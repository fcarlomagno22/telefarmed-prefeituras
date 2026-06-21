export type PrefeituraFaturamentoFechamentoStatus =
  | 'em_preparacao'
  | 'pronto_para_fechar'
  | 'fechado'
  | 'exportado'

export type PrefeituraFaturamentoFechamentoTipo = 'principal' | 'complementar'

export type PrefeituraFaturamentoFechamentoLoteItem = {
  id: string
  competencia: string
  consultaId: string
  consultaDate: string
  patientName: string
  patientCpf: string | null
  patientCns: string | null
  patientMunicipality: string | null
  patientMunicipalityIbge: string | null
  professionalName: string
  professionalConselho: string | null
  professionalCbo: string | null
  professionalCboLabel: string | null
  procedureCompatibleWithCbo: boolean
  specialty: string
  unitId: string
  unitName: string
  cnes: string
  procedureCode: string
  procedureName: string
  clinicalCid: string | null
  consultaStartedAt: string | null
  consultaEndedAt: string | null
  consultaEncerrada: boolean
  faturavel: boolean
  excluded: boolean
  excludeReason: string | null
  fechamentoRecordId: string | null
}

export type PrefeituraFaturamentoFechamentoRecord = {
  id: string
  competencia: string
  tipo: PrefeituraFaturamentoFechamentoTipo
  complementoSeq: number | null
  status: PrefeituraFaturamentoFechamentoStatus
  closedAt: string | null
  closedBy: string | null
  fechamentoId: string | null
  loteId: string | null
  exportedAt: string | null
  lastRevalidationAt: string | null
  consultasNoLote: number | null
  bloqueantesRegistrados: number | null
}

export type PrefeituraFaturamentoFechamentoGateItem = {
  id: string
  label: string
  ok: boolean
  detail: string
}

export type PrefeituraFaturamentoFechamentoConsolidacaoRow = {
  id: string
  label: string
  sublabel: string | null
  count: number
}

export type PrefeituraFaturamentoFechamentoSummary = {
  competenciaLabel: string
  realizadas: number
  elegiveis: number
  noLote: number
  bloqueantes: number
  ignoradas: number
}

export type PrefeituraFaturamentoFechamentoFilters = {
  competencia: string
  unitId: string
  professionalName: string
  search: string
}

export type PrefeituraFaturamentoFechamentoCloseResult = {
  ok: boolean
  message?: string
  errorReason?: string
  fechamentoId?: string
}

export type PrefeituraFaturamentoFechamentoViewMode = {
  recordId: string
  label: string
  isClosed: boolean
}
