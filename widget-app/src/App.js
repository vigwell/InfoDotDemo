import React, { useEffect, useState, useRef, useCallback } from 'react';
import * as HostBridge from './services/hostBridge';
import SuggestionCard from './components/SuggestionCard';
import ContextPanel from './components/ContextPanel';

const TABS = ['suggestions', 'context'];

export default function App() {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [suggestions, setSuggestions] = useState([]);
  const [elementStates, setElementStates] = useState({});
  const [studyContext, setStudyContext] = useState({});
  const [events, setEvents] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const analysisTimerRef = useRef(null);

  const addEvent = useCallback((evt) => {
    setEvents(prev => [evt, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    HostBridge.init({
      onTextChanged: (payload) => {
        setElementStates(prev => ({
          ...prev,
          [payload.label]: { elementId: payload.elementId, value: payload.value }
        }));
        addEvent({ type: 'text', label: payload.label, value: payload.value });
        setIsAnalyzing(true);
        clearTimeout(analysisTimerRef.current);
        analysisTimerRef.current = setTimeout(() => setIsAnalyzing(false), 1500);
      },
      onClicked: (payload) => {
        addEvent({ type: 'click', label: payload.label });
      },
      onSelectionChanged: (payload) => {
        setElementStates(prev => ({
          ...prev,
          [payload.label]: { elementId: payload.elementId, value: payload.selectedText || payload.value }
        }));
        addEvent({ type: 'select', label: payload.label, value: payload.selectedText });
      },
      onContext: (ctx) => {
        setStudyContext(ctx);
        addEvent({ type: 'context', label: 'Study context' });
      },
      onSuggestions: (newSuggestions) => {
        setSuggestions(newSuggestions);
        setIsAnalyzing(false);
        if (newSuggestions.length > 0) {
          setActiveTab('suggestions');
        }
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

  return (
    <div style={styles.shell}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>✦</div>
            <span style={styles.logoText}>InfoDot Assist</span>
          </div>
          <div style={styles.statusPill}>
            <span style={styles.statusDot(isAnalyzing)} />
            <span style={styles.statusLabel}>
              {isAnalyzing ? 'Analyzing...' : 'Watching'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab}
              style={styles.tab(tab === activeTab)}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'suggestions' ? `Suggestions${suggestions.length ? ` (${suggestions.length})` : ''}` : 'Context'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'suggestions' && (
          <>
            {suggestions.length === 0 && !isAnalyzing && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✦</div>
                <div style={styles.emptyTitle}>Ready to assist</div>
                <div style={styles.emptyText}>
                  Start typing in the report editor on the left.
                  AI suggestions will appear here based on your findings.
                </div>
                <div style={styles.emptyHints}>
                  <div style={styles.hintChip}>Try "nodule"</div>
                  <div style={styles.hintChip}>Try "pneumonia"</div>
                  <div style={styles.hintChip}>Try "fracture"</div>
                  <div style={styles.hintChip}>Try "effusion"</div>
                </div>
              </div>
            )}

            {isAnalyzing && suggestions.length === 0 && (
              <div style={styles.analyzing}>
                <div style={styles.spinner} />
                <span>Analyzing findings...</span>
              </div>
            )}

            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onApply={handleApply} />
            ))}
          </>
        )}

        {activeTab === 'context' && (
          <ContextPanel
            elementStates={elementStates}
            studyContext={studyContext}
            events={events}
          />
        )}
      </div>

      {/* Toast */}
      {lastAction && (
        <div style={styles.toast}>
          Inserted into host editor
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>Widget POC</span>
        <span style={styles.footerDot}>·</span>
        <span style={styles.footerText}>Org: demo_org</span>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#12141e',
    color: '#e1e4ed',
    fontFamily: "'SF Pro Text', -apple-system, system-ui, sans-serif",
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg,#1a2a4a 0%,#181b28 100%)',
    borderBottom: '1px solid #4f8ff750',
    flexShrink: 0,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px 8px',
  },
  logoArea: { display: 'flex', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 18, color: '#4f8ff7', textShadow: '0 0 8px #4f8ff7' },
  logoText: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', color: '#4f8ff7' },
  statusPill: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '3px 10px', borderRadius: 20,
    background: '#1a1d2a', border: '1px solid #2a2e3f',
  },
  statusDot: (active) => ({
    width: 7, height: 7, borderRadius: '50%',
    background: active ? '#f59e0b' : '#34d399',
    transition: 'background 0.3s',
    animation: active ? 'pulse 1s infinite' : 'none',
  }),
  statusLabel: { fontSize: 11, color: '#8b90a0', fontWeight: 500 },
  tabs: { display: 'flex', padding: '0 16px', gap: 4 },
  tab: (active) => ({
    flex: 1, padding: '8px 0', textAlign: 'center',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
    background: 'none', border: 'none',
    color: active ? '#4f8ff7' : '#6b7080',
    borderBottom: active ? '2px solid #4f8ff7' : '2px solid transparent',
    transition: 'all 0.2s',
  }),
  content: {
    flex: 1, overflowY: 'auto', padding: 14,
  },
  emptyState: { textAlign: 'center', padding: '30px 10px' },
  emptyIcon: { fontSize: 36, color: '#2a2e3f', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 700, marginBottom: 6 },
  emptyText: { fontSize: 13, color: '#6b7080', lineHeight: 1.6, marginBottom: 16 },
  emptyHints: { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  hintChip: { fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#4f8ff715', color: '#4f8ff7', fontWeight: 500 },
  analyzing: { display: 'flex', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center', fontSize: 13, color: '#8b90a0' },
  spinner: {
    width: 16, height: 16, border: '2px solid #2a2e3f',
    borderTopColor: '#4f8ff7', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  toast: {
    position: 'absolute', bottom: 44, left: 14, right: 14,
    padding: '10px 16px', borderRadius: 8,
    background: '#34d399', color: '#041f13',
    fontSize: 13, fontWeight: 600, textAlign: 'center',
    animation: 'slideUp 0.3s ease',
  },
  footer: {
    padding: '8px 16px', borderTop: '1px solid #2a2e3f',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    flexShrink: 0, background: '#181b28',
  },
  footerText: { fontSize: 10, color: '#555a6e' },
  footerDot: { fontSize: 10, color: '#555a6e' },
};
