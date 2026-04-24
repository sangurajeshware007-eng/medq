/**
 * Specialization options for doctor onboarding and search.
 *
 * `value` must match the backend `Specialization` enum exactly (SCREAMING_SNAKE_CASE).
 * `label` is the human-readable display string shown in the UI.
 * `category` / `categoryEmoji` drive grouped display in the searchable picker.
 */

export interface SpecializationOption {
  label: string;
  value: string;
  category: string;
  categoryEmoji: string;
}

export interface SpecializationCategory {
  key: string;
  label: string;
  emoji: string;
}

export const SPECIALIZATION_CATEGORIES: SpecializationCategory[] = [
  { key: 'neurosciences',     label: 'Neurosciences',                   emoji: '🧠' },
  { key: 'cardiac',           label: 'Cardiac Sciences',                emoji: '❤️' },
  { key: 'respiratory',       label: 'Respiratory Sciences',            emoji: '🫁' },
  { key: 'gastro',            label: 'Gastro & Hepatology',             emoji: '🍽️' },
  { key: 'oncology',          label: 'Oncology',                        emoji: '🧬' },
  { key: 'pediatrics',        label: 'Pediatrics & Superspecialties',   emoji: '👶' },
  { key: 'women',             label: 'Obstetrics & Women Care',         emoji: '👩‍⚕️' },
  { key: 'general_medicine',  label: 'General Medicine & Allied',       emoji: '🧓' },
  { key: 'surgical',          label: 'General & Surgical Specialties',  emoji: '🔪' },
  { key: 'orthopaedics',      label: 'Orthopaedics',                    emoji: '🦴' },
  { key: 'ent',               label: 'ENT & Related',                   emoji: '👃' },
  { key: 'eye',               label: 'Eye',                             emoji: '👁️' },
  { key: 'dermatology',       label: 'Dermatology',                     emoji: '🧴' },
  { key: 'dental',            label: 'Dental',                          emoji: '🦷' },
  { key: 'mental_health',     label: 'Mental Health',                   emoji: '💆' },
  { key: 'diagnostics',       label: 'Diagnostics & Imaging',           emoji: '🧪' },
  { key: 'supportive',        label: 'Supportive & Rehabilitation',     emoji: '🧍' },
  { key: 'emergency',         label: 'Emergency & Critical Care',       emoji: '🚨' },
  { key: 'transplant',        label: 'Transplant Programs',             emoji: '🫀' },
  { key: 'other',             label: 'Other Specialized Fields',        emoji: '🧫' },
];

const c = (label: string, value: string, category: string, categoryEmoji: string): SpecializationOption =>
  ({ label, value, category, categoryEmoji });

