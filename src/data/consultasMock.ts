import { specialties } from './specialties'

export type ConsultationStatus = 'concluida' | 'cancelada' | 'em_andamento'

export type ConsultationType = 'retorno' | 'consulta' | 'primeira_consulta'

export type ConsultationRecord = {
  id: string
  date: string
  time: string
  patientName: string
  cpf: string
  age: number
  gender: 'F' | 'M'
  specialty: string
  specialtyId: string
  doctorName: string
  doctorCrm: string
  neighborhood: string
  type: ConsultationType
  status: ConsultationStatus
  durationMinutes: number | null
}

export type ConsultasSummary = {
  total: number
  completed: number
  cancelled: number
  inProgress: number
}

export type ConsultasStatusSlice = {
  key: ConsultationStatus
  label: string
  count: number
  percent: number
  color: string
  gradientFrom: string
  gradientTo: string
}

export type ConsultasSpecialtySlice = {
  label: string
  count: number
  percent: number
}

export type ConsultasGenderSlice = {
  key: string
  label: string
  shortLabel: string
  count: number
  percent: number
  gradientFrom: string
  gradientTo: string
}

export const consultasPagination = {
  page: 1,
  pageSize: 10,
  total: 1248,
  totalPages: 125,
} as const

export const consultasSummary: ConsultasSummary = {
  total: 1248,
  completed: 1098,
  cancelled: 98,
  inProgress: 52,
}

export const consultasStatusDistribution: ConsultasStatusSlice[] = [
  {
    key: 'concluida',
    label: 'Concluídas',
    count: 1098,
    percent: 87.9,
    color: '#10b981',
    gradientFrom: '#34d399',
    gradientTo: '#059669',
  },
  {
    key: 'cancelada',
    label: 'Canceladas',
    count: 98,
    percent: 7.9,
    color: '#ef4444',
    gradientFrom: '#fb7185',
    gradientTo: '#dc2626',
  },
  {
    key: 'em_andamento',
    label: 'Em andamento',
    count: 52,
    percent: 4.2,
    color: '#3b82f6',
    gradientFrom: '#60a5fa',
    gradientTo: '#2563eb',
  },
]

export const consultasSpecialtyDistribution: ConsultasSpecialtySlice[] = [
  { label: 'Clínica Geral', count: 349, percent: 28 },
  { label: 'Cardiologia', count: 225, percent: 18 },
  { label: 'Dermatologia', count: 175, percent: 14 },
  { label: 'Ginecologia', count: 150, percent: 12 },
  { label: 'Pediatria', count: 125, percent: 10 },
  { label: 'Outras', count: 224, percent: 18 },
]

export const consultasGenderDistribution: ConsultasGenderSlice[] = [
  {
    key: 'feminino',
    label: 'Feminino',
    shortLabel: 'Fem.',
    count: 720,
    percent: 57.7,
    gradientFrom: '#f9a8d4',
    gradientTo: '#db2777',
  },
  {
    key: 'masculino',
    label: 'Masculino',
    shortLabel: 'Masc.',
    count: 465,
    percent: 37.3,
    gradientFrom: '#93c5fd',
    gradientTo: '#2563eb',
  },
  {
    key: 'outros',
    label: 'Outros',
    shortLabel: 'Out.',
    count: 38,
    percent: 3.0,
    gradientFrom: '#c4b5fd',
    gradientTo: '#7c3aed',
  },
  {
    key: 'nao_informado',
    label: 'Não quis informar',
    shortLabel: 'N/I',
    count: 25,
    percent: 2.0,
    gradientFrom: '#d1d5db',
    gradientTo: '#6b7280',
  },
]

export const defaultConsultasPeriod = {
  start: '2026-04-20',
  end: '2026-05-20',
} as const

