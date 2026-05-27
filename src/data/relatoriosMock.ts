import type { ReportCategoryId } from '../config/reportsCategories'
import { consultasFilterOptions, consultasRecords } from './consultasMock'
import { networkUsers } from './networkUsersMock'
import { getAgendaDoctorShifts } from './agendaDoctorShiftMock'
import { agendaToday } from './agendaMock'
import { metrics, serviceFlow } from './dashboardMock'
import { brand } from '../config/brand'

export type RelatoriosUnitOption = {
  value: string
  label: string
}

export const relatoriosUnitOptions: RelatoriosUnitOption[] = [
  { value: 'all', label: 'Todas as unidades' },
  { value: 'ubt-centro', label: 'UBT Centro' },
  { value: 'ubt-vila-nova', label: 'UBT Vila Nova' },
  { value: 'teleatendimento', label: 'Sala de Teleatendimento' },
]

export const relatoriosOperatorOptions = [
  { value: 'all', label: 'Todos os operadores' },
  { value: brand.operatorName, label: brand.operatorName },
  { value: 'Carlos Mendes', label: 'Carlos Mendes' },
  { value: 'Ana Paula Ribeiro', label: 'Ana Paula Ribeiro' },
]

export const relatoriosStationOptions = [
  { value: 'all', label: 'Todos os computadores' },
  { value: 'Computador 01', label: 'Computador 01' },
  { value: 'Computador 02', label: 'Computador 02' },
  { value: 'Computador 03', label: 'Computador 03' },
]

export type PostoReportRow = {
  id: string
  date: string
  time: string
  protocol: string
  patientName: string
  operator: string
  station: string
  unit: string
  specialty: string
  patientType: 'novo' | 'retorno'
  status: 'concluido' | 'abandonado' | 'em_andamento'
  waitMinutes: number
}

export const postoReportRows: PostoReportRow[] = [
  {
    id: 'p1',
    date: '19/05/2026',
    time: '08:12',
    protocol: 'ATD-482910',
    patientName: 'Maria Oliveira',
    operator: brand.operatorName,
    station: 'Computador 01',
    unit: 'UBT Centro',
    specialty: 'Clínico Geral',
    patientType: 'retorno',
    status: 'concluido',
    waitMinutes: 18,
  },
  {
    id: 'p2',
    date: '19/05/2026',
    time: '08:45',
    protocol: 'ATD-483102',
    patientName: 'João Santos',
    operator: brand.operatorName,
    station: 'Computador 01',
    unit: 'UBT Centro',
    specialty: 'Pediatria',
    patientType: 'novo',
    status: 'concluido',
    waitMinutes: 24,
  },
  {
    id: 'p3',
    date: '19/05/2026',
    time: '09:20',
    protocol: 'ATD-483401',
    patientName: 'Ana Paula Lima',
    operator: 'Carlos Mendes',
    station: 'Computador 02',
    unit: 'UBT Centro',
    specialty: 'Cardiologia',
    patientType: 'retorno',
    status: 'concluido',
    waitMinutes: 15,
  },
  {
    id: 'p4',
    date: '19/05/2026',
    time: '10:05',
    protocol: 'ATD-483890',
    patientName: 'Carlos Ferreira',
    operator: 'Ana Paula Ribeiro',
    station: 'Computador 03',
    unit: 'UBT Vila Nova',
    specialty: 'Dermatologia',
    patientType: 'novo',
    status: 'abandonado',
    waitMinutes: 42,
  },
  {
    id: 'p5',
    date: '19/05/2026',
    time: '11:30',
    protocol: 'ATD-484201',
    patientName: 'Fernanda Silva',
    operator: brand.operatorName,
    station: 'Computador 01',
    unit: 'UBT Centro',
    specialty: 'Psicologia',
    patientType: 'retorno',
    status: 'em_andamento',
    waitMinutes: 12,
  },
  {
    id: 'p6',
    date: '18/05/2026',
    time: '14:18',
    protocol: 'ATD-481002',
    patientName: 'Roberto Almeida',
    operator: 'Carlos Mendes',
    station: 'Computador 02',
    unit: 'Sala de Teleatendimento',
    specialty: 'Clínico Geral',
    patientType: 'retorno',
    status: 'concluido',
    waitMinutes: 21,
  },
  {
    id: 'p7',
    date: '18/05/2026',
    time: '15:02',
    protocol: 'ATD-481330',
    patientName: 'Juliana Dias',
    operator: brand.operatorName,
    station: 'Computador 01',
    unit: 'UBT Centro',
    specialty: 'Ginecologia',
    patientType: 'novo',
    status: 'concluido',
    waitMinutes: 19,
  },
  {
    id: 'p8',
    date: '17/05/2026',
    time: '09:55',
    protocol: 'ATD-479801',
    patientName: 'Paulo Henrique',
    operator: 'Ana Paula Ribeiro',
    station: 'Computador 03',
    unit: 'UBT Vila Nova',
    specialty: 'Ortopedia',
    patientType: 'retorno',
    status: 'concluido',
    waitMinutes: 28,
  },
]

