import React from 'react';

const typeConfig = {
  'auto-complete': { icon: '⚡', color: '#4f8ff7', bg: '#4f8ff715', label: 'AI suggestion' },
  'recommendation': { icon: '💡', color: '#f59e0b', bg: '#f59e0b15', label: 'Recommendation' },
  'prior-finding': { icon: '📋', color: '#a855f7', bg: '#a855f715', label: 'Prior finding' },
  'template': { icon: '📄', color: '#34d399', bg: '#34d39915', label: 'Template' },
};

export default function SuggestionCard({ suggestion, onApply }) {
  const config = typeConfig[suggestion.type] || typeConfig['auto-complete'];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={{ ...styles.badge, background: config.bg, color: config.color }}>
          {config.icon} {config.label}
        </span>
        {suggestion.confidence && (
          <span style={styles.confidence}>
            {Math.round(suggestion.confidence * 100)}%
          </span>
        )}
      </div>
      <div style={styles.text}>{suggestion.text}</div>
      <div style={styles.actions}>
        {suggestion.target && (
          <button style={styles.btnApply} onClick={() => onApply(suggestion)}>
            Insert
          </button>
        )}
        {suggestion.type === 'template' && (
          <button style={styles.btnApply} onClick={() => onApply({ ...suggestion, target: 'findings-editor' })}>
            Apply template
          </button>
        )}
        <button style={styles.btnCopy} onClick={() => navigator.clipboard.writeText(suggestion.text)}>
          Copy
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#1a1d27',
    border: '1px solid #2a2e3f',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    transition: 'border-color 0.2s',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 5,
  },
  confidence: {
    fontSize: 11,
    color: '#8b90a0',
    fontFamily: 'monospace',
  },
  text: {
    fontSize: 13,
    lineHeight: 1.6,
    color: '#c8cbd6',
    marginBottom: 10,
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  btnApply: {
    padding: '5px 14px',
    borderRadius: 6,
    border: 'none',
    background: '#4f8ff7',
    color: '#fff',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  btnCopy: {
    padding: '5px 14px',
    borderRadius: 6,
    border: '1px solid #2a2e3f',
    background: 'transparent',
    color: '#8b90a0',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
