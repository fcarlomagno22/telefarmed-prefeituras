export type PrefeituraFaturamentoPendenciaCategory =
  | 'paciente'
  | 'profissional'
  | 'consulta'
  | 'procedimento'

export type PrefeituraFaturamentoPendenciaGravidade = 'bloqueante' | 'aviso'

export type PrefeituraFaturamentoPendenciaStatus =
  | 'aberta'
  | 'em_correcao'
  | 'aguardando_profissional'
  | 'corrigida'
  | 'validada'
  | 'ignorada'
  | 'nao_faturavel'

export type PrefeituraFaturamentoPendenciasCategoryTab =
  | 'todas'
  | 'bloqueantes'
  | 'paciente'
  | 'profissional'
  | 'consulta'
  | 'procedimento'
  | 'resolvidas'

export type PrefeituraFaturamentoPendenciaAcao =
  | 'corrigir_cadastro'
  | 'editar_profissional'
  | 'abrir_consulta'
  | 'definir_procedimento'
  | 'revisar_regra_sus'
  | 'comparar_consultas'
  | 'solicitar_ajuste_profissional'

export type PrefeituraFaturamentoPendencia = {
  id: string
  competencia: string
  category: PrefeituraFaturamentoPendenciaCategory
  gravidade: PrefeituraFaturamentoPendenciaGravidade
  status: PrefeituraFaturamentoPendenciaStatus
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
  primaryAction: PrefeituraFaturamentoPendenciaAcao
  responsibleName: string | null
  ignoreJustification: string | null
  correctedAt: string | null
}

export type PrefeituraFaturamentoPendenciasFilters = {
  competencia: string
  unitId: string
  professionalName: string
  specialty: string
  category: string
  gravidade: string
  status: string
  search: string
}

export type PrefeituraFaturamentoPendenciasSummary = {
  abertas: number
  bloqueantes: number
  avisos: number
  corrigidasHoje: number
  faturaveis: number
  competenciaLabel: string
}