export const SPECIALIZATIONS: SpecializationOption[] = [

  // ── General Medicine & Allied ────────────────────────────────────────────
  c('General Physician',                 'GENERAL_PHYSICIAN',               'general_medicine',  '🧓'),
  c('Infectious Diseases',               'INFECTIOUS_DISEASES',             'general_medicine',  '🧓'),
  c('Endocrinologist',                   'ENDOCRINOLOGIST',                 'general_medicine',  '🧓'),
  c('Diabetologist',                     'DIABETOLOGIST',                   'general_medicine',  '🧓'),
  c('Rheumatologist',                    'RHEUMATOLOGIST',                  'general_medicine',  '🧓'),
  c('Allergist',                         'ALLERGIST',                       'general_medicine',  '🧓'),
  c('Geriatrics',                        'GERIATRICS',                      'general_medicine',  '🧓'),

  // ── Cardiac Sciences ─────────────────────────────────────────────────────
  c('Cardiologist',                      'CARDIOLOGIST',                    'cardiac',           '❤️'),
  c('Interventional Cardiology',         'INTERVENTIONAL_CARDIOLOGY',       'cardiac',           '❤️'),
  c('Electrophysiology',                 'ELECTROPHYSIOLOGY',               'cardiac',           '❤️'),
  c('Cardiothoracic Surgery',            'CARDIOTHORACIC_SURGERY',          'cardiac',           '❤️'),
  c('Heart & Lung Transplant',           'HEART_LUNG_TRANSPLANT',           'cardiac',           '❤️'),

  // ── Neurosciences ────────────────────────────────────────────────────────
  c('Neurology',                         'NEUROLOGIST',                     'neurosciences',     '🧠'),
  c('Neurosurgery',                      'NEUROSURGERY',                    'neurosciences',     '🧠'),
  c('Neuro Science',                     'NEURO_SCIENCE',                   'neurosciences',     '🧠'),
  c('Movement Disorders',                'MOVEMENT_DISORDERS',              'neurosciences',     '🧠'),
  c("Parkinson's Center",                'PARKINSONS_CENTER',               'neurosciences',     '🧠'),

  // ── Respiratory Sciences ─────────────────────────────────────────────────
  c('Pulmonology',                       'PULMONOLOGIST',                   'respiratory',       '🫁'),
  c('Interventional Pulmonology',        'INTERVENTIONAL_PULMONOLOGY',      'respiratory',       '🫁'),
  c('Sleep Medicine',                    'SLEEP_MEDICINE',                  'respiratory',       '🫁'),
  c('Lung Transplant',                   'LUNG_TRANSPLANT',                 'respiratory',       '🫁'),
  c('Thoracic Surgery',                  'THORACIC_SURGERY',                'respiratory',       '🫁'),
  c('Robotic Thoracic Surgery',          'ROBOTIC_THORACIC_SURGERY',        'respiratory',       '🫁'),

  // ── Gastro & Hepatology ──────────────────────────────────────────────────
  c('Gastroenterology',                  'GASTROENTEROLOGIST',              'gastro',            '🍽️'),
  c('Medical Gastroenterology',          'MEDICAL_GASTROENTEROLOGY',        'gastro',            '🍽️'),
  c('Surgical Gastroenterology',         'SURGICAL_GASTROENTEROLOGY',       'gastro',            '🍽️'),
  c('Hepatology',                        'HEPATOLOGY',                      'gastro',            '🍽️'),
  c('Liver Diseases',                    'LIVER_DISEASES',                  'gastro',            '🍽️'),
  c('Liver Transplant',                  'LIVER_TRANSPLANT',                'gastro',            '🍽️'),
  c('Pancreas Transplantation',          'PANCREAS_TRANSPLANTATION',        'gastro',            '🍽️'),

  // ── Oncology ─────────────────────────────────────────────────────────────
  c('Oncology (General)',                'ONCOLOGIST',                      'oncology',          '🧬'),
  c('Medical Oncology',                  'MEDICAL_ONCOLOGY',                'oncology',          '🧬'),
  c('Surgical Oncology',                 'SURGICAL_ONCOLOGY',               'oncology',          '🧬'),
  c('Radiation Oncology',                'RADIATION_ONCOLOGY',              'oncology',          '🧬'),
  c('Hematology & BMT',                  'HEMATOLOGY_BMT',                  'oncology',          '🧬'),
  c('Head & Neck Cancer',                'HEAD_NECK_CANCER',                'oncology',          '🧬'),

  // ── Pediatrics & Superspecialties ────────────────────────────────────────
  c('Pediatrics',                        'PEDIATRICIAN',                    'pediatrics',        '👶'),
  c('Neonatology',                       'NEONATOLOGY',                     'pediatrics',        '👶'),
  c('Pediatric Cardiology',              'PEDIATRIC_CARDIOLOGY',            'pediatrics',        '👶'),
  c('Pediatric Neurology',               'PEDIATRIC_NEUROLOGY',             'pediatrics',        '👶'),
  c('Pediatric Orthopedics',             'PEDIATRIC_ORTHOPEDICS',           'pediatrics',        '👶'),
  c('Pediatric Surgery',                 'PEDIATRIC_SURGERY',               'pediatrics',        '👶'),
  c('Pediatric Urology',                 'PEDIATRIC_UROLOGY',               'pediatrics',        '👶'),
  c('Pediatric Oncology',                'PEDIATRIC_ONCOLOGY',              'pediatrics',        '👶'),
  c('Pediatric Endocrinology',           'PEDIATRIC_ENDOCRINOLOGY',         'pediatrics',        '👶'),
  c('Pediatric Gastroenterology',        'PEDIATRIC_GASTROENTEROLOGY',      'pediatrics',        '👶'),
  c('Pediatric Nephrology',              'PEDIATRIC_NEPHROLOGY',            'pediatrics',        '👶'),
  c('Pediatric Pulmonology',             'PEDIATRIC_PULMONOLOGY',           'pediatrics',        '👶'),
  c('Pediatric Hematology',              'PEDIATRIC_HEMATOLOGY',            'pediatrics',        '👶'),
  c('Pediatric Liver Transplant',        'PEDIATRIC_LIVER_TRANSPLANT',      'pediatrics',        '👶'),

  // ── Obstetrics & Women Care ──────────────────────────────────────────────
  c('Gynaecology & Obstetrics',          'GYNECOLOGIST',                    'women',             '👩‍⚕️'),
  c('Fetal Medicine',                    'FETAL_MEDICINE',                  'women',             '👩‍⚕️'),
  c('Mother & Child',                    'MOTHER_CHILD',                    'women',             '👩‍⚕️'),

  // ── General & Surgical Specialties ───────────────────────────────────────
  c('General Surgery',                   'GENERAL_SURGEON',                 'surgical',          '🔪'),
  c('Bariatric Surgery',                 'BARIATRIC_SURGERY',               'surgical',          '🔪'),
  c('Proctology',                        'PROCTOLOGY',                      'surgical',          '🔪'),
  c('Vascular Surgery',                  'VASCULAR_SURGERY',                'surgical',          '🔪'),
  c('Plastic Surgery',                   'PLASTIC_SURGERY',                 'surgical',          '🔪'),
  c('Spine Surgery',                     'SPINE_SURGERY',                   'surgical',          '🔪'),
  c('Anesthesiologist',                  'ANESTHESIOLOGIST',                'surgical',          '🔪'),

  // ── Orthopaedics ─────────────────────────────────────────────────────────
  c('Orthopaedics / Orthopedics',        'ORTHOPEDIC',                      'orthopaedics',      '🦴'),
  c('Sports Medicine',                   'SPORTS_MEDICINE',                 'orthopaedics',      '🦴'),
  c('Arthroscopy & Sports Medicine',     'ARTHROSCOPY_SPORTS_MEDICINE',     'orthopaedics',      '🦴'),

  // ── ENT & Related ────────────────────────────────────────────────────────
  c('ENT',                               'ENT',                             'ent',               '👃'),

  // ── Eye ──────────────────────────────────────────────────────────────────
  c('Ophthalmology',                     'OPHTHALMOLOGIST',                 'eye',               '👁️'),

  // ── Dermatology ──────────────────────────────────────────────────────────
  c('Dermatologist',                     'DERMATOLOGIST',                   'dermatology',       '🧴'),

  // ── Dental ───────────────────────────────────────────────────────────────
  c('General Dentist',                   'DENTIST',                         'dental',            '🦷'),
  c('Pedodontist (Pediatric Dentist)',   'PEDODONTIST',                     'dental',            '🦷'),
  c('Orthodontist',                      'ORTHODONTIST',                    'dental',            '🦷'),
  c('Periodontist (Gum Specialist)',     'PERIODONTIST',                    'dental',            '🦷'),
  c('Endodontist (Root Canal Specialist)', 'ENDODONTIST',                   'dental',            '🦷'),
  c('Oral Pathologist',                  'ORAL_PATHOLOGIST',                'dental',            '🦷'),
  c('Oral and Maxillofacial Surgery',    'ORAL_MAXILLOFACIAL_SURGERY',      'dental',            '🦷'),
  c('Prosthodontist',                    'PROSTHODONTIST',                  'dental',            '🦷'),

  // ── Mental Health ─────────────────────────────────────────────────────────
  c('Psychiatry',                        'PSYCHIATRIST',                    'mental_health',     '💆'),
  c('Psychology',                        'PSYCHOLOGY',                      'mental_health',     '💆'),

  // ── Diagnostics & Imaging ─────────────────────────────────────────────────
  c('Radiology',                         'RADIOLOGIST',                     'diagnostics',       '🧪'),
  c('Interventional Radiology',          'INTERVENTIONAL_RADIOLOGY',        'diagnostics',       '🧪'),
  c('Nuclear Medicine',                  'NUCLEAR_MEDICINE',                'diagnostics',       '🧪'),

  // ── Supportive & Rehabilitation ───────────────────────────────────────────
  c('Physiotherapy',                     'PHYSIOTHERAPIST',                 'supportive',        '🧍'),
  c('Nutrition & Dietetics',             'NUTRITION_DIETETICS',             'supportive',        '🧍'),
  c('Pain Medicine',                     'PAIN_MEDICINE',                   'supportive',        '🧍'),
  c('Audiology & Speech Therapy',        'AUDIOLOGY_SPEECH_THERAPY',        'supportive',        '🧍'),

  // ── Emergency & Critical Care ─────────────────────────────────────────────
  c('Emergency Medicine',                'EMERGENCY_MEDICINE',              'emergency',         '🚨'),
  c('Emergency Services',                'EMERGENCY_SERVICES',              'emergency',         '🚨'),
  c('Critical Care',                     'CRITICAL_CARE',                   'emergency',         '🚨'),

  // ── Transplant Programs ───────────────────────────────────────────────────
  // Liver/Lung/Heart/Pediatric transplant entries live in their parent categories
  // (gastro, respiratory, cardiac, pediatrics). Only MULTIORGAN_TRANSPLANT is unique here.
  c('Multiorgan Transplant',             'MULTIORGAN_TRANSPLANT',           'transplant',        '🫀'),

  // ── Other Specialized Fields ──────────────────────────────────────────────
  c('Urology',                           'UROLOGIST',                       'other',             '🧫'),
  c('Nephrology',                        'NEPHROLOGIST',                    'other',             '🧫'),
  c('Andrology',                         'ANDROLOGY',                       'other',             '🧫'),
  c('Podiatry',                          'PODIATRY',                        'other',             '🧫'),
  c('Clinical Genetics',                 'CLINICAL_GENETICS',               'other',             '🧫'),
  c('Robotic Surgery',                   'ROBOTIC_SURGERY',                 'other',             '🧫'),
  c('Vaccination',                       'VACCINATION',                     'other',             '🧫'),
];

/** Map from backend enum value → display label */
const labelByValue = new Map(SPECIALIZATIONS.map((s) => [s.value, s.label]));

/** Get human-readable label for a backend specialization value. Falls back to the value itself. */
export const getSpecializationLabel = (value: string): string =>
  labelByValue.get(value) ?? value;
