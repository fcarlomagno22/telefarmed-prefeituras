import type { UbtScope } from '../ubt-pacientes/types.js'

export type UbtConsultasListQuery = {
  periodStart: string
  periodEnd: string
  specialty?: string
  doctor?: string
  neighborhood?: string
  gender?: '' | 'F' | 'M'
  ageRange?: '' | '0-17' | '18-39' | '40-59' | '60+'
  status?: '' | 'concluida' | 'cancelada' | 'em_andamento'
  generalSearch?: string
  page: number
  pageSize: number
}

export type UbtConsultasOverviewQuery = {
  periodStart: string
  periodEnd: string
}

export type UbtConsultationRecordDto = {
  id: string
  pacienteId: string
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
  type: 'retorno' | 'consulta' | 'primeira_consulta'
  status: 'concluida' | 'cancelada' | 'em_andamento'
  durationMinutes: number | null
}

export type UbtConsultasSummaryDto = {
  total: number
  completed: number
  cancelled: number
  inProgress: number
}

export type UbtConsultasStatusSliceDto = {
  key: 'concluida' | 'cancelada' | 'em_andamento'
  label: string
  count: number
  percent: number
  color: string
  gradientFrom: string
  gradientTo: string
}

export type UbtConsultasSpecialtySliceDto = {
  label: string
  count: number
  percent: number
}

export type UbtConsultasGenderSliceDto = {
  key: string
  label: string
  shortLabel: string
  count: number
  percent: number
  gradientFrom: string
  gradientTo: string
}

export type UbtConsultasFilterOptionsDto = {
  specialties: Array<{ value: string; label: string }>
  doctors: Array<{ value: string; label: string }>
  neighborhoods: Array<{ value: string; label: string }>
}

export type UbtConsultasOverviewDto = {
  summary: UbtConsultasSummaryDto
  avgDurationMinutes: number | null
  statusDistribution: UbtConsultasStatusSliceDto[]
  specialtyDistribution: UbtConsultasSpecialtySliceDto[]
  genderDistribution: UbtConsultasGenderSliceDto[]
  filterOptions: UbtConsultasFilterOptionsDto
}

export type UbtConsultasListResultDto = {
  records: UbtConsultationRecordDto[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export type UbtConsultasScope = UbtScope
