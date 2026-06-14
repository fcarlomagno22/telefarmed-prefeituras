import { BarChart3, FileText, Stethoscope, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProfissionalAtendimentosStats } from '../../../utils/profissional/computeProfissionalAtendimentosStats'
import { computeProfissionalAtendimentosStats } from '../../../utils/profissional/computeProfissionalAtendimentosStats'
import type { ProfissionalAttendanceRecord } from '../../../types/profissionalAtendimentos'
import { profissionalAtendimentosPanelClass } from './profissionalAtendimentosUi'
import { ChartTooltipPortal, useChartTooltip } from './profissionalChartTooltip'
import { ProfissionalAtendimentosChartsSidebarSkeleton } from './ProfissionalAtendimentosChartsSidebarSkeleton'
import { shouldShowPortalPageLoadingBlock } from '../../../utils/portal/portalPageLoading'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DONUT_RADIUS = 40
const DONUT_STROKE = 12
const LINE_HEIGHT = 88
const VERTICAL_CHART_HEIGHT_PX = 112

const WEEKDAY_FULL_NAMES: Record<string, string> = {
  Dom: 'Domingo',
  Seg: 'Segunda-feira',
  Ter: 'Terça-feira',
  Qua: 'Quarta-feira',
  Qui: 'Quinta-feira',
  Sex: 'Sexta-feira',
  Sáb: 'Sábado',
}

function useChartFillAnimation(delayMs = 60) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])
  return animate
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function attendanceWord(count: number) {
  return count === 1 ? 'atendimento' : 'atendimentos'
}

function patientWord(count: number) {
  return count === 1 ? 'paciente' : 'pacientes'
}

type ProfissionalAtendimentosChartsSidebarProps = {
  records: ProfissionalAttendanceRecord[]
  isLoading?: boolean
}

export function ProfissionalAtendimentosChartsSidebar({
  records,
  isLoading = false,
}: ProfissionalAtendimentosChartsSidebarProps) {
  const showLoadingBlock = shouldShowPortalPageLoadingBlock(isLoading, records.length > 0)

  if (showLoadingBlock) {
    return <ProfissionalAtendimentosChartsSidebarSkeleton />
  }

  const stats = computeProfissionalAtendimentosStats(records)

  return (
    <aside data-tour="atendimentos-charts-sidebar" className="flex h-full min-h-0 w-full flex-col gap-4">
      <HeroSummaryCard stats={stats} />
      <WeeklyTrendCard stats={stats} />
      <DocumentsDonutCard stats={stats} />
      <SpecialtyBarsCard stats={stats} />
      <AgeBandsCard stats={stats} />
      <WeekdayBarsCard stats={stats} />
    </aside>
  )
}

