import { useEffect, useMemo, useState } from 'react'
import {
  agendaChartSegments,
  filledAgendaPixelCount,
  maxAgendaChartSegmentValue,
  AGENDA_PIXEL_COUNT,
  type AgendaChartSegment,
} from '../../data/agendaChartSegments'
import type { AgendaDaySummary } from '../../data/agendaMock'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

function formatStat(value: number) {
  return value.toString().padStart(2, '0')
}

type PixelBarProps = {
  segment: AgendaChartSegment
  value: number
  animate: boolean
  rowIndex: number
  maxSegmentValue: number
}

function PixelBar({ segment, value, animate, rowIndex, maxSegmentValue }: PixelBarProps) {
  const filled = filledAgendaPixelCount(value, maxSegmentValue)
  const countLabel =
    value === 0
      ? 'Nenhum agendamento'
      : value === 1
        ? '1 agendamento'
        : `${formatStat(value)} agendamentos`

  return (
    <div
      className="group/chart-row flex items-center gap-2.5"
      role="img"
      aria-label={`${segment.situation}: ${value}`}
    >
      <span
        className={`w-7 shrink-0 text-base font-bold tabular-nums leading-none ${segment.valueClass}`}
        style={{
          opacity: animate ? 1 : 0,
          transform: animate ? 'translateX(0)' : 'translateX(-6px)',
          transition: `opacity 0.4s ${CHART_EASE} ${rowIndex * 0.06}s, transform 0.4s ${CHART_EASE} ${rowIndex * 0.06}s`,
        }}
      >
        {formatStat(value)}
      </span>
      <div className="relative min-w-0 flex-1">
        <div
          className="flex cursor-default gap-[3px]"
          aria-describedby={`pixel-chart-tip-${segment.key}`}
        >
          {Array.from({ length: AGENDA_PIXEL_COUNT }, (_, pixelIndex) => {
            const isFilled = pixelIndex < filled
            const delay = rowIndex * 0.08 + pixelIndex * 0.045

            return (
              <span
                key={pixelIndex}
                className={[
                  'h-3.5 flex-1 rounded-[3px] transition-[transform,opacity,box-shadow] duration-500',
                  isFilled
                    ? `bg-gradient-to-br ${segment.gradient} ${segment.glow}`
                    : segment.empty,
                ].join(' ')}
                style={{
                  opacity: animate ? 1 : 0,
                  transform: animate
                    ? isFilled
                      ? 'scaleY(1) translateY(0)'
                      : 'scaleY(0.85) translateY(0)'
                    : 'scaleY(0) translateY(4px)',
                  transitionTimingFunction: CHART_EASE,
                  transitionDelay: `${delay}s`,
                }}
              />
            )
          })}
        </div>

        <div
          id={`pixel-chart-tip-${segment.key}`}
          role="tooltip"
          className={[
            'pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2',
            'whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-center shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
            'opacity-0 transition-opacity duration-150',
            'group-hover/chart-row:opacity-100',
          ].join(' ')}
        >
          <p className={`text-xs font-semibold ${segment.valueClass}`}>{segment.situation}</p>
          <p className="mt-0.5 text-[11px] font-medium text-white/80">{countLabel}</p>
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"
            aria-hidden
          />
        </div>
      </div>
    </div>
  )
}

type AgendaDayPixelChartProps = {
  className?: string
  summary: AgendaDaySummary
}

export function AgendaDayPixelChart({ className = '', summary }: AgendaDayPixelChartProps) {
  const [animate, setAnimate] = useState(false)
  const maxSegmentValue = useMemo(() => maxAgendaChartSegmentValue(summary), [summary])

  useEffect(() => {
    setAnimate(false)
    const timer = window.setTimeout(() => setAnimate(true), 80)
    return () => window.clearTimeout(timer)
  }, [summary])

  return (
    <div
      className={`space-y-2.5 overflow-visible ${className}`.trim()}
      aria-label="Distribuição dos agendamentos do dia"
    >
      {agendaChartSegments.map((segment, index) => (
        <PixelBar
          key={segment.key}
          segment={segment}
          value={segment.getValue(summary)}
          animate={animate}
          rowIndex={index}
          maxSegmentValue={maxSegmentValue}
        />
      ))}
    </div>
  )
}
