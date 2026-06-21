import type { PrefeituraFaturamentoRegraSusCheckId } from './prefeituraFaturamentoRegraSus'

export type PrefeituraFaturamentoCorrecaoMode =
  | 'edit_cns'
  | 'edit_municipio'
  | 'edit_cbo'
  | 'edit_mt_profissional'
  | 'edit_vinculo_cnes'
  | 'select_procedure'
  | 'request_clinical'
  | 'open_consulta'
  | 'compare_consultas'

export type PrefeituraFaturamentoCorrecaoDefinition = {
  title: string
  fieldLabel: string
  reason: string
  mode: PrefeituraFaturamentoCorrecaoMode
  relatedChecks: PrefeituraFaturamentoRegraSusCheckId[]
}

export type PrefeituraFaturamentoCorrecaoPayload = {
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
