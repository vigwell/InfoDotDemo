import React from 'react';

const typeConfig = {
  'auto-complete':  { color: '#4f6fff', bg: '#eef1ff',  border: '#c7d0ff',  label: 'AI Suggestion' },
  'recommendation': { color: '#d97706', bg: '#fef9ec', border: '#fcd97a', label: 'Recommendation' },
  'prior-finding':  { color: '#7c3aed', bg: '#f3f0ff', border: '#c4b5fd', label: 'Prior Finding' },
  'template':       { color: '#0d9488', bg: '#f0fdfb', border: '#99f6e4', label: 'Template' },
};

export default function SuggestionCard({ suggestion, onApply }) {
  const cfg = typeConfig[suggestion.type] || typeConfig['auto-complete'];

  return (
    <div style={{ ...s.card, borderColor: cfg.border }}>
      <div style={s.head}>
        <span style={{ ...s.badge, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
        {suggestion.confidence && (
          <span style={s.confidence}>{Math.round(suggestion.confidence * 100)}%</span>
        )}
      </div>
      <div style={s.text}>{suggestion.text}</div>
      <div style={s.actions}>
        {suggestion.target && (
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => onApply(suggestion)}>
            Insert
          </button>
        )}
        {suggestion.type === 'template' && (
          <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => onApply({ ...suggestion, target: 'findings-editor' })}>
            Apply
          </button>
        )}
        <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => navigator.clipboard.writeText(suggestion.text)}>
          Copy
        </button>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: '#ffffff',
    border: '1px solid #dde2ea',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 7,
    transition: 'border-color 0.15s',
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, letterSpacing: '0.2px' },
  confidence: { fontSize: 10, color: '#a0abc0', fontFamily: 'monospace', fontWeight: 600 },
  text: { fontSize: 12, lineHeight: 1.55, color: '#3a4a62', marginBottom: 9, whiteSpace: 'pre-wrap' },
  actions: { display: 'flex', gap: 6 },
  btn: { padding: '5px 13px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none' },
  btnPrimary: {
    background: '#4f6fff',
    color: '#fff', boxShadow: '0 2px 6px rgba(79,111,255,0.25)',
  },
  btnGhost: {
    background: '#f2f4f7',
    border: '1px solid #dde2ea',
    color: '#6b7a99',
  },
};
