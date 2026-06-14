import type {
  MedicoCadastroFormStep,
  MedicoCadastroFormStepId,
} from '../../../config/medicoCadastroForm'

type MedicoCadastroFormStepperProps = {
  currentStep: MedicoCadastroFormStepId
  steps: MedicoCadastroFormStep[]
}

export function MedicoCadastroFormStepper({
  currentStep,
  steps,
}: MedicoCadastroFormStepperProps) {
  const activeIndex = steps.findIndex((step) => step.id === currentStep)
  const progress = ((activeIndex + 1) / steps.length) * 100

  return (
    <nav aria-label="Etapas do cadastro" className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-gray-500">
          Etapa{' '}
          <span className="font-bold tabular-nums text-gray-800">{activeIndex + 1}</span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-gray-800">{steps.length}</span>
        </span>
        <span className="font-semibold text-[var(--brand-primary)]">
          {steps[activeIndex]?.label}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[#ff9333] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={activeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
        />
      </div>

      <ol className="mt-3 hidden gap-2 sm:flex">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isDone = index < activeIndex

          return (
            <li
              key={step.id}
              className={[
                'flex-1 rounded-lg border px-2 py-1.5 text-center text-[10px] font-semibold leading-tight transition',
                isActive
                  ? 'border-[var(--brand-primary)]/30 bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                  : isDone
                    ? 'border-emerald-100 bg-emerald-50/80 text-emerald-700'
                    : 'border-gray-100 bg-gray-50/80 text-gray-400',
              ].join(' ')}
              aria-current={isActive ? 'step' : undefined}
            >
              {step.label}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
