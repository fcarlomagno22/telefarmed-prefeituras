import { useEffect, useRef, useState } from 'react'
import type { StationStatus } from '../../types/attendance'

const flowSteps = [
  { id: 'specialty', label: 'Especialidade' },
  { id: 'registration', label: 'Cadastro' },
  { id: 'triage', label: 'Triagem' },
] as const

const flowStepStatuses: StationStatus[] = [
  'specialty',
  'cpf_lookup',
  'confirm_registration',
  'age_group',
  'registration',
  'contacts',
  'address',
  'photo',
  'registration_consent',
  'clinical_triage',
  'waiting_room',
]

function resolveActiveIndex(status: StationStatus): number {
  if (status === 'waiting_doctor' || status === 'in_consultation') {
    return flowSteps.length
  }

  switch (status) {
    case 'specialty':
      return 0
    case 'cpf_lookup':
    case 'confirm_registration':
    case 'age_group':
    case 'registration':
    case 'contacts':
    case 'address':
    case 'photo':
    case 'registration_consent':
      return 1
    case 'clinical_triage':
    case 'waiting_room':
      return 2
    default:
      return -1
  }
}

type AttendanceFlowStepperProps = {
  status: StationStatus
}

export function AttendanceFlowStepper({ status }: AttendanceFlowStepperProps) {
  const activeIndex = resolveActiveIndex(status)
  const [fillRatio, setFillRatio] = useState(0)
  const fillRatioRef = useRef(0)

  const total = flowSteps.length
  const allDone = activeIndex >= total
  const stepNumber = allDone ? total : activeIndex + 1
  const currentLabel = allDone
    ? 'Pronto para consulta'
    : flowSteps[activeIndex]?.label ?? ''

  const targetRatio = allDone ? 1 : (activeIndex + 1) / total

  useEffect(() => {
    const from = fillRatioRef.current
    const to = targetRatio
    if (from === to) return

    let start: number | null = null
    let rafId = 0
    const durationMs = 900

    function tick(now: number) {
      if (start === null) start = now
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - (1 - progress) ** 3
      const next = from + (to - from) * eased
      fillRatioRef.current = next
      setFillRatio(next)

      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [targetRatio])

  if (activeIndex < 0) return null

  return (
    <nav
      aria-label="Progresso do atendimento"
      className="relative z-10 mt-4 shrink-0 rounded-xl border border-gray-200 bg-white/95 px-4 py-3 shadow-sm sm:mt-5 sm:px-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          Passo{' '}
          <span className="tabular-nums text-gray-800">{stepNumber}</span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-gray-800">{total}</span>
        </p>
        <p className="truncate text-sm font-semibold text-[var(--brand-primary)]">
          {currentLabel}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`${currentLabel} — passo ${stepNumber} de ${total}`}
        className="flex gap-1.5"
      >
        {flowSteps.map((step, index) => {
          const segmentStart = index / total
          const segmentEnd = (index + 1) / total
          const segmentFill =
            fillRatio <= segmentStart
              ? 0
              : fillRatio >= segmentEnd
                ? 1
                : (fillRatio - segmentStart) / (segmentEnd - segmentStart)

          return (
            <div key={step.id} className="min-w-0 flex-1">
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

export function isFlowStepStatus(status: StationStatus): boolean {
  return (
    flowStepStatuses.includes(status) ||
    status === 'waiting_doctor' ||
    status === 'in_consultation'
  )
}