export const consultasRecords: ConsultationRecord[] = [
  {
    id: '1',
    date: '20/05/2026',
    time: '08:30',
    patientName: 'Maria Silva Santos',
    cpf: '123.456.789-00',
    age: 34,
    gender: 'F',
    specialty: 'Clínica Geral',
    specialtyId: '4',
    doctorName: 'Dr. Carlos Mendes',
    doctorCrm: 'CRM 12345-SP',
    neighborhood: 'Centro',
    type: 'retorno',
    status: 'concluida',
    durationMinutes: 18,
  },
  {
    id: '2',
    date: '20/05/2026',
    time: '09:15',
    patientName: 'João Pedro Oliveira',
    cpf: '987.654.321-00',
    age: 28,
    gender: 'M',
    specialty: 'Cardiologia',
    specialtyId: '7',
    doctorName: 'Dra. Ana Paula Costa',
    doctorCrm: 'CRM 54321-SP',
    neighborhood: 'Jardim América',
    type: 'consulta',
    status: 'concluida',
    durationMinutes: 22,
  },
  {
    id: '3',
    date: '20/05/2026',
    time: '10:00',
    patientName: 'Fernanda Lima Rocha',
    cpf: '456.789.123-00',
    age: 45,
    gender: 'F',
    specialty: 'Dermatologia',
    specialtyId: '14',
    doctorName: 'Dr. Roberto Alves',
    doctorCrm: 'CRM 67890-SP',
    neighborhood: 'Vila Nova',
    type: 'primeira_consulta',
    status: 'em_andamento',
    durationMinutes: null,
  },
  {
    id: '4',
    date: '19/05/2026',
    time: '14:20',
    patientName: 'Carlos Eduardo Souza',
    cpf: '321.654.987-00',
    age: 52,
    gender: 'M',
    specialty: 'Ginecologia',
    specialtyId: '19',
    doctorName: 'Dra. Juliana Martins',
    doctorCrm: 'CRM 11223-SP',
    neighborhood: 'Boa Vista',
    type: 'retorno',
    status: 'concluida',
    durationMinutes: 15,
  },
  {
    id: '5',
    date: '19/05/2026',
    time: '11:45',
    patientName: 'Ana Beatriz Ferreira',
    cpf: '789.123.456-00',
    age: 19,
    gender: 'F',
    specialty: 'Pediatria',
    specialtyId: '3',
    doctorName: 'Dr. Paulo Henrique',
    doctorCrm: 'CRM 33445-SP',
    neighborhood: 'São José',
    type: 'consulta',
    status: 'cancelada',
    durationMinutes: null,
  },
  {
    id: '6',
    date: '18/05/2026',
    time: '16:00',
    patientName: 'Ricardo Almeida Nunes',
    cpf: '654.321.789-00',
    age: 61,
    gender: 'M',
    specialty: 'Clínica Geral',
    specialtyId: '4',
    doctorName: 'Dr. Carlos Mendes',
    doctorCrm: 'CRM 12345-SP',
    neighborhood: 'Centro',
    type: 'retorno',
    status: 'concluida',
    durationMinutes: 20,
  },
  {
    id: '7',
    date: '18/05/2026',
    time: '08:00',
    patientName: 'Patrícia Gomes Dias',
    cpf: '147.258.369-00',
    age: 38,
    gender: 'F',
    specialty: 'Cardiologia',
    specialtyId: '7',
    doctorName: 'Dra. Ana Paula Costa',
    doctorCrm: 'CRM 54321-SP',
    neighborhood: 'Industrial',
    type: 'consulta',
    status: 'concluida',
    durationMinutes: 25,
  },
  {
    id: '8',
    date: '17/05/2026',
    time: '13:30',
    patientName: 'Lucas Martins Barbosa',
    cpf: '258.369.147-00',
    age: 8,
    gender: 'M',
    specialty: 'Pediatria',
    specialtyId: '3',
    doctorName: 'Dr. Paulo Henrique',
    doctorCrm: 'CRM 33445-SP',
    neighborhood: 'Parque das Flores',
    type: 'primeira_consulta',
    status: 'concluida',
    durationMinutes: 30,
  },
  {
    id: '9',
    date: '17/05/2026',
    time: '10:45',
    patientName: 'Helena Costa Pinto',
    cpf: '369.147.258-00',
    age: 72,
    gender: 'F',
    specialty: 'Dermatologia',
    specialtyId: '14',
    doctorName: 'Dr. Roberto Alves',
    doctorCrm: 'CRM 67890-SP',
    neighborhood: 'Alto da Serra',
    type: 'retorno',
    status: 'concluida',
    durationMinutes: 12,
  },
  {
    id: '10',
    date: '16/05/2026',
    time: '15:10',
    patientName: 'Marcos Antônio Vieira',
    cpf: '741.852.963-00',
    age: 41,
    gender: 'M',
    specialty: 'Clínica Geral',
    specialtyId: '4',
    doctorName: 'Dr. Carlos Mendes',
    doctorCrm: 'CRM 12345-SP',
    neighborhood: 'Vila Nova',
    type: 'consulta',
    status: 'cancelada',
    durationMinutes: null,
  },
]

export const consultasFilterOptions = {
  specialties: [
    { value: '', label: 'Todas' },
    ...specialties.map((item) => ({ value: item.id, label: item.name })),
  ],
  doctors: [
    { value: '', label: 'Todos' },
    { value: 'carlos_mendes', label: 'Dr. Carlos Mendes' },
    { value: 'ana_costa', label: 'Dra. Ana Paula Costa' },
    { value: 'roberto_alves', label: 'Dr. Roberto Alves' },
    { value: 'juliana_martins', label: 'Dra. Juliana Martins' },
    { value: 'paulo_henrique', label: 'Dr. Paulo Henrique' },
  ],
  neighborhoods: [
    { value: '', label: 'Todos' },
    { value: 'centro', label: 'Centro' },
    { value: 'jardim_america', label: 'Jardim América' },
    { value: 'vila_nova', label: 'Vila Nova' },
    { value: 'boa_vista', label: 'Boa Vista' },
    { value: 'sao_jose', label: 'São José' },
  ],
  genders: [
    { value: '', label: 'Todos' },
    { value: 'F', label: 'Feminino' },
    { value: 'M', label: 'Masculino' },
  ],
  ageRanges: [
    { value: '', label: 'Todas' },
    { value: '0-17', label: '0 a 17 anos' },
    { value: '18-39', label: '18 a 39 anos' },
    { value: '40-59', label: '40 a 59 anos' },
    { value: '60+', label: '60 anos ou mais' },
  ],
  types: [
    { value: '', label: 'Todos' },
    { value: 'retorno', label: 'Retorno' },
    { value: 'consulta', label: 'Consulta' },
    { value: 'primeira_consulta', label: 'Primeira consulta' },
  ],
  statuses: [
    { value: '', label: 'Todos' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'em_andamento', label: 'Em andamento' },
  ],
  units: [
    { value: '', label: 'Todas' },
    { value: 'ubt_centro', label: 'UBT Centro' },
    { value: 'ubt_vila_nova', label: 'UBT Vila Nova' },
    { value: 'teleatendimento', label: 'Sala de Teleatendimento' },
  ],
} as const
