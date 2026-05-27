import type { DonutSlice } from '../../credenciais/CredentialDonutChart'
import { chartStaggerDelay, PREF_CHART_EASE, usePrefeituraChartAnimation } from '../prefeituraChartAnimation'

const STATION_CHART_HEIGHT_PX = 112
const STATION_BAR_MIN_HEIGHT_PX = 36

type PrefeituraRedeStationStatusBarsProps = {
  slices: DonutSlice[]
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(count: number, total: number) {
  if (total <= 0) return 0
  return Math.round((count / total) * 100)
}

export function PrefeituraRedeStationStatusBars({ slices }: PrefeituraRedeStationStatusBarsProps) {
  const sliceKey = slices.map((slice) => `${slice.key}:${slice.count}`).join('|')
  const animate = usePrefeituraChartAnimation(140, sliceKey)
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  const maxCount = Math.max(...slices.map((slice) => slice.count), 1)

  return (
    <div
      className="mt-4 pt-1"
      role="img"
      aria-label={`Terminais por status: ${slices.map((slice) => `${slice.label} ${formatNumber(slice.count)}`).join(', ')}`}
    >
      <div className="flex items-end justify-between gap-2 sm:gap-3">
        {slices.map((slice, index) => {
          const heightPx =
            maxCount > 0
              ? Math.max(
                  STATION_BAR_MIN_HEIGHT_PX,
                  (slice.count / maxCount) * STATION_CHART_HEIGHT_PX,
                )
              : 0
          const percent = formatPercent(slice.count, total)

          return (
            <div
              key={slice.key}
              className="group relative flex min-w-0 flex-1 flex-col items-center"
            >
              <div
                className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                role="tooltip"
              >
                <span className="block font-semibold">{slice.label}</span>
                <span className="block text-[10px] font-normal text-gray-300">
                  {formatNumber(slice.count)} terminais · {percent}%
                </span>
                <span
                  className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"
                  aria-hidden
                />
              </div>

              <div
                className="flex w-full items-end justify-center"
                style={{ height: STATION_CHART_HEIGHT_PX }}
              >
                <button
                  type="button"
                  className="relative w-full max-w-10 overflow-hidden rounded-t-md shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2 sm:max-w-11"
                  style={{
                    height: animate ? heightPx : 0,
                    background: `linear-gradient(to top, ${slice.gradientTo}, ${slice.gradientFrom})`,
                    transition: `height 0.9s ${PREF_CHART_EASE} ${chartStaggerDelay(index)}`,
                  }}
                  aria-label={`${slice.label}: ${formatNumber(slice.count)} terminais (${percent}%)`}
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

              <p
                className="mt-2 w-full truncate text-center text-[10px] font-semibold text-gray-700 transition-opacity duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transitionDelay: `${0.3 + index * 0.08}s`,
                }}
                title={slice.label}
              >
                {slice.label}
              </p>
              <p
                className="mt-0.5 text-center text-[10px] font-bold tabular-nums text-gray-500 transition-opacity duration-500"
                style={{
                  opacity: animate ? 1 : 0,
                  transitionDelay: `${0.35 + index * 0.08}s`,
                }}
              >
                {percent}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
