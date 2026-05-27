import { Monitor, Wrench } from 'lucide-react'
import type { AdminTerminalsView } from '../../../utils/adminDashboardFilters'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import { adminDashboardHourlyBodyClass, formatAdminNumber } from './adminDashboardUi'

type AdminTerminalsPanelProps = {
  className?: string
  terminals: AdminTerminalsView
  onClick?: () => void
}

export function AdminTerminalsPanel({
  className = '',
  terminals,
  onClick,
}: AdminTerminalsPanelProps) {
  const onlinePercent =
    terminals.total > 0 ? Math.round((terminals.online / terminals.total) * 100) : 0

  return (
    <DashCard
      title="Terminais UBT"
      subtitle="Status agregado no recorte"
      fillHeight
      className={className}
      bodyClassName={[adminDashboardHourlyBodyClass, 'flex flex-col justify-center gap-3 p-4'].join(
        ' ',
      )}
      action={
        onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
          >
            Detalhar
          </button>
        ) : null
      }
    >
      <div className="flex items-center justify-center gap-2">
        <Monitor className="h-5 w-5 text-teal-600" strokeWidth={2} />
        <span className="text-2xl font-bold tabular-nums text-gray-900">
          {formatAdminNumber(terminals.online)}
        </span>
        <span className="text-sm text-gray-500">/ {formatAdminNumber(terminals.total)} online</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-700"
          style={{ width: `${onlinePercent}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-emerald-50 px-2 py-2 font-semibold text-emerald-800">
          Online
          <p className="mt-0.5 text-sm font-bold tabular-nums">{terminals.online}</p>
        </div>
        <div className="rounded-lg bg-red-50 px-2 py-2 font-semibold text-red-700">
          Offline
          <p className="mt-0.5 text-sm font-bold tabular-nums">{terminals.offline}</p>
        </div>
        <div className="rounded-lg bg-amber-50 px-2 py-2 font-semibold text-amber-800">
          <span className="inline-flex items-center justify-center gap-1">
            <Wrench className="h-3 w-3" />
            Manutenção
          </span>
          <p className="mt-0.5 text-sm font-bold tabular-nums">{terminals.maintenance}</p>
        </div>
      </div>
    </DashCard>
  )
}
