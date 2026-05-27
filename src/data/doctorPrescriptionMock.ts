export type PrescriptionMedicationCatalogItem = {
  id: string
  name: string
  presentation: string
}

export const PRESCRIPTION_MEDICATION_CATALOG: PrescriptionMedicationCatalogItem[] = [
  { id: 'paracetamol', name: 'Paracetamol', presentation: '500 mg — comprimido' },
  { id: 'dipirona', name: 'Dipirona', presentation: '500 mg — comprimido' },
  { id: 'ibuprofeno', name: 'Ibuprofeno', presentation: '400 mg — comprimido' },
  { id: 'amoxicilina', name: 'Amoxicilina', presentation: '500 mg — cápsula' },
  { id: 'azitromicina', name: 'Azitromicina', presentation: '500 mg — comprimido' },
  { id: 'losartana', name: 'Losartana potássica', presentation: '50 mg — comprimido' },
  { id: 'omeprazol', name: 'Omeprazol', presentation: '20 mg — cápsula' },
  { id: 'loratadina', name: 'Loratadina', presentation: '10 mg — comprimido' },
  { id: 'metformina', name: 'Metformina', presentation: '850 mg — comprimido' },
  { id: 'captopril', name: 'Captopril', presentation: '25 mg — comprimido' },
  { id: 'prednisona', name: 'Prednisona', presentation: '20 mg — comprimido' },
  { id: 'bromoprida', name: 'Bromoprida', presentation: '10 mg — comprimido' },
]

export const PRESCRIPTION_ADMINISTRATION_ROUTES = [
  'Via oral',
  'Sublingual',
  'Tópica',
  'Inalatória',
  'Nasal',
  'Oftálmica',
  'Retal',
  'Injetável',
] as const

export const PRESCRIPTION_FREQUENCY_SUGGESTIONS = [
  '1 vez ao dia',
  '2 vezes ao dia',
  '3 vezes ao dia',
  'A cada 6 horas',
  'A cada 8 horas',
  'A cada 12 horas',
  'Se necessário',
  'Antes de dormir',
  'Em jejum',
] as const

export const PRESCRIPTION_DURATION_SUGGESTIONS = [
  '3 dias',
  '5 dias',
  '7 dias',
  '10 dias',
  '14 dias',
  '21 dias',
  '30 dias',
  'Uso contínuo',
  'Até nova orientação',
] as const
