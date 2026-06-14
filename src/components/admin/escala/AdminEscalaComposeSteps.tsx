import { CalendarRange, Check, Landmark, Stethoscope } from 'lucide-react'

export const adminEscalaComposeSteps = [
  { id: 1, label: 'Prefeitura', short: 'Onde publicar', icon: Landmark },
  { id: 2, label: 'Período', short: 'Datas da escala', icon: CalendarRange },
  { id: 3, label: 'Plantão', short: 'Horário e valor', icon: Stethoscope },
] as const

export type AdminEscalaComposeStepId = (typeof adminEscalaComposeSteps)[number]['id']

type AdminEscalaComposeStepsProps = {
  activeStep: AdminEscalaComposeStepId
  maxReachableStep: AdminEscalaComposeStepId
  onStepChange: (step: AdminEscalaComposeStepId) => void
  layout?: 'horizontal' | 'vertical'
}

export function AdminEscalaComposeSteps({
  activeStep,
  maxReachableStep,
  onStepChange,
  layout = 'horizontal',
}: AdminEscalaComposeStepsProps) {
  if (layout === 'vertical') {
    return (
      <nav className="flex flex-col gap-1" aria-label="Etapas da escala">
        {adminEscalaComposeSteps.map((step, index) => {
          const isActive = activeStep === step.id
          const isDone = step.id < activeStep
          const canClick = step.id <= maxReachableStep
          const Icon = step.icon

          return (
            <div key={step.id} className="relative flex gap-3">
              {index < adminEscalaComposeSteps.length - 1 ? (
                <span
                  className={[
                    'absolute left-[1.125rem] top-10 h-[calc(100%-0.25rem)] w-px',
                    isDone ? 'bg-[var(--brand-primary)]/40' : 'bg-gray-200',
                  ].join(' ')}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepChange(step.id)}
                className={[
                  'relative z-[1] flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition',
                  isActive
                    ? 'bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)] ring-1 ring-gray-200/80'
                    : canClick
                      ? 'hover:bg-white/70'
                      : 'cursor-not-allowed opacity-45',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-[0_4px_12px_rgba(255,107,0,0.35)]'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-200 text-gray-600',
                  ].join(' ')}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Icon
                      className={[
                        'h-3.5 w-3.5',
                        isActive ? 'text-[var(--brand-primary)]' : 'text-gray-400',
                      ].join(' ')}
                      strokeWidth={2}
                    />
                    <span
                      className={[
                        'text-sm font-bold',
                        isActive ? 'text-gray-900' : 'text-gray-700',
                      ].join(' ')}
                    >
                      {step.label}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{step.short}</span>
                </span>
              </button>
            </div>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="flex w-full gap-2" aria-label="Etapas da escala">
      {adminEscalaComposeSteps.map((step) => {
        const isActive = activeStep === step.id
        const isDone = step.id < activeStep
        const canClick = step.id <= maxReachableStep

        return (
          <button
            key={step.id}
            type="button"
            disabled={!canClick}
            onClick={() => canClick && onStepChange(step.id)}
            className={[
              'flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition sm:text-sm',
              isActive
                ? 'bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]'
                : isDone
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  : canClick
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                    : 'cursor-not-allowed bg-gray-50 text-gray-400',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]',
                isActive ? 'bg-white/20' : isDone ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500',
              ].join(' ')}
            >
              {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : step.id}
            </span>
            <span className="truncate">{step.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
