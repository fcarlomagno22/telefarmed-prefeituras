export type ExamCatalogItem = {
  id: string
  name: string
  category: string
}

export const EXAM_REQUEST_CATALOG: ExamCatalogItem[] = [
  { id: 'hemograma', name: 'Hemograma completo', category: 'Laboratorial' },
  { id: 'glicemia', name: 'Glicemia em jejum', category: 'Laboratorial' },
  { id: 'hba1c', name: 'Hemoglobina glicada (HbA1c)', category: 'Laboratorial' },
  { id: 'lipidograma', name: 'Perfil lipídico', category: 'Laboratorial' },
  { id: 'tsh', name: 'TSH', category: 'Laboratorial' },
  { id: 't4-livre', name: 'T4 livre', category: 'Laboratorial' },
  { id: 'urina', name: 'Urina tipo I', category: 'Laboratorial' },
  { id: 'ureia-creat', name: 'Ureia e creatinina', category: 'Laboratorial' },
  { id: 'pcr', name: 'PCR ultrassensível', category: 'Laboratorial' },
  { id: 'rx-torax', name: 'Radiografia de tórax (PA e perfil)', category: 'Imagem' },
  { id: 'us-abdome', name: 'Ultrassonografia de abdome total', category: 'Imagem' },
  { id: 'us-tireoide', name: 'Ultrassonografia de tireoide', category: 'Imagem' },
  { id: 'tc-cranio', name: 'Tomografia de crânio', category: 'Imagem' },
  { id: 'rm-coluna', name: 'Ressonância magnética de coluna lombar', category: 'Imagem' },
  { id: 'ecg', name: 'Eletrocardiograma (ECG)', category: 'Cardiologia' },
  { id: 'eco', name: 'Ecocardiograma transtorácico', category: 'Cardiologia' },
  { id: 'espirometria', name: 'Espirometria', category: 'Outros' },
  { id: 'teste-ergometrico', name: 'Teste ergométrico', category: 'Outros' },
]

export const EXAM_REQUEST_CATEGORIES = [
  'Laboratorial',
  'Imagem',
  'Cardiologia',
  'Outros',
] as const
