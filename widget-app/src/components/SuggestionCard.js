import React from 'react';

const typeConfig = {
  'auto-complete': { color: '#5c9bff', bg: '#5c9bff15', label: 'AI suggestion' },
  'recommendation': { color: '#f59e0b', bg: '#f59e0b15', label: 'Recommendation' },
  'prior-finding': { color: '#a855f7', bg: '#a855f715', label: 'Prior finding' },
  'template': { color: '#34d399', bg: '#34d39915', label: 'Template' },
};

export default function SuggestionCard({ suggestion, onApply }) {
  const config = typeConfig[suggestion.type] || typeConfig['auto-complete'];

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={{ ...styles.badge, background: config.bg, color: config.color }}>
          {config.label}
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
            Apply
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
    background: '#242840',
    border: '1px solid #2e3450',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 7,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  badge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 7px',
    borderRadius: 4,
  },
  confidence: {
    fontSize: 10,
    color: '#6b7080',
    fontFamily: 'monospace',
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#c8cbd6',
    marginBottom: 8,
    whiteSpace: 'pre-wrap',
  },
  actions: {
    display: 'flex',
    gap: 6,
  },
  btnApply: {
    padding: '4px 12px',
    borderRadius: 5,
    border: 'none',
    background: '#5c9bff',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnCopy: {
    padding: '4px 12px',
    borderRadius: 5,
    border: '1px solid #2e3450',
    background: 'transparent',
    color: '#8b90a0',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
