const NURSE_CONTENT = (patientName, date) => `
  <div class="section">
    <div class="section-title">Patient Assessment</div>
    <div class="row"><span class="label">Patient:</span><span>${patientName}</span></div>
    <div class="row"><span class="label">Date / Time:</span><span>${date}</span></div>
    <div class="row"><span class="label">Ward:</span><span>Internal Medicine — Room 4B</span></div>
    <div class="row"><span class="label">Nurse:</span><span>R. Shapiro RN</span></div>
  </div>
  <div class="section">
    <div class="section-title">Vital Signs</div>
    <div class="grid">
      <div class="cell"><div class="cell-label">BP</div><div class="cell-val">138 / 84 mmHg</div></div>
      <div class="cell"><div class="cell-label">HR</div><div class="cell-val">88 bpm</div></div>
      <div class="cell"><div class="cell-label">SpO₂</div><div class="cell-val">96 %</div></div>
      <div class="cell"><div class="cell-label">Temp</div><div class="cell-val">37.4 °C</div></div>
      <div class="cell"><div class="cell-label">RR</div><div class="cell-val">18 /min</div></div>
      <div class="cell"><div class="cell-label">Pain</div><div class="cell-val">4 / 10 VAS</div></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Nursing Notes</div>
    <p>Patient is alert and oriented x3. Cooperative with care. Reports mild dyspnea on exertion but denies chest pain at rest. IV access patent in right antecubital. Receiving normal saline at 80 mL/hr.</p>
    <p>Lung auscultation: diminished breath sounds at right base. No audible wheeze. Abdomen soft, non-tender. Peripheral oedema absent. Skin warm and dry.</p>
    <p>Patient educated on deep breathing exercises and incentive spirometry. Call light within reach. Safety rails up. Bed in lowest position.</p>
  </div>
  <div class="section">
    <div class="section-title">Medications Administered</div>
    <table>
      <tr><th>Medication</th><th>Dose</th><th>Route</th><th>Time</th></tr>
      <tr><td>Amlodipine</td><td>10 mg</td><td>PO</td><td>08:00</td></tr>
      <tr><td>Atorvastatin</td><td>40 mg</td><td>PO</td><td>08:00</td></tr>
      <tr><td>Salbutamol nebuliser</td><td>2.5 mg</td><td>INH</td><td>07:30</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Plan</div>
    <p>Continue monitoring vital signs every 4 hours. Chest imaging scheduled for AM. Pulmonology consult pending. Notify physician if SpO₂ drops below 92% or HR &gt; 110 bpm.</p>
  </div>
`;

const SURGERY_CONTENT = (patientName, date) => `
  <div class="section">
    <div class="section-title">Operative Report</div>
    <div class="row"><span class="label">Patient:</span><span>${patientName}</span></div>
    <div class="row"><span class="label">Date / Time:</span><span>${date}</span></div>
    <div class="row"><span class="label">Surgeon:</span><span>Dr. A. Ben-David, MD FACS</span></div>
    <div class="row"><span class="label">Assistant:</span><span>Dr. T. Goldberg</span></div>
    <div class="row"><span class="label">Anaesthesiologist:</span><span>Dr. M. Peretz</span></div>
    <div class="row"><span class="label">Anaesthesia:</span><span>General — endotracheal intubation</span></div>
    <div class="row"><span class="label">Duration:</span><span>1 hr 45 min</span></div>
    <div class="row"><span class="label">EBL:</span><span>~ 120 mL</span></div>
  </div>
  <div class="section">
    <div class="section-title">Pre-operative Diagnosis</div>
    <p>Right lower lobe pulmonary mass, 2.3 cm, suspected malignancy (CT-guided biopsy pending).</p>
  </div>
  <div class="section">
    <div class="section-title">Post-operative Diagnosis</div>
    <p>Same as pre-operative. Frozen section: adenocarcinoma, well differentiated. Final pathology pending.</p>
  </div>
  <div class="section">
    <div class="section-title">Procedure</div>
    <p>The patient was positioned in the left lateral decubitus position. A right posterolateral thoracotomy was performed through the 5th intercostal space. The right lower lobe mass was identified and resected with clear macroscopic margins (right lower lobectomy). Mediastinal lymph node sampling performed at levels 4R, 7, and 10R.</p>
    <p>Haemostasis achieved with cautery and 3-0 Prolene sutures. Two 28 Fr chest tubes placed — one apical, one basal. Chest closed in layers. Skin closed with subcuticular 3-0 Monocryl. Sterile dressing applied.</p>
  </div>
  <div class="section">
    <div class="section-title">Specimens Sent</div>
    <table>
      <tr><th>Specimen</th><th>Container</th><th>Destination</th></tr>
      <tr><td>Right lower lobe — lobectomy specimen</td><td>Formalin</td><td>Histopathology</td></tr>
      <tr><td>Mediastinal LN — level 7</td><td>Formalin</td><td>Histopathology</td></tr>
      <tr><td>Mediastinal LN — level 4R</td><td>Formalin</td><td>Histopathology</td></tr>
    </table>
  </div>
  <div class="section">
    <div class="section-title">Post-operative Orders</div>
    <p>ICU admission. Chest tube to water-seal suction at −20 cmH₂O. Incentive spirometry QID. DVT prophylaxis — enoxaparin 40 mg SC once daily from POD1. Analgesia — epidural PCA morphine. Follow-up CXR in AM.</p>
  </div>
`;

