import { Check, Clock, Stethoscope, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type {
  ConsultasGenderSlice,
  ConsultasSpecialtySlice,
  ConsultasStatusSlice,
  ConsultasSummary,
} from '../../data/consultasMock'

import { ConsultasDoctorIllustration } from './ConsultasDoctorIllustration'

type ConsultasSidebarPanelProps = {
  summary?: ConsultasSummary
  statusDistribution?: ConsultasStatusSlice[]
  specialtyDistribution?: ConsultasSpecialtySlice[]
  genderDistribution?: ConsultasGenderSlice[]
  isLoading?: boolean
  illustration?: ReactNode | null
  summarySubtitle?: string
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DONUT_RADIUS = 38
const DONUT_STROKE = 11

function useChartFillAnimation(delayMs = 60) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setAnimate(true), delayMs)
    return () => window.clearTimeout(timer)
  }, [delayMs])

  return animate
}

function StatusDonut({ slices }: { slices: ConsultasStatusSlice[] }) {
  const animate = useChartFillAnimation()
  const circumference = 2 * Math.PI * DONUT_RADIUS
  let rotation = -90

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative size-[5.5rem] shrink-0"
        role="img"
        aria-label={`Consultas por status: ${slices.map((s) => `${s.label} ${s.percent}%`).join(', ')}`}
      >
        <svg className="size-full" viewBox="0 0 100 100" aria-hidden>
          <defs>
            {slices.map((slice, index) => (
              <linearGradient
                key={slice.key}
                id={`consultas-status-gradient-${index}`}
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
                stroke={`url(#consultas-status-gradient-${index})`}
                strokeWidth={DONUT_STROKE}
                strokeLinecap="butt"
                strokeDasharray={animate ? `${length} ${circumference - length}` : `0 ${circumference}`}
                transform={`rotate(${currentRotation} 50 50)`}
                style={{
                  transition: `stroke-dasharray 1s ${CHART_EASE} ${index * 0.18}s`,
                }}
              />
            )
          })}
        </svg>
        <img
          src="/center.png"
          alt=""
          className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 object-contain"
        />
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((slice, index) => (
          <li key={slice.key} className="flex items-start gap-2 text-sm">
            <span
              className="mt-1.5 size-2.5 shrink-0 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${slice.gradientFrom}, ${slice.gradientTo})`,
              }}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="block text-gray-600">{slice.label}</span>
              <span
                className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transitionDelay: `${0.35 + index * 0.12}s`,
                }}
              >
                <span>{formatNumber(slice.count)}</span>
                <span className="font-normal text-gray-300" aria-hidden>
                  |
                </span>
                <span>
                  {slice.percent % 1 === 0 ? slice.percent : slice.percent.toFixed(1)}%
                </span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const GENDER_CHART_HEIGHT_PX = 112
const GENDER_BAR_MIN_HEIGHT_PX = 28

function formatPercent(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1)
}

type GenderBarColumnProps = {
  slice: ConsultasGenderSlice
  heightPx: number
  animate: boolean
  index: number
}

function GenderBarColumn({ slice, heightPx, animate, index }: GenderBarColumnProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null)

  function updateTooltipPosition() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltipPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    })
  }

  function hideTooltip() {
    setTooltipPos(null)
  }

  const tooltip =
    tooltipPos !== null
      ? createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              transform: 'translate(-50%, -100%)',
              zIndex: 9999,
            }}
            className="pointer-events-none whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg"
          >
            {slice.label}
            <span
              className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"
              aria-hidden
            />
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div className="relative flex min-w-0 flex-1 flex-col items-center">
        <div
          className="flex w-full items-end justify-center"
          style={{ height: GENDER_CHART_HEIGHT_PX }}
        >
          <button
            ref={buttonRef}
            type="button"
            className="relative w-full max-w-10 overflow-hidden rounded-t-md shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 sm:max-w-11"
            style={{
              height: animate ? heightPx : 0,
              background: `linear-gradient(to top, ${slice.gradientTo}, ${slice.gradientFrom})`,
              transition: `height 0.9s ${CHART_EASE} ${index * 0.1}s`,
            }}
            aria-label={`${slice.label}: ${formatPercent(slice.percent)}%`}
            onMouseEnter={updateTooltipPosition}
            onMouseLeave={hideTooltip}
            onFocus={updateTooltipPosition}
            onBlur={hideTooltip}
          />
        </div>

        <p
          className="mt-2 w-full text-center text-[10px] font-semibold tabular-nums text-gray-700 transition-opacity duration-500"
          style={{
            opacity: animate ? 1 : 0,
            transitionDelay: `${0.35 + index * 0.08}s`,
          }}
        >
          {formatPercent(slice.percent)}%
        </p>
      </div>
      {tooltip}
    </>
  )
}

