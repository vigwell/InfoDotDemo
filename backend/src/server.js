const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// --- Mock AI suggestion engine ---
function generateSuggestions(elements, studyContext) {
  const findings = (elements['Findings'] || '').toLowerCase();
  const impression = elements['Impression'] || '';
  const modality = elements['Modality'] || studyContext?.modality || 'CT';
  const bodyPart = studyContext?.bodyPart || 'CHEST';

  const suggestions = [];

  // Context-aware suggestions based on what the user is typing
  if (findings.includes('nodule') || findings.includes('lesion')) {
    suggestions.push({
      id: 's1',
      type: 'auto-complete',
      target: 'impression-editor',
      label: 'Suggested impression',
      text: `Pulmonary nodule identified. Recommend follow-up ${modality} in 3 months per Fleischner criteria.`,
      confidence: 0.88
    });
    suggestions.push({
      id: 's2',
      type: 'recommendation',
      label: 'Clinical recommendation',
      text: 'Consider PET-CT if nodule > 8mm or if patient has risk factors.',
      confidence: 0.72
    });
  }

  if (findings.includes('fracture') || findings.includes('break')) {
    suggestions.push({
      id: 's3',
      type: 'auto-complete',
      target: 'impression-editor',
      label: 'Suggested impression',
      text: 'Acute fracture identified. Clinical correlation and orthopedic consultation recommended.',
      confidence: 0.91
    });
  }

  if (findings.includes('pneumonia') || findings.includes('consolidation') || findings.includes('opacity')) {
    suggestions.push({
      id: 's4',
      type: 'auto-complete',
      target: 'impression-editor',
      label: 'Suggested impression',
      text: 'Findings consistent with pneumonia. Recommend clinical correlation and follow-up imaging after treatment.',
      confidence: 0.85
    });
    suggestions.push({
      id: 's5',
      type: 'prior-finding',
      label: 'Prior study comparison',
      text: 'Prior chest XR (2025-11-20): Lungs were clear bilaterally. No consolidation.',
      source: 'prior-study-uid-001',
      confidence: 0.95
    });
  }

  if (findings.includes('effusion')) {
    suggestions.push({
      id: 's6',
      type: 'auto-complete',
      target: 'impression-editor',
      label: 'Suggested impression',
      text: 'Pleural effusion noted. Consider thoracentesis if clinically significant. Follow-up imaging recommended.',
      confidence: 0.82
    });
  }

  if (findings.length > 10 && !impression) {
    suggestions.push({
      id: 's7',
      type: 'template',
      label: 'Apply report template',
      text: getTemplate(modality, bodyPart),
      confidence: 0.6
    });
  }

  // Always suggest based on modality if we have context
  if (suggestions.length === 0 && findings.length > 5) {
    suggestions.push({
      id: 's8',
      type: 'auto-complete',
      target: 'impression-editor',
      label: 'General impression',
      text: `${modality} of the ${bodyPart.toLowerCase()}: Findings as described above. No acute abnormality identified.`,
      confidence: 0.5
    });
  }

  return suggestions;
}

function getTemplate(modality, bodyPart) {
  const templates = {
    'CT-CHEST': 'FINDINGS:\nLungs: Clear bilaterally.\nPleura: No effusion.\nMediastinum: Normal.\nHeart: Normal size.\nBones: No acute osseous abnormality.\n\nIMPRESSION:\nNo acute cardiopulmonary process.',
    'CT-ABDOMEN': 'FINDINGS:\nLiver: Normal size and attenuation.\nGallbladder: Unremarkable.\nPancreas: Normal.\nSpleen: Normal.\nKidneys: Bilateral normal.\nBowel: Unremarkable.\n\nIMPRESSION:\nNo acute abdominal abnormality.',
    'XR-CHEST': 'FINDINGS:\nHeart size: Normal.\nMediastinum: Unremarkable.\nLungs: Clear bilaterally.\nPleura: No effusion or pneumothorax.\nBones: Intact.\n\nIMPRESSION:\nNo acute cardiopulmonary abnormality.',
    'MR-BRAIN': 'FINDINGS:\nBrain parenchyma: Normal signal intensity.\nVentricles: Normal size and configuration.\nExtra-axial spaces: Unremarkable.\nMidline structures: No shift.\n\nIMPRESSION:\nUnremarkable MRI of the brain.'
  };
  return templates[`${modality}-${bodyPart}`] || templates['CT-CHEST'];
}

// --- API endpoints ---

// Widget analyze endpoint — receives context, returns suggestions
app.post('/api/widget/analyze', (req, res) => {
  const { elements, studyContext } = req.body;

  console.log('[Analyze] Received context:', JSON.stringify(elements, null, 2));

  const suggestions = generateSuggestions(elements || {}, studyContext || {});

  res.json({
    suggestions,
    timestamp: Date.now(),
    contextReceived: Object.keys(elements || {})
  });
});

// Widget event log (for demo/debugging)
app.post('/api/widget/event', (req, res) => {
  const { eventType, elementId, label, value } = req.body;
  console.log(`[Event] ${eventType}: ${label} (${elementId}) = ${value ? value.substring(0, 50) : 'N/A'}`);
  res.json({ ok: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'widget-poc-backend' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`   POST /api/widget/analyze — AI suggestion endpoint`);
  console.log(`   POST /api/widget/event   — Event logging\n`);
});
