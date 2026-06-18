import type { RankingUbtsReportApi } from '../../../types/prefeituraRelatorios'
import { EntidadeReportChartCaption } from './EntidadeReportChartCaption'

type Props = {
  report: RankingUbtsReportApi
  brandName: string
  logoUrl: string
  generatedAtLabel: string
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

function signedPp(value: number) {
  if (value === 0) return '0 p.p.'
  return `${value > 0 ? '+' : ''}${formatPercent(value)} p.p.`
}

const CHART_BAR_STYLES = {
  composite: 'linear-gradient(to top, #7c3aed, #a78bfa)',
  production: 'linear-gradient(to top, #0284c7, #38bdf8)',
  goals: 'linear-gradient(to top, #059669, #34d399)',
} as const

const HIGHLIGHT_TONE_CLASS = {
  red: 'border-rose-200 bg-rose-50/70 text-rose-800',
  green: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
  blue: 'border-sky-200 bg-sky-50/70 text-sky-900',
} as const

const SLA_STATUS_CLASS = {
  normal: 'text-emerald-700',
  atencao: 'text-amber-700',
  critico: 'text-rose-700',
} as const

const SLA_STATUS_LABEL = {
  normal: 'Normal',
  atencao: 'Atenção',
  critico: 'Crítico',
} as const

function EvolutionChart({
  points,
  mode,
  title,
  valueSuffix = '',
  barStyle,
}: {
  points: RankingUbtsReportApi['evolution']['compositePoints']
  mode: 'daily' | 'monthly'
  title: string
  valueSuffix?: string
  barStyle: (typeof CHART_BAR_STYLES)[keyof typeof CHART_BAR_STYLES]
}) {
  const hasData = points.some((point) => point.value > 0)
  const max = Math.max(...points.map((point) => point.value), 1)
  const chartHeightPx = 176
  const barAreaHeightPx = 120

  if (points.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Sem dados no período selecionado.
      </p>
    )
  }

  if (!hasData) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Nenhum registro de {title.toLowerCase()} no período selecionado.
      </p>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1.5" style={{ height: chartHeightPx }}>
        {points.map((point) => {
          const barHeightPx = Math.max(8, Math.round((point.value / max) * barAreaHeightPx))
          return (
            <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-gray-500">
                {point.value > 0 ? `${formatNumber(point.value)}${valueSuffix}` : ''}
              </span>
              <div
                className="w-full max-w-[2rem] rounded-t-lg"
                style={{ height: barHeightPx, background: barStyle }}
                title={`${point.label}: ${formatNumber(point.value)}${valueSuffix}`}
              />
              <span className="truncate text-[10px] font-medium text-gray-500">{point.label}</span>
            </div>
          )
        })}
      </div>
      <EntidadeReportChartCaption mode={mode} subject={`de ${title.toLowerCase()}`} />
    </div>
  )
}

