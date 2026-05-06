import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as HostBridge from './services/hostBridge';
import SuggestionCard from './components/SuggestionCard';
import ContextPanel from './components/ContextPanel';
import { LEGACY_DATA } from './data/legacyPatients';

const SETTINGS_PASSWORD = '1234';

const INITIAL_INTEGRATIONS = [
  {
    id: 'chameleon', name: 'Chameleon', description: 'Clinical Documents System', enabled: true,
    connectionString: 'Server=hms-db.hospital.local;Database=ChameleonClinical;User=svc_infodot;Password=••••••••',
    query: 'SELECT doc_id, doc_type, created_at, doc_title, patient_id\nFROM clinical_documents\nWHERE patient_id = :patientId\nORDER BY created_at DESC',
    fieldMappings: [
      { source: 'doc_id', alias: 'Document ID' },
      { source: 'doc_type', alias: 'Type' },
      { source: 'created_at', alias: 'Date / Time' },
      { source: 'doc_title', alias: 'Title' },
    ],
  },
  {
    id: 'clinipharm', name: 'Clinipharm', description: 'Pharmacy Data System', enabled: true,
    connectionString: 'Server=pharmacy-db.hospital.local;Database=PharmDB;User=svc_infodot;Password=••••••••',
    query: "SELECT medication_name, dosage, frequency, indication, start_date\nFROM patient_medications\nWHERE patient_id = :patientId AND status = 'active'\nORDER BY medication_name",
    fieldMappings: [
      { source: 'medication_name', alias: 'Medication' },
      { source: 'dosage', alias: 'Dose' },
      { source: 'frequency', alias: 'Frequency' },
      { source: 'indication', alias: 'Indication' },
    ],
  },
];

// ── Icons ────────────────────────────────────────────────────────────────────

