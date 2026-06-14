import { BarChart3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { parseCompetenceKey } from '../../../utils/profissional/profissionalCompetence'
import { profissionalFinanceiroPanelClass } from './profissionalFinanceiroUi'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

type MonthForecastRow = {
  key: string
  monthLabel: string
  realizados: number
  previstos: number
  total: number
}

type ForecastInputRow = {
  key: string
  realizados: number
  previstos: number
  total: number
}

function formatMonthShortLabel(competenceKey: string): string {
  const { year, month } = parseCompetenceKey(competenceKey)
  const date = new Date(year, month - 1, 1)
  const monthPart = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
  const capitalized = monthPart.charAt(0).toUpperCase() + monthPart.slice(1)
  return `${capitalized}/${String(year).slice(-2)}`
}

function useChartFillAnimation(delayMs = 60) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])
  return animate
}

type ProfissionalFinanceiroForecastSectionProps = {
  rows: ForecastInputRow[]
}

export function ProfissionalFinanceiroForecastSection({
  rows: inputRows,
}: ProfissionalFinanceiroForecastSectionProps) {
  const animate = useChartFillAnimation(80)

  const rows = useMemo((): MonthForecastRow[] => {
    return [...inputRows]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((row) => ({
        key: row.key,
        monthLabel: formatMonthShortLabel(row.key),
        realizados: row.realizados,
        previstos: row.previstos,
        total: row.total,
      }))
  }, [inputRows])

  const periodTotal = rows.reduce((sum, row) => sum + row.total, 0)
  const periodRealized = rows.reduce((sum, row) => sum + row.realizados, 0)

  return (
    <section
      data-tour="financeiro-forecast"
      className={[profissionalFinanceiroPanelClass, 'overflow-hidden p-4 sm:p-5'].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
              <BarChart3 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            <h3 className="text-sm font-bold text-gray-900">Previsão por mês</h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Repasses por competência com base em consultas concluídas.
          </p>
        </div>
        <dl className="shrink-0 text-right">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            No período
          </dt>
          <dd className="text-base font-bold tabular-nums text-gray-900">
            {formatProfissionalCurrency(periodTotal)}
          </dd>
          <dd className="text-[11px] text-emerald-700">
            {formatProfissionalCurrency(periodRealized)} realizados
          </dd>
        </dl>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-gray-500">Nenhuma competência com repasse ainda.</p>
      ) : (
        <ul className="mt-4 space-y-2.5" aria-label="Previsão por competência">
          {rows.map((row, index) => (
            <MonthForecastBarRow
              key={row.key}
              row={row}
              animate={animate}
              animationDelay={`${index * 0.1}s`}
            />
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-gray-100 pt-3 text-[11px] font-medium text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm"
            aria-hidden
          />
          Realizados
        </span>
        <span className="inline-flex items-center gap-2">
          <span
            className="h-2 w-6 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 opacity-80"
            aria-hidden
          />
          Previstos
        </span>
      </div>
    </section>
  )
}

function MonthForecastBarRow({
  row,
  animate,
  animationDelay,
}: {
  row: MonthForecastRow
  animate: boolean
  animationDelay: string
}) {
  const realizadosPct = row.total > 0 ? (row.realizados / row.total) * 100 : 0
  const previstosPct = row.total > 0 ? (row.previstos / row.total) * 100 : 0
  const hasPrevistos = row.previstos > 0

  return (
    <li>
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50/90 to-white p-3 shadow-sm ring-1 ring-gray-100/80">
        <div className="mb-2.5 flex items-baseline justify-between gap-2">
          <span className="text-xs font-bold text-gray-900">{row.monthLabel}</span>
          <span className="text-sm font-bold tabular-nums text-gray-900">
            {formatProfissionalCurrency(row.total)}
          </span>
        </div>

        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200/70 shadow-inner"
          role="img"
          aria-label={`${row.monthLabel}: ${formatProfissionalCurrency(row.realizados)} realizados${
            hasPrevistos ? `, ${formatProfissionalCurrency(row.previstos)} previstos` : ''
          }`}
        >
          <span
            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-500"
            style={{
              width: animate ? `${realizadosPct}%` : '0%',
              transition: `width 0.85s ${CHART_EASE} ${animationDelay}`,
            }}
          />
          {hasPrevistos ? (
            <span
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400"
              style={{
                width: animate ? `${previstosPct}%` : '0%',
                transition: `width 0.85s ${CHART_EASE} ${animationDelay}`,
              }}
            />
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[10px]">
          <span className="font-semibold text-emerald-700">
            {formatProfissionalCurrency(row.realizados)}
            <span className="font-medium text-emerald-600/80"> · realizado</span>
          </span>
          {hasPrevistos ? (
            <span className="font-medium text-sky-700">
              +{formatProfissionalCurrency(row.previstos)}{' '}
              <span className="text-sky-600/80">previsto</span>
            </span>
          ) : (
            <span className="text-gray-400">Competência fechada</span>
          )}
        </div>
      </div>
    </li>
  )
}