export type AgendaReportRow = {
  id: string
  date: string
  weekday: string
  total: number
  completed: number
  noShows: number
  scheduled: number
  attendanceRate: number
  unit: string
}

export const agendaReportRows: AgendaReportRow[] = [
  {
    id: 'a1',
    date: '19/05/2026',
    weekday: 'Segunda',
    total: 24,
    completed: 18,
    noShows: 3,
    scheduled: 3,
    attendanceRate: 75,
    unit: 'UBT Centro',
  },
  {
    id: 'a2',
    date: '18/05/2026',
    weekday: 'Domingo',
    total: 8,
    completed: 6,
    noShows: 1,
    scheduled: 1,
    attendanceRate: 75,
    unit: 'UBT Centro',
  },
  {
    id: 'a3',
    date: '17/05/2026',
    weekday: 'Sábado',
    total: 12,
    completed: 10,
    noShows: 2,
    scheduled: 0,
    attendanceRate: 83,
    unit: 'UBT Vila Nova',
  },
  {
    id: 'a4',
    date: '16/05/2026',
    weekday: 'Sexta',
    total: 28,
    completed: 22,
    noShows: 4,
    scheduled: 2,
    attendanceRate: 79,
    unit: 'UBT Centro',
  },
  {
    id: 'a5',
    date: '15/05/2026',
    weekday: 'Quinta',
    total: 26,
    completed: 21,
    noShows: 2,
    scheduled: 3,
    attendanceRate: 81,
    unit: 'UBT Centro',
  },
  {
    id: 'a6',
    date: '14/05/2026',
    weekday: 'Quarta',
    total: 22,
    completed: 17,
    noShows: 3,
    scheduled: 2,
    attendanceRate: 77,
    unit: 'Sala de Teleatendimento',
  },
]

export type MedicoReportRow = {
  id: string
  date: string
  name: string
  specialty: string
  unit: string
  loginAt: string
  logoutAt: string
  totalPatients: number
  averageRating: number
  totalReviews: number
}

export function getMedicoReportRows(): MedicoReportRow[] {
  const shifts = getAgendaDoctorShifts(agendaToday)
  return shifts.map((shift) => ({
    id: shift.id,
    date: '19/05/2026',
    name: shift.name,
    specialty: shift.specialty,
    unit: 'UBT Centro',
    loginAt: shift.loginAt,
    logoutAt: shift.logoutAt,
    totalPatients: shift.totalPatients,
    averageRating: shift.ratings.average,
    totalReviews: shift.ratings.totalReviews,
  }))
}

export type GestaoReportRow = {
  id: string
  indicator: string
  value: string
  variation: string
  category: string
}

export function getGestaoReportRows(): GestaoReportRow[] {
  return [
    ...metrics.map((metric) => ({
      id: metric.id,
      indicator: metric.title,
      value: metric.value,
      variation: metric.subtext,
      category: 'Indicador principal',
    })),
    ...serviceFlow.map((flow, index) => ({
      id: `flow-${index}`,
      indicator: flow.label,
      value: String(flow.count),
      variation: `${flow.progress}% da capacidade`,
      category: 'Fluxo do dia',
    })),
  ]
}

export type UsuarioReportRow = {
  id: string
  name: string
  bairro: string
  registrationUnit: string
  totalAppointments: number
  lastAppointment: string
  status: 'ativo' | 'inativo' | 'incompleto'
}

