import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as WidgetSDK from './widgetSDK';

const STUDIES = [
  { id: 'STU-001', patientId: 'P-78432', patientName: 'Sarah Cohen', modality: 'CT', bodyPart: 'CHEST', description: 'CT Chest with contrast', indication: 'Cough and shortness of breath x 2 weeks' },
  { id: 'STU-002', patientId: 'P-91205', patientName: 'David Levy', modality: 'XR', bodyPart: 'CHEST', description: 'Chest X-Ray PA/Lateral', indication: 'Pre-operative evaluation' },
  { id: 'STU-003', patientId: 'P-33187', patientName: 'Rachel Mizrahi', modality: 'MR', bodyPart: 'BRAIN', description: 'MRI Brain without contrast', indication: 'Persistent headaches' },
  { id: 'STU-004', patientId: 'P-55921', patientName: 'Yosef Katz', modality: 'CT', bodyPart: 'ABDOMEN', description: 'CT Abdomen/Pelvis', indication: 'Abdominal pain, rule out appendicitis' },
];

export default function App() {
  const [selectedStudy, setSelectedStudy] = useState(STUDIES[0]);
  const [eventLog, setEventLog] = useState([]);
  const [widgetReady, setWidgetReady] = useState(false);
  const [reportStatus, setReportStatus] = useState('draft');
  const initialized = useRef(false);
  const findingsRef = useRef(null);
  const impressionRef = useRef(null);

  const addLog = useCallback((entry) => {
    setEventLog(prev => [{ ...entry, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 30));
  }, []);

  // Initialize widget SDK
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    WidgetSDK.init({
      orgKey: 'demo_org',
      position: 'right',
      onReady: () => {
        setWidgetReady(true);
        addLog({ type: 'system', label: 'Widget', value: 'Connected and ready' });

        // Register watchers
        WidgetSDK.watchText('findings-editor', { label: 'Findings', debounce: 500 });
        WidgetSDK.watchText('impression-editor', { label: 'Impression', debounce: 500 });
        WidgetSDK.watchSelect('modality-select', { label: 'Modality' });
        WidgetSDK.watchClick('btn-sign', { label: 'Sign report' });
        WidgetSDK.watchClick('btn-addendum', { label: 'Add addendum' });

        // Push initial study context
        WidgetSDK.setContext({
          patientId: STUDIES[0].patientId,
          studyUid: STUDIES[0].id,
          modality: STUDIES[0].modality,
          bodyPart: STUDIES[0].bodyPart,
          indication: STUDIES[0].indication,
        });
      },
      onEvent: (evt) => {
        addLog(evt);
      },
    });

    // Handle widget insert actions
    WidgetSDK.onAction((action) => {
      addLog({ type: 'action', label: 'Widget insert', value: action.text?.substring(0, 60) + '...' });
      const el = action.targetElementId === 'impression-editor' ? impressionRef.current
                : action.targetElementId === 'findings-editor'  ? findingsRef.current
                : null;
      if (el) {
        el.value = action.text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
      }
    });

    return () => WidgetSDK.destroy();
  }, [addLog]);

  // Update context when study changes
  const handleStudyChange = (study) => {
    setSelectedStudy(study);
    setReportStatus('draft');
    if (findingsRef.current) findingsRef.current.value = '';
    if (impressionRef.current) impressionRef.current.value = '';
    WidgetSDK.setContext({
      patientId: study.patientId,
      studyUid: study.id,
      modality: study.modality,
      bodyPart: study.bodyPart,
      indication: study.indication,
    });
    addLog({ type: 'system', label: 'Study changed', value: `${study.patientName} — ${study.description}` });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>RadReport</div>
          <span style={styles.badge}>PACS DEMO</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.statusDot(widgetReady)} />
          <span style={styles.statusText}>Widget {widgetReady ? 'connected' : 'loading...'}</span>
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* Left sidebar - study list */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarTitle}>Worklist</div>
          {STUDIES.map((study) => (
            <div
              key={study.id}
              style={styles.studyCard(study.id === selectedStudy.id)}
              onClick={() => handleStudyChange(study)}
            >
              <div style={styles.studyModality(study.modality)}>{study.modality}</div>
              <div style={styles.studyInfo}>
                <div style={styles.patientName}>{study.patientName}</div>
                <div style={styles.studyDesc}>{study.description}</div>
              </div>
            </div>
          ))}

          {/* Event log */}
          <div style={{ ...styles.sidebarTitle, marginTop: 24 }}>Event log</div>
          <div style={styles.eventLog}>
            {eventLog.length === 0 && (
              <div style={styles.eventEmpty}>Events will appear here as you type...</div>
            )}
            {eventLog.map((evt, i) => (
              <div key={i} style={styles.eventEntry}>
                <span style={styles.eventTime}>{evt.time}</span>
                <span style={styles.eventType(evt.type)}>{evt.type}</span>
                <span style={styles.eventLabel}>{evt.label}</span>
                {evt.value && <div style={styles.eventValue}>{evt.value.substring(0, 80)}</div>}
              </div>
            ))}
          </div>
        </aside>

        {/* Main content - report editor */}
        <main style={styles.main}>
          {/* Patient banner */}
          <div style={styles.patientBanner}>
            <div>
              <div style={styles.bannerName}>{selectedStudy.patientName}</div>
              <div style={styles.bannerId}>MRN: {selectedStudy.patientId} &nbsp;|&nbsp; Study: {selectedStudy.id}</div>
            </div>
            <div style={styles.bannerRight}>
              <span style={styles.bannerStatus(reportStatus)}>{reportStatus.toUpperCase()}</span>
            </div>
          </div>

          {/* Study info */}
          <div style={styles.studyBanner}>
            <div style={styles.infoField}>
              <label style={styles.infoLabel}>Modality</label>
              <select id="modality-select" value={selectedStudy.modality} style={styles.select} readOnly>
                <option value="CT">CT</option>
                <option value="XR">X-Ray</option>
                <option value="MR">MRI</option>
              </select>
            </div>
            <div style={styles.infoField}>
              <label style={styles.infoLabel}>Body part</label>
              <div style={styles.infoValue}>{selectedStudy.bodyPart}</div>
            </div>
            <div style={styles.infoField}>
              <label style={styles.infoLabel}>Clinical indication</label>
              <div style={styles.infoValue}>{selectedStudy.indication}</div>
            </div>
          </div>

          {/* Report editor */}
          <div style={styles.editorSection}>
            <label style={styles.editorLabel}>Findings</label>
            <textarea
              ref={findingsRef}
              id="findings-editor"
              style={styles.textarea}
              placeholder="Type findings here... (try: 'nodule', 'pneumonia', 'fracture', 'effusion')"
              rows={8}
            />
          </div>

          <div style={styles.editorSection}>
            <label style={styles.editorLabel}>Impression</label>
            <textarea
              ref={impressionRef}
              id="impression-editor"
              style={styles.textarea}
              placeholder="Impression will appear here (or get AI-suggested via widget)..."
              rows={4}
            />
          </div>

          {/* Action buttons */}
          <div style={styles.actions}>
            <button id="btn-sign" style={styles.btnPrimary} onClick={() => setReportStatus('signed')}>
              Sign report
            </button>
            <button id="btn-addendum" style={styles.btnSecondary} onClick={() => setReportStatus('addendum')}>
              Add addendum
            </button>
          </div>

          {/* Hint */}
          <div style={styles.hint}>
            <strong>Try it:</strong> Type in the Findings box. The widget on the right will receive
            your text in real-time and offer AI suggestions. Try typing "There is a 2cm nodule" or
            "Right lower lobe consolidation consistent with pneumonia".
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Styles ---
const colors = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surfaceHover: '#22263a',
  border: '#2a2e3f',
  text: '#e1e4ed',
  textMuted: '#8b90a0',
  accent: '#4f8ff7',
  accentDim: '#2a4a8a',
  green: '#34d399',
  amber: '#f59e0b',
  red: '#ef4444',
};

