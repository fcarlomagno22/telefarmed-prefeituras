export function normalizeContratoEntidadeIds(
  ids: string[] | null | undefined,
  legacyId?: string | null,
): string[] {
  const normalized = [...new Set((ids ?? []).map(String).filter(Boolean))]
  if (normalized.length > 0) return normalized
  if (legacyId) return [String(legacyId)]
  return []
}

export function slotMatchesClientContratos(
  slotContratoIds: string[] | null | undefined,
  slotLegacyContratoId: string | null | undefined,
  clientContratoIds: string[],
): boolean {
  if (clientContratoIds.length === 0) return false

  const slotIds = normalizeContratoEntidadeIds(slotContratoIds, slotLegacyContratoId)
  if (slotIds.length === 0) return false

  const clientSet = new Set(clientContratoIds.map(String))
  return slotIds.some((id) => clientSet.has(id))
}

export type ContratoSpecialtyIndex = Map<string, Set<string>>

export function slotAuthorizedForClienteContratos(input: {
  slotContratoIds?: string[] | null
  slotLegacyContratoId?: string | null
  specialtyId: string
  clientContratoIds: string[]
  index: ContratoSpecialtyIndex
}): boolean {
  const slotContratoIds = normalizeContratoEntidadeIds(
    input.slotContratoIds,
    input.slotLegacyContratoId,
  )
  if (slotContratoIds.length === 0 || input.clientContratoIds.length === 0) {
    return false
  }

  const clientContratoSet = new Set(input.clientContratoIds.map(String))
  const specialtyId = String(input.specialtyId)

  for (const contratoId of slotContratoIds) {
    if (!clientContratoSet.has(contratoId)) continue
    const authorized = input.index.get(contratoId)
    if (authorized?.has(specialtyId)) return true
  }

  return false
}

export function formatContratoIdsForOverlapFilter(contratoIds: string[]): string {
  return `{${contratoIds.join(',')}}`
}

export function buildEscalaSlotContratoOverlapOrFilter(contratoIds: string[]): string | null {
  const unique = [...new Set(contratoIds.map(String).filter(Boolean))]
  if (unique.length === 0) return null

  const overlapValue = formatContratoIdsForOverlapFilter(unique)
  const legacyInValue = `(${unique.join(',')})`
  return `contrato_entidade_ids.ov.${overlapValue},contrato_entidade_id.in.${legacyInValue}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyDirectEscalaSlotContratoOverlapFilter(query: any, contratoIds: string[]): any {
  const filter = buildEscalaSlotContratoOverlapOrFilter(contratoIds)
  if (!filter) return query
  return query.or(filter)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyNestedEscalaSlotContratoOverlapFilter(query: any, contratoIds: string[]): any {
  const filter = buildEscalaSlotContratoOverlapOrFilter(contratoIds)
  if (!filter) return query
  return query.or(filter, { referencedTable: 'escala_slots' })
}
