import type { ChronicConditionId } from '../types/triageClinical'

export const TRIAGE_SYMPTOM_OPTIONS = [
  { id: 'fever', label: 'Febre' },
  { id: 'headache', label: 'Dor de cabeça' },
  { id: 'cough', label: 'Tosse' },
  { id: 'shortness_of_breath', label: 'Falta de ar' },
  { id: 'nausea', label: 'Náusea' },
  { id: 'dizziness', label: 'Tontura' },
  { id: 'chest_pain', label: 'Dor no peito' },
  { id: 'abdominal_pain', label: 'Dor abdominal' },
  { id: 'body_ache', label: 'Dor no corpo' },
  { id: 'sore_throat', label: 'Dor de garganta' },
  { id: 'diarrhea', label: 'Diarreia' },
  { id: 'fatigue', label: 'Cansaço' },
] as const

export const TRIAGE_CHRONIC_CONDITIONS: Array<{
  id: ChronicConditionId
  label: string
}> = [
  { id: 'hypertension', label: 'Hipertensão' },
  { id: 'diabetes_type_1', label: 'Diabetes tipo 1' },
  { id: 'diabetes_type_2', label: 'Diabetes tipo 2' },
  { id: 'asthma_copd', label: 'Asma / DPOC' },
  { id: 'heart_disease', label: 'Doença cardíaca' },
  { id: 'renal_failure', label: 'Insuficiência renal' },
  { id: 'epilepsy', label: 'Epilepsia' },
  { id: 'depression_anxiety', label: 'Depressão / ansiedade' },
  { id: 'obesity', label: 'Obesidade' },
  { id: 'hypothyroidism', label: 'Hipotiroidismo' },
  { id: 'cancer_treatment', label: 'Câncer em tratamento' },
  { id: 'other', label: 'Outra' },
  { id: 'none', label: 'Nenhuma' },
]

export const SYMPTOM_ONSET_LABELS = {
  today: 'Hoje',
  yesterday: 'Ontem',
  few_days: 'Há alguns dias',
  over_week: 'Há mais de 1 semana',
} as const

export const SYMPTOM_INTENSITY_LABELS = {
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
} as const
