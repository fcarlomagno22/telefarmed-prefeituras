import {
  resolveUbtPasswordRecoveryStepperStep,
  ubtPasswordRecoverySteps,
  type UbtPasswordRecoveryStepId,
} from '../../../config/ubtPasswordRecovery'

type UbtPasswordRecoveryStepperProps = {
  currentStep: UbtPasswordRecoveryStepId
}

export function UbtPasswordRecoveryStepper({ currentStep }: UbtPasswordRecoveryStepperProps) {
  const stepperStep = resolveUbtPasswordRecoveryStepperStep(currentStep)
  const activeIndex = ubtPasswordRecoverySteps.findIndex((step) => step.id === stepperStep)
  const progress = ((activeIndex + 1) / ubtPasswordRecoverySteps.length) * 100

  return (
    <nav aria-label="Etapas da recuperação de senha" className="shrink-0 px-6 pb-4 pt-1">
      <div className="h-0.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={activeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={ubtPasswordRecoverySteps.length}
        />
      </div>
    </nav>
  )
}
