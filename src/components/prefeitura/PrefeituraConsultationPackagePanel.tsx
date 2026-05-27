import { Gauge, Info, Package } from 'lucide-react'
import type { PrefeituraPackageUsageView } from '../../utils/prefeituraConsultationPackage'
import {
  prefeituraPackageStatusStyles,
} from '../../utils/prefeituraConsultationPackage'
import { PrefeituraPackageUsageBar } from './PrefeituraPackageUsageBar'
import {
  DashCard,
  formatPrefeituraNumber,
  prefDashboardHourlyAlertsBodyClass,
} from './prefeituraDashboardUi'

type PrefeituraConsultationPackagePanelProps = {
  className?: string
  usage: PrefeituraPackageUsageView
  animationKey?: string
}

export function PrefeituraConsultationPackagePanel({
  className = '',
  usage,
  animationKey,
}: PrefeituraConsultationPackagePanelProps) {
  const styles = prefeituraPackageStatusStyles[usage.status]
  const usageBarKey =
    animationKey ?? `${usage.usagePercent}-${usage.usedInCycle}-${usage.status}`

  return (
    <DashCard
      title="Pacote de consultas"
      subtitle="Ciclo mensal · fecha no último dia do mês"
      fillHeight
      className={className}
      bodyClassName={[prefDashboardHourlyAlertsBodyClass, 'flex flex-col gap-3 p-3'].join(' ')}
    >
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
            Contratadas
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
            {formatPrefeituraNumber(usage.contractedTotal)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
            Utilizadas
          </p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900">
            {formatPrefeituraNumber(usage.usedInCycle)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-100 bg-slate-50/90 px-2 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">
            Restantes
          </p>
          <p className={`mt-0.5 text-sm font-bold tabular-nums ${styles.text}`}>
            {formatPrefeituraNumber(usage.remainingInPackage)}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-gray-600">
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
            Nível de uso
          </span>
          <span className="tabular-nums">{usage.usagePercent}%</span>
        </div>
        <PrefeituraPackageUsageBar
          percent={usage.usagePercent}
          barClassName={styles.bar}
          resetKey={usageBarKey}
        />

        <span
          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${styles.pill}`}
        >
          <Gauge className={`h-3 w-3 ${styles.icon}`} strokeWidth={2} />
          {usage.statusLabel}
        </span>

        <p className="text-[11px] leading-relaxed text-gray-600">{usage.statusHint}</p>

        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2.5 py-2 text-[10px] leading-relaxed text-gray-500">
          <p>
            <span className="font-semibold text-gray-700">Ciclo atual:</span>{' '}
            {usage.cycleStartLabel} a {usage.cycleCloseLabel}
          </p>
          <p className="mt-1">
            Projeção até o fechamento:{' '}
            <span className="font-semibold text-gray-800">
              ~{formatPrefeituraNumber(usage.projectedTotalAtRenewal)} consultas
            </span>{' '}
            em {usage.daysRemaining} dia{usage.daysRemaining === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      {usage.avulsoCount > 0 ? (
        <p className="flex shrink-0 items-start gap-1.5 rounded-lg bg-red-50/80 px-2 py-1.5 text-[10px] leading-snug text-red-700">
          <Info className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
          <span>
            <span className="font-semibold">{formatPrefeituraNumber(usage.avulsoCount)} avulsas</span>{' '}
            no mês — cobradas à parte do pacote mensal.
          </span>
        </p>
      ) : (
        <p className="shrink-0 text-[10px] leading-snug text-gray-400">
          Se ultrapassar o pacote, as consultas excedentes serão faturadas como avulso.
        </p>
      )}
    </DashCard>
  )
}
