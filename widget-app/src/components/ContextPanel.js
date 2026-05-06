import React from 'react';

export default function ContextPanel({ elementStates, studyContext, events }) {
  return (
    <div style={styles.container}>
      {/* Study context */}
      {studyContext && studyContext.patientId && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Study context</div>
          <div style={styles.contextGrid}>
            <ContextItem label="Patient" value={studyContext.patientId} />
            <ContextItem label="Modality" value={studyContext.modality} />
            <ContextItem label="Body part" value={studyContext.bodyPart} />
          </div>
          {studyContext.indication && (
            <div style={styles.indication}>
              <span style={styles.indicationLabel}>Indication:</span> {studyContext.indication}
            </div>
          )}
        </div>
      )}

      {/* Live element values */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Live context from host</div>
        {Object.keys(elementStates).length === 0 ? (
          <div style={styles.empty}>Waiting for host page data...</div>
        ) : (
          Object.entries(elementStates).map(([label, data]) => (
            <div key={label} style={styles.elementRow}>
              <div style={styles.elementHeader}>
                <span style={styles.elementLabel}>{label}</span>
                <span style={styles.elementId}>#{data.elementId}</span>
              </div>
              <div style={styles.elementValue}>
                {data.value
                  ? data.value.length > 100
                    ? data.value.substring(0, 100) + '...'
                    : data.value
                  : '(empty)'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent events */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Recent events</div>
        {events.length === 0 ? (
          <div style={styles.empty}>No events yet</div>
        ) : (
          events.slice(0, 8).map((evt, i) => (
            <div key={i} style={styles.eventRow}>
              <span style={styles.eventDot(evt.type)} />
              <span style={styles.eventText}>
                {evt.type === 'text' && `${evt.label} changed`}
                {evt.type === 'click' && `Clicked "${evt.label}"`}
                {evt.type === 'select' && `${evt.label} → ${evt.value}`}
                {evt.type === 'context' && `Context updated`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ContextItem({ label, value }) {
  return (
    <div style={styles.contextItem}>
      <div style={styles.contextLabel}>{label}</div>
      <div style={styles.contextValue}>{value || '—'}</div>
    </div>
  );
}

const styles = {
  container: { padding: '0' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: 700, color: '#6b7080', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 },
  contextGrid: { display: 'flex', gap: 8, marginBottom: 8 },
  contextItem: { flex: 1, background: '#1a1d27', borderRadius: 8, padding: '8px 10px' },
  contextLabel: { fontSize: 10, color: '#6b7080', fontWeight: 600, textTransform: 'uppercase' },
  contextValue: { fontSize: 13, fontWeight: 600, color: '#e1e4ed', marginTop: 2 },
  indication: { fontSize: 12, color: '#8b90a0', background: '#1a1d27', borderRadius: 8, padding: '8px 10px' },
  indicationLabel: { fontWeight: 600, color: '#6b7080' },
  empty: { fontSize: 12, color: '#555a6e', fontStyle: 'italic', padding: 8 },
  elementRow: { background: '#1a1d27', borderRadius: 8, padding: '8px 10px', marginBottom: 6 },
  elementHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  elementLabel: { fontSize: 12, fontWeight: 600, color: '#4f8ff7' },
  elementId: { fontSize: 10, color: '#555a6e', fontFamily: 'monospace' },
  elementValue: { fontSize: 12, color: '#c8cbd6', lineHeight: 1.5, wordBreak: 'break-word' },
  eventRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' },
  eventDot: (type) => ({ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: type === 'text' ? '#4f8ff7' : type === 'click' ? '#f59e0b' : type === 'select' ? '#a855f7' : '#34d399' }),
  eventText: { fontSize: 11, color: '#8b90a0' },
};