function HeroSummaryCard({ stats }: { stats: ProfissionalAtendimentosStats }) {
  const miniStats = [
    { label: 'Concluídos', value: stats.completed, tone: 'emerald' as const },
    { label: 'Interrompidos', value: stats.interrupted, tone: 'amber' as const },
    {
      label: 'Tempo médio',
      value: stats.averageDurationMin > 0 ? `${stats.averageDurationMin} min` : '—',
      tone: 'sky' as const,
    },
  ]

  return (
    <section
      data-tour="atendimentos-summary-card"
      className={[
        profissionalAtendimentosPanelClass,
        'flex shrink-0 flex-col overflow-hidden bg-gradient-to-br from-[var(--brand-primary-light)]/55 via-white to-white p-5',
      ].join(' ')}
    >
      <div className="flex shrink-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-orange-100">
          <Stethoscope className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Consolidado do período
          </p>
          <p className="mt-0.5 text-3xl font-bold tabular-nums text-gray-900">
            {formatNumber(stats.total)}
            <span className="ml-1.5 text-sm font-semibold text-gray-500">atendimentos</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex h-[12.5rem] flex-col gap-1.5">
        {miniStats.map((item) => (
          <MiniStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
        <DocsMiniStatRow sent={stats.documentsIssued} received={stats.patientUploads} />
      </div>
    </section>
  )
}

const miniStatToneStyles = {
  emerald: {
    ring: 'ring-emerald-100/90',
    accent: 'border-l-emerald-500',
    value: 'text-emerald-900',
  },
  amber: {
    ring: 'ring-amber-100/90',
    accent: 'border-l-amber-500',
    value: 'text-amber-900',
  },
  sky: {
    ring: 'ring-sky-100/90',
    accent: 'border-l-sky-500',
    value: 'text-sky-900',
  },
  orange: {
    ring: 'ring-orange-100/90',
    accent: 'border-l-[var(--brand-primary)]',
    value: 'text-gray-900',
  },
} as const

function DocsMiniStatRow({ sent, received }: { sent: number; received: number }) {
  return (
    <div className="flex min-h-0 flex-1 items-center rounded-xl border-l-[3px] border-l-gray-400 bg-white/90 px-3 py-0 ring-1 ring-gray-200/90">
      <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1 text-sm leading-snug text-gray-600">
        <span>
          <span className="text-xl font-bold tabular-nums text-gray-900">{formatNumber(sent)}</span>{' '}
          <span className="font-medium">docs enviados</span>
        </span>
        <span>
          <span className="text-xl font-bold tabular-nums text-gray-900">{formatNumber(received)}</span>{' '}
          <span className="font-medium">docs recebidos</span>
        </span>
      </p>
    </div>
  )
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: number | string
  tone: keyof typeof miniStatToneStyles
}) {
  const styles = miniStatToneStyles[tone]

  return (
    <div
      className={[
        'flex min-h-0 flex-1 items-center rounded-xl border-l-[3px] bg-white/90 px-3 py-0 ring-1',
        styles.accent,
        styles.ring,
      ].join(' ')}
    >
      <p className="flex min-w-0 items-baseline gap-2">
        <span className={['text-xl font-bold leading-none tabular-nums', styles.value].join(' ')}>
          {value}
        </span>
        <span className="truncate text-xs font-medium leading-none text-gray-500">{label}</span>
      </p>
    </div>
  )
}

type VerticalBarProps = {
  label: string
  count: number
  maxCount: number
  animate: boolean
  animationDelay: string
  barClassName: string
  tooltipTitle: string
  tooltipDescription: string
}

function ChartVerticalBar({
  label,
  count,
  maxCount,
  animate,
  animationDelay,
  barClassName,
  tooltipTitle,
  tooltipDescription,
}: VerticalBarProps) {
  const { tooltip, bind } = useChartTooltip()
  const plotHeight = VERTICAL_CHART_HEIGHT_PX - 22
  const barHeight =
    maxCount > 0
      ? Math.max(count > 0 ? 8 : 3, (count / maxCount) * plotHeight)
      : 3

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col items-stretch">
        <div
          className="flex items-end justify-center"
          style={{ height: VERTICAL_CHART_HEIGHT_PX - 18 }}
        >
          <button
            type="button"
            className={[
              'w-full min-w-0 max-w-9 rounded-t-md outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40 focus-visible:ring-offset-1',
              barClassName,
            ].join(' ')}
            style={{
              height: animate ? barHeight : 3,
              transition: `height 0.85s ${CHART_EASE} ${animationDelay}`,
            }}
            aria-label={`${tooltipTitle}: ${count}`}
            {...bind(tooltipTitle, tooltipDescription)}
          />
        </div>
        <span className="mt-1.5 truncate text-center text-[9px] font-semibold text-gray-500">
          {label}
        </span>
      </div>
      <ChartTooltipPortal tooltip={tooltip} />
    </>
  )
}

function WeeklyTrendCard({ stats }: { stats: ProfissionalAtendimentosStats }) {
  const animate = useChartFillAnimation(80)
  const { tooltip, show, hide } = useChartTooltip()
  const maxCount = Math.max(...stats.weeklyTrend.map((p) => p.count), 1)
  const width = 280
  const height = LINE_HEIGHT
  const paddingX = 10
  const paddingY = 10
  const innerW = width - paddingX * 2
  const innerH = height - paddingY * 2

  const points = stats.weeklyTrend.map((point, index) => {
    const x = paddingX + (index / Math.max(stats.weeklyTrend.length - 1, 1)) * innerW
    const y = paddingY + innerH - (point.count / maxCount) * innerH
    return { x, y, ...point }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : ''

  const monthTotal = stats.weeklyTrend.reduce((sum, p) => sum + p.count, 0)

  return (
    <section
      data-tour="atendimentos-weekly-trend"
      className={[profissionalAtendimentosPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Atendimentos por semana</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">
        Passe o mouse nos pontos para ver cada semana
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-gray-900">{formatNumber(monthTotal)}</span>
        <span className="text-xs text-gray-500">nas últimas 4 semanas</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full overflow-visible">
        <defs>
          <linearGradient id="prof-att-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath ? (
          <path
            d={areaPath}
            fill="url(#prof-att-trend-fill)"
            style={{
              opacity: animate ? 1 : 0,
              transition: `opacity 0.8s ${CHART_EASE}`,
            }}
          />
        ) : null}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: animate ? 'none' : '0 1000',
              transition: `stroke-dasharray 1.1s ${CHART_EASE}`,
            }}
          />
        ) : null}
        {points.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="10"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(event) =>
                show(
                  event.currentTarget,
                  `Semana de ${point.label}`,
                  `${formatNumber(point.count)} ${attendanceWord(point.count)} realizados nessa semana, considerando o período e filtros da lista.`,
                )
              }
              onMouseLeave={hide}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke="var(--brand-primary)"
              strokeWidth="2"
              pointerEvents="none"
              style={{
                opacity: animate ? 1 : 0,
                transition: `opacity 0.5s ${CHART_EASE}`,
              }}
            />
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between gap-1 text-[10px] font-medium text-gray-400">
        {stats.weeklyTrend.map((point) => (
          <span key={point.label} className="min-w-0 truncate text-center">
            {point.label}
          </span>
        ))}
      </div>
      <ChartTooltipPortal tooltip={tooltip} />
    </section>
  )
}

