import React, { useState } from 'react';
import { openDocument } from '../utils/openDocument';

// ── Icons ────────────────────────────────────────────────────────────────────

const ChevronIcon = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease', display: 'block', color: '#3d4a65' }}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const FileIcon = ({ color }) => (
  <svg width="15" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="12" y2="17"/>
  </svg>
);

const OpenIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9b72f8" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function ContextPanel({ elementStates, studyContext, legacyData }) {
  const [contextOpen, setContextOpen] = useState(true);
  const [chameleonOpen, setChameleonOpen] = useState(true);
  const [clinipharmOpen, setClinipharmOpen] = useState(true);

  const patientName = studyContext?.patientName || 'Unknown Patient';

  return (
    <div style={s.container}>

      {/* Study Context */}
      <Section
        accentColor="#4f83ff"
        label="Study Context"
        sublabel="Live data"
        open={contextOpen}
        onToggle={() => setContextOpen(o => !o)}
      >
        {studyContext?.patientId ? (
          <>
            <div style={s.statGrid}>
              <StatCard label="Patient" value={studyContext.patientId} color="#4f83ff" />
              <StatCard label="Modality" value={studyContext.modality} color="#4f83ff" />
              <StatCard label="Body part" value={studyContext.bodyPart} color="#4f83ff" />
            </div>
            {studyContext.indication && (
              <div style={s.indicationBox}>
                <span style={s.indicationLabel}>Indication</span>
                <div style={s.indicationText}>{studyContext.indication}</div>
              </div>
            )}
          </>
        ) : (
          <div style={s.emptyMsg}>Waiting for study context...</div>
        )}

        {Object.keys(elementStates).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={s.miniLabel}>Live editor values</div>
            {Object.entries(elementStates).map(([label, data]) => (
              <div key={label} style={s.editorRow}>
                <div style={s.editorRowHead}>
                  <span style={s.editorLabel}>{label}</span>
                  <span style={s.editorId}>#{data.elementId}</span>
                </div>
                <div style={s.editorVal}>
                  {data.value
                    ? data.value.length > 120 ? data.value.substring(0, 120) + '…' : data.value
                    : <em style={{ color: '#2d3550' }}>empty</em>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Chameleon */}
      <Section
        accentColor="#9b72f8"
        label="Chameleon"
        sublabel="Clinical documents"
        badge={legacyData?.chameleon?.documents?.length || 0}
        open={chameleonOpen}
        onToggle={() => setChameleonOpen(o => !o)}
      >
        {legacyData?.chameleon?.documents?.length > 0 ? (
          legacyData.chameleon.documents.map((doc) => (
            <button key={doc.id} style={s.docRow} onClick={() => openDocument(doc, patientName)}>
              <div style={s.docIconWrap}>
                <FileIcon color="#9b72f8" />
              </div>
              <div style={s.docInfo}>
                <div style={s.docTitle}>{doc.title}</div>
                <div style={s.docDate}>{doc.date}</div>
              </div>
              <OpenIcon />
            </button>
          ))
        ) : (
          <div style={s.emptyMsg}>No documents for this patient</div>
        )}
      </Section>

      {/* Clinipharm */}
      <Section
        accentColor="#2dd4bf"
        label="Clinipharm"
        sublabel="Current medicines"
        badge={legacyData?.clinipharm?.medicines?.length || 0}
        open={clinipharmOpen}
        onToggle={() => setClinipharmOpen(o => !o)}
      >
        {legacyData?.clinipharm?.medicines?.length > 0 ? (
          legacyData.clinipharm.medicines.map((med, i) => (
            <div key={i} style={s.medRow}>
              <div style={s.medAccent} />
              <div style={s.medBody}>
                <div style={s.medName}>{med.name}</div>
                <div style={s.medMeta}>
                  <span style={s.medDose}>{med.dose}</span>
                  <span style={s.metaSep} />
                  <span style={s.medFreq}>{med.freq}</span>
                  <span style={s.metaSep} />
                  <span style={s.medInd}>{med.indication}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={s.emptyMsg}>No medication records for this patient</div>
        )}
      </Section>

    </div>
  );
}

// ── Section component ─────────────────────────────────────────────────────────

function Section({ accentColor, label, sublabel, badge, open, onToggle, children }) {
  return (
    <div style={{ ...s.sectionWrap, borderLeftColor: accentColor }}>
      <button style={{ ...s.sectionHead, background: open ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)' }} onClick={onToggle}>
        <div style={s.sectionHeadLeft}>
          <div style={{ ...s.accentDot, background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
          <div>
            <span style={s.sectionLabel}>{label}</span>
            <span style={s.sectionSub}> · {sublabel}</span>
          </div>
          {badge > 0 && (
            <span style={{ ...s.sectionBadge, color: accentColor, background: accentColor + '1a', border: `1px solid ${accentColor}30` }}>
              {badge}
            </span>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && <div style={s.sectionBody}>{children}</div>}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...s.statCard, borderColor: color + '22' }}>
      <div style={{ ...s.statLabel, color }}>{label}</div>
      <div style={s.statValue}>{value || '—'}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = {
  container: { paddingBottom: 4 },

  // Section
  sectionWrap: {
    marginBottom: 8, borderRadius: 11, overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.07)',
    borderLeft: '3px solid transparent',
  },
  sectionHead: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 13px', border: 'none', cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s', color: 'inherit',
  },
  sectionHeadLeft: { display: 'flex', alignItems: 'center', gap: 9 },
  accentDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  sectionLabel: { fontSize: 12, fontWeight: 700, color: '#c8d8ff' },
  sectionSub: { fontSize: 10, color: '#4a5980' },
  sectionBadge: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9 },
  sectionBody: { padding: '10px 13px 12px', background: 'rgba(0,0,0,0.15)' },

  // Study context
  statGrid: { display: 'flex', gap: 6, marginBottom: 8 },
  statCard: {
    flex: 1, borderRadius: 8, padding: '8px 10px',
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
  },
  statLabel: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  statValue: { fontSize: 12, fontWeight: 700, color: '#dce6f8' },
  indicationBox: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '8px 10px',
  },
  indicationLabel: { fontSize: 9, fontWeight: 700, color: '#4a5980', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 3 },
  indicationText: { fontSize: 11, color: '#8b96b0', lineHeight: 1.5 },
  miniLabel: { fontSize: 9, fontWeight: 700, color: '#2d3550', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 },
  editorRow: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: '7px 10px', marginBottom: 5,
  },
  editorRowHead: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 },
  editorLabel: { fontSize: 11, fontWeight: 600, color: '#4f83ff' },
  editorId: { fontSize: 9, color: '#2d3550', fontFamily: 'monospace' },
  editorVal: { fontSize: 11, color: '#8b96b0', lineHeight: 1.4, wordBreak: 'break-word' },

  // Document row
  docRow: {
    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
    background: 'rgba(155,114,248,0.06)', border: '1px solid rgba(155,114,248,0.15)',
    borderRadius: 9, padding: '10px 12px', marginBottom: 6,
    cursor: 'pointer', textAlign: 'left', color: 'inherit', transition: 'background 0.15s',
  },
  docIconWrap: {
    width: 34, height: 38, borderRadius: 7, flexShrink: 0,
    background: 'rgba(155,114,248,0.1)', border: '1px solid rgba(155,114,248,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  docInfo: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 12, fontWeight: 600, color: '#c8d8ff', marginBottom: 3 },
  docDate: { fontSize: 10, color: '#4a5980', fontFamily: 'monospace' },

  // Medicine row
  medRow: {
    display: 'flex', gap: 10, alignItems: 'stretch', marginBottom: 6,
    background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.12)',
    borderRadius: 9, overflow: 'hidden',
  },
  medAccent: { width: 3, flexShrink: 0, background: '#2dd4bf', opacity: 0.7 },
  medBody: { flex: 1, padding: '8px 10px 8px 0' },
  medName: { fontSize: 12, fontWeight: 700, color: '#dce6f8', marginBottom: 3 },
  medMeta: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  medDose: { fontSize: 10, color: '#8b96b0' },
  medFreq: { fontSize: 10, color: '#8b96b0' },
  medInd: { fontSize: 10, color: '#4a5980', fontStyle: 'italic' },
  metaSep: { width: 3, height: 3, borderRadius: '50%', background: '#2d3550', flexShrink: 0, display: 'inline-block' },

  emptyMsg: { fontSize: 11, color: '#2d3550', fontStyle: 'italic', padding: '4px 0' },
};
