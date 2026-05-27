import {
  AlertTriangle,
  CircleAlert,
  Info,
} from 'lucide-react'
import type { AuditLogActionTone, AuditLogSeverity } from '../../data/auditLogsMock'

export const actionToneStyles: Record<
  AuditLogActionTone,
  { labelClass: string }
> = {
  create: { labelClass: 'text-emerald-600' },
  view: { labelClass: 'text-sky-600' },
  update: { labelClass: 'text-orange-600' },
  delete: { labelClass: 'text-red-600' },
  auth: { labelClass: 'text-emerald-600' },
}

export function AuditLogSeverityIcon({ severity }: { severity: AuditLogSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600">
        <CircleAlert className="h-4 w-4" strokeWidth={2.25} />
      </span>
    )
  }

  if (severity === 'warning') {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
      </span>
    )
  }

  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-sky-600">
      <Info className="h-4 w-4" strokeWidth={2.25} />
    </span>
  )
}
