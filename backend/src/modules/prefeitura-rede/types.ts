export type RedeUnitStatus = 'ativa' | 'manutencao' | 'inativa'

export type RedeUnitApi = {
  id: string
  name: string
  slug: string
  publicUrl: string
  address: string
  cnes: string
  region: string
  regionKey: string
  responsibleName: string
  responsiblePhone: string
  stationsTotal: number
  stationsOnline: number
  status: RedeUnitStatus
  maintenanceTerminalIndexes: number[]
}

export type RedeOverviewKpi = {
  key: string
  label: string
  value: string
  suffix: string
  topBar: string
}

export type RedeDonutSlice = {
  key?: string
  label: string
  value: number
  color: string
}

export type RedeOverviewApi = {
  kpis: RedeOverviewKpi[]
  regionSlices: RedeDonutSlice[]
  stationStatusSlices: RedeDonutSlice[]
  filterOptions: {
    regions: Array<{ value: string; label: string }>
    statuses: Array<{ value: string; label: string }>
  }
}

export type RedeOperatorApi = {
  id: string
  unitId: string
  name: string
  role: string
}

export type RedeUnitDetailApi = {
  unit: RedeUnitApi
  cadastral: {
    unitType: 'Fixa' | 'Móvel'
    responsibleEmail: string
    responsibleCpf: string
    unitLandline: string
    dailyCapacityLabel: string
    specialtyNames: string[]
    address: {
      cep: string
      street: string
      number: string
      complement: string
      neighborhood: string
      city: string
      state: string
      formatted: string
    }
    notes: string
    credentialsConfigured: boolean
  }
  operators: RedeOperatorApi[]
  metrics: {
    operatorsOnline: number
    stationsActive: number
    consultationsCompleted: number
    consultationsInProgress: number
    cancellationsToday: number
    avgConsultationMinutes: number
    queueNow: number
    consultationsToday: number
  }
}

export type RedeSettingsApi = {
  limitDailyCapacity: boolean
  dailyCapacity: number
  limitPerUnit: boolean
  unitDailyLimits: Record<string, string>
  unitSpecialties: Record<string, string[]>
  allowAvulso: boolean
  packageConsultationsTotal: number | null
}

export type RedeConfigRede = {
  limitDailyCapacity?: boolean
  dailyCapacity?: number
  limitPerUnit?: boolean
  unitDailyLimits?: Record<string, number | string>
  unitSpecialties?: Record<string, string[]>
  allowAvulso?: boolean
}

export type UnidadeUbtRow = {
  id: string
  entidade_contratante_id: string
  nome: string
  slug: string | null
  slug_locked_at?: string | null
  ra_chave: string
  ra_rotulo: string
  cnes: string
  tipo_unidade: 'fixa' | 'movel'
  endereco: Record<string, unknown>
  telefone: string
  capacidade_diaria: number
  especialidades: string[]
  notas: string
  terminais_total: number
  terminais_manutencao: number[]
  estado_operacional: RedeUnitStatus
  status: string
}

export type ResponsavelRow = {
  unidade_ubt_id: string
  nome: string
  email: string | null
  cpf: string
  telefone?: never
}

export type OperadorRow = {
  id: string
  unidade_ubt_id: string
  nome: string
  funcao: string
  status: string
  ultimo_login_em: string | null
}
