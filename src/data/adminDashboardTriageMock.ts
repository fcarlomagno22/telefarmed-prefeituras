import type { AdminDashboardTriageChartsView } from '../../types/adminDashboardTriage'

export function buildMockAdminDashboardTriageCharts(
  consultationVolume: number,
): AdminDashboardTriageChartsView {
  const totalTriages = Math.max(24, Math.round(consultationVolume * 0.72))
  const withChronicCount = Math.round(totalTriages * 0.46)
  const withoutChronicCount = Math.max(0, totalTriages - withChronicCount)

  return {
    totalTriages,
    chronicShare: {
      withChronicCount,
      withoutChronicCount,
      withChronicPercent: Math.round((withChronicCount / totalTriages) * 100),
    },
    chronicConditions: [
      { key: 'hypertension', label: 'Hipertensão', count: 38, percent: 22 },
      { key: 'diabetes_type_2', label: 'Diabetes tipo 2', count: 27, percent: 16 },
      { key: 'obesity', label: 'Obesidade', count: 19, percent: 11 },
      { key: 'depression_anxiety', label: 'Depressão / ansiedade', count: 14, percent: 8 },
      { key: 'asthma_copd', label: 'Asma / DPOC', count: 11, percent: 6 },
      { key: 'heart_disease', label: 'Doença cardíaca', count: 9, percent: 5 },
    ],
    comorbidities: [
      { key: '0', label: 'Nenhuma crônica', count: Math.round(totalTriages * 0.54), percent: 54 },
      { key: '1', label: '1 condição', count: Math.round(totalTriages * 0.24), percent: 24 },
      { key: '2', label: '2 condições', count: Math.round(totalTriages * 0.14), percent: 14 },
      { key: '3plus', label: '3 ou mais', count: Math.round(totalTriages * 0.08), percent: 8 },
    ],
    chiefComplaints: [
      { key: 'dor-cabeca', label: 'Dor de cabeça', count: 31, percent: 18 },
      { key: 'febre', label: 'Febre', count: 24, percent: 14 },
      { key: 'tosse', label: 'Tosse persistente', count: 21, percent: 12 },
      { key: 'dor-abdominal', label: 'Dor abdominal', count: 17, percent: 10 },
      { key: 'falta-ar', label: 'Falta de ar', count: 14, percent: 8 },
      { key: 'tontura', label: 'Tontura', count: 12, percent: 7 },
      { key: 'dor-garganta', label: 'Dor de garganta', count: 10, percent: 6 },
    ],
    associatedSymptoms: [
      { key: 'fever', label: 'Febre', count: 36, percent: 21 },
      { key: 'cough', label: 'Tosse', count: 29, percent: 17 },
      { key: 'headache', label: 'Dor de cabeça', count: 25, percent: 15 },
      { key: 'fatigue', label: 'Cansaço', count: 18, percent: 10 },
      { key: 'nausea', label: 'Náusea', count: 15, percent: 9 },
      { key: 'body_ache', label: 'Dor no corpo', count: 12, percent: 7 },
      { key: 'shortness_of_breath', label: 'Falta de ar', count: 11, percent: 6 },
    ],
  }
}
