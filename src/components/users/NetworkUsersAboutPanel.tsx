import { Lightbulb } from 'lucide-react'
import { useEffect, useState } from 'react'
import { brand } from '../../config/brand'
import {
  networkUsersAbout,
  type NetworkUsersAbout,
  type NetworkUsersAgeSlice,
  type NetworkUsersGenderSlice,
  type NetworkUsersNeighborhoodSlice,
} from '../../data/networkUsersMock'

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

function GenderDonut({ slices }: { slices: NetworkUsersGenderSlice[] }) {
  const animate = useChartFillAnimation()
  const leading = slices.reduce((max, slice) => (slice.percent > max.percent ? slice : max), slices[0])
  const circumference = 2 * Math.PI * DONUT_RADIUS
  let rotation = -90

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative size-[5.5rem] shrink-0"
        role="img"
        aria-label={`Distribuição por gênero: ${slices.map((s) => `${s.label} ${s.percent}%`).join(', ')}`}
      >
        <svg className="size-full" viewBox="0 0 100 100" aria-hidden>
          <defs>
            {slices.map((slice, index) => (
              <linearGradient
                key={slice.label}
                id={`gender-gradient-${index}`}
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
                key={slice.label}
                cx="50"
                cy="50"
                r={DONUT_RADIUS}
                fill="none"
                stroke={`url(#gender-gradient-${index})`}
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
        <div
          className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner transition-opacity duration-500"
          style={{ opacity: animate ? 1 : 0 }}
        >
          <span className="text-lg font-bold leading-none text-gray-900">{leading.percent}%</span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-500">
            {leading.label.slice(0, 3)}.
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((slice, index) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${slice.gradientFrom}, ${slice.gradientTo})`,
              }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-gray-600">{slice.label}</span>
            <span
              className="shrink-0 font-semibold tabular-nums text-gray-900 transition-opacity duration-500"
              style={{
                opacity: animate ? 1 : 0,
                transitionDelay: `${0.35 + index * 0.12}s`,
              }}
            >
              {slice.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AgeBars({ slices }: { slices: NetworkUsersAgeSlice[] }) {
  const animate = useChartFillAnimation(100)
  const maxPercent = Math.max(...slices.map((s) => s.percent))

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
              className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-gradient-end)]"
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

const NEIGHBORHOOD_CHART_HEIGHT_PX = 112
const NEIGHBORHOOD_BAR_MIN_HEIGHT_PX = 36

function TopNeighborhoodBars({ slices }: { slices: NetworkUsersNeighborhoodSlice[] }) {
  const animate = useChartFillAnimation(140)
  const maxAppointments = Math.max(...slices.map((s) => s.appointments))

  return (
    <div
      className="pt-1"
      role="img"
      aria-label={`Top bairros por atendimentos: ${slices.map((s) => `${s.label} ${formatNumber(s.appointments)}`).join(', ')}`}
    >
      <div className="flex items-end justify-between gap-1.5 sm:gap-2">
        {slices.map((slice, index) => {
          const heightPx =
            maxAppointments > 0
              ? Math.max(
                  NEIGHBORHOOD_BAR_MIN_HEIGHT_PX,
                  (slice.appointments / maxAppointments) * NEIGHBORHOOD_CHART_HEIGHT_PX,
                )
              : 0

          return (
            <div
              key={slice.label}
              className="group relative flex min-w-0 flex-1 flex-col items-center"
            >
              <div
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                role="tooltip"
              >
                {slice.label}
                <span
                  className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"
                  aria-hidden
                />
              </div>

              <div
                className="flex w-full items-end justify-center"
                style={{ height: NEIGHBORHOOD_CHART_HEIGHT_PX }}
              >
                <button
                  type="button"
                  className="relative w-full max-w-9 overflow-hidden rounded-t-md bg-gradient-to-t from-indigo-600 via-sky-500 to-sky-400 outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 sm:max-w-10"
                  style={{
                    height: animate ? heightPx : 0,
                    transition: `height 0.9s ${CHART_EASE} ${index * 0.12}s`,
                  }}
                  aria-label={`${slice.label}: ${formatNumber(slice.appointments)} atendimentos`}
                >
                  <span
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
                    style={{
                      opacity: animate ? 1 : 0,
                      transitionDelay: `${0.35 + index * 0.1}s`,
                    }}
                  >
                    <span className="rotate-[-90deg] whitespace-nowrap text-[9px] font-bold leading-none tabular-nums tracking-tight text-white sm:text-[10px]">
                      {formatNumber(slice.appointments)}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function NetworkUsersAboutPanel({ about }: { about?: NetworkUsersAbout | null }) {
  const illustrationUrl = brand.dashboardUsersAboutImageUrl
  const data = about ?? networkUsersAbout
  const { ageDistribution, genderDistribution, topNeighborhoodsByAppointments } = data

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      {illustrationUrl ? (
        <div className="shrink-0 overflow-hidden bg-gradient-to-b from-sky-50/50 to-white px-4 pt-4">
          <img
            src={illustrationUrl}
            alt=""
            className="mx-auto h-32 w-full max-w-[240px] object-contain object-center"
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <header className="shrink-0 text-center">
          <h2 className="text-lg font-bold text-gray-900">Sobre os usuários</h2>
          <p className="mt-1 text-sm text-gray-500">Panorama da base de pacientes da rede.</p>
        </header>

        <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Composição por gênero
            </h3>
            <div className="mt-3">
              <GenderDonut slices={genderDistribution} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Faixa etária
            </h3>
            <div className="mt-3">
              <AgeBars slices={ageDistribution} />
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Bairros com mais atendimentos
            </h3>
            <p className="mt-1 text-[11px] text-gray-500">Top 5 da rede</p>
            <div className="mt-3">
              <TopNeighborhoodBars slices={topNeighborhoodsByAppointments} />
            </div>
          </section>

          <section className="rounded-xl bg-sky-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 shrink-0 text-sky-600" strokeWidth={2} />
              <p className="text-xs text-sky-800/90">
                <span className="font-semibold text-sky-700">Dica: </span>
                Mantenha os cadastros atualizados para uma rede mais confiável.
              </p>
            </div>
          </section>
        </div>

        <p className="mt-3 shrink-0 border-t border-gray-200 pt-3 text-center text-[11px] leading-relaxed text-gray-400">
          Dados protegidos em conformidade com a LGPD.
        </p>
      </div>
    </aside>
  )
}
