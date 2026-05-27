import { useEffect, useState } from 'react'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DONUT_RADIUS = 38
const DONUT_STROKE = 11

export type DonutSlice = {
  key: string
  label: string
  count: number
  gradientFrom: string
  gradientTo: string
}

function useChartFillAnimation(deps: unknown[], delayMs = 60) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(false)
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, deps)

  return animate
}

type CredentialDonutChartProps = {
  chartId: string
  slices: DonutSlice[]
  centerPrimary: string
  centerSecondary?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CredentialDonutChart({
  chartId,
  slices,
  centerPrimary,
  centerSecondary,
  size = 'md',
  className = '',
}: CredentialDonutChartProps) {
  const sliceKey = slices.map((s) => `${s.key}:${s.count}`).join('|')
  const animate = useChartFillAnimation([sliceKey, chartId])
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  const circumference = 2 * Math.PI * DONUT_RADIUS
  let rotation = -90

  const chartSize =
    size === 'sm' ? 'size-[4.5rem]' : size === 'lg' ? 'size-[8.5rem]' : 'size-[5.5rem]'
  const centerTextPrimary =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg'
  const centerTextSecondary = size === 'lg' ? 'text-[10px]' : 'text-[9px]'

  return (
    <div
      className={`relative ${chartSize} shrink-0 ${className}`}
      role="img"
      aria-label={slices.map((s) => `${s.label} ${s.count}`).join(', ')}
    >
      <svg className="size-full" viewBox="0 0 100 100" aria-hidden>
        <defs>
          {slices.map((slice, index) => (
            <linearGradient
              key={slice.key}
              id={`credential-donut-${chartId}-${index}`}
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
        {total > 0
          ? slices.map((slice, index) => {
              const percent = (slice.count / total) * 100
              const length = (percent / 100) * circumference
              const currentRotation = rotation
              rotation += (percent / 100) * 360

              return (
                <circle
                  key={slice.key}
                  cx="50"
                  cy="50"
                  r={DONUT_RADIUS}
                  fill="none"
                  stroke={`url(#credential-donut-${chartId}-${index})`}
                  strokeWidth={DONUT_STROKE}
                  strokeLinecap="butt"
                  strokeDasharray={
                    animate ? `${length} ${circumference - length}` : `0 ${circumference}`
                  }
                  transform={`rotate(${currentRotation} 50 50)`}
                  style={{
                    transition: `stroke-dasharray 1s ${CHART_EASE} ${index * 0.15}s`,
                  }}
                />
              )
            })
          : null}
      </svg>
      <div
        className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner transition-opacity duration-500"
        style={{
          opacity: animate ? 1 : 0,
          transitionDelay: '0.25s',
        }}
      >
        <span className={`${centerTextPrimary} font-bold leading-none text-gray-900`}>
          {centerPrimary}
        </span>
        {centerSecondary ? (
          <span className={`mt-0.5 ${centerTextSecondary} font-medium text-gray-500`}>
            {centerSecondary}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function useCredentialChartLegendAnimation(deps: unknown[]) {
  return useChartFillAnimation(deps, 60)
}
