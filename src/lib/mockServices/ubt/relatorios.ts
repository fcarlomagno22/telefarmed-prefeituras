import type {
  RelatorioCategoryApi,
  RelatorioData,
  RelatorioMeta,
  RelatoriosFiltersInput,
} from '../../../types/relatorios'
import {
  agendaReportRows,
  consultasRecords,
  defaultRelatoriosPeriod,
  getColumnsForCategory,
  getGestaoReportRows,
  getMedicoReportRows,
  postoReportRows,
  relatoriosOperatorOptions,
  relatoriosSpecialtyOptions,
  relatoriosStationOptions,
  relatoriosStatusOptionsByCategory,
  relatoriosUnitOptions,
  usuarioReportRows,
} from '../../../data/relatoriosMock'
import { reportCategories, type ReportCategoryId } from '../../../config/reportsCategories'
import { mockDelay } from '../delay'

export class UbtRelatoriosApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'UbtRelatoriosApiError'
    this.status = status
    this.code = code
  }
}

function getRowsByCategory(categoryId: ReportCategoryId) {
  if (categoryId === 'posto') return postoReportRows
  if (categoryId === 'agenda') return agendaReportRows
  if (categoryId === 'consultas') return consultasRecords
  if (categoryId === 'usuarios') return usuarioReportRows
  if (categoryId === 'medicos') return getMedicoReportRows()
  return getGestaoReportRows()
}

function getMetaByCategory(categoryId: ReportCategoryId): RelatorioMeta {
  return {
    categoryId,
    columns: getColumnsForCategory(categoryId),
    statusOptions: relatoriosStatusOptionsByCategory[categoryId],
    unitOptions: relatoriosUnitOptions,
    operatorOptions: relatoriosOperatorOptions,
    stationOptions: relatoriosStationOptions,
    specialtyOptions: relatoriosSpecialtyOptions,
    defaultPeriod: { ...defaultRelatoriosPeriod },
    showPeriod: true,
    showUnit: categoryId !== 'gestao',
    showOperator: categoryId === 'posto',
    showStation: categoryId === 'posto',
    showSpecialty: categoryId === 'consultas' || categoryId === 'posto',
    showStatus: categoryId !== 'medicos' && categoryId !== 'agenda' && categoryId !== 'gestao',
  }
}

function paginateRows(rows: Record<string, unknown>[], page = 1, pageSize = 8) {
  const total = rows.length
  const safePage = page > 0 ? page : 1
  const safePageSize = pageSize > 0 ? pageSize : 8
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  const start = (safePage - 1) * safePageSize
  return {
    rows: rows.slice(start, start + safePageSize),
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
  }
}

function applyBasicFilters(rows: Record<string, unknown>[], filters: RelatoriosFiltersInput) {
  let filtered = [...rows]
  if (filters.generalSearch?.trim()) {
    const needle = filters.generalSearch.trim().toLowerCase()
    filtered = filtered.filter((row) => JSON.stringify(row).toLowerCase().includes(needle))
  }
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter((row) => String(row.status ?? '').toLowerCase() === filters.status.toLowerCase())
  }
  if (filters.unit && filters.unit !== 'all') {
    filtered = filtered.filter((row) => {
      const unitValue = String(row.unit ?? row.registrationUnit ?? '').toLowerCase()
      return unitValue.includes(filters.unit.toLowerCase().replace(/-/g, ' '))
    })
  }
  if (filters.operator && filters.operator !== 'all') {
    filtered = filtered.filter((row) =>
      String(row.operator ?? '').toLowerCase().includes(filters.operator.toLowerCase()),
    )
  }
  if (filters.station && filters.station !== 'all') {
    filtered = filtered.filter((row) =>
      String(row.station ?? '').toLowerCase().includes(filters.station.toLowerCase()),
    )
  }
  if (filters.specialty && filters.specialty !== 'all') {
    filtered = filtered.filter((row) => String(row.specialtyId ?? row.specialty ?? '') === filters.specialty)
  }
  return filtered
}

function computeKpis(rows: Record<string, unknown>[]) {
  return [
    { key: 'rows', label: 'Registros', value: String(rows.length), suffix: 'no periodo' },
    { key: 'export', label: 'Exportacao', value: 'Disponivel', suffix: 'CSV' },
  ]
}

export function isUbtRelatoriosApiError(error: unknown): error is UbtRelatoriosApiError {
  return error instanceof UbtRelatoriosApiError
}

export async function fetchUbtRelatorioCategories(_accessToken: string) {
  void _accessToken
  const categories: RelatorioCategoryApi[] = reportCategories.map((category) => ({
    id: category.id,
    title: category.title,
    description: category.description,
    pageSubtitle: category.pageSubtitle,
  }))
  return mockDelay(categories)
}

export async function fetchUbtRelatorioMeta(_accessToken: string, categoryId: string) {
  const normalized = reportCategories.find((item) => item.id === categoryId)?.id
  if (!normalized) {
    throw new UbtRelatoriosApiError('Categoria de relatorio nao encontrada.', 404, 'CATEGORY_NOT_FOUND')
  }
  return mockDelay(getMetaByCategory(normalized))
}

export async function fetchUbtRelatorioData(
  _accessToken: string,
  categoryId: string,
  filters: RelatoriosFiltersInput,
) {
  const normalized = reportCategories.find((item) => item.id === categoryId)?.id
  if (!normalized) {
    throw new UbtRelatoriosApiError('Categoria de relatorio nao encontrada.', 404, 'CATEGORY_NOT_FOUND')
  }
  const rows = applyBasicFilters(
    getRowsByCategory(normalized) as unknown as Record<string, unknown>[],
    filters,
  )
  const paginated = filters.all ? { rows, page: 1, pageSize: rows.length || 1, total: rows.length, totalPages: 1 } : paginateRows(rows, filters.page ?? 1)
  const data: RelatorioData = {
    rows: paginated.rows as RelatorioData['rows'],
    pagination: {
      page: paginated.page,
      pageSize: paginated.pageSize,
      total: paginated.total,
      totalPages: paginated.totalPages,
    },
    kpis: computeKpis(rows),
  }
  return mockDelay(data)
}

export async function downloadUbtRelatorioCsv(
  accessToken: string,
  categoryId: string,
  filters: RelatoriosFiltersInput,
) {
  const data = await fetchUbtRelatorioData(accessToken, categoryId, { ...filters, all: true })
  const headers = Object.keys(data.rows[0] ?? {})
  const lines = data.rows.map((row) =>
    headers.map((header) => JSON.stringify((row as Record<string, unknown>)[header] ?? '')).join(','),
  )
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `relatorio-${categoryId}-${Date.now()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
  return mockDelay(undefined)
}
