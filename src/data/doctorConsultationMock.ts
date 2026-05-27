import type { DoctorRecordNote } from '../components/attendance/doctor/doctorRecordTypes'

export type DoctorRecordSpecialtyKey = 'pediatria' | 'clinica' | 'nutricao' | 'psicologia'

const SAMPLE_PDF_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const SAMPLE_IMAGE_URL =
  'https://images.unsplash.com/photo-1582719366826-5a40d5c13f00?auto=format&fit=crop&w=640&q=80'

export function resolveDoctorRecordSpecialtyKey(specialty: string): DoctorRecordSpecialtyKey {
  const normalized = specialty
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

  if (normalized.includes('pediatr')) return 'pediatria'
  if (normalized.includes('nutri')) return 'nutricao'
  if (normalized.includes('psicolog')) return 'psicologia'
  if (normalized.includes('clinic') || normalized.includes('geral')) return 'clinica'
  return 'clinica'
}

export const DOCTOR_RECORD_SPECIALTY_LABELS: Record<DoctorRecordSpecialtyKey, string> = {
  pediatria: 'Pediatria',
  clinica: 'Clínica Geral',
  nutricao: 'Nutrição',
  psicologia: 'Psicologia',
}

export const DOCTOR_RECORD_NOTES: DoctorRecordNote[] = [
  {
    id: 'note-1',
    specialty: 'clinica',
    date: '15/04/2026',
    doctorName: 'Dra. Ana Costa',
    note: 'Paciente com histórico de cefaleia tensional. Orientada hidratação e retorno se piora dos sintomas.',
    chatAttachments: [
      {
        id: 'att-clinica-1',
        type: 'pdf',
        url: SAMPLE_PDF_URL,
        name: 'Exame_Sangue_15-04.pdf',
        size: 1_258_291,
      },
    ],
  },
  {
    id: 'note-2',
    specialty: 'psicologia',
    date: '02/03/2026',
    doctorName: 'Dra. Carla Mendes',
    note: 'Sessão focada em técnicas de respiração e regulação emocional. Paciente relatou melhora leve do sono.',
  },
  {
    id: 'note-3',
    specialty: 'pediatria',
    date: '10/02/2026',
    doctorName: 'Dr. Marcos Lima',
    note: 'Quadro viral autolimitado. Orientados sinais de alerta e hidratação. Responsável verbalizou compreensão.',
    chatAttachments: [
      {
        id: 'att-ped-1',
        type: 'image',
        url: SAMPLE_IMAGE_URL,
        name: 'Foto_rash_braco.jpg',
        size: 860_160,
      },
      {
        id: 'att-ped-2',
        type: 'pdf',
        url: SAMPLE_PDF_URL,
        name: 'Carteira_vacinacao.pdf',
        size: 420_000,
      },
    ],
  },
  {
    id: 'note-4',
    specialty: 'nutricao',
    date: '18/01/2026',
    doctorName: 'Nutr. Fernanda Rocha',
    note: 'Plano alimentar ajustado com meta de 500 ml de água/dia a mais. Reforçada importância do café da manhã.',
  },
  {
    id: 'note-5',
    specialty: 'clinica',
    date: '05/12/2025',
    doctorName: 'Dr. João Pedro Santos',
    note: 'Retorno de rotina. PA e exames laboratoriais dentro da normalidade.',
  },
  {
    id: 'note-6',
    specialty: 'pediatria',
    date: '22/11/2025',
    doctorName: 'Dra. Ana Costa',
    note: 'Consulta de puericultura. Curva de crescimento adequada para idade.',
    chatAttachments: [
      {
        id: 'att-ped-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=640&q=80',
        name: 'Foto_lesao_pele.jpg',
        size: 512_000,
      },
    ],
  },
]

export function getDoctorRecordNotesForSpecialty(specialty: string): DoctorRecordNote[] {
  const key = resolveDoctorRecordSpecialtyKey(specialty)
  return DOCTOR_RECORD_NOTES.filter((entry) => entry.specialty === key).sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split('/').map(Number)
    const [dayB, monthB, yearB] = b.date.split('/').map(Number)
    return (
      new Date(yearB, monthB - 1, dayB).getTime() - new Date(yearA, monthA - 1, dayA).getTime()
    )
  })
}

/** @deprecated Use DOCTOR_RECORD_NOTES */
export const DOCTOR_PREVIOUS_NOTES = DOCTOR_RECORD_NOTES.map((entry) => ({
  id: entry.id,
  specialty: entry.specialty,
  date: entry.date,
  author: entry.doctorName,
  text: entry.note,
}))

export const DOCTOR_VITALS = [
  { id: 'pa', label: 'PA', value: '120/80' },
  { id: 'fc', label: 'FC', value: '72 bpm' },
  { id: 'temp', label: 'Temp.', value: '36,6 °C' },
  { id: 'spo2', label: 'SpO₂', value: '98%' },
] as const