function GenderVerticalBars({ slices }: { slices: ConsultasGenderSlice[] }) {
  const animate = useChartFillAnimation(100)
  const maxCount = Math.max(...slices.map((s) => s.count))

  return (
    <div
      className="pt-1"
      role="img"
      aria-label={`Consultas por gênero: ${slices.map((s) => `${s.label} ${formatNumber(s.count)}`).join(', ')}`}
    >
      <div className="flex items-end justify-between gap-1 sm:gap-1.5">
        {slices.map((slice, index) => {
          const heightPx =
            maxCount > 0
              ? Math.max(
                  GENDER_BAR_MIN_HEIGHT_PX,
                  (slice.count / maxCount) * GENDER_CHART_HEIGHT_PX,
                )
              : 0

          return (
            <GenderBarColumn
              key={slice.key}
              slice={slice}
              heightPx={heightPx}
              animate={animate}
              index={index}
            />
          )
        })}
      </div>
    </div>
  )
}

function SpecialtyBars({ slices }: { slices: ConsultasSpecialtySlice[] }) {
  const animate = useChartFillAnimation(140)
  const maxPercent = Math.max(...slices.map((s) => s.percent), 1)

  return (
    <ul className="space-y-2.5">
      {slices.map((slice, index) => (
        <li key={slice.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-gray-600">{slice.label}</span>
            <span
              className="shrink-0 font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
              style={{
                opacity: animate ? 1 : 0,
                transitionDelay: `${0.25 + index * 0.1}s`,
              }}
            >
              {slice.percent}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[#ff9a3d]"
              style={{
                width: animate ? `${(slice.percent / maxPercent) * 100}%` : '0%',
                transition: `width 0.9s ${CHART_EASE} ${index * 0.12}s`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function ConsultasSidebarPanel({
  summary = { total: 0, completed: 0, cancelled: 0, inProgress: 0 },
  statusDistribution = [],
  specialtyDistribution = [],
  genderDistribution = [],
  isLoading = false,
  illustration = <ConsultasDoctorIllustration />,
  summarySubtitle,
}: ConsultasSidebarPanelProps) {
  const summaryCards = [
    {
      label: 'Total de consultas',
      value: summary.total,
      icon: Stethoscope,
      iconClass:
        'bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-gradient-end)] text-white',
      valueClass:
        'bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-gradient-end)] bg-clip-text text-transparent',
    },
    {
      label: 'Concluídas',
      value: summary.completed,
      icon: Check,
      iconClass: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white',
      valueClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent',
    },
    {
      label: 'Canceladas',
      value: summary.cancelled,
      icon: X,
      iconClass: 'bg-gradient-to-br from-red-500 to-rose-600 text-white',
      valueClass: 'bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent',
    },
    {
      label: 'Em andamento',
      value: summary.inProgress,
      icon: Clock,
      iconClass: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
      valueClass: 'bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent',
    },
  ] as const

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      {illustration}

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Resumo geral</h2>
          {summarySubtitle ? (
            <p className="mt-1 text-sm text-gray-500">{summarySubtitle}</p>
          ) : null}
        </header>

        <div className="mt-4 grid shrink-0 grid-cols-2 gap-2.5">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <article
                key={card.label}
                className="flex flex-col items-center rounded-xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 px-3 py-3.5 text-center shadow-sm"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${card.iconClass}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <p className="mt-2 text-[11px] font-medium text-gray-500">{card.label}</p>
                <p
                  className={`mt-0.5 text-lg font-bold tabular-nums leading-tight ${card.valueClass}`}
                >
                  {formatNumber(card.value)}
                </p>
              </article>
            )
          })}
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Consultas por status
            </h3>
            <div className="mt-3">
              <StatusDonut slices={statusDistribution} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Consultas por especialidade
            </h3>
            <div className="mt-3">
              <SpecialtyBars slices={specialtyDistribution} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Consultas por gênero
            </h3>
            <div className="mt-3">
              <GenderVerticalBars slices={genderDistribution} />
            </div>
          </section>
        </div>
      </div>
    </aside>
  )
}
