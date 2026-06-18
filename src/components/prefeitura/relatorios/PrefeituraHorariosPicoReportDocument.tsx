import type { HorariosPicoReportApi } from '../../../types/prefeituraRelatorios'
import { EntidadeReportChartCaption } from './EntidadeReportChartCaption'

type Props = {
  report: HorariosPicoReportApi
  brandName: string
  logoUrl: string
  generatedAtLabel: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const tableMetricCellClass = 'border border-gray-200 px-3 py-2.5 text-center'

function signedPercent(value: number) {
  if (value === 0) return '0%'
  return `${value > 0 ? '+' : ''}${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`
}

const CHART_BAR_STYLES = {
  volume: 'linear-gradient(to top, #ea580c, #fb923c)',
  hourly: 'linear-gradient(to top, #0891b2, #22d3ee)',
  weekday: 'linear-gradient(to top, #4f46e5, #818cf8)',
} as const

const HIGHLIGHT_TONE_CLASS = {
  red: 'border-rose-200 bg-rose-50/70 text-rose-800',
  green: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
  blue: 'border-sky-200 bg-sky-50/70 text-sky-900',
} as const

function DistributionChart({
  items,
  labelKey,
  valueKey,
  title,
  barStyle,
}: {
  items: Array<Record<string, string | number>>
  labelKey: string
  valueKey: string
  title: string
  barStyle: string
}) {
  const max = Math.max(...items.map((item) => Number(item[valueKey])), 1)
  const chartHeightPx = 176
  const barAreaHeightPx = 120

  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        Sem dados no período selecionado.
      </p>
    )
  }

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1.5" style={{ height: chartHeightPx }}>
        {items.map((item, index) => {
          const value = Number(item[valueKey])
          const barHeightPx = Math.max(8, Math.round((value / max) * barAreaHeightPx))
          return (
            <div key={`${item[labelKey]}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-gray-500">
                {value > 0 ? formatNumber(value) : ''}
              </span>
              <div
                className="w-full max-w-[2rem] rounded-t-lg"
                style={{ height: barHeightPx, background: barStyle }}
                title={`${item[labelKey]}: ${formatNumber(value)}`}
              />
              <span className="truncate text-[10px] font-medium text-gray-500">
                {String(item[labelKey])}
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">{title}</p>
    </div>
  )
}

function EvolutionChart({
  points,
  mode,
  barStyle,
}: {
  points: HorariosPicoReportApi['evolution']['volumePoints']
  mode: 'daily' | 'monthly'
  barStyle: string
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
                className="w-full max-w-[2rem] rounded-t-lg"
                style={{ height: barHeightPx, background: barStyle }}
              />
              <span className="truncate text-[10px] font-medium text-gray-500">{point.label}</span>
            </div>
          )
        })}
      </div>
      <EntidadeReportChartCaption mode={mode} subject="do volume total" />
    </div>
  )
}

export function PrefeituraHorariosPicoReportDocument({
  report,
  brandName,
  logoUrl,
  generatedAtLabel,
}: Props) {
  const hourlyItems = report.hourly.map((row) => ({
    hour: row.hour,
    totalCount: row.totalCount,
  }))
  const weekdayItems = report.weekday.map((row) => ({
    label: row.label,
    totalCount: row.totalCount,
  }))

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
          <p className="text-xs font-medium text-gray-500">Pico horário</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{report.summary.peakHour}</p>
          <p className="mt-1 text-xs text-gray-500">
            {formatNumber(report.summary.peakHourVolume)} registros
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Pico semanal</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {report.summary.peakWeekday}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatNumber(report.summary.peakDayVolume)} registros
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Volume total</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.totalVolume)}
          </p>
          <p className="mt-1 text-xs font-medium text-emerald-600">
            {signedPercent(report.summary.volumeDeltaPercent)} vs período anterior
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Unidades</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.unitsCount)}
          </p>
          <p className="mt-1 text-xs text-gray-500">UBTs no recorte do relatório</p>
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
          Distribuição por horário
        </h2>
        <DistributionChart
          items={hourlyItems}
          labelKey="hour"
          valueKey="totalCount"
          title="Volume combinado de agenda e fila por faixa horária."
          barStyle={CHART_BAR_STYLES.hourly}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Distribuição por dia da semana
        </h2>
        <DistributionChart
          items={weekdayItems}
          labelKey="label"
          valueKey="totalCount"
          title="Volume combinado de agenda e fila por dia da semana."
          barStyle={CHART_BAR_STYLES.weekday}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Evolução do volume total
        </h2>
        <EvolutionChart
          points={report.evolution.volumePoints}
          mode={report.evolution.mode}
          barStyle={CHART_BAR_STYLES.volume}
        />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">
          Picos por unidade
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Unidade</th>
                <th className={tableMetricCellClass}>Região</th>
                <th className={tableMetricCellClass}>Pico horário</th>
                <th className={tableMetricCellClass}>Pico semanal</th>
                <th className={tableMetricCellClass}>Volume no pico</th>
                <th className={tableMetricCellClass}>Pico fila</th>
                <th className={tableMetricCellClass}>Pico agenda</th>
              </tr>
            </thead>
            <tbody>
              {report.units.map((unit) => (
                <tr key={unit.id} className="text-gray-800 even:bg-gray-50/60">
                  <td className="border border-gray-200 px-3 py-2.5 text-left font-semibold">{unit.name}</td>
                  <td className={tableMetricCellClass}>{unit.region}</td>
                  <td className={[tableMetricCellClass, 'font-semibold'].join(' ')}>{unit.peakHour}</td>
                  <td className={[tableMetricCellClass, 'font-semibold'].join(' ')}>{unit.peakWeekday}</td>
                  <td className={[tableMetricCellClass, 'tabular-nums font-bold'].join(' ')}>
                    {formatNumber(unit.peakVolume)}
                  </td>
                  <td className={tableMetricCellClass}>{unit.filaPeakHour}</td>
                  <td className={tableMetricCellClass}>{unit.agendaPeakHour}</td>
                </tr>
              ))}
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
          Picos consolidados a partir dos registros de agenda e fila de espera nas UBTs da rede
          municipal.
        </p>
      </footer>
    </div>
  )
}
