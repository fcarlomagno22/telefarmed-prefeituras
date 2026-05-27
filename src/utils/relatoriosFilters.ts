import type { ReportCategoryId } from '../config/reportsCategories'
import type { ConsultationRecord } from '../data/consultasMock'
import {
  agendaReportRows,
  getGestaoReportRows,
  getMedicoReportRows,
  postoReportRows,
  usuarioReportRows,
  type AgendaReportRow,
  type GestaoReportRow,
  type MedicoReportRow,
  type PostoReportRow,
  type UsuarioReportRow,
} from '../data/relatoriosMock'
import { consultasRecords } from '../data/consultasMock'
import { specialties } from '../data/specialties'
import { applyConsultasFilters, type ConsultasFilters } from './consultasFilters'

function specialtyLabelForFilter(value: string): string | null {
  if (value === 'all' || !value) return null
  const byId = specialties.find((item) => item.id === value)
  return byId?.name ?? value
}

export type RelatoriosFilters = {
  periodStart: string
  periodEnd: string
  unit: string
  operator: string
  station: string
  specialty: string
  status: string
  generalSearch: string
}

export const defaultRelatoriosFilters: RelatoriosFilters = {
  periodStart: '',
  periodEnd: '',
  unit: 'all',
  operator: 'all',
  station: 'all',
  specialty: 'all',
  status: 'all',
  generalSearch: '',
}

function parseBrDate(dateStr: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr.trim())
  if (!match) return null
  const [, day, month, year] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function parseIsoDate(iso: string): Date | null {
  if (!iso) return null
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function isWithinPeriod(
  recordDate: Date | null,
  periodStart: string,
  periodEnd: string,
): boolean {
  if (!recordDate) return true
  const start = parseIsoDate(periodStart)
  const end = parseIsoDate(periodEnd)
  if (start && recordDate < start) return false
  if (end) {
    const endInclusive = new Date(end)
    endInclusive.setHours(23, 59, 59, 999)
    if (recordDate > endInclusive) return false
  }
  return true
}

function matchesUnit(unitValue: string, recordUnit: string): boolean {
  if (unitValue === 'all') return true
  const map: Record<string, string> = {
    'ubt-centro': 'UBT Centro',
    'ubt-vila-nova': 'UBT Vila Nova',
    teleatendimento: 'Sala de Teleatendimento',
  }
  return recordUnit === map[unitValue]
}

function matchesSearch(query: string, values: string[]): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return values.some((value) => value.toLowerCase().includes(normalized))
}

function filterPostoRows(filters: RelatoriosFilters): PostoReportRow[] {
  return postoReportRows.filter((row) => {
    const date = parseBrDate(row.date)
    if (!isWithinPeriod(date, filters.periodStart, filters.periodEnd)) return false
    if (!matchesUnit(filters.unit, row.unit)) return false
    if (filters.operator !== 'all' && row.operator !== filters.operator) return false
    if (filters.station !== 'all' && row.station !== filters.station) return false
    const specialtyLabel = specialtyLabelForFilter(filters.specialty)
    if (specialtyLabel && row.specialty !== specialtyLabel) return false
    if (filters.status !== 'all' && row.status !== filters.status) return false
    return matchesSearch(filters.generalSearch, [
      row.patientName,
      row.protocol,
      row.operator,
      row.specialty,
    ])
  })
}

function filterAgendaRows(filters: RelatoriosFilters): AgendaReportRow[] {
  return agendaReportRows.filter((row) => {
    const date = parseBrDate(row.date)
    if (!isWithinPeriod(date, filters.periodStart, filters.periodEnd)) return false
    if (!matchesUnit(filters.unit, row.unit)) return false
    return matchesSearch(filters.generalSearch, [row.weekday, row.unit])
  })
}

function filterUsuarioRows(filters: RelatoriosFilters): UsuarioReportRow[] {
  return usuarioReportRows.filter((row) => {
    if (!matchesUnit(filters.unit, row.registrationUnit)) return false
    if (filters.status !== 'all' && row.status !== filters.status) return false
    return matchesSearch(filters.generalSearch, [
      row.name,
      row.bairro,
      row.registrationUnit,
    ])
  })
}

function filterMedicoRows(filters: RelatoriosFilters): MedicoReportRow[] {
  return getMedicoReportRows().filter((row) => {
    const date = parseBrDate(row.date)
    if (!isWithinPeriod(date, filters.periodStart, filters.periodEnd)) return false
    if (!matchesUnit(filters.unit, row.unit)) return false
    const specialtyLabel = specialtyLabelForFilter(filters.specialty)
    if (specialtyLabel && row.specialty !== specialtyLabel) return false
    return matchesSearch(filters.generalSearch, [row.name, row.specialty])
  })
}

function filterGestaoRows(filters: RelatoriosFilters): GestaoReportRow[] {
  return getGestaoReportRows().filter((row) =>
    matchesSearch(filters.generalSearch, [row.indicator, row.category, row.variation]),
  )
}

function filterConsultasRows(filters: RelatoriosFilters): ConsultationRecord[] {
  const consultasFilters: ConsultasFilters = {
    periodStart: filters.periodStart,
    periodEnd: filters.periodEnd,
    specialty: filters.specialty === 'all' ? '' : filters.specialty,
    doctor: '',
    neighborhood: '',
    gender: '',
    ageRange: '',
    status: filters.status === 'all' ? '' : filters.status,
    unit: filters.unit === 'all' ? '' : filters.unit,
    generalSearch: filters.generalSearch,
  }
  return applyConsultasFilters(consultasRecords, consultasFilters)
}

export type ReportRowValue = string | number | null

export function getRowsForCategory(
  categoryId: ReportCategoryId,
  filters: RelatoriosFilters,
): Record<string, ReportRowValue>[] {
  switch (categoryId) {
    case 'posto':
      return filterPostoRows(filters) as unknown as Record<string, ReportRowValue>[]
    case 'agenda':
      return filterAgendaRows(filters) as unknown as Record<string, ReportRowValue>[]
    case 'consultas':
      return filterConsultasRows(filters).map((row) => ({
        date: row.date,
        time: row.time,
        patientName: row.patientName,
        specialty: row.specialty,
        doctorName: row.doctorName,
        neighborhood: row.neighborhood,
        status: row.status,
        durationMinutes: row.durationMinutes,
      }))
    case 'usuarios':
      return filterUsuarioRows(filters) as unknown as Record<string, ReportRowValue>[]
    case 'medicos':
      return filterMedicoRows(filters) as unknown as Record<string, ReportRowValue>[]
    case 'gestao':
      return filterGestaoRows(filters) as unknown as Record<string, ReportRowValue>[]
    default:
      return []
  }
}

export function formatCellValue(key: string, value: ReportRowValue): string {
  if (value === null || value === undefined) return '—'
  if (key === 'patientType') {
    return value === 'novo' ? 'Novo' : 'Retorno'
  }
  if (key === 'status') {
    const labels: Record<string, string> = {
      concluido: 'Concluído',
      abandonado: 'Abandonado',
      em_andamento: 'Em andamento',
      concluida: 'Concluída',
      cancelada: 'Cancelada',
      ativo: 'Ativo',
      inativo: 'Inativo',
      incompleto: 'Incompleto',
    }
    return labels[String(value)] ?? String(value)
  }
  if (key === 'attendanceRate') return `${value}%`
  if (key === 'averageRating') return Number(value).toFixed(1)
  return String(value)
}

