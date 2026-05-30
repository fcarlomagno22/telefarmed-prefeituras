import { Building2, CalendarRange, Check, Stethoscope } from 'lucide-react'
import type { AdminEscalaComposeStepId } from './AdminEscalaComposeSteps'

const steps: {
  id: AdminEscalaComposeStepId
  label: string
  description: string
  icon: typeof Building2
}[] = [
  { id: 1, label: 'Cobertura', description: 'Prefeitura e UBTs', icon: Building2 },
  { id: 2, label: 'Especialidades', description: 'O que será atendido', icon: Stethoscope },
  {
    id: 3,
    label: 'Programação',
    description: 'Dias, horários e médicos',
    icon: CalendarRange,
  },
]

type AdminEscalaComposeSidebarProps = {
  activeStep: AdminEscalaComposeStepId
  maxReachableStep: AdminEscalaComposeStepId
  onStepChange: (step: AdminEscalaComposeStepId) => void
}

export function AdminEscalaComposeSidebar({
  activeStep,
  maxReachableStep,
  onStepChange,
}: AdminEscalaComposeSidebarProps) {
  return (
    <nav
      className="flex h-full w-[17.5rem] shrink-0 flex-col border-r border-gray-200/80 bg-white px-4 py-6"
      aria-label="Etapas"
    >
      <p className="mb-6 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
        Montagem
      </p>
      <ol className="relative flex flex-col gap-1">
        <span
          className="absolute bottom-4 left-[1.125rem] top-4 w-px bg-gray-200"
          aria-hidden
        />
        {steps.map((step) => {
          const isActive = activeStep === step.id
          const isDone = step.id < activeStep
          const canClick = step.id <= maxReachableStep
          const Icon = step.icon

          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepChange(step.id)}
                className={[
                  'group flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition',
                  isActive ? 'bg-[var(--brand-primary-light)]/60' : canClick ? 'hover:bg-gray-50' : '',
                  !canClick ? 'cursor-not-allowed opacity-45' : '',
                ].join(' ')}
              >
                <span
                  className={[
                    'relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-[0_4px_14px_rgba(255,107,0,0.35)]'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-gray-500 ring-2 ring-gray-200',
                  ].join(' ')}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={2.5} /> : step.id}
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
                  <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
