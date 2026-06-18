import type { PrefeituraSlaStatus } from '../../../types/prefeituraDashboard'
import { EntidadeReportChartCaption } from './EntidadeReportChartCaption'
import type { ProducaoUnidadeReportApi } from '../../../types/prefeituraRelatorios'
import type { SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import { prefeituraSlaBadgeConfig } from '../prefeituraDashboardUi'

type Props = {
  report: ProducaoUnidadeReportApi
  brandName: string
  logoUrl: string
  generatedAtLabel: string
  slaBadgeConfig?: Record<PrefeituraSlaStatus, SituationStatusBadgeStyle>
}

function resolveSlaLabel(
  status: PrefeituraSlaStatus,
  slaBadgeConfig: Record<PrefeituraSlaStatus, SituationStatusBadgeStyle>,
) {
  return slaBadgeConfig[status]?.label ?? prefeituraSlaBadgeConfig.normal.label
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const tableMetricCellClass = 'border border-gray-200 px-3 py-2.5 text-center'

function formatPercent(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

function signedPercent(value: number) {
  if (value === 0) return '0%'
  return `${value > 0 ? '+' : ''}${formatPercent(value)}%`
}

function EvolutionChart({
  points,
  mode,
}: {
  points: ProducaoUnidadeReportApi['evolution']['points']
  mode: 'daily' | 'monthly'
}) {
  const max = Math.max(...points.map((point) => point.value), 1)
  const chartHeightPx = 176
  const barAreaHeightPx = 120

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1.5" style={{ height: chartHeightPx }}>
        {points.map((point) => {
          const barHeightPx = Math.max(8, Math.round((point.value / max) * barAreaHeightPx))
          return (
            <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-gray-500">
                {point.value > 0 ? formatNumber(point.value) : ''}
              </span>
              <div
                className="w-full max-w-[2rem] rounded-t-lg bg-gradient-to-t from-sky-600 to-sky-400"
                style={{ height: barHeightPx }}
                title={`${point.label}: ${formatNumber(point.value)} consultas`}
              />
              <span className="truncate text-[10px] font-medium text-gray-500">{point.label}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Evolução {mode === 'monthly' ? 'mensal' : 'diária'} do volume de consultas naRedePlaceholder.
      </p>
    </div>
  )
}

export function PrefeituraProducaoUnidadeReportDocument({
  report,
  brandName,
  logoUrl,
  generatedAtLabel,
  slaBadgeConfig = prefeituraSlaBadgeConfig,
}: Props) {
  const topUnit = report.units[0]

  return (
    <div className="p-6 sm:p-8">
      <div className="h-1 rounded-full bg-[var(--brand-primary)]" />

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Relatório operacional
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{report.description}</p>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>
              <span className="font-medium text-gray-700">{report.entidadeRazaoSocial}</span> ·{' '}
              {brandName}
            </p>
            <p>
              Período: <strong className="text-gray-800">{report.periodLabel}</strong>
            </p>
          </div>
        </div>
        <img src={logoUrl} alt={brandName} className="h-9 w-auto shrink-0 self-start" crossOrigin="anonymous" />
      </header>

      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Volume total no período</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.periodTotal)}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-600">
            {signedPercent(report.summary.volumeDeltaPercent)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Unidades com produção</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.unitsCount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">UBTs ativas no recorte</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Média por unidade</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.networkAvgVolume)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Consultas por UBT no período</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Maior produtora</p>
          <p className="mt-1 truncate text-lg font-bold text-gray-900">
            {topUnit?.name ?? '—'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {topUnit ? `${formatNumber(topUnit.volumeTotal)} consultas (${formatPercent(topUnit.sharePercent)}% da rede)` : 'Sem dados'}
          </p>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução do volume
        </h2>
        <EvolutionChart points={report.evolution.points} mode={report.evolution.mode} />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Comparativo entre unidades
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Unidade</th>
                <th className={tableMetricCellClass}>Região</th>
                <th className={tableMetricCellClass}>Volume</th>
                <th className={tableMetricCellClass}>% da rede</th>
                <th className={tableMetricCellClass}>vs média</th>
                <th className={tableMetricCellClass}>Concluídas</th>
                <th className={tableMetricCellClass}>Taxa conclusão</th>
                <th className={tableMetricCellClass}>Canceladas</th>
                <th className={tableMetricCellClass}>Duração média</th>
                <th className={tableMetricCellClass}>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.units.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
                    Nenhuma consulta registrada no período selecionado.
                  </td>
                </tr>
              ) : (
                report.units.map((unit) => (
                  <tr key={unit.id} className="text-gray-800 even:bg-gray-50/60">
                    <td className="border border-gray-200 px-3 py-2.5 text-left font-semibold">{unit.name}</td>
                    <td className={tableMetricCellClass}>{unit.region}</td>
                    <td className={[tableMetricCellClass, 'font-bold tabular-nums'].join(' ')}>
                      {formatNumber(unit.volumeTotal)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatPercent(unit.sharePercent)}%
                    </td>
                    <td
                      className={[
                        tableMetricCellClass,
                        'tabular-nums font-medium',
                        unit.volumeVsNetworkPercent >= 0 ? 'text-emerald-700' : 'text-amber-700',
                      ].join(' ')}
                    >
                      {signedPercent(unit.volumeVsNetworkPercent)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.completed)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatPercent(unit.completionRate)}%
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.cancelled)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {unit.avgDurationMin > 0 ? `${unit.avgDurationMin} min` : '—'}
                    </td>
                    <td className={tableMetricCellClass}>
                      {resolveSlaLabel(unit.status, slaBadgeConfig)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Indicadores do período
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.summary.kpis.map((kpi) => (
            <article key={kpi.label} className="rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{kpi.value}</p>
              <p className="mt-1 text-xs text-gray-500">{kpi.footer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-8 border-t border-gray-200 pt-4 text-center text-[11px] text-gray-500">
        <p>
          Relatório gerado em <strong className="text-gray-700">{generatedAtLabel}</strong> por{' '}
          <strong className="text-gray-700">{report.generatedBy}</strong>
        </p>
        <p className="mt-1 text-gray-400">
          Dados consolidados a partir das consultas operacionais registradas nas UBTs da rede
          municipal.
        </p>
      </footer>
    </div>
  )
}
