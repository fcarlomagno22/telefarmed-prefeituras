import { useEffect, useRef, useState } from 'react'
import {
  adminEntidadeCadastroFlowSteps,
  resolveAdminEntidadeCadastroStepIndex,
  type AdminEntidadeCadastroStep,
} from './adminEntidadeCadastroTypes'

type AdminEntidadeCadastroFlowStepperProps = {
  step: AdminEntidadeCadastroStep
}

export function AdminEntidadeCadastroFlowStepper({ step }: AdminEntidadeCadastroFlowStepperProps) {
  const activeIndex = resolveAdminEntidadeCadastroStepIndex(step)
  const [fillRatio, setFillRatio] = useState(0)
  const fillRatioRef = useRef(0)

  const total = adminEntidadeCadastroFlowSteps.length
  const stepNumber = activeIndex + 1
  const currentLabel = adminEntidadeCadastroFlowSteps[activeIndex]?.label ?? ''
  const targetRatio = (activeIndex + 1) / total

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
      aria-label="Progresso do cadastro de entidade"
      className="shrink-0 rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          Passo <span className="tabular-nums text-gray-800">{stepNumber}</span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-gray-800">{total}</span>
        </p>
        <p className="truncate text-sm font-semibold text-[var(--brand-primary)]">{currentLabel}</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={total}
        className="flex gap-1.5"
      >
        {adminEntidadeCadastroFlowSteps.map((flowStep, index) => {
          const segmentStart = index / total
          const segmentEnd = (index + 1) / total
          const segmentFill =
            fillRatio <= segmentStart
              ? 0
              : fillRatio >= segmentEnd
                ? 1
                : (fillRatio - segmentStart) / (segmentEnd - segmentStart)

          return (
            <div
              key={flowStep.id}
              className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100"
              title={flowStep.label}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-400"
                style={{ width: `${segmentFill * 100}%` }}
              />
            </div>
          )
        })}
      </div>
    </nav>
  )
}
