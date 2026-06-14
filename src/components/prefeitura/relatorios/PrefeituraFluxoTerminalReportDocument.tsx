import type { FluxoTerminalReportApi } from '../../../types/prefeituraRelatorios'

type Props = {
  report: FluxoTerminalReportApi
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
  arrivals: 'linear-gradient(to top, #ea580c, #fb923c)',
  completions: 'linear-gradient(to top, #059669, #34d399)',
  completionRate: 'linear-gradient(to top, #4f46e5, #818cf8)',
  triageTime: 'linear-gradient(to top, #0891b2, #22d3ee)',
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
  points: FluxoTerminalReportApi['evolution']['arrivalPoints']
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

export function PrefeituraFluxoTerminalReportDocument({
  report,
  brandName,
  logoUrl,
  generatedAtLabel,
}: Props) {
  const maxFunnel = Math.max(...report.funnel.map((stage) => stage.count), 1)

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
          <p className="text-xs font-medium text-gray-500">Chegadas no terminal</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.arrivals)}
          </p>
          <p
            className={[
              'mt-1 text-xs font-medium',
              report.summary.arrivalsDeltaPercent >= 0 ? 'text-emerald-600' : 'text-amber-600',
            ].join(' ')}
          >
            {signedPercent(report.summary.arrivalsDeltaPercent)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Taxa de conclusão da jornada</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatPercent(report.summary.completionRatePercent)}%
          </p>
          <p
            className={[
              'mt-1 text-xs font-medium',
              report.summary.completionDeltaPp >= 0 ? 'text-emerald-600' : 'text-amber-600',
            ].join(' ')}
          >
            {signedPp(report.summary.completionDeltaPp)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Tempo médio de triagem</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {report.summary.avgTriageMinutes > 0
              ? `${formatNumber(report.summary.avgTriageMinutes)} min`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-500">Da chegada até a chamada ou início do atendimento</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Jornada completa</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.completed)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {report.summary.avgJourneyMinutes > 0
              ? `${formatNumber(report.summary.avgJourneyMinutes)} min em média até a conclusão`
              : 'Consultas concluídas após o terminal'}
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
          Funil da jornada no terminal
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {report.funnel.map((stage) => {
            const widthPercent = Math.max(18, Math.round((stage.count / maxFunnel) * 100))
            return (
              <article key={stage.stage} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{stage.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                  {formatNumber(stage.count)}
                </p>
                <div className="mx-auto mt-3 h-2 max-w-[12rem] overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${widthPercent}%`,
                      background: `linear-gradient(to right, ${
                        stage.stage === 'chegada'
                          ? '#f97316, #fbbf24'
                          : stage.stage === 'triagem'
                            ? '#06b6d4, #38bdf8'
                            : stage.stage === 'encaminhamento'
                              ? '#6366f1, #60a5fa'
                              : '#10b981, #34d399'
                      })`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-gray-700">
                  {stage.stage === 'chegada'
                    ? 'Entrada no terminal'
                    : `${formatPercent(stage.conversionPercent)}% da etapa anterior`}
                </p>
                {stage.avgMinutes > 0 ? (
                  <p className="mt-1 text-xs text-gray-500">{formatNumber(stage.avgMinutes)} min em média</p>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Origem dos atendimentos
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {report.origins.map((origin) => (
            <article key={origin.origin} className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
              <p className="text-xs font-medium text-gray-500">{origin.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
                {formatNumber(origin.count)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatPercent(origin.completionRatePercent)}% concluíram a jornada
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução das chegadas
        </h2>
        <EvolutionChart
          points={report.evolution.arrivalPoints}
          mode={report.evolution.mode}
          title="Chegadas no terminal"
          barStyle={CHART_BAR_STYLES.arrivals}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução das conclusões
        </h2>
        <EvolutionChart
          points={report.evolution.completionPoints}
          mode={report.evolution.mode}
          title="Consultas concluídas"
          barStyle={CHART_BAR_STYLES.completions}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução da taxa de conclusão
        </h2>
        <EvolutionChart
          points={report.evolution.completionRatePoints}
          mode={report.evolution.mode}
          title="Taxa de conclusão da jornada"
          valueSuffix="%"
          barStyle={CHART_BAR_STYLES.completionRate}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução do tempo de triagem
        </h2>
        <EvolutionChart
          points={report.evolution.triageTimePoints}
          mode={report.evolution.mode}
          title="Tempo médio de triagem"
          valueSuffix=" min"
          barStyle={CHART_BAR_STYLES.triageTime}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Comparativo entre unidades
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[62rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Unidade</th>
                <th className={tableMetricCellClass}>Região</th>
                <th className={tableMetricCellClass}>Chegadas</th>
                <th className={tableMetricCellClass}>Triagem</th>
                <th className={tableMetricCellClass}>Encaminh.</th>
                <th className={tableMetricCellClass}>Concluídas</th>
                <th className={tableMetricCellClass}>Desistências</th>
                <th className={tableMetricCellClass}>Taxa conclusão</th>
                <th className={tableMetricCellClass}>Triagem média</th>
                <th className={tableMetricCellClass}>vs rede</th>
              </tr>
            </thead>
            <tbody>
              {report.units.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-gray-200 px-3 py-8 text-center text-sm text-gray-500">
                    Nenhum fluxo registrado no período selecionado.
                  </td>
                </tr>
              ) : (
                report.units.map((unit) => (
                  <tr key={unit.id} className="text-gray-800 even:bg-gray-50/60">
                    <td className="border border-gray-200 px-3 py-2.5 text-left font-semibold">{unit.name}</td>
                    <td className={tableMetricCellClass}>{unit.region}</td>
                    <td className={[tableMetricCellClass, 'font-bold tabular-nums'].join(' ')}>
                      {formatNumber(unit.arrivals)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.triaged)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.referred)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.completed)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {formatNumber(unit.abandoned)}
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums font-semibold'].join(' ')}>
                      {formatPercent(unit.completionRatePercent)}%
                    </td>
                    <td className={[tableMetricCellClass, 'tabular-nums'].join(' ')}>
                      {unit.avgTriageMinutes > 0 ? `${formatNumber(unit.avgTriageMinutes)} min` : '—'}
                    </td>
                    <td
                      className={[
                        tableMetricCellClass,
                        'tabular-nums font-medium',
                        unit.completionVsNetworkPp >= 0 ? 'text-emerald-700' : 'text-amber-700',
                      ].join(' ')}
                    >
                      {signedPp(unit.completionVsNetworkPp)}
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
          Jornada consolidada a partir da fila de espera do terminal, triagem presencial e consultas
          clínicas vinculadas nas UBTs da rede municipal.
        </p>
      </footer>
    </div>
  )
}
