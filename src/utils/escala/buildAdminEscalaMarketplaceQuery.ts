import type { EscalaCatalogApi } from '../../lib/mockServices/admin/escala'
import type { AdminEscalaOpenFilters } from './filterAdminEscalaOpenShifts'

export function buildAdminEscalaMarketplaceQuery(
  filters: AdminEscalaOpenFilters,
  catalog: EscalaCatalogApi | null,
): Record<string, string | undefined> {
  const params: Record<string, string | undefined> = {}

  const search = filters.search.trim()
  if (search) params.search = search

  if (filters.status !== 'all') params.status = filters.status

  if (filters.modality !== 'all') {
    params.modalidade =
      filters.modality === 'presencial' ? 'presencial_ubt' : filters.modality
  }

  if (filters.assignmentMode !== 'all') {
    params.assignmentMode = filters.assignmentMode
  }

  if (filters.dateFrom) params.dataInicio = filters.dateFrom
  if (filters.dateTo) params.dataFim = filters.dateTo

  if (filters.specialty !== 'all' && catalog) {
    const specialty = catalog.specialties.find((item) => item.name === filters.specialty)
    if (specialty) params.especialidadeId = specialty.id
  }

  return params
}

export function marketplaceNeedsClientFilter(filters: AdminEscalaOpenFilters): boolean {
  return (
    filters.turn !== 'all' ||
    filters.fillStatus !== 'all' ||
    filters.minAmountReais.trim().length > 0 ||
    filters.maxAmountReais.trim().length > 0
  )
}
