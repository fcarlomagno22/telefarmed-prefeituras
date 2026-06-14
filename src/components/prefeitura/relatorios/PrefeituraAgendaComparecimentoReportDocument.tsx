import type { AgendaComparecimentoReportApi } from '../../../types/prefeituraRelatorios'

type Props = {
  report: AgendaComparecimentoReportApi
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
  attendance: 'linear-gradient(to top, #0284c7, #38bdf8)',
  noShows: 'linear-gradient(to top, #e11d48, #fb7185)',
  rescheduled: 'linear-gradient(to top, #7c3aed, #a78bfa)',
  volume: 'linear-gradient(to top, #ea580c, #fb923c)',
} as const

const HIGHLIGHT_TONE_CLASS = {
  red: 'border-rose-200 bg-rose-50/70 text-rose-800',
  green: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
  blue: 'border-sky-200 bg-sky-50/70 text-sky-900',
} as const

function EvolutionChart({
  points,
  mode,
  title,
  valueSuffix = '',
  barStyle,
}: {
  points: AgendaComparecimentoReportApi['evolution']['attendancePoints']
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
      <p className="mt-3 text-xs text-gray-500">
        Evolução {mode === 'monthly' ? 'mensal' : 'diária'} de {title.toLowerCase()} na rede municipal.
      </p>
    </div>
  )
}

export function PrefeituraAgendaComparecimentoReportDocument({
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
          <p className="text-xs font-medium text-gray-500">Agendamentos no período</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.scheduled)}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-600">
            {signedPercent(report.summary.scheduledDeltaPercent)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Comparecimentos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.attended)}
          </p>
          <p className="mt-1 text-xs text-gray-500">Presença confirmada ou em andamento</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Taxa de comparecimento</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatPercent(report.summary.attendanceRatePercent)}%
          </p>
          <p
            className={[
              'mt-1 text-xs font-medium',
              report.summary.attendanceDeltaPp >= 0 ? 'text-emerald-600' : 'text-amber-600',
            ].join(' ')}
          >
            {signedPp(report.summary.attendanceDeltaPp)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Melhor desempenho</p>
          <p className="mt-1 truncate text-lg font-bold text-gray-900">
            {topUnit?.name ?? '—'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {topUnit
              ? `${formatPercent(topUnit.attendanceRatePercent)}% comparecimento · ${formatNumber(topUnit.noShows)} faltas`
              : 'Sem dados'}
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
          Evolução da taxa de comparecimento
        </h2>
        <EvolutionChart
          points={report.evolution.attendancePoints}
          mode={report.evolution.mode}
          title="Taxa de comparecimento"
          valueSuffix="%"
          barStyle={CHART_BAR_STYLES.attendance}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução de faltas
        </h2>
        <EvolutionChart
          points={report.evolution.noShowPoints}
          mode={report.evolution.mode}
          title="Faltas"
          barStyle={CHART_BAR_STYLES.noShows}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução de remarcações e cancelamentos
        </h2>
        <EvolutionChart
          points={report.evolution.rescheduledPoints}
          mode={report.evolution.mode}
          title="Remarcações e cancelamentos"
          barStyle={CHART_BAR_STYLES.rescheduled}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Volume de agendamentos
        </h2>
        <EvolutionChart
          points={report.evolution.volumePoints}
          mode={report.evolution.mode}
          title="Volume de agendamentos"
          barStyle={CHART_BAR_STYLES.volume}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Comparativo entre unidades
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[58rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Unidade</th>
                <th className={tableMetricCellClass}>Região</th>
                <th className={tableMetricCellClass}>Agendados</th>
                <th className={tableMetricCellClass}>Compareceram</th>
                <th className={tableMetricCellClass}>Faltas</th>
                <th className={tableMetricCellClass}>Pendentes</th>
                <th className={tableMetricCellClass}>Remarcações</th>
                <th className={tableMetricCellClass}>Taxa comparec.</th>
                <th className={tableMetricCellClass}>vs rede</th>
              </tr>
            </thead>
            <tbody>
              {report.units.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
                    Nenhum agendamento registrado no período selecionado.
                  </td>
                </tr>
              ) : (
                report.units.map((unit) => (
                  <tr key={unit.id} className="text-gray-800 even:bg-gray-50/60">
                    <td className="border border-gray-200 px-3 py-2.5 text-left font-semibold">{unit.name}</td>
                    <td className={tableMetricCellClass}>{unit.region}</td>
                    <td className={[tableMetricCellClass, 'font-bold tabular-nums'].join(' ')}>
                      {formatNumber(unit.scheduled)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.attended)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.noShows)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.pending)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.rescheduled)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums font-semibold'].join(' ')}>
                      {formatPercent(unit.attendanceRatePercent)}%
                    </td>
                    <td
                      className={[
                        tableMetricCellClass,
                        'tabular-nums font-medium',
                        unit.attendanceVsNetworkPp >= 0 ? 'text-emerald-700' : 'text-amber-700',
                      ].join(' ')}
                    >
                      {signedPp(unit.attendanceVsNetworkPp)}
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
          Dados consolidados a partir das agendas das UBTs da rede municipal e dos status de
          comparecimento, falta, cancelamento ou remarcação.
        </p>
      </footer>
    </div>
  )
}