function DimensionRankingTable({
  title,
  rows,
}: {
  title: string
  rows: RankingUbtsReportApi['rankings']['producao']
}) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white">
      <h3 className="border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-gray-600">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="border border-gray-200 px-2 py-2 text-center">#</th>
              <th className="border border-gray-200 px-2 py-2 text-left">Unidade</th>
              <th className="border border-gray-200 px-2 py-2 text-center">Valor</th>
              <th className="border border-gray-200 px-2 py-2 text-center">Var.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-gray-200 px-2 py-6 text-center text-gray-500">
                  Sem dados
                </td>
              </tr>
            ) : (
              rows.slice(0, 5).map((row) => (
                <tr key={`${title}-${row.unitId}`} className="text-gray-800 even:bg-gray-50/60">
                  <td className="border border-gray-200 px-2 py-2 text-center font-bold tabular-nums">
                    {row.position}
                  </td>
                  <td className="border border-gray-200 px-2 py-2 text-left">
                    <p className="truncate font-semibold">{row.unitName}</p>
                    <p className="truncate text-[10px] text-gray-500">{row.region}</p>
                  </td>
                  <td className="border border-gray-200 px-2 py-2 text-center font-semibold tabular-nums">
                    {row.valueLabel}
                  </td>
                  <td
                    className={[
                      'border border-gray-200 px-2 py-2 text-center tabular-nums font-medium',
                      row.variationPercent >= 0 ? 'text-emerald-700' : 'text-amber-700',
                    ].join(' ')}
                  >
                    {signedPercent(row.variationPercent)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export function PrefeituraRankingUbtsReportDocument({
  report,
  brandName,
  logoUrl,
  generatedAtLabel,
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
          <p className="text-xs font-medium text-gray-500">Unidades classificadas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.unitsCount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">UBTs ativas no recorte do relatório</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Produção total</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.totalProduction)}
          </p>
          <p
            className={[
              'mt-1 text-xs font-medium',
              report.summary.productionDeltaPercent >= 0 ? 'text-emerald-600' : 'text-amber-600',
            ].join(' ')}
          >
            {signedPercent(report.summary.productionDeltaPercent)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Cumprimento médio de metas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatPercent(report.summary.avgGoalFulfillmentPercent)}%
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatNumber(report.summary.unitsMeetingGoals)} unidades com metas ≥ 75%
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Líder do ranking</p>
          <p className="mt-1 truncate text-lg font-bold text-gray-900">
            {topUnit?.name ?? report.summary.topUnitName}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Score {formatPercent(topUnit?.compositeScore ?? report.summary.networkCompositeScore)} · rede{' '}
            {formatPercent(report.summary.networkCompositeScore)}
            {report.summary.compositeDeltaPp !== 0
              ? ` (${signedPp(report.summary.compositeDeltaPp)} vs anterior)`
              : ''}
          </p>
        </article>
      </section>

      {report.highlights.length > 0 ? (
        <section className="mt-8">
          <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
            Destaques do período
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {report.highlights.map((item) => (
              <article
                key={item.id}
                className={[
                  'rounded-xl border px-4 py-3 text-center',
                  HIGHLIGHT_TONE_CLASS[item.tone],
                ].join(' ')}
              >
                <p className="text-xs font-bold uppercase tracking-wide">{item.title}</p>
                <p className="mt-1 text-sm font-medium">{item.subtitle}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Metas da rede municipal
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Conclusão</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              ≥ {formatPercent(report.goals.completionRatePercent)}%
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Abandono</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              ≤ {formatPercent(report.goals.maxAbandonmentRatePercent)}%
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Espera média</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              ≤ {formatNumber(report.goals.maxWaitMinutes)} min
            </p>
          </article>
          <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Comparecimento</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              ≥ {formatPercent(report.goals.minAttendanceRatePercent)}%
            </p>
          </article>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução do score composto
        </h2>
        <EvolutionChart
          points={report.evolution.compositePoints}
          mode={report.evolution.mode}
          title="Score composto"
          barStyle={CHART_BAR_STYLES.composite}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução da produção
        </h2>
        <EvolutionChart
          points={report.evolution.productionPoints}
          mode={report.evolution.mode}
          title="Produção"
          barStyle={CHART_BAR_STYLES.production}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução do cumprimento de metas
        </h2>
        <EvolutionChart
          points={report.evolution.goalPoints}
          mode={report.evolution.mode}
          title="Cumprimento de metas"
          valueSuffix="%"
          barStyle={CHART_BAR_STYLES.goals}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Ranking geral das UBTs
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[68rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-center">Pos.</th>
                <th className="border border-gray-200 px-3 py-2.5 text-left">Unidade</th>
                <th className={tableMetricCellClass}>Região</th>
                <th className={tableMetricCellClass}>Produção</th>
                <th className={tableMetricCellClass}>Conclusão</th>
                <th className={tableMetricCellClass}>Abandono</th>
                <th className={tableMetricCellClass}>Espera</th>
                <th className={tableMetricCellClass}>Comparec.</th>
                <th className={tableMetricCellClass}>Nota</th>
                <th className={tableMetricCellClass}>Metas</th>
                <th className={tableMetricCellClass}>Score</th>
                <th className={tableMetricCellClass}>vs rede</th>
                <th className={tableMetricCellClass}>SLA</th>
              </tr>
            </thead>
            <tbody>
              {report.units.length === 0 ? (
                <tr>
                  <td colSpan={13} className="border border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
                    Nenhuma unidade classificada no período selecionado.
                  </td>
                </tr>
              ) : (
                report.units.map((unit) => {
                  const vsNetwork = unit.compositeScore - report.summary.networkCompositeScore
                  return (
                    <tr key={unit.id} className="text-gray-800 even:bg-gray-50/60">
                      <td className="border border-gray-200 px-3 py-2.5 text-center font-bold tabular-nums">
                        {unit.rank}
                      </td>
                      <td className="border border-gray-200 px-3 py-2.5 text-left font-semibold">{unit.name}</td>
                      <td className={tableMetricCellClass}>{unit.region}</td>
                      <td className={[tableMetricCellClass, 'font-bold tabular-nums'].join(' ')}>
                        {formatNumber(unit.production)}
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                        {formatPercent(unit.completionRatePercent)}%
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                        {formatPercent(unit.abandonmentRatePercent)}%
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                        {formatNumber(unit.avgWaitMinutes)} min
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                        {formatPercent(unit.attendanceRatePercent)}%
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                        {unit.avgRating > 0 ? formatPercent(unit.avgRating, 1) : '—'}
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums font-semibold'].join(' ')}>
                        {formatPercent(unit.goalFulfillmentPercent)}%
                      </td>
                      <td className={[tableMetricCellClass, 'tabular-nums font-bold'].join(' ')}>
                        {formatPercent(unit.compositeScore)}
                      </td>
                      <td
                        className={[
                          tableMetricCellClass,
                          'tabular-nums font-medium',
                          vsNetwork >= 0 ? 'text-emerald-700' : 'text-amber-700',
                        ].join(' ')}
                      >
                        {signedPp(vsNetwork)}
                      </td>
                      <td
                        className={[
                          tableMetricCellClass,
                          'font-semibold',
                          SLA_STATUS_CLASS[unit.slaStatus],
                        ].join(' ')}
                      >
                        {SLA_STATUS_LABEL[unit.slaStatus]}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Rankings por dimensão
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <DimensionRankingTable title="Produção" rows={report.rankings.producao} />
          <DimensionRankingTable title="Eficiência (conclusão)" rows={report.rankings.eficiencia} />
          <DimensionRankingTable title="Menor abandono" rows={report.rankings.abandono} />
          <DimensionRankingTable title="Cumprimento de metas" rows={report.rankings.metas} />
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
          Classificação consolidada a partir de produção, fila de espera, agenda, avaliações e metas
          operacionais da rede municipal.
        </p>
      </footer>
    </div>
  )
}