export const usuarioReportRows: UsuarioReportRow[] = networkUsers.map((user, index) => ({
  id: user.id,
  name: user.name,
  bairro: user.bairro,
  registrationUnit: index % 2 === 0 ? 'UBT Centro' : 'UBT Vila Nova',
  totalAppointments: user.totalAppointments,
  lastAppointment: user.lastAppointmentDate,
  status:
    user.totalAppointments === 0
      ? 'incompleto'
      : user.lastAppointmentRelative.includes('mês') ||
          user.lastAppointmentRelative.includes('ano')
        ? 'inativo'
        : 'ativo',
}))

export const defaultRelatoriosPeriod = {
  start: '2026-05-01',
  end: '2026-05-19',
} as const

export const relatoriosSpecialtyOptions = [
  { value: 'all', label: 'Todas as especialidades' },
  ...consultasFilterOptions.specialties.filter((option) => option.value !== ''),
]

export const relatoriosStatusOptionsByCategory: Record<
  ReportCategoryId,
  { value: string; label: string }[]
> = {
  posto: [
    { value: 'all', label: 'Todos os status' },
    { value: 'concluido', label: 'Concluído' },
    { value: 'abandonado', label: 'Abandonado' },
    { value: 'em_andamento', label: 'Em andamento' },
  ],
  agenda: [{ value: 'all', label: 'Todos' }],
  consultas: [
    { value: 'all', label: 'Todos os status' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' },
    { value: 'em_andamento', label: 'Em andamento' },
  ],
  usuarios: [
    { value: 'all', label: 'Todos os status' },
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'incompleto', label: 'Cadastro incompleto' },
  ],
  medicos: [{ value: 'all', label: 'Todos' }],
  gestao: [{ value: 'all', label: 'Todos' }],
}

export type ReportTableColumn = {
  key: string
  label: string
}

export function getColumnsForCategory(categoryId: ReportCategoryId): ReportTableColumn[] {
  switch (categoryId) {
    case 'posto':
      return [
        { key: 'date', label: 'Data' },
        { key: 'time', label: 'Hora' },
        { key: 'protocol', label: 'Protocolo' },
        { key: 'patientName', label: 'Paciente' },
        { key: 'operator', label: 'Operador' },
        { key: 'station', label: 'Computador' },
        { key: 'specialty', label: 'Especialidade' },
        { key: 'patientType', label: 'Tipo' },
        { key: 'status', label: 'Status' },
        { key: 'waitMinutes', label: 'Espera (min)' },
      ]
    case 'agenda':
      return [
        { key: 'date', label: 'Data' },
        { key: 'weekday', label: 'Dia' },
        { key: 'total', label: 'Agendados' },
        { key: 'completed', label: 'Realizados' },
        { key: 'noShows', label: 'Faltas' },
        { key: 'attendanceRate', label: 'Comparecimento' },
        { key: 'unit', label: 'Unidade' },
      ]
    case 'consultas':
      return [
        { key: 'date', label: 'Data' },
        { key: 'time', label: 'Hora' },
        { key: 'patientName', label: 'Paciente' },
        { key: 'specialty', label: 'Especialidade' },
        { key: 'doctorName', label: 'Médico' },
        { key: 'neighborhood', label: 'Bairro' },
        { key: 'status', label: 'Status' },
        { key: 'durationMinutes', label: 'Duração (min)' },
      ]
    case 'usuarios':
      return [
        { key: 'name', label: 'Paciente' },
        { key: 'bairro', label: 'Bairro' },
        { key: 'registrationUnit', label: 'UBT cadastro' },
        { key: 'totalAppointments', label: 'Consultas' },
        { key: 'lastAppointment', label: 'Último atendimento' },
        { key: 'status', label: 'Status' },
      ]
    case 'medicos':
      return [
        { key: 'date', label: 'Data' },
        { key: 'name', label: 'Médico' },
        { key: 'specialty', label: 'Especialidade' },
        { key: 'loginAt', label: 'Entrada' },
        { key: 'logoutAt', label: 'Saída' },
        { key: 'totalPatients', label: 'Pacientes' },
        { key: 'averageRating', label: 'Nota média' },
        { key: 'totalReviews', label: 'Avaliações' },
      ]
    case 'gestao':
      return [
        { key: 'indicator', label: 'Indicador' },
        { key: 'value', label: 'Valor' },
        { key: 'variation', label: 'Variação / detalhe' },
        { key: 'category', label: 'Categoria' },
      ]
    default:
      return []
  }
}

export { consultasRecords }
