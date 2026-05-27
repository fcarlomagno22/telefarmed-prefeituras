import { useEffect, useRef, useState } from 'react'
import {
  adminProfessionalCreateFlowSteps,
  resolveAdminProfessionalCreateStepIndex,
  type AdminProfessionalCreateStep,
} from './adminProfessionalCreateTypes'

type AdminProfessionalCreateFlowStepperProps = {
  step: AdminProfessionalCreateStep
}

export function AdminProfessionalCreateFlowStepper({
  step,
}: AdminProfessionalCreateFlowStepperProps) {
  const activeIndex = resolveAdminProfessionalCreateStepIndex(step)
  const [fillRatio, setFillRatio] = useState(0)
  const fillRatioRef = useRef(0)

  const total = adminProfessionalCreateFlowSteps.length
  const allDone = step === 'success'
  const stepNumber = allDone ? total : activeIndex + 1
  const currentLabel = allDone
    ? 'Profissional cadastrado'
    : adminProfessionalCreateFlowSteps[activeIndex]?.label ?? ''

  const targetRatio = allDone ? 1 : (activeIndex + 1) / total

  useEffect(() => {
    const from = fillRatioRef.current
    const to = targetRatio
    if (from === to) return

    let start: number | null = null
    let rafId = 0
    const durationMs = 700

    function tick(now: number) {
      if (start === null) start = now
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (to - from) * eased
      fillRatioRef.current = next
      setFillRatio(next)
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [targetRatio])

  return (
    <nav
      aria-label="Progresso do cadastro de profissional"
      className="shrink-0 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          Passo <span className="tabular-nums text-gray-800">{stepNumber}</span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-gray-800">{total}</span>
        </p>
        <p className="truncate text-sm font-semibold text-[var(--brand-primary)]">
          {currentLabel}
        </p>
      </div>

      <div className="flex gap-1.5">
        {adminProfessionalCreateFlowSteps.map((flowStep, index) => {
          const segmentStart = index / total
          const segmentEnd = (index + 1) / total
          const segmentFill =
            fillRatio <= segmentStart
              ? 0
              : fillRatio >= segmentEnd
                ? 1
                : (fillRatio - segmentStart) / (segmentEnd - segmentStart)

          return (
            <div key={flowStep.id} className="min-w-0 flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="attendance-flow-segment-fill h-full w-full origin-left rounded-full motion-reduce:transition-none"
                  style={{
                    transform: `scaleX(${segmentFill})`,
                    backgroundPosition: `${(index / Math.max(total - 1, 1)) * 100}% 0`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