const HTML_SHELL = (type, patientName, date, body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${type === 'nurse' ? 'Nurse Report' : 'Surgery Report'} — ${patientName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f4f6f9; color: #1a1e2e; font-size: 13px; }
  .page { max-width: 720px; margin: 24px auto 40px; background: #fff; border-radius: 8px; box-shadow: 0 2px 20px rgba(0,0,0,0.12); overflow: hidden; }
  .doc-header { padding: 20px 28px 16px; border-bottom: 3px solid ${type === 'nurse' ? '#a855f7' : '#5c9bff'}; background: linear-gradient(135deg,#1e2235 0%,#252a3d 100%); color: #fff; }
  .doc-type { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${type === 'nurse' ? '#c084fc' : '#93c5fd'}; margin-bottom: 4px; }
  .doc-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
  .doc-meta { font-size: 11px; color: #9ba3be; }
  .watermark { float: right; margin-top: -8px; font-size: 32px; opacity: 0.3; }
  .body { padding: 24px 28px; }
  .section { margin-bottom: 22px; }
  .section-title { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: ${type === 'nurse' ? '#a855f7' : '#5c9bff'}; border-bottom: 1px solid #e8ecf5; padding-bottom: 5px; margin-bottom: 10px; }
  .row { display: flex; gap: 12px; margin-bottom: 5px; font-size: 13px; }
  .label { font-weight: 600; color: #6b7280; min-width: 130px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .cell { background: #f4f6f9; border-radius: 6px; padding: 8px 12px; }
  .cell-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ba3be; margin-bottom: 3px; }
  .cell-val { font-size: 14px; font-weight: 700; color: #1a1e2e; }
  p { line-height: 1.7; color: #374151; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f4f6f9; text-align: left; padding: 7px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 1px solid #e8ecf5; }
  td { padding: 7px 10px; border-bottom: 1px solid #f0f2f7; color: #374151; }
  .footer { padding: 12px 28px; background: #f4f6f9; border-top: 1px solid #e8ecf5; font-size: 10px; color: #9ba3be; display: flex; justify-content: space-between; }
  .stamp { display: inline-block; border: 2px solid #34d399; color: #059669; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 4px; letter-spacing: 1px; transform: rotate(-3deg); margin-top: 2px; }
</style>
</head>
<body>
<div class="page">
  <div class="doc-header">
    <span class="watermark">${type === 'nurse' ? '🏥' : '⚕️'}</span>
    <div class="doc-type">Chameleon Clinical System — Document</div>
    <div class="doc-title">${type === 'nurse' ? 'Nurse Report' : 'Operative / Surgery Report'}</div>
    <div class="doc-meta">Patient: ${patientName} &nbsp;·&nbsp; ${date} &nbsp;·&nbsp; Ref: ${type === 'nurse' ? 'NR' : 'SR'}-${Math.floor(Math.random()*90000+10000)}</div>
  </div>
  <div class="body">
    ${body}
    <div style="margin-top:18px;text-align:right;"><span class="stamp">SIGNED</span></div>
  </div>
  <div class="footer">
    <span>Chameleon Clinical Information System v4.2 &nbsp;·&nbsp; Confidential patient record</span>
    <span>Printed: ${new Date().toLocaleString()}</span>
  </div>
</div>
</body>
</html>`;

export function openDocument(doc, patientName) {
  const body = doc.type === 'nurse'
    ? NURSE_CONTENT(patientName, doc.date)
    : SURGERY_CONTENT(patientName, doc.date);

  const html = HTML_SHELL(doc.type, patientName, doc.date, body);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=780,height=900,resizable=yes,scrollbars=yes');
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}
