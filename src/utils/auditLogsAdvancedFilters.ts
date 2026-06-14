export type AuditCriticalityLevel = 'all' | 'critical' | 'high' | 'medium' | 'low'

export type AuditLogsAdvancedFilters = {
  startDate: string
  endDate: string
  timeFrom: string
  timeTo: string
  userId: string
  userType: string
  unit: string
  prefeitura: string
  ubt: string
  platform: string
  action: string
  eventCategory: string
  criticality: AuditCriticalityLevel
  module: string
  affectedResource: string
  resourceId: string
  ipDevice: string
  serverResponse: string
  httpCode: string
  outcome: string
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const defaultAuditLogsAdvancedFilters = (): AuditLogsAdvancedFilters => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)

  return {
  startDate: toDateInputValue(start),
  endDate: toDateInputValue(end),
  timeFrom: '00:00',
  timeTo: '23:59',
  userId: '',
  userType: '',
  unit: '',
  prefeitura: '',
  ubt: '',
  platform: '',
  action: '',
  eventCategory: '',
  criticality: 'all',
  module: '',
  affectedResource: '',
  resourceId: '',
  ipDevice: '',
  serverResponse: '',
  httpCode: '',
  outcome: '',
  }
}

export const auditCriticalityOptions = [
  { value: 'all' as const, label: 'Todas' },
  { value: 'critical' as const, label: 'Crítico' },
  { value: 'high' as const, label: 'Alto' },
  { value: 'medium' as const, label: 'Médio' },
  { value: 'low' as const, label: 'Baixo' },
]
