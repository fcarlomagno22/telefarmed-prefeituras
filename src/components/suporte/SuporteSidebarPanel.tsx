import { Headphones } from 'lucide-react'
import { useEffect, useState } from 'react'
import { brand } from '../../config/brand'
import {
  supportMonthlyTrend,
  supportPriorityDistribution,
  supportStatusSummary,
  type SupportPrioritySlice,
} from '../../data/suporteMock'
import type { SupportTicketStatus } from '../../data/suporteMock'

type StatusSummaryItem = {
  key: SupportTicketStatus
  label: string
  count: number
  iconClass: string
  dotClass: string
}
const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DONUT_RADIUS = 38
const DONUT_STROKE = 11
const LINE_CHART_HEIGHT = 72

function useChartFillAnimation(delayMs = 60) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return animate
}

function PriorityDonut({ slices }: { slices: SupportPrioritySlice[] }) {
  const animate = useChartFillAnimation()
  const circumference = 2 * Math.PI * DONUT_RADIUS
  let rotation = -90

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative size-[5.5rem] shrink-0"
        role="img"
        aria-label={`Chamados por prioridade: ${slices.map((s) => `${s.label} ${s.percent}%`).join(', ')}`}
      >
        <svg className="size-full" viewBox="0 0 100 100" aria-hidden>
          <defs>
            {slices.map((slice, index) => (
              <linearGradient
                key={slice.key}
                id={`support-priority-gradient-${index}`}
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

            return (
              <circle
                key={slice.key}
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke={`url(#support-priority-gradient-${index})`}
                strokeWidth={DONUT_STROKE}
                strokeLinecap="butt"
                strokeDasharray={
                  animate ? `${length} ${circumference - length}` : `0 ${circumference}`
                }
                transform={`rotate(${currentRotation} 50 50)`}
                style={{
                  transition: `stroke-dasharray 1s ${CHART_EASE} ${index * 0.18}s`,
                }}
              />
            )
          })}
        </svg>
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
          aria-hidden
        >
          <Headphones className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((slice, index) => (
          <li key={slice.key} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${slice.gradientFrom}, ${slice.gradientTo})`,
              }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-gray-600">
              {slice.label} {slice.percent}%
            </span>
            <span
              className="shrink-0 font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
              style={{
                opacity: animate ? 1 : 0,
                transitionDelay: `${0.35 + index * 0.12}s`,
              }}
            >
              ({slice.count})
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MonthlyTrendChart({
  trend,
  monthlyTotal,
}: {
  trend: readonly { label: string; count: number }[]
  monthlyTotal: number
}) {
  const animate = useChartFillAnimation(120)
  const maxCount = Math.max(...trend.map((p) => p.count), 1)
  const width = 240
  const height = LINE_CHART_HEIGHT
  const paddingX = 8
  const paddingY = 8
  const innerW = width - paddingX * 2
  const innerH = height - paddingY * 2

  const points = trend.map((point, index) => {
    const x = paddingX + (index / Math.max(trend.length - 1, 1)) * innerW
    const y = paddingY + innerH - (point.count / maxCount) * innerH
    return { x, y, ...point }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-gray-900">{monthlyTotal}</span>
        <span className="text-sm text-gray-500">Total de chamados</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-3 w-full"
        role="img"
        aria-label="Gráfico de chamados abertos em maio"
      >
        <defs>
          <linearGradient id="support-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#support-trend-fill)"
          style={{
            opacity: animate ? 1 : 0,
            transition: `opacity 0.8s ${CHART_EASE}`,
          }}
        />
        <path
          d={linePath}
          fill="none"
          stroke="var(--brand-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: animate ? 'none' : '1000',
            strokeDashoffset: animate ? 0 : 1000,
            transition: `stroke-dashoffset 1.2s ${CHART_EASE}`,
          }}
        />
        {points.map((point) => (
          <circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r={point.count > 0 ? 3 : 0}
            fill="var(--brand-primary)"
            style={{
              opacity: animate ? 1 : 0,
              transition: `opacity 0.5s ${CHART_EASE}`,
            }}
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[9px] font-medium text-gray-400">
        <span>{trend[0]?.label}</span>
        <span>{trend[trend.length - 1]?.label}</span>
      </div>
    </div>
  )
}

type SuporteSidebarPanelProps = {
  statusSummary?: StatusSummaryItem[]
  priorityDistribution?: SupportPrioritySlice[]
  monthlyTrend?: readonly { label: string; count: number }[]
  monthlyTotal?: number
  summaryTitle?: string
}

export function SuporteSidebarPanel({
  statusSummary = supportStatusSummary,
  priorityDistribution = supportPriorityDistribution,
  monthlyTrend = supportMonthlyTrend,
  monthlyTotal,
  summaryTitle = 'Resumo de chamados',
}: SuporteSidebarPanelProps) {
  const illustrationUrl = brand.dashboardSuporteImageUrl
  const totalChamados =
    monthlyTotal ?? statusSummary.reduce((sum, item) => sum + item.count, 0)

  return (
    <aside
      data-tour="suporte-sidebar"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
    >
      {illustrationUrl ? (
        <div className="shrink-0 overflow-hidden bg-white px-4 pt-4 pb-2">
          <img
            src={illustrationUrl}
            alt=""
            className="mx-auto h-28 w-full max-w-[220px] object-contain object-center sm:h-32"
          />
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <section
          data-tour="suporte-status-summary"
          className={`p-5 ${illustrationUrl ? 'border-t border-gray-200' : ''}`}
        >
          <h2 className="text-base font-bold text-gray-900">{summaryTitle}</h2>
          <ul className="mt-4 space-y-3">
            {statusSummary.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                  >
                    <span className={`h-2 w-2 rounded-full ${item.dotClass}`} aria-hidden />
                  </span>
                  <span className="truncate text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-lg font-bold tabular-nums text-gray-900">{item.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          data-tour="suporte-priority-chart"
          className="border-t border-gray-200 p-5"
        >
          <h2 className="text-base font-bold text-gray-900">Chamados por prioridade</h2>
          <div className="mt-4">
            <PriorityDonut slices={priorityDistribution} />
          </div>
        </section>

        <section className="border-t border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900">Chamados este mês</h2>
          <div className="mt-4">
            <MonthlyTrendChart trend={monthlyTrend} monthlyTotal={totalChamados} />
          </div>
        </section>
      </div>
    </aside>
  )
}
