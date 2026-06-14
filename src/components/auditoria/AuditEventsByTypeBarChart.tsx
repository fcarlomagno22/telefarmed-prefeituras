import { useEffect, useState } from 'react'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const BAR_MIN_PERCENT = 14

export type AuditEventTypeSlice = {
  key: string
  label: string
  count: number
  percent: number
  gradientFrom: string
  gradientTo: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1)
}

function useChartFillAnimation(delayMs = 140) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return animate
}

type AuditEventsByTypeBarChartProps = {
  slices: readonly AuditEventTypeSlice[]
  className?: string
}

export function AuditEventsByTypeBarChart({ slices, className = '' }: AuditEventsByTypeBarChartProps) {
  const animate = useChartFillAnimation()
  const maxCount = Math.max(...slices.map((s) => s.count), 1)

  return (
    <div
      className={`flex h-full min-h-0 min-w-0 flex-col ${className}`.trim()}
      role="img"
      aria-label={`Eventos por tipo: ${slices.map((s) => `${s.label} ${formatNumber(s.count)}`).join(', ')}`}
    >
      <div className="flex min-h-0 flex-1 items-stretch gap-1.5 sm:gap-2">
        {slices.map((slice, index) => {
          const heightPercent = Math.max(BAR_MIN_PERCENT, (slice.count / maxCount) * 100)

          return (
            <div
              key={slice.key}
              className="group flex min-w-0 flex-1 flex-col gap-2"
            >
              <div className="relative flex min-h-[5.5rem] flex-1 flex-col items-center justify-end">
                <div
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                  role="tooltip"
                >
                  <span className="block font-semibold">{slice.label}</span>
                  <span className="block text-[10px] font-normal text-gray-300">
                    {formatNumber(slice.count)} eventos · {formatPercent(slice.percent)}%
                  </span>
                  <span
                    className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"
                    aria-hidden
                  />
                </div>

                <button
                  type="button"
                  className="relative w-full max-w-11 overflow-hidden rounded-t-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 sm:max-w-12"
                  style={{
                    height: animate ? `${heightPercent}%` : '0%',
                    background: `linear-gradient(to top, ${slice.gradientTo}, ${slice.gradientFrom})`,
                    transition: `height 0.9s ${CHART_EASE} ${index * 0.12}s`,
                  }}
                  aria-label={`${slice.label}: ${formatNumber(slice.count)} eventos (${formatPercent(slice.percent)}%)`}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                    style={{
                      opacity: animate ? 1 : 0,
                      transitionDelay: `${0.35 + index * 0.1}s`,
                    }}
                  >
                    <span className="rotate-[-90deg] whitespace-nowrap text-[9px] font-bold leading-none tabular-nums tracking-tight text-white sm:text-[10px]">
                      {formatNumber(slice.count)}
                    </span>
                  </span>
                </button>
              </div>

              <div className="flex min-h-[3rem] shrink-0 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50/80 px-1 py-1.5 text-center">
                <span
                  className="mb-0.5 size-2 shrink-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${slice.gradientFrom}, ${slice.gradientTo})`,
                  }}
                  aria-hidden
                />
                <span className="truncate text-[10px] font-medium leading-tight text-gray-700">
                  {slice.label}
                </span>
                <span className="mt-0.5 text-xs font-bold tabular-nums text-gray-900">
                  {formatPercent(slice.percent)}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