const styles = {
  container: { minHeight: '100vh', background: colors.bg, color: colors.text, fontFamily: "'SF Pro Text', -apple-system, system-ui, sans-serif" },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: `1px solid ${colors.border}`, background: colors.surface },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  logo: { fontSize: 20, fontWeight: 700, color: colors.accent, letterSpacing: '-0.5px' },
  badge: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: colors.accentDim, color: colors.accent, letterSpacing: '1px' },
  statusDot: (ready) => ({ width: 8, height: 8, borderRadius: '50%', background: ready ? colors.green : colors.amber, display: 'inline-block' }),
  statusText: { fontSize: 13, color: colors.textMuted },
  mainLayout: { display: 'flex', minHeight: 'calc(100vh - 49px)' },
  sidebar: { width: 280, borderRight: `1px solid ${colors.border}`, padding: 16, background: colors.surface, overflowY: 'auto' },
  sidebarTitle: { fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 },
  studyCard: (active) => ({ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 6, cursor: 'pointer', background: active ? colors.accentDim : 'transparent', border: active ? `1px solid ${colors.accent}40` : `1px solid transparent`, transition: 'all 0.15s' }),
  studyModality: (mod) => ({ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, background: mod === 'CT' ? '#4f8ff720' : mod === 'MR' ? '#a855f720' : '#f59e0b20', color: mod === 'CT' ? '#4f8ff7' : mod === 'MR' ? '#a855f7' : '#f59e0b' }),
  studyInfo: { minWidth: 0 },
  patientName: { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  studyDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  eventLog: { maxHeight: 300, overflowY: 'auto', fontSize: 11 },
  eventEmpty: { color: colors.textMuted, fontStyle: 'italic', padding: 8 },
  eventEntry: { padding: '6px 0', borderBottom: `1px solid ${colors.border}` },
  eventTime: { color: colors.textMuted, marginRight: 6, fontFamily: 'monospace', fontSize: 10 },
  eventType: (type) => ({ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3, marginRight: 6, background: type === 'text-changed' ? '#4f8ff720' : type === 'clicked' ? '#f59e0b20' : type === 'action' ? '#34d39920' : '#a855f720', color: type === 'text-changed' ? '#4f8ff7' : type === 'clicked' ? '#f59e0b' : type === 'action' ? '#34d399' : '#a855f7' }),
  eventLabel: { fontWeight: 500 },
  eventValue: { color: colors.textMuted, marginTop: 2, wordBreak: 'break-all' },
  main: { flex: 1, padding: 24 },
  patientBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderRadius: 10, background: colors.surface, border: `1px solid ${colors.border}`, marginBottom: 16 },
  bannerName: { fontSize: 18, fontWeight: 700 },
  bannerId: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontFamily: 'monospace' },
  bannerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  bannerStatus: (status) => ({ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 6, letterSpacing: '0.5px', background: status === 'signed' ? '#34d39920' : status === 'addendum' ? '#f59e0b20' : '#4f8ff720', color: status === 'signed' ? '#34d399' : status === 'addendum' ? '#f59e0b' : '#4f8ff7' }),
  studyBanner: { display: 'flex', gap: 24, padding: '12px 20px', borderRadius: 10, background: colors.surface, border: `1px solid ${colors.border}`, marginBottom: 20 },
  infoField: {},
  infoLabel: { fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 4 },
  infoValue: { fontSize: 13 },
  select: { background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text, padding: '4px 8px', fontSize: 13 },
  editorSection: { marginBottom: 16 },
  editorLabel: { display: 'block', fontSize: 12, fontWeight: 600, color: colors.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' },
  textarea: { width: '100%', backgroundColor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, color: colors.text, WebkitTextFillColor: colors.text, forcedColorAdjust: 'none', padding: '14px 16px', fontSize: 14, fontFamily: "'SF Pro Text', -apple-system, system-ui, sans-serif", lineHeight: 1.6, resize: 'vertical', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' },
  actions: { display: 'flex', gap: 12, marginTop: 20 },
  btnPrimary: { padding: '10px 24px', borderRadius: 8, border: 'none', background: colors.accent, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '10px 24px', borderRadius: 8, border: `1px solid ${colors.border}`, background: 'transparent', color: colors.text, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  hint: { marginTop: 24, padding: '14px 18px', borderRadius: 10, background: '#4f8ff710', border: `1px solid ${colors.accent}30`, fontSize: 13, lineHeight: 1.6, color: colors.textMuted },
};
