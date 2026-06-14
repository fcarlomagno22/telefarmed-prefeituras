import type { AuditLogPlatform } from './auditLogScope'

export type AuditLogSeverity = 'info' | 'warning' | 'critical'

export type AuditLogActionTone = 'create' | 'view' | 'update' | 'delete' | 'auth'

/** Entrada unificada para tabela de auditoria (API — não mock). */
export type AuditLogEntry = {
  id: string
  kind?: 'acesso' | 'evento'
  createdAt?: string
  platform: AuditLogPlatform
  prefeituraName: string | null
  ubtName: string | null
  severity: AuditLogSeverity
  dateTime: string
  userName: string
  userRole: string
  actionLabel: string
  httpMethod: string
  actionTone: AuditLogActionTone
  moduleName: string
  pagePath: string
  resourceLabel: string
  resourceId: string
  serverResponse: string
  serverResponseTone: 'success' | 'error'
  ipAddress: string
  deviceInfo: string
}

export type AuditoriaSummary = {
  totalEvents: number
  criticalEvents: number
  activeUsers: number
  totalAcessos: number
}

export type ListAuditoriaParams = {
  limit?: number
  offset?: number
  search?: string
  portal?: AuditLogPlatform
  from?: string
  to?: string
  atorId?: string
  entidadeContratanteId?: string
  unidadeUbtId?: string
  acao?: string
  pagina?: string
  recursoTipo?: string
  recursoId?: string
}
