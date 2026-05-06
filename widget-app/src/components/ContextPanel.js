import React, { useState } from 'react';

export default function ContextPanel({ elementStates, studyContext, events, legacyData }) {
  const [chameleonOpen, setChameleonOpen] = useState(false);
  const [clinipharmOpen, setClinipharmOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <div style={styles.container}>

      {/* Chameleon — Anamneses */}
      <CollapsibleSection
        icon="🏥"
        title="Chameleon"
        subtitle="Anamneses"
        accent="#a855f7"
        open={chameleonOpen}
        onToggle={() => setChameleonOpen(o => !o)}
        badge={legacyData?.chameleon?.anamneses?.length || 0}
      >
        {legacyData?.chameleon?.anamneses?.length > 0 ? (
          <ul style={styles.anamnesislist}>
            {legacyData.chameleon.anamneses.map((item, i) => (
              <li key={i} style={styles.anamnesisItem}>
                <span style={styles.bullet} />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div style={styles.empty}>No anamnesis data available for this patient.</div>
        )}
      </CollapsibleSection>

      {/* Clinipharm — Medicines */}
      <CollapsibleSection
        icon="💊"
        title="Clinipharm"
        subtitle="Current medicines"
        accent="#34d399"
        open={clinipharmOpen}
        onToggle={() => setClinipharmOpen(o => !o)}
        badge={legacyData?.clinipharm?.medicines?.length || 0}
      >
        {legacyData?.clinipharm?.medicines?.length > 0 ? (
          <div>
            {legacyData.clinipharm.medicines.map((med, i) => (
              <div key={i} style={styles.medRow}>
                <div style={styles.medName}>{med.name}</div>
                <div style={styles.medDetails}>
                  <span style={styles.medDose}>{med.dose}</span>
                  <span style={styles.medSep}>·</span>
                  <span style={styles.medFreq}>{med.freq}</span>
                  <span style={styles.medSep}>·</span>
                  <span style={styles.medIndication}>{med.indication}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.empty}>No medication records available for this patient.</div>
        )}
      </CollapsibleSection>

      {/* Study Context */}
      <CollapsibleSection
        icon="📋"
        title="Study context"
        subtitle="Live data"
        accent="#5c9bff"
        open={contextOpen}
        onToggle={() => setContextOpen(o => !o)}
      >
        {studyContext?.patientId ? (
          <>
            <div style={styles.contextGrid}>
              <ContextItem label="Patient" value={studyContext.patientId} />
              <ContextItem label="Modality" value={studyContext.modality} />
              <ContextItem label="Body part" value={studyContext.bodyPart} />
            </div>
            {studyContext.indication && (
              <div style={styles.indication}>
                <span style={styles.indicationLabel}>Indication: </span>
                {studyContext.indication}
              </div>
            )}
          </>
        ) : (
          <div style={styles.empty}>Waiting for study context...</div>
        )}

        {Object.keys(elementStates).length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={styles.subLabel}>Live editor values</div>
            {Object.entries(elementStates).map(([label, data]) => (
              <div key={label} style={styles.elementRow}>
                <div style={styles.elementHeader}>
                  <span style={styles.elementLabel}>{label}</span>
                  <span style={styles.elementId}>#{data.elementId}</span>
                </div>
                <div style={styles.elementValue}>
                  {data.value
                    ? data.value.length > 80 ? data.value.substring(0, 80) + '…' : data.value
                    : <em style={{ color: '#555a6e' }}>(empty)</em>}
                </div>
              </div>
            ))}
          </div>
        )}

        {events.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={styles.subLabel}>Recent events</div>
            {events.slice(0, 6).map((evt, i) => (
              <div key={i} style={styles.eventRow}>
                <span style={styles.eventDot(evt.type)} />
                <span style={styles.eventText}>
                  {evt.type === 'text' && `${evt.label} changed`}
                  {evt.type === 'click' && `Clicked "${evt.label}"`}
                  {evt.type === 'select' && `${evt.label} → ${evt.value}`}
                  {evt.type === 'context' && 'Context updated'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CollapsibleSection>

    </div>
  );
}

function CollapsibleSection({ icon, title, subtitle, accent, open, onToggle, badge, children }) {
  return (
    <div style={sectionStyles.wrapper}>
      <button style={sectionStyles.header(accent, open)} onClick={onToggle}>
        <div style={sectionStyles.headerLeft}>
          <span style={sectionStyles.icon}>{icon}</span>
          <div>
            <span style={sectionStyles.title}>{title}</span>
            <span style={sectionStyles.subtitle}> — {subtitle}</span>
          </div>
          {badge > 0 && (
            <span style={{ ...sectionStyles.badge, background: accent + '25', color: accent }}>{badge}</span>
          )}
        </div>
        <span style={sectionStyles.chevron(open)}>▾</span>
      </button>
      {open && (
        <div style={sectionStyles.body}>
          {children}
        </div>
      )}
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

const sectionStyles = {
  wrapper: { marginBottom: 8, borderRadius: 10, overflow: 'hidden', border: '1px solid #252a3d' },
  header: (accent, open) => ({
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '9px 12px', background: open ? '#1e2235' : '#191c2a',
    border: 'none', cursor: 'pointer', textAlign: 'left',
    borderBottom: open ? '1px solid #252a3d' : 'none',
    transition: 'background 0.15s',
  }),
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  icon: { fontSize: 14 },
  title: { fontSize: 12, fontWeight: 700, color: '#c8cbd6' },
  subtitle: { fontSize: 11, color: '#6b7080' },
  badge: { fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 8 },
  chevron: (open) => ({
    fontSize: 12, color: '#6b7080',
    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
    transition: 'transform 0.2s',
    display: 'inline-block',
  }),
  body: { padding: '10px 12px', background: '#191c2a' },
};

const styles = {
  container: { paddingBottom: 4 },
  anamnesislist: { listStyle: 'none', margin: 0, padding: 0 },
  anamnesisItem: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    fontSize: 12, color: '#c8cbd6', lineHeight: 1.55, marginBottom: 7,
  },
  bullet: {
    width: 5, height: 5, borderRadius: '50%', background: '#a855f7',
    flexShrink: 0, marginTop: 5,
  },
  medRow: {
    background: '#1a1d27', borderRadius: 8, padding: '7px 10px', marginBottom: 5,
  },
  medName: { fontSize: 12, fontWeight: 600, color: '#34d399', marginBottom: 3 },
  medDetails: { fontSize: 11, color: '#8b90a0', display: 'flex', flexWrap: 'wrap', gap: 4 },
  medDose: { color: '#c8cbd6' },
  medFreq: { color: '#c8cbd6' },
  medSep: { color: '#363d5a' },
  medIndication: { color: '#8b90a0', fontStyle: 'italic' },
  contextGrid: { display: 'flex', gap: 6, marginBottom: 8 },
  contextItem: { flex: 1, background: '#1a1d27', borderRadius: 8, padding: '7px 9px' },
  contextLabel: { fontSize: 9, color: '#6b7080', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  contextValue: { fontSize: 12, fontWeight: 600, color: '#e1e4ed', marginTop: 2 },
  indication: { fontSize: 11, color: '#8b90a0', background: '#1a1d27', borderRadius: 8, padding: '7px 10px' },
  indicationLabel: { fontWeight: 600, color: '#6b7080' },
  subLabel: { fontSize: 9, fontWeight: 700, color: '#555a6e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 },
  elementRow: { background: '#1a1d27', borderRadius: 8, padding: '7px 10px', marginBottom: 5 },
  elementHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  elementLabel: { fontSize: 11, fontWeight: 600, color: '#5c9bff' },
  elementId: { fontSize: 9, color: '#555a6e', fontFamily: 'monospace' },
  elementValue: { fontSize: 11, color: '#c8cbd6', lineHeight: 1.4, wordBreak: 'break-word' },
  eventRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0' },
  eventDot: (type) => ({ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: type === 'text' ? '#5c9bff' : type === 'click' ? '#f59e0b' : type === 'select' ? '#a855f7' : '#34d399' }),
  eventText: { fontSize: 11, color: '#8b90a0' },
  empty: { fontSize: 12, color: '#555a6e', fontStyle: 'italic', padding: '4px 0' },
};
