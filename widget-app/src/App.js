import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as HostBridge from './services/hostBridge';
import SuggestionCard from './components/SuggestionCard';
import ContextPanel from './components/ContextPanel';
import { LEGACY_DATA } from './data/legacyPatients';

const SETTINGS_PASSWORD = '1234';

const DEFAULT_SETTINGS = {
  aiMode: 'auto',
  language: 'en',
  confidenceThreshold: 'medium',
  suggestionTypes: 'all',
};

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
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const analysisTimerRef = useRef(null);

  const addEvent = useCallback((evt) => {
    setEvents(prev => [evt, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    HostBridge.init({
      onTextChanged: (payload) => {
        setElementStates(prev => ({ ...prev, [payload.label]: { elementId: payload.elementId, value: payload.value } }));
        addEvent({ type: 'text', label: payload.label, value: payload.value });
        setIsAnalyzing(true);
        clearTimeout(analysisTimerRef.current);
        analysisTimerRef.current = setTimeout(() => setIsAnalyzing(false), 1500);
      },
      onClicked: (payload) => {
        addEvent({ type: 'click', label: payload.label });
      },
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
    const target = suggestion.target || 'findings-editor';
    HostBridge.insertText(target, suggestion.text, 'replace');
    setLastAction({ label: suggestion.label, time: Date.now() });
    setTimeout(() => setLastAction(null), 3000);
  };

  const handleOpenSettings = () => {
    setSettingsOpen(true);
    setSettingsUnlocked(false);
    setPasswordInput('');
    setPasswordError(false);
  };

  const handleCloseSettings = () => {
    setSettingsOpen(false);
    setSettingsUnlocked(false);
    setPasswordInput('');
    setPasswordError(false);
  };

  const handleUnlock = () => {
    if (passwordInput === SETTINGS_PASSWORD) {
      setSettingsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
      setPasswordInput('');
    }
  };

  return (
    <div style={styles.shell}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>✦</div>
          <span style={styles.logoText}>InfoDot Assist</span>
        </div>
        <div style={styles.headerActions}>
          <div style={styles.statusPill}>
            <span style={styles.statusDot(isAnalyzing)} />
            <span style={styles.statusLabel}>{isAnalyzing ? 'Analyzing...' : 'Watching'}</span>
          </div>
          <button style={styles.settingsBtn} onClick={handleOpenSettings} title="Settings">⚙</button>
        </div>
      </div>

      {/* Context — scrollable main area */}
      <div style={styles.contextArea}>
        <ContextPanel
          elementStates={elementStates}
          studyContext={studyContext}
          events={events}
          legacyData={legacyData}
        />
      </div>

      {/* AI Suggestions — pinned bottom panel */}
      <div style={styles.suggestionsPanel}>
        <button style={styles.suggestionsHeader} onClick={() => setSuggestionsExpanded(o => !o)}>
          <div style={styles.suggestionsHeaderLeft}>
            <span style={styles.suggestionsTitle}>AI Suggestions</span>
            {suggestions.length > 0 && (
              <span style={styles.countBadge}>{suggestions.length}</span>
            )}
            {isAnalyzing && <div style={styles.miniSpinner} />}
          </div>
          <span style={styles.suggestionsChevron(suggestionsExpanded)}>▾</span>
        </button>

        {suggestionsExpanded && (
          <div style={styles.suggestionsList}>
            {!isAnalyzing && suggestions.length === 0 && (
              <div style={styles.emptySmall}>
                Type in the Findings field to get AI suggestions
              </div>
            )}
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onApply={handleApply} />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {lastAction && (
        <div style={styles.toast}>Inserted into host editor</div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>InfoDot Assist</span>
        <span style={styles.footerDot}>·</span>
        <span style={styles.footerText}>Org: demo_org</span>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div style={styles.modalOverlay} onClick={handleCloseSettings}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>⚙ Widget Settings</span>
              <button style={styles.modalClose} onClick={handleCloseSettings}>×</button>
            </div>

            {!settingsUnlocked ? (
              <div style={styles.lockScreen}>
                <div style={styles.lockIcon}>🔒</div>
                <div style={styles.lockTitle}>Password required</div>
                <div style={styles.lockSubtitle}>Enter the admin password to access settings</div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  placeholder="Enter password"
                  style={{ ...styles.pwInput, borderColor: passwordError ? '#ef4444' : '#363d5a' }}
                  autoFocus
                />
                {passwordError && (
                  <div style={styles.pwError}>Incorrect password. Please try again.</div>
                )}
                <button style={styles.unlockBtn} onClick={handleUnlock}>Unlock</button>
              </div>
            ) : (
              <div style={styles.settingsForm}>
                <div style={styles.settingRow}>
                  <label style={styles.settingLabel}>AI Analysis Mode</label>
                  <select style={styles.settingSelect} value={settings.aiMode} onChange={e => setSettings(s => ({ ...s, aiMode: e.target.value }))}>
                    <option value="auto">Automatic (real-time)</option>
                    <option value="manual">On-demand only</option>
                  </select>
                </div>
                <div style={styles.settingRow}>
                  <label style={styles.settingLabel}>Interface Language</label>
                  <select style={styles.settingSelect} value={settings.language} onChange={e => setSettings(s => ({ ...s, language: e.target.value }))}>
                    <option value="en">English</option>
                    <option value="he">עברית (Hebrew)</option>
                  </select>
                </div>
                <div style={styles.settingRow}>
                  <label style={styles.settingLabel}>Confidence Threshold</label>
                  <select style={styles.settingSelect} value={settings.confidenceThreshold} onChange={e => setSettings(s => ({ ...s, confidenceThreshold: e.target.value }))}>
                    <option value="low">Low — show all (≥ 30%)</option>
                    <option value="medium">Medium (≥ 60%)</option>
                    <option value="high">High only (≥ 80%)</option>
                  </select>
                </div>
                <div style={styles.settingRow}>
                  <label style={styles.settingLabel}>Suggestion Types</label>
                  <select style={styles.settingSelect} value={settings.suggestionTypes} onChange={e => setSettings(s => ({ ...s, suggestionTypes: e.target.value }))}>
                    <option value="all">All types</option>
                    <option value="recommendations">Recommendations only</option>
                    <option value="templates">Templates only</option>
                  </select>
                </div>
                <button style={styles.saveBtn} onClick={handleCloseSettings}>Save &amp; Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  shell: {
    height: '100vh', display: 'flex', flexDirection: 'column',
    background: '#12141e', color: '#e1e4ed',
    fontFamily: "'SF Pro Text', -apple-system, system-ui, sans-serif",
    overflow: 'hidden', position: 'relative',
  },
  header: {
    background: 'linear-gradient(135deg,#1a2a4a 0%,#181b28 100%)',
    borderBottom: '1px solid #4f8ff750', flexShrink: 0,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 16, color: '#5c9bff', textShadow: '0 0 8px #5c9bff' },
  logoText: { fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px', color: '#5c9bff' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 8 },
  statusPill: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 9px', borderRadius: 20,
    background: '#1a1d2a', border: '1px solid #2a2e3f',
  },
  statusDot: (active) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: active ? '#f59e0b' : '#34d399',
    animation: active ? 'pulse 1s infinite' : 'none',
  }),
  statusLabel: { fontSize: 10, color: '#8b90a0', fontWeight: 500 },
  settingsBtn: {
    background: 'none', border: '1px solid #2a2e3f', color: '#8b90a0',
    borderRadius: 7, width: 28, height: 28, cursor: 'pointer',
    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
  // Context scrollable area
  contextArea: {
    flex: 1, overflowY: 'auto', padding: '10px 12px 4px',
    minHeight: 0,
  },
  // Suggestions panel — pinned at bottom
  suggestionsPanel: {
    flexShrink: 0, borderTop: '2px solid #2e3450',
    background: '#181b28',
  },
  suggestionsHeader: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
    textAlign: 'left', color: 'inherit',
  },
  suggestionsHeaderLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  suggestionsTitle: { fontSize: 11, fontWeight: 700, color: '#8b90a0', textTransform: 'uppercase', letterSpacing: '0.8px' },
  countBadge: {
    fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10,
    background: '#5c9bff20', color: '#5c9bff',
  },
  miniSpinner: {
    width: 12, height: 12, border: '2px solid #2a2e3f',
    borderTopColor: '#5c9bff', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  suggestionsChevron: (open) => ({
    fontSize: 12, color: '#555a6e',
    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    transition: 'transform 0.2s',
    display: 'inline-block',
  }),
  suggestionsList: {
    padding: '0 12px 8px',
    maxHeight: 220,
    overflowY: 'auto',
  },
  emptySmall: {
    fontSize: 11, color: '#555a6e', fontStyle: 'italic',
    padding: '6px 2px 10px', textAlign: 'center',
  },
  toast: {
    position: 'absolute', bottom: 44, left: 14, right: 14,
    padding: '9px 14px', borderRadius: 8,
    background: '#34d399', color: '#041f13',
    fontSize: 12, fontWeight: 600, textAlign: 'center',
    animation: 'slideUp 0.3s ease',
    zIndex: 50,
  },
  footer: {
    padding: '6px 14px', borderTop: '1px solid #2a2e3f',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    flexShrink: 0, background: '#181b28',
  },
  footerText: { fontSize: 10, color: '#555a6e' },
  footerDot: { fontSize: 10, color: '#555a6e' },
  // Settings modal
  modalOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1e2235', borderRadius: 14, border: '1px solid #363d5a',
    width: 320, maxWidth: '90%', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: '1px solid #2a2e3f',
  },
  modalTitle: { fontSize: 14, fontWeight: 700, color: '#e1e4ed' },
  modalClose: {
    background: 'none', border: 'none', color: '#6b7080', fontSize: 20,
    cursor: 'pointer', lineHeight: 1, padding: '0 2px',
  },
  lockScreen: { padding: 24, textAlign: 'center' },
  lockIcon: { fontSize: 32, marginBottom: 12 },
  lockTitle: { fontSize: 15, fontWeight: 700, color: '#e1e4ed', marginBottom: 4 },
  lockSubtitle: { fontSize: 12, color: '#6b7080', marginBottom: 18, lineHeight: 1.5 },
  pwInput: {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1px solid #363d5a', background: '#12141e',
    color: '#e1e4ed', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', marginBottom: 8, textAlign: 'center', letterSpacing: '4px',
  },
  pwError: { fontSize: 12, color: '#ef4444', marginBottom: 12 },
  unlockBtn: {
    width: '100%', padding: '10px', borderRadius: 8, border: 'none',
    background: '#5c9bff', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4,
  },
  settingsForm: { padding: '16px 18px 20px' },
  settingRow: { marginBottom: 16 },
  settingLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: '#8b90a0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 },
  settingSelect: {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1px solid #363d5a', background: '#12141e',
    color: '#e1e4ed', fontSize: 13, outline: 'none',
  },
  saveBtn: {
    width: '100%', padding: '10px', borderRadius: 8, border: 'none',
    background: '#5c9bff', color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: 8,
  },
};
