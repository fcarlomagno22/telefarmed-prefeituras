export type AdminClienteUbtOperatorDto = {
  id: string
  name: string
  role: string
}

export type AdminClienteUbtResponsibleDto = {
  name: string
  email: string
  cpf: string
  phone: string
  credentialsConfigured: boolean
}

export type AdminClienteUbtMetricsDto = {
  operatorsOnline: number
  stationsActive: number
  consultationsCompleted: number
  consultationsInProgress: number
  cancellationsToday: number
  avgConsultationMinutes: number
  queueNow: number
  consultationsToday: number
}

export type AdminClienteUbtAddressDto = {
  formatted: string
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

export type AdminClienteUbtRowDto = {
  id: string
  name: string
  region: string
  regionKey: string
  status: 'ativa' | 'manutencao' | 'inativa'
  statusLabel: string
  cnes: string
  unitType: 'Fixa' | 'Móvel'
  address: AdminClienteUbtAddressDto
  phone: string
  dailyCapacityLabel: string
  specialtyNames: string[]
  stationsTotal: number
  stationsOnline: number
  maintenanceTerminals: number
  notes: string
  responsible: AdminClienteUbtResponsibleDto
  operators: AdminClienteUbtOperatorDto[]
  metrics: AdminClienteUbtMetricsDto
}

export type AdminClienteUbtsResponseDto = {
  entidadeId: string
  prefeitura: string
  total: number
  ubts: AdminClienteUbtRowDto[]
}
