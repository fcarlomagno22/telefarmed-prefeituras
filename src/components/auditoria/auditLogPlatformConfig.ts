import type { AuditLogPlatform } from '../../types/auditLogScope'

export const auditLogPlatformLabels: Record<AuditLogPlatform, string> = {
  ubt: 'UBT',
  prefeitura: 'Prefeitura',
  admin: 'Admin',
  profissional: 'Profissional',
  atendimento: 'Atendimento',
}

export const auditLogPlatformBadgeClass: Record<AuditLogPlatform, string> = {
  ubt: 'border-sky-200 bg-sky-50 text-sky-800',
  prefeitura: 'border-violet-200 bg-violet-50 text-violet-800',
  admin: 'border-orange-200 bg-orange-50 text-orange-800',
  profissional: 'border-teal-200 bg-teal-50 text-teal-800',
  atendimento: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

const auditLogPlatformSet = new Set<string>(Object.keys(auditLogPlatformLabels))

export function isAuditLogPlatform(value: string): value is AuditLogPlatform {
  return auditLogPlatformSet.has(value)
}

export function resolveAuditLogPlatformLabel(platform: string): string {
  if (isAuditLogPlatform(platform)) return auditLogPlatformLabels[platform]
  return platform.charAt(0).toUpperCase() + platform.slice(1)
}

export function resolveAuditLogPlatformBadgeClass(platform: string): string {
  if (isAuditLogPlatform(platform)) return auditLogPlatformBadgeClass[platform]
  return 'border-gray-200 bg-gray-50 text-gray-700'
}

export const auditLogPlatformFilterOptions: Array<{ value: AuditLogPlatform; label: string }> = [
  { value: 'admin', label: auditLogPlatformLabels.admin },
  { value: 'prefeitura', label: auditLogPlatformLabels.prefeitura },
  { value: 'ubt', label: auditLogPlatformLabels.ubt },
  { value: 'profissional', label: auditLogPlatformLabels.profissional },
  { value: 'atendimento', label: auditLogPlatformLabels.atendimento },
]
