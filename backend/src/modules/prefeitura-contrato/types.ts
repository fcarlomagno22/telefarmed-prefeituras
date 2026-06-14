export type PrefeituraPackageUsageStatus = 'comfortable' | 'attention' | 'critical' | 'exceeded'

export type PrefeituraPackageUsageDto = {
  contractedTotal: number
  usedInCycle: number
  remainingInPackage: number
  avulsoCount: number
  usagePercent: number
  projectedTotalAtRenewal: number
  projectedOverflow: number
  daysRemaining: number
  daysElapsed: number
  daysInMonth: number
  cycleStartLabel: string
  cycleCloseLabel: string
  nextCycleStartLabel: string
  status: PrefeituraPackageUsageStatus
  statusLabel: string
  statusHint: string
  filteredScope: boolean
}

export type ContratoEntidadeRow = {
  id: string
  entidade_contratante_id: string
  numero: string | null
  tipo: string
  status: string
  data_assinatura: string
  data_encerramento: string | null
  consultas_contratadas: number | null
  consultas_realizadas: number
  percentual_utilizado: number | string | null
  permite_ultrapassar: boolean
}

export type EntidadeContratoRow = {
  nome_exibicao: string
  razao_social: string
  municipio: string
  uf: string
  contato_contrato: unknown
}
