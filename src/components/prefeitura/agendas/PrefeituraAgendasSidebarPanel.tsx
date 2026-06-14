import { Package } from 'lucide-react'
import type { PrefeituraPackageUsageView } from '../../../utils/prefeituraConsultationPackage'
import { prefeituraPackageStatusStyles } from '../../../utils/prefeituraConsultationPackage'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'

type PackageStatProps = {
  label: string
  value: string
  valueClassName?: string
}

function PackageStat({ label, value, valueClassName = 'text-gray-900' }: PackageStatProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 px-3 py-2.5 shadow-sm">
      <span className="text-[11px] font-semibold text-gray-500">{label}</span>
      <span className={['text-base font-bold tabular-nums', valueClassName].join(' ')}>
        {value}
      </span>
    </div>
  )
}

type PrefeituraAgendasSidebarPanelProps = {
  weeklySummaryCards: ReadonlyArray<{
    label: string
    value: string
    suffix: string
    icon: typeof Package
    iconClass: string
    ringClass: string
    shadowClass: string
  }>
  packageUsage: PrefeituraPackageUsageView | null
}

export function PrefeituraAgendasSidebarPanel({
  weeklySummaryCards,
  packageUsage,
}: PrefeituraAgendasSidebarPanelProps) {
  const packageStyles = packageUsage
    ? prefeituraPackageStatusStyles[packageUsage.status]
    : prefeituraPackageStatusStyles.comfortable
  const usageBarWidth = packageUsage ? Math.min(100, packageUsage.usagePercent) : 0

  return (
    <aside className="flex shrink-0 flex-col gap-4">
      <section className="shrink-0 rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
        <h2 className="text-sm font-bold text-gray-900">Resumo da semana</h2>
        <p className="mt-0.5 text-xs leading-snug text-gray-500">
          Agendamentos, comparecimento e faltas da rede (dom.–sáb.)
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {weeklySummaryCards.length === 0 ? (
            <li className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
              Carregando resumo da semana...
            </li>
          ) : (
            weeklySummaryCards.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  <article className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 px-3 py-2.5 shadow-sm">
                    <span
                      className={[
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ring-2',
                        item.iconClass,
                        item.ringClass,
                        item.shadowClass,
                      ].join(' ')}
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold leading-snug text-gray-500">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-lg font-bold leading-none tabular-nums text-gray-900">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[10px] font-medium leading-snug text-gray-500">
                        {item.suffix}
                      </p>
                    </div>
                  </article>
                </li>
              )
            })
          )}
        </ul>
      </section>

      <section className="flex shrink-0 flex-col rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]">
        <h2 className="shrink-0 text-sm font-bold text-gray-900">Pacote de consultas</h2>
        {packageUsage ? (
          <>
            <p className="mt-0.5 shrink-0 text-xs leading-snug text-gray-500">
              Ciclo mensal · {packageUsage.cycleStartLabel} a {packageUsage.cycleCloseLabel}
            </p>

            <div className="mt-3 flex flex-col gap-2.5">
              <PackageStat
                label="Consultas contratadas"
                value={formatPrefeituraNumber(packageUsage.contractedTotal)}
              />
              <PackageStat
                label="Consultas utilizadas"
                value={formatPrefeituraNumber(packageUsage.usedInCycle)}
                valueClassName={packageStyles.text}
              />
              {packageUsage.avulsoCount > 0 ? (
                <PackageStat
                  label="Consultas avulsas"
                  value={formatPrefeituraNumber(packageUsage.avulsoCount)}
                  valueClassName="text-red-700"
                />
              ) : null}

              <div className="mt-1 space-y-2 rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Package className="h-3.5 w-3.5 text-gray-400" strokeWidth={2} />
                    Uso do pacote
                  </span>
                  <span className="tabular-nums">{packageUsage.usagePercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${packageStyles.bar}`}
                    style={{ width: `${usageBarWidth}%` }}
                  />
                </div>
                <span
                  className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${packageStyles.pill}`}
                >
                  {packageUsage.statusLabel}
                </span>
                <p className="text-[11px] leading-relaxed text-gray-600">{packageUsage.statusHint}</p>
              </div>

              {packageUsage.avulsoCount > 0 ? (
                <p className="text-[10px] leading-snug text-red-700">
                  Cobradas à parte do pacote mensal contratado.
                </p>
              ) : (
                <p className="text-[10px] leading-snug text-gray-500">
                  Se ultrapassar o pacote, o excedente será faturado como consulta avulsa.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-3 text-xs text-gray-500">Carregando pacote de consultas...</p>
        )}

        <div className="flex min-h-[7rem] shrink-0 items-end justify-center pt-2">
          <img
            src="/agenda.png"
            alt="Ilustração de gestão de agendas"
            className="max-h-[9.5rem] w-full max-w-[240px] object-contain object-bottom"
          />
        </div>
      </section>
    </aside>
  )
}