function DocumentsDonutCard({ stats }: { stats: ProfissionalAtendimentosStats }) {
  const animate = useChartFillAnimation(120)
  const { tooltip, show, hide, bind } = useChartTooltip()
  const slices = stats.documentsFlow
  const circumference = 2 * Math.PI * DONUT_RADIUS
  let rotation = -90

  if (slices.length === 0) {
    return (
      <section className={[profissionalAtendimentosPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}>
        <h3 className="text-sm font-bold text-gray-900">Arquivos</h3>
        <p className="mt-4 text-center text-xs text-gray-500">Nenhum arquivo no período.</p>
      </section>
    )
  }

  return (
    <section
      data-tour="atendimentos-docs-donut"
      className={[profissionalAtendimentosPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Enviados e recebidos</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">Passe o mouse nas fatias ou na legenda</p>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-[6.5rem] shrink-0">
          <svg className="size-full" viewBox="0 0 100 100" aria-hidden>
            <defs>
              {slices.map((slice, index) => (
                <linearGradient
                  key={slice.key}
                  id={`prof-doc-gradient-${index}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={slice.gradientFrom} />
                  <stop offset="100%" stopColor={slice.gradientTo} />
                </linearGradient>
              ))}
            </defs>
            <circle
              cx="50"
              cy="50"
              r={DONUT_RADIUS}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth={DONUT_STROKE}
            />
            {slices.map((slice, index) => {
              const length = (slice.percent / 100) * circumference
              const currentRotation = rotation
              rotation += (slice.percent / 100) * 360
              const title = slice.label
              const description =
                slice.key === 'sent'
                  ? `${formatNumber(slice.count)} arquivo${slice.count === 1 ? '' : 's'} que você enviou ao paciente (${slice.percent}% do total de arquivos no período).`
                  : `${formatNumber(slice.count)} arquivo${slice.count === 1 ? '' : 's'} que o paciente enviou a você (${slice.percent}% do total no período).`

              return (
                <circle
                  key={slice.key}
                  cx="50"
                  cy="50"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={`url(#prof-doc-gradient-${index})`}
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={
                    animate ? `${length} ${circumference - length}` : `0 ${circumference}`
                  }
                  transform={`rotate(${currentRotation} 50 50)`}
                  className="cursor-pointer"
                  style={{
                    transition: `stroke-dasharray 1s ${CHART_EASE} ${index * 0.15}s`,
                  }}
                  onMouseEnter={(event) => show(event.currentTarget, title, description)}
                  onMouseLeave={hide}
                />
              )
            })}
          </svg>
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-gray-900">
              {formatNumber(stats.documentsIssued + stats.patientUploads)}
            </span>
            <span className="text-[9px] font-medium text-gray-500">arquivos</span>
          </span>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {slices.map((slice, index) => (
            <li key={slice.key}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left text-xs transition hover:bg-gray-50"
                {...bind(
                  slice.label,
                  slice.key === 'sent'
                    ? `${formatNumber(slice.count)} arquivo${slice.count === 1 ? '' : 's'} enviados por você no período filtrado.`
                    : `${formatNumber(slice.count)} arquivo${slice.count === 1 ? '' : 's'} recebidos do paciente no período filtrado.`,
                )}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${slice.gradientFrom}, ${slice.gradientTo})`,
                  }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-gray-600">{slice.label}</span>
                <span
                  className="shrink-0 font-semibold tabular-nums text-gray-900"
                  style={{
                    opacity: animate ? 1 : 0,
                    transition: `opacity 0.5s ${CHART_EASE} ${0.3 + index * 0.1}s`,
                  }}
                >
                  {slice.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ChartTooltipPortal tooltip={tooltip} />
    </section>
  )
}

function SpecialtyBarsCard({ stats }: { stats: ProfissionalAtendimentosStats }) {
  const animate = useChartFillAnimation(160)
  const { tooltip, bind } = useChartTooltip()
  const max = Math.max(...stats.specialtyBars.map((b) => b.count), 1)

  return (
    <section
      data-tour="atendimentos-specialty-bars"
      className={[profissionalAtendimentosPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Por especialidade</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">Passe o mouse nas barras</p>
      <ul className="mt-4 space-y-3">
        {stats.specialtyBars.map((bar, index) => (
          <li key={bar.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{bar.label}</span>
              <span className="font-bold tabular-nums text-gray-900">{bar.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <button
                type="button"
                className="block h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-300 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40"
                style={{
                  width: animate ? `${(bar.count / max) * 100}%` : '0%',
                  minWidth: bar.count > 0 ? '0.5rem' : 0,
                  transition: `width 0.9s ${CHART_EASE} ${index * 0.08}s`,
                }}
                aria-label={`${bar.label}: ${bar.count} atendimentos`}
                {...bind(
                  bar.label,
                  `${formatNumber(bar.count)} ${attendanceWord(bar.count)} registrados em ${bar.label}, dentro do período e filtros aplicados na lista.`,
                )}
              />
            </div>
          </li>
        ))}
      </ul>
      <ChartTooltipPortal tooltip={tooltip} />
    </section>
  )
}

function AgeBandsCard({ stats }: { stats: ProfissionalAtendimentosStats }) {
  const animate = useChartFillAnimation(200)
  const max = Math.max(...stats.ageBands.map((b) => b.count), 1)

  return (
    <section
      data-tour="atendimentos-age-bars"
      className={[profissionalAtendimentosPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <h3 className="text-sm font-bold text-gray-900">Faixa etária dos pacientes</h3>
      <p className="mt-0.5 text-[11px] text-gray-500">Idade no momento do atendimento</p>
      <div className="mt-4 flex gap-1 overflow-hidden">
        {stats.ageBands.map((band, index) => (
          <ChartVerticalBar
            key={band.label}
            label={band.label}
            count={band.count}
            maxCount={max}
            animate={animate}
            animationDelay={`${index * 0.06}s`}
            barClassName="bg-gradient-to-t from-[var(--brand-primary)] to-orange-300"
            tooltipTitle={`${band.label} anos`}
            tooltipDescription={`${formatNumber(band.count)} ${patientWord(band.count)} atendidos com idade na faixa de ${band.label} anos, no período filtrado.`}
          />
        ))}
      </div>
    </section>
  )
}

function WeekdayBarsCard({ stats }: { stats: ProfissionalAtendimentosStats }) {
  const animate = useChartFillAnimation(240)
  const max = Math.max(...stats.weekdayBars.map((b) => b.count), 1)

  return (
    <section
      data-tour="atendimentos-weekday-bars"
      className={[profissionalAtendimentosPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <h3 className="text-sm font-bold text-gray-900">Dias da semana</h3>
      <p className="mt-0.5 text-[11px] text-gray-500">Quando você mais atende</p>
      <div className="mt-4 overflow-hidden">
        <div className="flex gap-1">
          {stats.weekdayBars.map((bar, index) => {
            const fullDay = WEEKDAY_FULL_NAMES[bar.label] ?? bar.label
            return (
              <ChartVerticalBar
                key={bar.label}
                label={bar.label}
                count={bar.count}
                maxCount={max}
                animate={animate}
                animationDelay={`${index * 0.05}s`}
                barClassName="bg-gradient-to-t from-orange-600/90 to-[var(--brand-primary)]"
                tooltipTitle={fullDay}
                tooltipDescription={`${formatNumber(bar.count)} ${attendanceWord(bar.count)} realizados às ${fullDay.toLowerCase()}s, somando todas as semanas do período filtrado.`}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
