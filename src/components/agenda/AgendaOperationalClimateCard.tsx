import { useEffect, useMemo, useState } from 'react'
import type { AgendaOperationalClimate } from '../../data/agendaMock'

const CHART_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

type AgendaOperationalClimateCardProps = {
  operationalClimate: AgendaOperationalClimate
}

export function AgendaOperationalClimateCard({
  operationalClimate,
}: AgendaOperationalClimateCardProps) {
  const [animate, setAnimate] = useState(false)
  const { hourlySlots } = operationalClimate

  const maxSlotCount = useMemo(
    () => Math.max(...hourlySlots.map((slot) => slot.count), 1),
    [hourlySlots],
  )

  useEffect(() => {
    setAnimate(false)
    const timer = window.setTimeout(() => setAnimate(true), 160)
    return () => window.clearTimeout(timer)
  }, [hourlySlots])

  return (
    <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
      <header>
        <h2 className="text-lg font-bold text-gray-900">Clima operacional</h2>
        <p className="mt-0.5 text-xs text-gray-500">Planeje a equipe pelo volume do dia</p>
      </header>

      <div
        className="mt-4 flex items-end justify-between gap-1.5"
        role="img"
        aria-label="Distribuição de atendimentos por horário"
      >
        {hourlySlots.map((slot, index) => {
          const heightPercent = (slot.count / maxSlotCount) * 100
          const barHeight = Math.max(28, (heightPercent / 100) * 72)

          return (
            <div key={slot.hour} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={`text-[10px] font-bold tabular-nums transition-opacity duration-500 ${
                  slot.isPeak ? 'text-[var(--brand-primary)]' : 'text-gray-500'
                }`}
                style={{
                  opacity: animate ? 1 : 0,
                  transitionDelay: `${0.2 + index * 0.06}s`,
                }}
              >
                {slot.count}
              </span>
              <div
                className="flex w-full items-end justify-center"
                style={{ height: 72 }}
              >
                <span
                  className={[
                    'w-full max-w-7 rounded-t-md transition-[height,opacity] duration-700',
                    slot.isPeak
                      ? 'bg-gradient-to-t from-[#e55f00] via-[var(--brand-primary)] to-[#ff9a3d] shadow-[0_0_12px_rgba(255,107,0,0.35)]'
                      : 'bg-gradient-to-t from-gray-400 to-gray-300',
                  ].join(' ')}
                  style={{
                    height: animate ? barHeight : 0,
                    opacity: animate ? 1 : 0,
                    transitionTimingFunction: CHART_EASE,
                    transitionDelay: `${0.1 + index * 0.08}s`,
                  }}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  slot.isPeak ? 'text-[var(--brand-primary)]' : 'text-gray-500'
                }`}
              >
                {slot.hour}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
