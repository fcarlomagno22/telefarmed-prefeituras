import { AlertTriangle, Building2, ChevronRight, Timer } from 'lucide-react'
import { DashCard, DashLinkAction } from '../../prefeitura/prefeituraDashboardUi'
import type { PrefeituraSlaStatus } from '../../../data/prefeituraDashboardMock'
import {
  adminDashboardHourlyBodyClass,
  adminHealthDotClass,
  adminHealthLabels,
  formatAdminNumber,
} from './adminDashboardUi'

type AdminOperationalSummaryPanelProps = {
  className?: string
  municipalityCount: number
  criticalIncidentCount: number
  openIncidentCount: number
  avgSlaMinutes: number
  healthSummary: { green: number; yellow: number; red: number }
  onOpenHealthDetail?: () => void
}

const slaHintClass: Record<PrefeituraSlaStatus, string> = {
  normal: 'text-emerald-700',
  atencao: 'text-amber-700',
  critico: 'text-red-600',
}

const slaHintLabel: Record<PrefeituraSlaStatus, string> = {
  normal: 'Dentro da meta',
  atencao: 'Acima da meta',
  critico: 'Fora da meta',
}

function slaStatusFromMinutes(minutes: number): PrefeituraSlaStatus {
  if (minutes <= 15) return 'normal'
  if (minutes <= 20) return 'atencao'
  return 'critico'
}

export function AdminOperationalSummaryPanel({
  className = '',
  municipalityCount,
  criticalIncidentCount,
  openIncidentCount,
  avgSlaMinutes,
  healthSummary,
  onOpenHealthDetail,
}: AdminOperationalSummaryPanelProps) {
  const slaStatus = slaStatusFromMinutes(avgSlaMinutes)
  const slaRounded = Math.round(avgSlaMinutes)

  const healthItems = (
    [
      { key: 'green' as const, count: healthSummary.green },
      { key: 'yellow' as const, count: healthSummary.yellow },
      { key: 'red' as const, count: healthSummary.red },
    ] as const
  ).filter((item) => item.count > 0)

  return (
    <DashCard
      title="Resumo operacional"
      subtitle="Recorte atual"
      fillHeight
      className={className}
      bodyClassName={[
        adminDashboardHourlyBodyClass,
        'flex flex-col justify-between gap-2 p-3',
      ].join(' ')}
      action={
        onOpenHealthDetail ? (
          <DashLinkAction onClick={onOpenHealthDetail}>
            Semáforo
            <ChevronRight className="ml-0.5 inline h-3.5 w-3.5" strokeWidth={2.5} />
          </DashLinkAction>
        ) : null
      }
    >
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-lg border border-sky-100 bg-sky-50/70 px-2 py-2 text-center">
          <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <Building2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <p className="mt-1 text-lg font-bold leading-none tabular-nums text-gray-900">
            {formatAdminNumber(municipalityCount)}
          </p>
          <p className="mt-1 text-[9px] font-semibold leading-tight text-sky-800">
            Município{municipalityCount === 1 ? '' : 's'}
          </p>
        </div>

        <div
          className={[
            'rounded-lg border px-2 py-2 text-center',
            criticalIncidentCount > 0
              ? 'border-red-200/90 bg-red-50/80'
              : 'border-gray-100 bg-slate-50/90',
          ].join(' ')}
        >
          <span
            className={[
              'mx-auto flex h-7 w-7 items-center justify-center rounded-lg',
              criticalIncidentCount > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500',
            ].join(' ')}
          >
            <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <p
            className={[
              'mt-1 text-lg font-bold leading-none tabular-nums',
              criticalIncidentCount > 0 ? 'text-red-700' : 'text-gray-900',
            ].join(' ')}
          >
            {formatAdminNumber(criticalIncidentCount)}
          </p>
          <p
            className={[
              'mt-1 text-[9px] font-semibold leading-tight',
              criticalIncidentCount > 0 ? 'text-red-700' : 'text-gray-500',
            ].join(' ')}
          >
            Crítico{criticalIncidentCount === 1 ? '' : 's'}
          </p>
        </div>

        <div className="rounded-lg border border-orange-100 bg-orange-50/60 px-2 py-2 text-center">
          <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <Timer className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <p className="mt-1 text-lg font-bold leading-none tabular-nums text-gray-900">
            {slaRounded}
            <span className="ml-0.5 text-[10px] font-semibold text-gray-500">min</span>
          </p>
          <p className={`mt-1 text-[9px] font-semibold leading-tight ${slaHintClass[slaStatus]}`}>
            {slaHintLabel[slaStatus]}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2.5 py-1.5">
        <p className="text-[10px] font-medium text-gray-600">
          {openIncidentCount > 0 ? (
            <>
              <span className="font-bold text-gray-900">{openIncidentCount}</span> incidente
              {openIncidentCount === 1 ? '' : 's'} em aberto no recorte
            </>
          ) : (
            <span className="text-emerald-700">Nenhum incidente aberto</span>
          )}
        </p>
        {healthItems.length > 0 ? (
          <ul className="flex shrink-0 items-center gap-2" aria-label="Semáforo dos municípios">
            {healthItems.map((item) => (
              <li
                key={item.key}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600"
              >
                <span
                  className={['h-2 w-2 rounded-full', adminHealthDotClass[item.key]].join(' ')}
                  aria-hidden
                />
                <span className="tabular-nums">{item.count}</span>
                <span className="sr-only">{adminHealthLabels[item.key]}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DashCard>
  )
}
