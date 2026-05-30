import { Building2, CalendarRange, Check, Stethoscope } from 'lucide-react'

export const adminEscalaComposeSteps = [
  { id: 1, label: 'Cobertura', short: 'Prefeitura e UBT', icon: Building2 },
  { id: 2, label: 'Especialidades', short: 'O que atender', icon: Stethoscope },
  { id: 3, label: 'Programação', short: 'Dias, horários e médicos', icon: CalendarRange },
] as const

export type AdminEscalaComposeStepId = (typeof adminEscalaComposeSteps)[number]['id']

type AdminEscalaComposeStepsProps = {
  activeStep: AdminEscalaComposeStepId
  maxReachableStep: AdminEscalaComposeStepId
  onStepChange: (step: AdminEscalaComposeStepId) => void
  layout?: 'compact' | 'bar'
}

export function AdminEscalaComposeSteps({
  activeStep,
  maxReachableStep,
  onStepChange,
  layout = 'compact',
}: AdminEscalaComposeStepsProps) {
  if (layout === 'bar') {
    return (
      <nav className="flex w-full min-w-0 items-stretch gap-2" aria-label="Etapas">
        {adminEscalaComposeSteps.map((step, index) => {
          const isActive = activeStep === step.id
          const isDone = step.id < activeStep
          const canClick = step.id <= maxReachableStep
          const Icon = step.icon

          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              {index > 0 ? (
                <span
                  className={[
                    'hidden h-px w-3 shrink-0 sm:block',
                    isDone || isActive ? 'bg-[var(--brand-primary)]/40' : 'bg-gray-200',
                  ].join(' ')}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepChange(step.id)}
                className={[
                  'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition sm:px-4',
                  isActive
                    ? 'bg-[var(--brand-primary-light)]/70 ring-1 ring-[var(--brand-primary)]/25'
                    : canClick
                      ? 'bg-white ring-1 ring-gray-200/80 hover:bg-gray-50'
                      : 'cursor-not-allowed bg-gray-50/80 opacity-50 ring-1 ring-gray-100',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600',
                  ].join(' ')}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.id}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span
                    className={[
                      'block truncate text-xs font-bold',
                      isActive ? 'text-gray-900' : 'text-gray-700',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                  <span className="block truncate text-[10px] text-gray-500">{step.short}</span>
                </span>
                <Icon
                  className={[
                    'h-4 w-4 shrink-0 sm:hidden',
                    isActive ? 'text-[var(--brand-primary)]' : 'text-gray-400',
                  ].join(' ')}
                  strokeWidth={2}
                />
              </button>
            </div>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      className="grid grid-cols-3 gap-1 rounded-xl border border-gray-200 bg-gray-100/80 p-1"
      aria-label="Etapas"
    >
      {adminEscalaComposeSteps.map((step) => {
        const isActive = activeStep === step.id
        const isDone = step.id < activeStep
        const canClick = step.id <= maxReachableStep
        const Icon = step.icon

        return (
          <button
            key={step.id}
            type="button"
            disabled={!canClick}
            onClick={() => canClick && onStepChange(step.id)}
            className={[
              'flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-2.5 text-center transition sm:flex-row sm:justify-center sm:gap-2 sm:px-3',
              isActive
                ? 'bg-white text-[var(--brand-primary)] shadow-sm'
                : canClick
                  ? 'text-gray-700 hover:bg-white/60'
                  : 'cursor-not-allowed text-gray-400',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                isActive
                  ? 'bg-[var(--brand-primary)] text-white'
                  : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-600',
              ].join(' ')}
            >
              {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step.id}
            </span>
            <span className="truncate text-[10px] font-bold sm:text-xs">{step.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
