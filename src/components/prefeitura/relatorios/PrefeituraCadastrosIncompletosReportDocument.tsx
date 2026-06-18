import type { CadastrosIncompletosReportApi } from '../../../types/prefeituraRelatorios'
import { EntidadeReportChartCaption } from './EntidadeReportChartCaption'

type Props = {
  report: CadastrosIncompletosReportApi
  brandName: string
  logoUrl: string
  generatedAtLabel: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}
function formatPercent(value: number, fractionDigits = 1) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}
const HIGHLIGHT_TONE_CLASS = {
  red: 'border-rose-200 bg-rose-50/70 text-rose-800',
  green: 'border-emerald-200 bg-emerald-50/70 text-emerald-800',
  amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
  blue: 'border-sky-200 bg-sky-50/70 text-sky-900',
} as const
const tableMetricCellClass = 'border border-gray-200 px-3 py-2.5 text-center'

function EvolutionChart({
  points,
  mode,
}: {
  points?: Array<{ date?: string; label: string; value: number }>
  mode: 'daily' | 'monthly'
}) {
  const safePoints = points ?? []
  const max = Math.max(...safePoints.map((p) => p.value), 1)
  if (safePoints.length === 0) return null
  return (
    <div className="mt-4">
      <div className="flex items-end gap-1.5" style={{ height: 176 }}>
        {safePoints.map((point) => {
          const barHeight = Math.max(8, Math.round((point.value / max) * 120))
          return (
            <div key={point.date ?? point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold tabular-nums text-gray-500">
                {point.value > 0 ? formatNumber(point.value) : ''}
              </span>
              <div
                className="w-full max-w-[2rem] rounded-t-lg"
                style={{ height: barHeight, background: 'linear-gradient(to top, #dc2626, #f87171)' }}
              />
              <span className="truncate text-[10px] font-medium text-gray-500">{point.label}</span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Evolução {mode === 'monthly' ? 'mensal' : 'diária'} de cadastros incompletos naRedePlaceholder.
      </p>
    </div>
  )
}

export function PrefeituraCadastrosIncompletosReportDocument({
  report,
  brandName,
  logoUrl,
  generatedAtLabel,
}: Props) {
  return (
    <div className="p-6 sm:p-8">
      <div className="h-1 rounded-full bg-[var(--brand-primary)]" />
      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Relatório operacional</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">{report.description}</p>
          <div className="mt-3 space-y-1 text-xs text-gray-500">
            <p>
              <span className="font-medium text-gray-700">{report.entidadeRazaoSocial}</span> · {brandName}
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
          <p className="text-xs font-medium text-gray-500">Cadastros incompletos</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
            {formatNumber(report.summary.incompleteCount)}
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Taxa de incompletude</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700">
            {formatPercent(report.summary.incompleteRatePercent)}%
          </p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Pacientes totais</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{formatNumber(report.summary.totalPatients)}</p>
        </article>
        <article className="rounded-xl border border-gray-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-medium text-gray-500">Unidades impactadas</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{report.summary.unitsCount}</p>
        </article>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">Destaques do período</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {report.highlights.map((item) => (
            <article key={item.id} className={['rounded-xl border px-4 py-3 text-center', HIGHLIGHT_TONE_CLASS[item.tone]].join(' ')}>
              <p className="text-xs font-bold uppercase tracking-wide">{item.title}</p>
              <p className="mt-1 text-sm font-medium">{item.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">Campos com maior pendência</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Campo</th>
                <th className={tableMetricCellClass}>Ocorrências</th>
                <th className={tableMetricCellClass}>Participação</th>
              </tr>
            </thead>
            <tbody>
              {report.fields.map((row) => (
                <tr key={row.key} className="text-gray-800 even:bg-gray-50/60">
                  <td className="border border-gray-200 px-3 py-2.5 font-semibold">{row.label}</td>
                  <td className={tableMetricCellClass}>{formatNumber(row.count)}</td>
                  <td className={tableMetricCellClass}>{formatPercent(row.sharePercent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">Unidades com cadastros pendentes</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Unidade</th>
                <th className={tableMetricCellClass}>Região</th>
                <th className={tableMetricCellClass}>Pendências</th>
                <th className={tableMetricCellClass}>Participação</th>
              </tr>
            </thead>
            <tbody>
              {report.units.map((row) => (
                <tr key={row.id} className="text-gray-800 even:bg-gray-50/60">
                  <td className="border border-gray-200 px-3 py-2.5 font-semibold">{row.name}</td>
                  <td className={tableMetricCellClass}>{row.region}</td>
                  <td className={tableMetricCellClass}>{formatNumber(row.count)}</td>
                  <td className={tableMetricCellClass}>{formatPercent(row.sharePercent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">Amostra de pacientes com pendência</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="border border-gray-200 px-3 py-2.5 text-left">Paciente</th>
                <th className={tableMetricCellClass}>Unidade</th>
                <th className={tableMetricCellClass}>Campos faltantes</th>
                <th className={tableMetricCellClass}>Qtde</th>
              </tr>
            </thead>
            <tbody>
              {report.samples.map((row) => (
                <tr key={row.id} className="text-gray-800 even:bg-gray-50/60">
                  <td className="border border-gray-200 px-3 py-2.5 font-semibold">{row.name}</td>
                  <td className={tableMetricCellClass}>{row.unitName}</td>
                  <td className={tableMetricCellClass}>{row.missingFields.join(', ')}</td>
                  <td className={tableMetricCellClass}>{row.missingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">Evolução das pendências</h2>
        <EvolutionChart points={report.evolution.incompletePoints} mode={report.evolution.mode} />
      </section>

      <section className="mt-8">
        <h2 className="border-b-2 border-[var(--brand-primary)] pb-2 text-sm font-bold text-gray-900">Indicadores do período</h2>
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
        <p className="mt-1 text-gray-400">{report.description}</p>
      </footer>
    </div>
  )
}
