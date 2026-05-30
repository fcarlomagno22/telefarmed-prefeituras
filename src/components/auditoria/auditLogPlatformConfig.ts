import type { AuditLogPlatform } from '../../types/auditLogScope'

export const auditLogPlatformLabels: Record<AuditLogPlatform, string> = {
  ubt: 'UBT',
  prefeitura: 'Prefeitura',
  admin: 'Admin',
  atendimento: 'Atendimento',
}

export const auditLogPlatformBadgeClass: Record<AuditLogPlatform, string> = {
  ubt: 'border-sky-200 bg-sky-50 text-sky-800',
  prefeitura: 'border-violet-200 bg-violet-50 text-violet-800',
  admin: 'border-orange-200 bg-orange-50 text-orange-800',
  atendimento: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}
