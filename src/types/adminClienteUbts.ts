export type AdminClienteUbtOperator = {
  id: string
  name: string
  role: string
}

export type AdminClienteUbtMetrics = {
  operatorsOnline: number
  stationsActive: number
  consultationsCompleted: number
  consultationsInProgress: number
  cancellationsToday: number
  avgConsultationMinutes: number
  queueNow: number
  consultationsToday: number
}

export type AdminClienteUbtRow = {
  id: string
  name: string
  region: string
  regionKey: string
  status: 'ativa' | 'manutencao' | 'inativa'
  statusLabel: string
  cnes: string
  unitType: 'Fixa' | 'Móvel'
  address: {
    formatted: string
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
  phone: string
  dailyCapacityLabel: string
  specialtyNames: string[]
  stationsTotal: number
  stationsOnline: number
  maintenanceTerminals: number
  notes: string
  responsible: {
    name: string
    email: string
    cpf: string
    phone: string
    credentialsConfigured: boolean
  }
  operators: AdminClienteUbtOperator[]
  metrics: AdminClienteUbtMetrics
}

export type AdminClienteUbtsResponse = {
  entidadeId: string
  prefeitura: string
  total: number
  ubts: AdminClienteUbtRow[]
}
