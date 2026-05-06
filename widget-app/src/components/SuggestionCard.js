import React from 'react';

const typeConfig = {
  'auto-complete':  { color: '#4f83ff', bg: 'rgba(79,131,255,0.1)',  border: 'rgba(79,131,255,0.22)',  label: 'AI Suggestion' },
  'recommendation': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.22)', label: 'Recommendation' },
  'prior-finding':  { color: '#9b72f8', bg: 'rgba(155,114,248,0.1)', border: 'rgba(155,114,248,0.22)', label: 'Prior Finding' },
  'template':       { color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.22)', label: 'Template' },
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
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 7,
    transition: 'border-color 0.15s',
  },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, letterSpacing: '0.2px' },
  confidence: { fontSize: 10, color: '#3d4a65', fontFamily: 'monospace', fontWeight: 600 },
  text: { fontSize: 12, lineHeight: 1.55, color: '#a8b8d0', marginBottom: 9, whiteSpace: 'pre-wrap' },
  actions: { display: 'flex', gap: 6 },
  btn: { padding: '5px 13px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none' },
  btnPrimary: {
    background: 'linear-gradient(90deg,#4f83ff,#7c5af6)',
    color: '#fff', boxShadow: '0 2px 8px rgba(79,131,255,0.3)',
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    color: '#7b88a8',
  },
};
