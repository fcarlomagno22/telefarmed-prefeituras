export type CorrecaoPayloadDto = {
  patientCns?: string
  patientMunicipality?: string
  patientMunicipalityIbge?: string
  professionalCbo?: string
  professionalCboLabel?: string
  professionalCns?: string
  professionalConselhoNumero?: string
  professionalConselhoUf?: string
  professionalHasCnesVinculo?: boolean
  suggestedProcedure?: string
  consultaEncerrada?: boolean
  duplicidadeResolvida?: boolean
  clinicalCid?: string
}

export type PendenciaDto = {
  id: string
  competencia: string
  category: string
  gravidade: string
  status: string
  kind: string
  title: string
  patientName: string
  patientCpf: string | null
  patientCns: string | null
  patientMunicipality?: string | null
  patientMunicipalityIbge?: string | null
  professionalCbo?: string | null
  professionalCboLabel?: string | null
  professionalHasCnesVinculo?: boolean
  procedureCompatibleWithCbo?: boolean
  clinicalCid?: string | null
  clinicalRequestSentAt?: string | null
  consultaEncerrada?: boolean
  duplicidadeResolvida?: boolean
  duplicateConsultaId?: string | null
  consultaStartedAt?: string | null
  consultaEndedAt?: string | null
  consultaModality?: string | null
  consultaClinicalStatus?: string | null
  patientBirthDate?: string | null
  patientSex?: string | null
  professionalConselho?: string | null
  professionalCns?: string | null
  professionalActive?: boolean
  suggestedProcedureName?: string | null
  consultaId: string
  consultaDate: string
  professionalName: string
  specialty: string
  unitId: string
  unitName: string
  cnes: string
  suggestedProcedure: string | null
  reason: string
  impact: string
  recommendedAction: string
  primaryAction: string
  responsibleName: string | null
  ignoreJustification: string | null
  correctedAt: string | null
}

export type PendenciasSummaryDto = {
  abertas: number
  bloqueantes: number
  avisos: number
  corrigidasHoje: number
  faturaveis: number
  competenciaLabel: string
}

export type FechamentoRecordDto = {
  id: string
  competencia: string
  tipo: 'principal' | 'complementar'
  complementoSeq: number | null
  status: string
  closedAt: string | null
  closedBy: string | null
  fechamentoId: string | null
  loteId: string | null
  exportedAt: string | null
  lastRevalidationAt: string | null
  consultasNoLote: number | null
  bloqueantesRegistrados: number | null
}

export type LoteItemDto = {
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

export type FechamentoSummaryDto = {
  competenciaLabel: string
  realizadas: number
  elegiveis: number
  noLote: number
  bloqueantes: number
  ignoradas: number
}

export type SigtapOptionDto = {
  value: string
  label: string
}
