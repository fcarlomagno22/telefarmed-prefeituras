import { AlertTriangle, ChevronRight, ShieldAlert } from 'lucide-react'
import {
  adminNocCategoryLabels,
  type AdminNocIncident,
} from '../../../types/adminDashboard'
import { DashCard, DashLinkAction } from '../../prefeitura/prefeituraDashboardUi'
import {
  adminDashboardTopRowBodyClass,
  adminDashboardTopRowDashCardClass,
} from './adminDashboardUi'

type AdminNocCentralPanelProps = {
  className?: string
  incidents: AdminNocIncident[]
  totalOpen: number
  onOpenAll: () => void
  onSelectIncident: (incident: AdminNocIncident) => void
}

const priorityStyles = {
  critical: 'border-l-red-500 bg-red-50/40',
  high: 'border-l-orange-500 bg-orange-50/30',
  medium: 'border-l-amber-400 bg-amber-50/25',
} as const

const statusLabels = {
  open: { label: 'Aberto', className: 'bg-red-50 text-red-700 ring-red-200/80' },
  in_progress: {
    label: 'Em tratamento',
    className: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  },
  resolved: {
    label: 'Resolvido',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200/80',
  },
} as const

export function AdminNocCentralPanel({
  className = '',
  incidents,
  totalOpen,
  onOpenAll,
  onSelectIncident,
}: AdminNocCentralPanelProps) {
  return (
    <DashCard
      title="Central de incidentes"
      subtitle="Operação Telefarmed · não confundir com alertas da prefeitura"
      fillHeight
      className={[className, adminDashboardTopRowDashCardClass].filter(Boolean).join(' ')}
      bodyClassName={[adminDashboardTopRowBodyClass, 'p-0'].join(' ')}
      action={
        <span className="inline-flex items-center gap-2">
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {totalOpen}
          </span>
          <DashLinkAction onClick={onOpenAll}>
            Ver central
            <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
          </DashLinkAction>
        </span>
      }
    >
      {incidents.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-sm text-gray-500">
          Nenhum incidente para os filtros aplicados
        </p>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5">
          {incidents.map((incident) => {
            const isCritical = incident.priority === 'critical'
            const status = statusLabels[incident.status]

            return (
              <li
                key={incident.id}
                className={['border-l-4', priorityStyles[incident.priority]].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => onSelectIncident(incident)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/70"
                >
                  <span
                    className={[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      isCritical ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600',
                    ].join(' ')}
                  >
                    {incident.category === 'security' ? (
                      <ShieldAlert className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-gray-900">
                        {incident.title}
                      </span>
                      <span className="shrink-0 text-[11px] font-medium tabular-nums text-gray-400">
                        {incident.timeAgo}
                      </span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="truncate text-xs text-gray-600">{incident.municipality}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                        {adminNocCategoryLabels[incident.category]}
                      </span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${status.className}`}
                      >
                        {status.label}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {incident.assignee ?? 'Sem responsável'} · {incident.team}
                      </span>
                      {incident.internalSlaBreached ? (
                        <span className="text-[10px] font-bold text-red-600">SLA estourado</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          SLA {incident.internalSlaHours}h
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </DashCard>
  )
}
