import { BarChart3, Star, ThumbsUp, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProfissionalPatientReview } from '../../../types/profissionalAvaliacoes'
import type { ProfissionalAvaliacoesStats } from '../../../utils/profissional/computeProfissionalAvaliacoesStats'
import { computeProfissionalAvaliacoesStats } from '../../../utils/profissional/computeProfissionalAvaliacoesStats'
import { ChartTooltipPortal, useChartTooltip } from '../atendimentos/profissionalChartTooltip'
import { ProfissionalStarRating } from './ProfissionalStarRating'
import { profissionalAvaliacoesPanelClass } from './profissionalAvaliacoesUi'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DONUT_RADIUS = 40
const DONUT_STROKE = 12

const STAR_MIX_COLORS: Record<
  1 | 2 | 3 | 4 | 5,
  { from: string; to: string; dot: string; track: string }
> = {
  5: { from: '#f59e0b', to: '#fbbf24', dot: 'bg-amber-400', track: 'from-amber-400 to-amber-300' },
  4: {
    from: '#fb923c',
    to: '#fdba74',
    dot: 'bg-orange-400',
    track: 'from-orange-500 to-orange-300',
  },
  3: { from: '#94a3b8', to: '#cbd5e1', dot: 'bg-slate-400', track: 'from-slate-400 to-slate-300' },
  2: { from: '#f87171', to: '#fca5a5', dot: 'bg-red-400', track: 'from-red-500 to-red-300' },
  1: { from: '#dc2626', to: '#f87171', dot: 'bg-red-600', track: 'from-red-600 to-red-400' },
}
const LINE_HEIGHT = 88
const VERTICAL_CHART_HEIGHT_PX = 112

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

function reviewWord(count: number) {
  return count === 1 ? 'avaliação' : 'avaliações'
}

type ProfissionalAvaliacaoChartsSidebarProps = {
  reviews: ProfissionalPatientReview[]
}

export function ProfissionalAvaliacaoChartsSidebar({
  reviews,
}: ProfissionalAvaliacaoChartsSidebarProps) {
  const stats = computeProfissionalAvaliacoesStats(reviews)

  return (
    <aside
      data-tour="avaliacao-charts-sidebar"
      className="flex h-full min-h-0 w-full flex-col gap-4"
    >
      <HeroRatingCard stats={stats} />
      <StarBreakdownCard stats={stats} />
      <SentimentDonutCard stats={stats} />
      <WeeklyCountTrendCard stats={stats} />
      <WeeklyAverageTrendCard stats={stats} />
      <MonthlyBarsCard stats={stats} />
      <StarDistributionDonutCard stats={stats} />
      <AvaliacaoIllustration />
    </aside>
  )
}

function HeroRatingCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const miniStats = [
    {
      label: 'Positivas (4–5★)',
      value: `${stats.positivePercent}%`,
      tone: 'emerald' as const,
    },
    {
      label: 'Críticas (< 4★)',
      value: formatNumber(stats.criticalCount),
      tone: 'red' as const,
    },
    {
      label: 'Com comentário',
      value: `${stats.withCommentPercent}%`,
      tone: 'sky' as const,
    },
  ]

  return (
    <section
      className={[
        profissionalAvaliacoesPanelClass,
        'flex shrink-0 flex-col overflow-hidden bg-gradient-to-br from-[var(--brand-primary-light)]/55 via-white to-white p-5',
      ].join(' ')}
    >
      <div className="flex shrink-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-orange-100">
          <Star className="h-5 w-5 fill-amber-400 text-amber-500" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Métricas do período
          </p>
          <ProfissionalStarRating
            rating={stats.averageRating}
            size="md"
            showValue
            className="mt-2"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formatNumber(stats.total)} {reviewWord(stats.total)} considerando filtros da lista
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {miniStats.map((item) => (
          <MiniStat key={item.label} label={item.label} value={item.value} tone={item.tone} />
        ))}
      </div>
    </section>
  )
}

const miniStatToneStyles = {
  emerald: { ring: 'ring-emerald-100/90', accent: 'border-t-emerald-500', value: 'text-emerald-900' },
  red: { ring: 'ring-red-100/90', accent: 'border-t-red-500', value: 'text-red-900' },
  sky: { ring: 'ring-sky-100/90', accent: 'border-t-sky-500', value: 'text-sky-900' },
} as const

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: keyof typeof miniStatToneStyles
}) {
  const styles = miniStatToneStyles[tone]
  return (
    <div
      className={[
        'flex min-w-0 flex-col items-center justify-center rounded-xl border-t-[3px] bg-white/90 px-1.5 py-2.5 text-center ring-1',
        styles.accent,
        styles.ring,
      ].join(' ')}
    >
      <span className="line-clamp-2 text-[9px] font-semibold leading-tight text-gray-500">{label}</span>
      <span className={['mt-1 text-base font-bold leading-none tabular-nums sm:text-lg', styles.value].join(' ')}>
        {value}
      </span>
    </div>
  )
}

function StarBreakdownCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const animate = useChartFillAnimation(80)
  const { tooltip, bind } = useChartTooltip()
  const max = Math.max(...stats.starBars.map((b) => b.count), 1)

  return (
    <section
      data-tour="avaliacao-star-breakdown"
      className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 fill-amber-400 text-amber-500" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Distribuição por estrelas</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">Quantidade de avaliações em cada nota</p>
      <ul className="mt-4 space-y-2.5">
        {stats.starBars.map((bar, index) => (
          <li key={bar.stars}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{bar.stars} estrelas</span>
              <span className="font-bold tabular-nums text-gray-900">
                {bar.count} ({bar.percent}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <button
                type="button"
                className={[
                  'block h-full rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40',
                  bar.stars >= 4
                    ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                    : bar.stars === 3
                      ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                      : 'bg-gradient-to-r from-red-500 to-red-300',
                ].join(' ')}
                style={{
                  width: animate ? `${(bar.count / max) * 100}%` : '0%',
                  minWidth: bar.count > 0 ? '0.5rem' : 0,
                  transition: `width 0.9s ${CHART_EASE} ${index * 0.06}s`,
                }}
                aria-label={`${bar.stars} estrelas: ${bar.count}`}
                {...bind(
                  `${bar.stars} estrelas`,
                  `${formatNumber(bar.count)} ${reviewWord(bar.count)} (${bar.percent}% do total filtrado).`,
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

function SentimentDonutCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const animate = useChartFillAnimation(120)
  const { tooltip, show, hide, bind } = useChartTooltip()
  const slices = stats.sentimentSlices
  const circumference = 2 * Math.PI * DONUT_RADIUS
  let rotation = -90

  if (slices.length === 0) {
    return (
      <section className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}>
        <h3 className="text-sm font-bold text-gray-900">Sentimento geral</h3>
        <p className="mt-4 text-center text-xs text-gray-500">Sem avaliações no período.</p>
      </section>
    )
  }

  return (
    <section
      data-tour="avaliacao-sentiment-donut"
      className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <div className="flex items-center gap-2">
        <ThumbsUp className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Positivas vs críticas</h3>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative size-[6.5rem] shrink-0">
          <svg className="size-full" viewBox="0 0 100 100" aria-hidden>
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
              return (
                <circle
                  key={slice.key}
                  cx="50"
                  cy="50"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={
                    slice.key === 'positive'
                      ? 'url(#prof-aval-pos-gradient)'
                      : 'url(#prof-aval-crit-gradient)'
                  }
                  strokeWidth={DONUT_STROKE}
                  strokeDasharray={
                    animate ? `${length} ${circumference - length}` : `0 ${circumference}`
                  }
                  transform={`rotate(${currentRotation} 50 50)`}
                  className="cursor-pointer"
                  style={{ transition: `stroke-dasharray 1s ${CHART_EASE} ${index * 0.12}s` }}
                  onMouseEnter={(event) =>
                    show(
                      event.currentTarget as unknown as HTMLElement,
                      slice.label,
                      `${formatNumber(slice.count)} ${reviewWord(slice.count)} (${slice.percent}%).`,
                    )
                  }
                  onMouseLeave={hide}
                />
              )
            })}
            <defs>
              <linearGradient id="prof-aval-pos-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b00" />
                <stop offset="100%" stopColor="#ffb347" />
              </linearGradient>
              <linearGradient id="prof-aval-crit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#fca5a5" />
              </linearGradient>
            </defs>
          </svg>
          <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-gray-900">
              {stats.positivePercent}%
            </span>
            <span className="text-[9px] font-medium text-gray-500">positivas</span>
          </span>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {slices.map((slice) => (
            <li key={slice.key}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left text-xs transition hover:bg-gray-50"
                {...bind(slice.label, `${formatNumber(slice.count)} ${reviewWord(slice.count)}.`)}
              >
                <span
                  className={[
                    'size-2.5 shrink-0 rounded-full',
                    slice.key === 'positive' ? 'bg-amber-400' : 'bg-red-400',
                  ].join(' ')}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-gray-600">{slice.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-900">
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

function WeeklyCountTrendCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const animate = useChartFillAnimation(160)
  const { tooltip, show, hide } = useChartTooltip()
  const points = stats.weeklyReviewCounts
  const maxCount = Math.max(...points.map((p) => p.count), 1)
  const width = 280
  const height = LINE_HEIGHT
  const paddingX = 10
  const paddingY = 10
  const innerW = width - paddingX * 2
  const innerH = height - paddingY * 2

  const coords = points.map((point, index) => {
    const x = paddingX + (index / Math.max(points.length - 1, 1)) * innerW
    const y = paddingY + innerH - (point.count / maxCount) * innerH
    return { x, y, ...point }
  })

  const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`
      : ''
  const periodTotal = points.reduce((sum, p) => sum + p.count, 0)

  return (
    <section
      data-tour="avaliacao-weekly-volume"
      className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Volume semanal</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">Quantidade de avaliações por semana</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-gray-900">
          {formatNumber(periodTotal)}
        </span>
        <span className="text-xs text-gray-500">últimas 8 semanas</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full overflow-visible">
        <defs>
          <linearGradient id="prof-aval-volume-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {areaPath ? (
          <path
            d={areaPath}
            fill="url(#prof-aval-volume-fill)"
            style={{ opacity: animate ? 1 : 0, transition: `opacity 0.8s ${CHART_EASE}` }}
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
          />
        ) : null}
        {coords.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="10"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(event) =>
                show(
                  event.currentTarget as unknown as HTMLElement,
                  `Semana ${point.label}`,
                  `${formatNumber(point.count)} ${reviewWord(point.count)}.`,
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
              style={{ opacity: animate ? 1 : 0 }}
            />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex justify-between gap-0.5 text-[9px] font-medium text-gray-400">
        {points.map((point) => (
          <span key={point.label} className="min-w-0 flex-1 truncate text-center">
            {point.label}
          </span>
        ))}
      </div>
      <ChartTooltipPortal tooltip={tooltip} />
    </section>
  )
}

function WeeklyAverageTrendCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const animate = useChartFillAnimation(200)
  const { tooltip, show, hide } = useChartTooltip()
  const maxRating = 5
  const width = 280
  const height = LINE_HEIGHT
  const paddingX = 10
  const paddingY = 10
  const innerW = width - paddingX * 2
  const innerH = height - paddingY * 2

  const coords = stats.weeklyAverageRatings.map((point, index) => {
    const x = paddingX + (index / Math.max(stats.weeklyAverageRatings.length - 1, 1)) * innerW
    const y =
      paddingY + innerH - (point.average > 0 ? point.average / maxRating : 0) * innerH
    return { x, y, ...point }
  })

  const linePath = coords
    .filter((p) => p.average > 0)
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  return (
    <section className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}>
      <div className="flex items-center gap-2">
        <Star className="h-4 w-4 text-amber-500" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Nota média semanal</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">Evolução da média de estrelas</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full overflow-visible">
        {[1, 2, 3, 4, 5].map((level) => {
          const y = paddingY + innerH - (level / maxRating) * innerH
          return (
            <line
              key={level}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          )
        })}
        {linePath ? (
          <path
            d={linePath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: animate ? 1 : 0, transition: `opacity 0.8s ${CHART_EASE}` }}
          />
        ) : null}
        {coords.map((point) =>
          point.average > 0 ? (
            <g key={point.label}>
              <circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(event) =>
                  show(
                    event.currentTarget as unknown as HTMLElement,
                    `Semana ${point.label}`,
                    `Média de ${point.average.toFixed(1)} estrelas na semana.`,
                  )
                }
                onMouseLeave={hide}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="white"
                stroke="#f59e0b"
                strokeWidth="2"
                pointerEvents="none"
              />
            </g>
          ) : null,
        )}
      </svg>
      <ChartTooltipPortal tooltip={tooltip} />
    </section>
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
    maxCount > 0 ? Math.max(count > 0 ? 8 : 3, (count / maxCount) * plotHeight) : 3

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

function MonthlyBarsCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const animate = useChartFillAnimation(240)
  const max = Math.max(...stats.monthlyCounts.map((b) => b.count), 1)

  return (
    <section className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Avaliações por mês</h3>
      </div>
      <div className="mt-4 flex gap-1 overflow-hidden">
        {stats.monthlyCounts.map((month, index) => (
          <ChartVerticalBar
            key={month.label}
            label={month.label}
            count={month.count}
            maxCount={max}
            animate={animate}
            animationDelay={`${index * 0.06}s`}
            barClassName="bg-gradient-to-t from-[var(--brand-primary)] to-orange-300"
            tooltipTitle={month.label}
            tooltipDescription={`${formatNumber(month.count)} ${reviewWord(month.count)} no mês.`}
          />
        ))}
      </div>
    </section>
  )
}

function StarRatingDots({ filledCount }: { filledCount: number }) {
  return (
    <span className="flex items-center gap-px" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={[
            'h-3 w-3',
            index < filledCount
              ? 'fill-amber-400 text-amber-500'
              : 'fill-gray-100 text-gray-200',
          ].join(' ')}
          strokeWidth={1.5}
        />
      ))}
    </span>
  )
}

function StarMixLegendRow({
  stars,
  count,
  percent,
  animate,
  animationDelay,
  onHover,
  onLeave,
}: {
  stars: 1 | 2 | 3 | 4 | 5
  count: number
  percent: number
  animate: boolean
  animationDelay: string
  onHover: (target: HTMLElement, title: string, description: string) => void
  onLeave: () => void
}) {
  const colors = STAR_MIX_COLORS[stars]
  const isEmpty = count === 0

  return (
    <li>
      <button
        type="button"
        className={[
          'group flex w-full flex-col gap-1.5 rounded-xl px-2.5 py-2 text-left transition',
          isEmpty ? 'opacity-45' : 'hover:bg-gray-50/90',
        ].join(' ')}
        onMouseEnter={(event) =>
          onHover(
            event.currentTarget,
            `${stars} ${stars === 1 ? 'estrela' : 'estrelas'}`,
            isEmpty
              ? 'Nenhuma avaliação com esta nota no período filtrado.'
              : `${formatNumber(count)} ${reviewWord(count)} — ${percent}% do total.`,
          )
        }
        onMouseLeave={onLeave}
      >
        <div className="flex items-center gap-2">
          <span
            className={['size-2 shrink-0 rounded-full ring-2 ring-white', colors.dot].join(' ')}
            aria-hidden
          />
          <StarRatingDots filledCount={stars} />
          <span className="ml-auto flex shrink-0 items-baseline gap-1.5 tabular-nums">
            <span
              className={[
                'text-sm font-bold',
                isEmpty ? 'text-gray-400' : 'text-gray-900',
              ].join(' ')}
            >
              {formatNumber(count)}
            </span>
            <span className="text-[11px] font-semibold text-gray-400">{percent}%</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <span
            className={[
              'block h-full rounded-full bg-gradient-to-r',
              colors.track,
            ].join(' ')}
            style={{
              width: animate ? `${percent}%` : '0%',
              minWidth: count > 0 ? '0.35rem' : 0,
              transition: `width 0.85s ${CHART_EASE} ${animationDelay}`,
            }}
          />
        </div>
      </button>
    </li>
  )
}

function StarDistributionDonutCard({ stats }: { stats: ProfissionalAvaliacoesStats }) {
  const animate = useChartFillAnimation(320)
  const { tooltip, show, hide } = useChartTooltip()

  if (stats.total === 0) return null

  return (
    <section className={[profissionalAvaliacoesPanelClass, 'shrink-0 overflow-hidden p-5'].join(' ')}>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[var(--brand-primary)]" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900">Mix de notas</h3>
      </div>
      <p className="mt-0.5 text-[11px] text-gray-500">
        Proporção de cada nota · passe o mouse nas barras
      </p>

      <ul className="mt-4 space-y-0.5" aria-label="Detalhamento por estrelas">
        {stats.starBars.map((bar, index) => (
          <StarMixLegendRow
            key={bar.stars}
            stars={bar.stars}
            count={bar.count}
            percent={bar.percent}
            animate={animate}
            animationDelay={`${index * 0.05}s`}
            onHover={show}
            onLeave={hide}
          />
        ))}
      </ul>
      <ChartTooltipPortal tooltip={tooltip} />
    </section>
  )
}

function AvaliacaoIllustration() {
  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-orange-100/80 bg-gradient-to-b from-white to-[var(--brand-primary-light)]/30 p-2 shadow-sm">
      <img
        src="/avaliacao.png"
        alt="Ilustração de avaliações e feedback dos pacientes"
        className="w-full rounded-xl object-contain"
        loading="lazy"
      />
    </div>
  )
}
