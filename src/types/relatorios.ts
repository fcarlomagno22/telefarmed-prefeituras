import type { ReportCategoryId } from '../config/reportsCategories'

export type RelatorioFilterOption = {
  value: string
  label: string
}

export type RelatorioColumn = {
  key: string
  label: string
}

export type RelatorioRow = Record<string, string | number | null>

export type RelatorioKpi = {
  key: string
  label: string
  value: string
  suffix: string
}

export type RelatorioPagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type RelatorioMeta = {
  categoryId: ReportCategoryId
  columns: RelatorioColumn[]
  statusOptions: RelatorioFilterOption[]
  unitOptions: RelatorioFilterOption[]
  operatorOptions: RelatorioFilterOption[]
  stationOptions: RelatorioFilterOption[]
  specialtyOptions: RelatorioFilterOption[]
  defaultPeriod: { start: string; end: string }
  showPeriod: boolean
  showUnit: boolean
  showOperator: boolean
  showStation: boolean
  showSpecialty: boolean
  showStatus: boolean
}

export type RelatorioData = {
  rows: RelatorioRow[]
  pagination: RelatorioPagination
  kpis: RelatorioKpi[]
}

export type RelatorioCategoryApi = {
  id: ReportCategoryId
  title: string
  description: string
  pageSubtitle: string
}

export type RelatoriosFiltersInput = {
  periodStart: string
  periodEnd: string
  unit: string
  operator: string
  station: string
  specialty: string
  status: string
  generalSearch: string
  page?: number
  all?: boolean
}

export type RelatoriosPortal = 'ubt' | 'prefeitura'