const LogoMark = () => (
  <div style={{
    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
    background: 'linear-gradient(135deg,#4f83ff 0%,#9b72f8 100%)',
    boxShadow: '0 2px 14px rgba(79,131,255,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
      <circle cx="12" cy="12" r="3.5"/>
      <rect x="11" y="2" width="2" height="5" rx="1"/>
      <rect x="11" y="17" width="2" height="5" rx="1"/>
      <rect x="2" y="11" width="5" height="2" rx="1"/>
      <rect x="17" y="11" width="5" height="2" rx="1"/>
    </svg>
  </div>
);

const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="4" y1="6" x2="20" y2="6"/>
    <line x1="4" y1="12" x2="20" y2="12"/>
    <line x1="4" y1="18" x2="20" y2="18"/>
    <circle cx="9" cy="6" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="12" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="9" cy="18" r="2.5" fill="currentColor" stroke="none"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const BackIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4f6fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2"/>
    <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    <circle cx="12" cy="16" r="1.2" fill="#4f6fff" stroke="none"/>
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease', display: 'block', color: '#3d4a65' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function App() {
  const [suggestions, setSuggestions] = useState([]);
  const [elementStates, setElementStates] = useState({});
  const [studyContext, setStudyContext] = useState({});
  const [legacyData, setLegacyData] = useState(null);
  const [events, setEvents] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsUnlocked, setSettingsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);
  const [editingId, setEditingId] = useState(null); // null = list view, 'new' or id = edit view
  const [editDraft, setEditDraft] = useState(null);

  const analysisTimerRef = useRef(null);
  const addEvent = useCallback((evt) => setEvents(prev => [evt, ...prev].slice(0, 50)), []);

  useEffect(() => {
    HostBridge.init({
      onTextChanged: (payload) => {
        setElementStates(prev => ({ ...prev, [payload.label]: { elementId: payload.elementId, value: payload.value } }));
        addEvent({ type: 'text', label: payload.label, value: payload.value });
        setIsAnalyzing(true);
        clearTimeout(analysisTimerRef.current);
        analysisTimerRef.current = setTimeout(() => setIsAnalyzing(false), 1500);
      },
      onClicked: (payload) => addEvent({ type: 'click', label: payload.label }),
      onSelectionChanged: (payload) => {
        setElementStates(prev => ({ ...prev, [payload.label]: { elementId: payload.elementId, value: payload.selectedText || payload.value } }));
        addEvent({ type: 'select', label: payload.label, value: payload.selectedText });
      },
      onContext: (ctx) => {
        setStudyContext(ctx);
        addEvent({ type: 'context', label: 'Study context' });
        setLegacyData(ctx.patientId ? (LEGACY_DATA[ctx.patientId] || null) : null);
      },
      onSuggestions: (newSuggestions) => {
        setSuggestions(newSuggestions);
        setIsAnalyzing(false);
        if (newSuggestions.length > 0) setSuggestionsExpanded(true);
      },
    });
    return () => HostBridge.destroy();
  }, [addEvent]);

  const handleApply = (suggestion) => {
    HostBridge.insertText(suggestion.target || 'findings-editor', suggestion.text, 'replace');
    setLastAction(true);
    setTimeout(() => setLastAction(null), 2800);
  };

  // Settings handlers
  const openSettings = () => { setSettingsOpen(true); setSettingsUnlocked(false); setPasswordInput(''); setPasswordError(false); setEditingId(null); };
  const closeSettings = () => { setSettingsOpen(false); setSettingsUnlocked(false); setPasswordInput(''); setPasswordError(false); setEditingId(null); setEditDraft(null); };

  const handleUnlock = () => {
    if (passwordInput === SETTINGS_PASSWORD) { setSettingsUnlocked(true); setPasswordError(false); }
    else { setPasswordError(true); setPasswordInput(''); }
  };

  const startEdit = (id) => {
    const blank = { id: `sys_${Date.now()}`, name: '', description: '', enabled: true, connectionString: '', query: '', fieldMappings: [] };
    const draft = id === 'new' ? blank : integrations.find(i => i.id === id);
    setEditDraft({ ...draft, fieldMappings: draft.fieldMappings.map(f => ({ ...f })) });
    setEditingId(id);
  };

  const saveDraft = () => {
    if (!editDraft) return;
    setIntegrations(prev =>
      editingId === 'new'
        ? [...prev, editDraft]
        : prev.map(i => i.id === editingId ? editDraft : i)
    );
    setEditingId(null);
    setEditDraft(null);
  };

  const deleteIntegration = (id) => setIntegrations(prev => prev.filter(i => i.id !== id));

  const updateDraftField = (key, val) => setEditDraft(d => ({ ...d, [key]: val }));
  const updateMapping = (i, key, val) => setEditDraft(d => {
    const fm = d.fieldMappings.map((m, idx) => idx === i ? { ...m, [key]: val } : m);
    return { ...d, fieldMappings: fm };
  });
  const addMapping = () => setEditDraft(d => ({ ...d, fieldMappings: [...d.fieldMappings, { source: '', alias: '' }] }));
  const removeMapping = (i) => setEditDraft(d => ({ ...d, fieldMappings: d.fieldMappings.filter((_, idx) => idx !== i) }));

  return (
    <div style={s.shell}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logoRow}>
          <LogoMark />
          <div>
            <div style={s.logoName}>InfoDot Assist</div>
            <div style={s.logoSub}>Clinical AI Assistant</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.statusPill}>
            <span style={s.statusDot(isAnalyzing)} />
            <span style={s.statusLabel}>{isAnalyzing ? 'Analyzing' : 'Live'}</span>
          </div>
          <button style={s.iconBtn} onClick={openSettings} title="Settings"><SettingsIcon /></button>
        </div>
      </div>

      {/* Context */}
      <div style={s.contextArea}>
        <ContextPanel elementStates={elementStates} studyContext={studyContext} events={events} legacyData={legacyData} />
      </div>

      {/* AI Suggestions — pinned bottom */}
      <div style={s.suggestionsPanel}>
        <button style={s.suggestionsToggle} onClick={() => setSuggestionsExpanded(o => !o)}>
          <div style={s.suggToggleLeft}>
            <div style={s.suggDot(isAnalyzing)} />
            <span style={s.suggTitle}>AI Suggestions</span>
            {suggestions.length > 0 && <span style={s.suggBadge}>{suggestions.length}</span>}
          </div>
          <ChevronIcon open={suggestionsExpanded} />
        </button>
        {suggestionsExpanded && (
          <div style={s.suggList}>
            {!isAnalyzing && suggestions.length === 0 && (
              <div style={s.suggEmpty}>Type in the Findings field — suggestions will appear here</div>
            )}
            {isAnalyzing && suggestions.length === 0 && (
              <div style={s.suggAnalyzing}><div style={s.miniSpinner} /><span>Analyzing content...</span></div>
            )}
            {suggestions.map((sg) => <SuggestionCard key={sg.id} suggestion={sg} onApply={handleApply} />)}
          </div>
        )}
      </div>

      {lastAction && <div style={s.toast}>Inserted into report editor</div>}

      <div style={s.footer}>
        <span style={s.footerText}>InfoDot Assist</span>
        <span style={s.footerSep} />
        <span style={s.footerText}>demo_org</span>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div style={s.overlay} onClick={closeSettings}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={s.modalHeader}>
              <div style={s.modalHeaderLeft}>
                {editingId && settingsUnlocked && (
                  <button style={s.backBtn} onClick={() => { setEditingId(null); setEditDraft(null); }}>
                    <BackIcon />
                  </button>
                )}
                <span style={s.modalTitle}>
                  {!settingsUnlocked ? 'Widget Settings' : editingId ? (editingId === 'new' ? 'Add System' : 'Edit Integration') : 'Integrations'}
                </span>
              </div>
              <button style={s.modalCloseBtn} onClick={closeSettings}><CloseIcon /></button>
            </div>

            {/* Password screen */}
            {!settingsUnlocked ? (
              <div style={s.lockScreen}>
                <div style={s.lockIconWrap}><LockIcon /></div>
                <div style={s.lockTitle}>Admin access required</div>
                <div style={s.lockSub}>Enter the admin password to manage integration settings</div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  placeholder="Password"
                  autoFocus
                  style={{ ...s.pwInput, borderColor: passwordError ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                />
                {passwordError && <div style={s.pwError}>Incorrect password</div>}
                <button style={s.primaryBtn} onClick={handleUnlock}>Unlock</button>
              </div>

            ) : editingId ? (
              /* ── Edit / Add system view ── */
              <div style={s.editBody}>
                <div style={s.editField}>
                  <label style={s.editLabel}>System name</label>
                  <input style={s.editInput} value={editDraft.name} onChange={e => updateDraftField('name', e.target.value)} placeholder="e.g. Chameleon" />
                </div>
                <div style={s.editField}>
                  <label style={s.editLabel}>Description</label>
                  <input style={s.editInput} value={editDraft.description} onChange={e => updateDraftField('description', e.target.value)} placeholder="e.g. Clinical Documents System" />
                </div>
                <div style={s.editField}>
                  <label style={s.editLabel}>Connection string</label>
                  <input style={s.editInput} value={editDraft.connectionString} onChange={e => updateDraftField('connectionString', e.target.value)} placeholder="Server=...;Database=...;User=...;Password=..." />
                </div>
                <div style={s.editField}>
                  <label style={s.editLabel}>SQL query</label>
                  <textarea
                    style={s.editTextarea}
                    value={editDraft.query}
                    onChange={e => updateDraftField('query', e.target.value)}
                    placeholder={'SELECT field1, field2\nFROM table\nWHERE patient_id = :patientId'}
                    rows={4}
                  />
                  <div style={s.editHint}>Use <code style={s.code}>:patientId</code> as the bind parameter for patient filtering</div>
                </div>

                <div style={s.editField}>
                  <div style={s.editLabelRow}>
                    <label style={s.editLabel}>Field selectors</label>
                    <button style={s.addMappingBtn} onClick={addMapping}><PlusIcon />&nbsp;Add field</button>
                  </div>
                  {editDraft.fieldMappings.length === 0 && (
                    <div style={s.editHint}>No fields configured — add field mappings below</div>
                  )}
                  {editDraft.fieldMappings.map((m, i) => (
                    <div key={i} style={s.mappingRow}>
                      <input style={s.mappingInput} value={m.source} onChange={e => updateMapping(i, 'source', e.target.value)} placeholder="SQL column" />
                      <span style={s.mappingArrow}>as</span>
                      <input style={s.mappingInput} value={m.alias} onChange={e => updateMapping(i, 'alias', e.target.value)} placeholder="Display label" />
                      <button style={s.removeMappingBtn} onClick={() => removeMapping(i)}><TrashIcon /></button>
                    </div>
                  ))}
                </div>

                <div style={s.editActions}>
                  <button style={s.ghostBtn} onClick={() => { setEditingId(null); setEditDraft(null); }}>Cancel</button>
                  <button style={s.primaryBtn} onClick={saveDraft}>Save integration</button>
                </div>
              </div>

            ) : (
              /* ── Integrations list view ── */
              <div style={s.listBody}>
                <div style={s.listIntro}>
                  Connected data sources — configure connection strings and SQL queries to pull patient data into the widget.
                </div>
                {integrations.map(intg => (
                  <div key={intg.id} style={s.intgCard}>
                    <div style={s.intgCardLeft}>
                      <div style={{ ...s.intgDot, background: intg.enabled ? '#34d399' : '#4a5568', boxShadow: intg.enabled ? '0 0 6px #34d399' : 'none' }} />
                      <div>
                        <div style={s.intgName}>{intg.name}</div>
                        <div style={s.intgDesc}>{intg.description}</div>
                      </div>
                    </div>
                    <div style={s.intgActions}>
                      <button style={s.editBtn} onClick={() => startEdit(intg.id)}>Edit</button>
                      <button style={s.deleteBtn} onClick={() => deleteIntegration(intg.id)}><TrashIcon /></button>
                    </div>
                  </div>
                ))}
                <button style={s.addSystemBtn} onClick={() => startEdit('new')}>
                  <PlusIcon />&nbsp;&nbsp;Add system
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const wc = {
  bg: '#f2f4f7',
  surface: '#ffffff',
  border: '#dde2ea',
  text: '#1e2530',
  textMuted: '#6b7a99',
  textFaint: '#a0abc0',
  accent: '#4f6fff',
  accentDim: '#eef1ff',
  red: '#dc2626',
};

const s = {
  shell: {
    height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
    background: wc.bg,
    color: wc.text,
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif',
  },
  header: {
    flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px',
    background: wc.surface,
    borderBottom: `1px solid ${wc.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
  logoName: { fontSize: 14, fontWeight: 700, color: wc.text, letterSpacing: '-0.2px', lineHeight: 1.2 },
  logoSub: { fontSize: 9, color: wc.textFaint, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  statusPill: { display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: wc.bg, border: `1px solid ${wc.border}` },
  statusDot: (active) => ({ width: 6, height: 6, borderRadius: '50%', background: active ? '#f59e0b' : '#22c55e' }),
  statusLabel: { fontSize: 10, color: wc.textMuted, fontWeight: 500 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, border: `1px solid ${wc.border}`, background: wc.bg, color: wc.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  contextArea: { flex: 1, overflowY: 'auto', padding: '10px 12px 4px', minHeight: 0 },
  suggestionsPanel: { flexShrink: 0, background: wc.surface, borderTop: `1px solid ${wc.border}`, boxShadow: '0 -2px 8px rgba(0,0,0,0.06)' },
  suggestionsToggle: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit' },
  suggToggleLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  suggDot: (active) => ({ width: 6, height: 6, borderRadius: '50%', background: active ? '#f59e0b' : wc.accent }),
  suggTitle: { fontSize: 10, fontWeight: 700, color: wc.textMuted, textTransform: 'uppercase', letterSpacing: '1px' },
  suggBadge: { fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: wc.accentDim, color: wc.accent, border: `1px solid ${wc.accent}30` },
  suggList: { padding: '0 12px 10px', maxHeight: 220, overflowY: 'auto' },
  suggEmpty: { fontSize: 11, color: wc.textFaint, textAlign: 'center', padding: '10px 8px 14px', fontStyle: 'italic' },
  suggAnalyzing: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px 14px', justifyContent: 'center', fontSize: 11, color: wc.textMuted },
  miniSpinner: { width: 13, height: 13, border: `2px solid ${wc.border}`, borderTopColor: wc.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  toast: { position: 'absolute', bottom: 36, left: 12, right: 12, padding: '9px 14px', borderRadius: 9, background: 'linear-gradient(90deg,#10b981,#059669)', color: '#fff', fontSize: 12, fontWeight: 600, textAlign: 'center', animation: 'slideUp 0.3s ease', zIndex: 50, boxShadow: '0 4px 16px rgba(16,185,129,0.25)' },
  footer: { padding: '5px 14px', borderTop: `1px solid ${wc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexShrink: 0, background: wc.surface },
  footerText: { fontSize: 9, color: wc.textFaint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' },
  footerSep: { width: 3, height: 3, borderRadius: '50%', background: wc.border, display: 'inline-block' },

  // Modal
  overlay: { position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(100,110,130,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { width: 348, maxWidth: '94%', borderRadius: 14, background: wc.surface, border: `1px solid ${wc.border}`, boxShadow: '0 12px 48px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '88vh', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: `1px solid ${wc.border}`, background: wc.bg, flexShrink: 0 },
  modalHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 13, fontWeight: 700, color: wc.text },
  modalCloseBtn: { width: 26, height: 26, borderRadius: 6, border: `1px solid ${wc.border}`, background: 'none', color: wc.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  backBtn: { width: 26, height: 26, borderRadius: 6, border: `1px solid ${wc.border}`, background: 'none', color: wc.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Lock screen
  lockScreen: { padding: '28px 22px 22px', textAlign: 'center' },
  lockIconWrap: { marginBottom: 14, display: 'flex', justifyContent: 'center' },
  lockTitle: { fontSize: 15, fontWeight: 700, color: wc.text, marginBottom: 5 },
  lockSub: { fontSize: 11, color: wc.textMuted, marginBottom: 20, lineHeight: 1.6 },
  pwInput: { width: '100%', padding: '11px 14px', borderRadius: 9, border: `1px solid`, background: wc.bg, color: wc.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '6px', marginBottom: 8, transition: 'border-color 0.2s' },
  pwError: { fontSize: 11, color: wc.red, marginBottom: 12 },
  primaryBtn: { width: '100%', padding: '11px', borderRadius: 9, border: 'none', background: wc.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 10px ${wc.accent}35`, marginTop: 4 },
  ghostBtn: { flex: 1, padding: '10px', borderRadius: 9, border: `1px solid ${wc.border}`, background: 'none', color: wc.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' },

  // Integrations list
  listBody: { padding: '14px 16px 18px', overflowY: 'auto' },
  listIntro: { fontSize: 11, color: wc.textMuted, lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', background: wc.accentDim, borderRadius: 8, border: `1px solid ${wc.accent}25` },
  intgCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', background: wc.bg, border: `1px solid ${wc.border}`, borderRadius: 10, marginBottom: 8 },
  intgCardLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  intgDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  intgName: { fontSize: 13, fontWeight: 700, color: wc.text },
  intgDesc: { fontSize: 10, color: wc.textMuted, marginTop: 2 },
  intgActions: { display: 'flex', alignItems: 'center', gap: 6 },
  editBtn: { padding: '4px 12px', borderRadius: 6, border: `1px solid ${wc.accent}40`, background: wc.accentDim, color: wc.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer' },
  deleteBtn: { width: 26, height: 26, borderRadius: 6, border: `1px solid #fca5a540`, background: 'none', color: wc.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
  addSystemBtn: { width: '100%', padding: '10px', borderRadius: 9, border: `1px dashed ${wc.accent}50`, background: wc.accentDim, color: wc.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  // Edit form
  editBody: { padding: '14px 16px 18px', overflowY: 'auto' },
  editField: { marginBottom: 14 },
  editLabel: { display: 'block', fontSize: 10, fontWeight: 600, color: wc.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 },
  editLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  editInput: { width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${wc.border}`, background: wc.bg, color: wc.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' },
  editTextarea: { width: '100%', padding: '9px 11px', borderRadius: 8, border: `1px solid ${wc.border}`, background: wc.bg, color: wc.text, fontSize: 11, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.55 },
  editHint: { fontSize: 10, color: wc.textFaint, marginTop: 5 },
  code: { fontFamily: 'monospace', background: wc.accentDim, padding: '1px 5px', borderRadius: 3, color: wc.accent },
  mappingRow: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  mappingInput: { flex: 1, padding: '7px 9px', borderRadius: 7, border: `1px solid ${wc.border}`, background: wc.bg, color: wc.text, fontSize: 11, outline: 'none', minWidth: 0 },
  mappingArrow: { fontSize: 10, color: wc.textFaint, flexShrink: 0 },
  removeMappingBtn: { width: 24, height: 24, borderRadius: 5, border: `1px solid #fca5a540`, background: 'none', color: wc.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: 0.7 },
  addMappingBtn: { display: 'flex', alignItems: 'center', padding: '4px 10px', borderRadius: 6, border: `1px solid ${wc.accent}40`, background: wc.accentDim, color: wc.accent, fontSize: 10, fontWeight: 600, cursor: 'pointer' },
  editActions: { display: 'flex', gap: 8, marginTop: 4 },
};
