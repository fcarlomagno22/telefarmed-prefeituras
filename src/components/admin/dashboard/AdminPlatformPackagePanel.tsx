import { Gauge, Package } from 'lucide-react'
import type { AdminPlatformPackageView } from '../../../utils/adminDashboardFilters'
import { PrefeituraPackageUsageBar } from '../../prefeitura/PrefeituraPackageUsageBar'
import { DashCard } from '../../prefeitura/prefeituraDashboardUi'
import {
  adminDashboardTopRowBodyClass,
  adminDashboardTopRowDashCardClass,
  formatAdminNumber,
} from './adminDashboardUi'

const statusStyles = {
  normal: {
    text: 'text-emerald-700',
    bar: 'from-emerald-400 to-green-500',
    pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
    label: 'Confortável',
  },
  atencao: {
    text: 'text-amber-700',
    bar: 'from-amber-400 to-orange-500',
    pill: 'bg-amber-50 text-amber-800 ring-amber-200/80',
    label: 'Atenção',
  },
  critico: {
    text: 'text-red-600',
    bar: 'from-rose-400 to-red-500',
    pill: 'bg-red-50 text-red-700 ring-red-200/80',
    label: 'Crítico',
  },
} as const

type AdminPlatformPackagePanelProps = {
  className?: string
  usage: AdminPlatformPackageView
  animationKey?: string
  onClick?: () => void
}

type StatCellProps = {
  label: string
  value: string
  valueClassName?: string
}

function StatCell({ label, value, valueClassName = 'text-gray-900' }: StatCellProps) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-1 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-bold leading-none tabular-nums sm:text-lg ${valueClassName}`}>
        {value}
      </p>
    </div>
  )
}

export function AdminPlatformPackagePanel({
  className = '',
  usage,
  animationKey,
  onClick,
}: AdminPlatformPackagePanelProps) {
  const styles = statusStyles[usage.status]
  const usageBarKey =
    animationKey ?? `${usage.usagePercent}-${usage.usedInCycle}-${usage.status}`

  return (
    <DashCard
      title="Pacote agregado"
      subtitle="Todos os contratos no recorte"
      fillHeight
      className={[className, adminDashboardTopRowDashCardClass].filter(Boolean).join(' ')}
      bodyClassName={[adminDashboardTopRowBodyClass, 'gap-2 !p-3'].join(' ')}
      action={
        onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)]"
          >
            <Package className="h-3.5 w-3.5" strokeWidth={2} />
            Detalhar
          </button>
        ) : null
      }
    >
      <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2">
          <StatCell label="Contratadas" value={formatAdminNumber(usage.contractedTotal)} />
          <StatCell label="Utilizadas" value={formatAdminNumber(usage.usedInCycle)} />
          <StatCell
            label="Restantes"
            value={formatAdminNumber(usage.remainingInPackage)}
            valueClassName={styles.text}
          />
        </div>

        <div className="flex shrink-0 flex-col gap-2 rounded-lg border border-gray-100 bg-gradient-to-b from-slate-50/90 to-white px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-baseline gap-2">
              <p className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <Gauge className="h-3.5 w-3.5" strokeWidth={2} />
                Uso agregado
              </p>
              <p className={`text-xl font-bold leading-none tabular-nums ${styles.text}`}>
                {usage.usagePercent}%
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${styles.pill}`}
            >
              {styles.label}
            </span>
          </div>

          <PrefeituraPackageUsageBar
            percent={usage.usagePercent}
            barClassName={`h-full w-0 rounded-full bg-gradient-to-r ${styles.bar}`}
            resetKey={usageBarKey}
            trackClassName="h-2.5 w-full"
          />

          <p className="text-center text-[10px] leading-snug text-gray-500">
            Consumo médio de todos os contratos no recorte atual
          </p>
        </div>
      </div>
    </DashCard>
  )
}
