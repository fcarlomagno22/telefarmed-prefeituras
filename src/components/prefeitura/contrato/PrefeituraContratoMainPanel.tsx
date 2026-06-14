import { ChevronRight, FileText, Lock } from 'lucide-react'
import { useMemo } from 'react'
import type {
  PrefeituraContratoMonthlyRow,
  PrefeituraContratoRecord,
} from '../../../types/prefeituraContrato'
import type { usePrefeituraContratoMonthDrawer } from '../../../hooks/usePrefeituraContratoMonthDrawer'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'
import { PrefeituraConsultasKpiCards } from '../consultas/PrefeituraConsultasKpiCards'
import { formatPrefeituraNumber } from '../prefeituraDashboardUi'
import { PrefeituraPackageUsageBar } from '../PrefeituraPackageUsageBar'
import { PrefeituraContratoMonthlyChart } from './PrefeituraContratoMonthlyChart'
import {
  buildPrefeituraContratoPackageChartLabel,
  buildPrefeituraContratoPeriodKpiCards,
  computePrefeituraContratoMonthlyUsagePercent,
  formatPrefeituraContratoMonthlyContracted,
  getCurrentPrefeituraContratoMonthKey,
  prefeituraContratoOutcomeBadge,
} from './prefeituraContratoUi'

type PrefeituraContratoMainPanelProps = {
  contract: PrefeituraContratoRecord
  rows: PrefeituraContratoMonthlyRow[]
  monthDrawer: Pick<ReturnType<typeof usePrefeituraContratoMonthDrawer>, 'openDrawer'>
  className?: string
}

function formatUsagePercentLabel(value: number) {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`
}

export function PrefeituraContratoMainPanel({
  contract,
  rows,
  monthDrawer,
  className = '',
}: PrefeituraContratoMainPanelProps) {
  const currentMonthKey = useMemo(() => getCurrentPrefeituraContratoMonthKey(), [])
  const tableRows = useMemo(
    () => rows.filter((row) => row.key <= currentMonthKey),
    [rows, currentMonthKey],
  )
  const monthCountLabel =
    tableRows.length === 1 ? '1 mês' : `${tableRows.length} meses`
  const isExpired = contract.status === 'expired'

  const totals = useMemo(() => {
    const performed = tableRows.reduce((sum, r) => sum + r.performed, 0)
    const avulso = tableRows.reduce((sum, r) => sum + r.avulsoCount, 0)
    const exceededMonths = tableRows.filter((r) => r.outcome === 'exceeded').length
    return { performed, avulso, exceededMonths }
  }, [tableRows])

  const periodKpiCards = useMemo(
    () => buildPrefeituraContratoPeriodKpiCards(totals, monthCountLabel),
    [totals, monthCountLabel],
  )
  return (
    <article
      className={[dashboardMainPanelSurfaceClass, 'flex min-h-0 flex-col', className].join(' ')}
    >
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
            <h2 className="text-base font-bold text-gray-900">Histórico mensal do pacote</h2>
            {isExpired ? (
              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 ring-1 ring-inset ring-gray-200/80">
                Contrato encerrado
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Consultas contratadas, realizadas e cobrança avulsa — clique no mês para ver a lista
            detalhada.
          </p>
        </div>
        <p className="inline-flex max-w-xs items-start gap-1.5 rounded-lg border border-dashed border-gray-200 bg-slate-50/90 px-3 py-2 text-[11px] leading-snug text-gray-500">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" strokeWidth={2} />
          Dados do contrato público municipal — somente consulta neste painel.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-3">
        <div className="mb-3 shrink-0 rounded-xl border border-gray-100 bg-slate-50/60 px-2 py-2 sm:px-3">
          <PrefeituraContratoMonthlyChart
            rows={rows}
            animationKey={contract.id}
            monthlyPackageLabel={buildPrefeituraContratoPackageChartLabel(contract.info)}
          />
        </div>

        <PrefeituraConsultasKpiCards
          items={periodKpiCards}
          className="mb-2 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Mês</th>
                <th className="px-3 py-2 text-center">Contratadas</th>
                <th className="px-3 py-2 text-center">Realizadas</th>
                <th className="px-3 py-2 text-center">Uso</th>
                <th className="px-3 py-2 text-center">Avulsas</th>
                <th className="px-3 py-2 text-center">Situação</th>
                <th className="w-10 px-2 py-2" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {[...tableRows].reverse().map((row) => {
                const percent = computePrefeituraContratoMonthlyUsagePercent(row, contract.info)
                const usageBarClass =
                  percent >= 100
                    ? 'bg-red-500'
                    : percent >= 85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'

                return (
                  <tr
                    key={row.key}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver consultas de ${row.label}`}
                    onClick={() => monthDrawer.openDrawer(row, contract)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        monthDrawer.openDrawer(row, contract)
                      }
                    }}
                    className="group cursor-pointer border-b border-gray-100 last:border-0 hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand-primary)]"
                  >
                    <td className="px-3 py-1.5 font-semibold text-gray-900">{row.label}</td>
                    <td className="px-3 py-1.5 text-center tabular-nums text-gray-700">
                      {formatPrefeituraContratoMonthlyContracted(row, contract.info)}
                    </td>
                    <td className="px-3 py-1.5 text-center tabular-nums font-semibold text-gray-900">
                      {formatPrefeituraNumber(row.performed)}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="mx-auto inline-flex min-w-[4.5rem] flex-col items-center gap-0.5">
                        <span className="text-[11px] font-bold tabular-nums text-gray-700">
                          {formatUsagePercentLabel(percent)}
                        </span>
                        <PrefeituraPackageUsageBar
                          percent={percent}
                          barClassName={usageBarClass}
                          resetKey={`${contract.id}-${row.key}`}
                          trackClassName="h-1 w-full"
                          durationMs={700}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-center tabular-nums">
                      {row.avulsoCount > 0 ? (
                        <span className="font-semibold text-red-600">
                          {formatPrefeituraNumber(row.avulsoCount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <SituationStatusBadge
                        config={prefeituraContratoOutcomeBadge[row.outcome]}
                        widthClass="w-[5.75rem]"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <ChevronRight
                        className="ml-auto h-4 w-4 text-gray-300 transition group-hover:text-[var(--brand-primary)]"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          <div className="min-h-0 flex-1" aria-hidden />
        </div>
      </div>
    </article>
  )
}
