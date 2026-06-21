import type {
  PrefeituraFaturamentoFechamentoLoteItem,
  PrefeituraFaturamentoFechamentoRecord,
  PrefeituraFaturamentoFechamentoTipo,
  PrefeituraFaturamentoFechamentoViewMode,
} from '../../../../types/prefeituraFaturamentoFechamento'

export function buildPrincipalRecordId(entidadeId: string, competencia: string) {
  return `rec-${entidadeId}-${competencia}-principal`
}

export function buildComplementRecordId(entidadeId: string, competencia: string, seq: number) {
  return `rec-${entidadeId}-${competencia}-c${seq}`
}

export function isFechamentoRecordClosed(record: PrefeituraFaturamentoFechamentoRecord) {
  return record.status === 'fechado' || record.status === 'exportado'
}

export function formatFechamentoTipoLabel(record: PrefeituraFaturamentoFechamentoRecord) {
  if (record.tipo === 'principal') return 'Lote principal'
  return `Complemento ${record.complementoSeq ?? ''}`.trim()
}

export function buildLoteIdForRecord(record: PrefeituraFaturamentoFechamentoRecord) {
  if (record.loteId) return record.loteId
  if (record.tipo === 'complementar' && record.complementoSeq) {
    return `LOTE-SUS-${record.competencia}-C${String(record.complementoSeq).padStart(2, '0')}`
  }
  return `LOTE-SUS-${record.competencia}`
}

export function getRecordsForCompetencia(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
) {
  return records.filter((record) => record.competencia === competencia)
}

export function getPrincipalRecord(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
) {
  return records.find(
    (record) => record.competencia === competencia && record.tipo === 'principal',
  )
}

export function getOpenComplementRecord(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
) {
  return records.find(
    (record) =>
      record.competencia === competencia &&
      record.tipo === 'complementar' &&
      !isFechamentoRecordClosed(record),
  )
}

export function getNextComplementoSeq(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
) {
  const seqs = records
    .filter((record) => record.competencia === competencia && record.tipo === 'complementar')
    .map((record) => record.complementoSeq ?? 0)
  return seqs.length > 0 ? Math.max(...seqs) + 1 : 1
}

export function isScheduledPostCloseItem(
  item: PrefeituraFaturamentoFechamentoLoteItem,
  principal?: PrefeituraFaturamentoFechamentoRecord,
) {
  if (!principal?.closedAt) {
    return false
  }
  return new Date(item.consultaDate).getTime() > new Date(principal.closedAt).getTime()
}

export function isPostCloseCandidate(
  item: PrefeituraFaturamentoFechamentoLoteItem,
  principal: PrefeituraFaturamentoFechamentoRecord,
) {
  if (item.competencia !== principal.competencia) return false
  if (item.fechamentoRecordId) return false
  if (!principal.closedAt) return false
  return new Date(item.consultaDate).getTime() > new Date(principal.closedAt).getTime()
}

export function getPostCloseCandidates(
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[],
  principal: PrefeituraFaturamentoFechamentoRecord | undefined,
) {
  if (!principal?.closedAt) return []
  return loteItems.filter((item) => isPostCloseCandidate(item, principal))
}

export function countPostCloseCandidates(
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[],
  principal: PrefeituraFaturamentoFechamentoRecord | undefined,
) {
  return getPostCloseCandidates(loteItems, principal).length
}

export function getLoteItemsForRecord(
  record: PrefeituraFaturamentoFechamentoRecord,
  loteItems: PrefeituraFaturamentoFechamentoLoteItem[],
  principal: PrefeituraFaturamentoFechamentoRecord | undefined,
) {
  if (isFechamentoRecordClosed(record)) {
    return loteItems.filter((item) => item.fechamentoRecordId === record.id)
  }

  if (record.tipo === 'complementar') {
    return getPostCloseCandidates(loteItems, principal)
  }

  return loteItems.filter(
    (item) =>
      item.competencia === record.competencia &&
      !item.fechamentoRecordId &&
      !isScheduledPostCloseItem(item, principal),
  )
}

export function buildViewModesForCompetencia(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
): PrefeituraFaturamentoFechamentoViewMode[] {
  return getRecordsForCompetencia(records, competencia)
    .slice()
    .sort((a, b) => {
      if (a.tipo === b.tipo) {
        return (a.complementoSeq ?? 0) - (b.complementoSeq ?? 0)
      }
      return a.tipo === 'principal' ? -1 : 1
    })
    .map((record) => ({
      recordId: record.id,
      label: formatFechamentoTipoLabel(record),
      isClosed: isFechamentoRecordClosed(record),
    }))
}

export function resolveDefaultRecordId(
  records: PrefeituraFaturamentoFechamentoRecord[],
  competencia: string,
  entidadeId?: string,
) {
  const openComplement = getOpenComplementRecord(records, competencia)
  if (openComplement) return openComplement.id

  const principal = getPrincipalRecord(records, competencia)
  if (principal && !isFechamentoRecordClosed(principal)) return principal.id

  const closedComplements = records
    .filter(
      (record) =>
        record.competencia === competencia &&
        record.tipo === 'complementar' &&
        isFechamentoRecordClosed(record),
    )
    .sort((a, b) => (b.complementoSeq ?? 0) - (a.complementoSeq ?? 0))

  if (closedComplements[0]) return closedComplements[0].id
  if (principal) return principal.id

  return entidadeId ? buildPrincipalRecordId(entidadeId, competencia) : ''
}

export function createEmptyRecord(
  competencia: string,
  entidadeId: string,
  tipo: PrefeituraFaturamentoFechamentoTipo = 'principal',
  complementoSeq: number | null = null,
): PrefeituraFaturamentoFechamentoRecord {
  return {
    id:
      tipo === 'principal'
        ? buildPrincipalRecordId(entidadeId, competencia)
        : buildComplementRecordId(entidadeId, competencia, complementoSeq ?? 1),
    competencia,
    tipo,
    complementoSeq,
    status: 'em_preparacao',
    closedAt: null,
    closedBy: null,
    fechamentoId: null,
    loteId: null,
    exportedAt: null,
    lastRevalidationAt: null,
    consultasNoLote: null,
    bloqueantesRegistrados: null,
  }
}
