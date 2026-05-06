export const LEGACY_DATA = {
  'P-78432': {
    chameleon: {
      anamneses: [
        'Chronic smoker – 20 pack-years. Quit 3 years ago.',
        'Hypertension diagnosed 8 years ago, on antihypertensive therapy.',
        'Family history: father deceased from lung carcinoma (age 67).',
        'Progressive dyspnea on exertion ~3 months with occasional productive cough.',
      ],
    },
    clinipharm: {
      medicines: [
        { name: 'Amlodipine', dose: '10 mg', freq: 'Once daily', indication: 'Hypertension' },
        { name: 'Atorvastatin', dose: '40 mg', freq: 'Nightly', indication: 'Hyperlipidemia' },
        { name: 'Aspirin', dose: '100 mg', freq: 'Once daily', indication: 'Cardiovascular prophylaxis' },
        { name: 'Salbutamol inhaler', dose: '100 mcg/puff', freq: 'PRN', indication: 'Bronchospasm' },
      ],
    },
  },
  'P-91205': {
    chameleon: {
      anamneses: [
        'Non-smoker, no known cardiopulmonary disease.',
        'Type 2 diabetes mellitus – well controlled on oral agents.',
        'Hypertension – mild, on low-dose ACE inhibitor.',
        'Scheduled for elective left knee arthroplasty. Good exercise tolerance.',
      ],
    },
    clinipharm: {
      medicines: [
        { name: 'Metformin', dose: '500 mg', freq: 'Twice daily', indication: 'T2DM' },
        { name: 'Lisinopril', dose: '5 mg', freq: 'Once daily', indication: 'Hypertension' },
      ],
    },
  },
  'P-33187': {
    chameleon: {
      anamneses: [
        'Migraines since age 18, predominantly right-sided with visual aura.',
        'Increased frequency over 2 months (3–4 episodes/week).',
        'No focal neurological deficits on examination. No recent head trauma.',
        'Family history: maternal aunt – intracranial aneurysm.',
      ],
    },
    clinipharm: {
      medicines: [
        { name: 'Sumatriptan', dose: '50 mg', freq: 'PRN (max 2/day)', indication: 'Acute migraine' },
        { name: 'Propranolol', dose: '40 mg', freq: 'Twice daily', indication: 'Migraine prophylaxis' },
        { name: 'Oral contraceptive pill', dose: 'Standard dose', freq: 'Once daily', indication: 'Contraception' },
      ],
    },
  },
  'P-55921': {
    chameleon: {
      anamneses: [
        "Known Crohn's disease (terminal ileum), diagnosed 6 years ago.",
        'Currently in clinical remission; last flare 18 months ago.',
        'Acute-onset right iliac fossa pain, fever 38.4°C, rebound tenderness.',
        'Last colonoscopy 14 months ago – no strictures or active disease.',
      ],
    },
    clinipharm: {
      medicines: [
        { name: 'Azathioprine', dose: '100 mg', freq: 'Once daily', indication: "Crohn's maintenance" },
        { name: 'Mesalazine', dose: '800 mg', freq: 'Three times daily', indication: 'IBD maintenance' },
        { name: 'Omeprazole', dose: '20 mg', freq: 'Once daily', indication: 'Gastroprotection' },
        { name: 'Vitamin D3', dose: '1000 IU', freq: 'Once daily', indication: 'Supplementation' },
        { name: 'Calcium carbonate', dose: '500 mg', freq: 'Twice daily', indication: 'Bone protection' },
      ],
    },
  },
};
