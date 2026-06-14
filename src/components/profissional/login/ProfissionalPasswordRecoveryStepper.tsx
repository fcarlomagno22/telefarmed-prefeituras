import {
  resolveProfissionalPasswordRecoveryStepperStep,
  profissionalPasswordRecoverySteps,
  type ProfissionalPasswordRecoveryStepId,
} from '../../../config/profissionalPasswordRecovery'

type ProfissionalPasswordRecoveryStepperProps = {
  currentStep: ProfissionalPasswordRecoveryStepId
}

export function ProfissionalPasswordRecoveryStepper({ currentStep }: ProfissionalPasswordRecoveryStepperProps) {
  const stepperStep = resolveProfissionalPasswordRecoveryStepperStep(currentStep)
  const activeIndex = profissionalPasswordRecoverySteps.findIndex((step) => step.id === stepperStep)
  const progress = ((activeIndex + 1) / profissionalPasswordRecoverySteps.length) * 100

  return (
    <nav aria-label="Etapas da recuperação de senha" className="shrink-0 px-6 pb-4 pt-1">
      <div className="h-0.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={activeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={profissionalPasswordRecoverySteps.length}
        />
      </div>
    </nav>
  )
}
