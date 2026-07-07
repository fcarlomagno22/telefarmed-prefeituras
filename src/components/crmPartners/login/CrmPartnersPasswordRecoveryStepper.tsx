import {
  crmPartnersPasswordRecoverySteps,
  resolveCrmPartnersPasswordRecoveryStepperStep,
  type CrmPartnersPasswordRecoveryStepId,
} from '../../../config/crmPartnersPasswordRecovery'

type CrmPartnersPasswordRecoveryStepperProps = {
  currentStep: CrmPartnersPasswordRecoveryStepId
}

export function CrmPartnersPasswordRecoveryStepper({
  currentStep,
}: CrmPartnersPasswordRecoveryStepperProps) {
  const stepperStep = resolveCrmPartnersPasswordRecoveryStepperStep(currentStep)
  const activeIndex = crmPartnersPasswordRecoverySteps.findIndex((step) => step.id === stepperStep)
  const progress = ((activeIndex + 1) / crmPartnersPasswordRecoverySteps.length) * 100

  return (
    <nav aria-label="Etapas da recuperação de senha" className="shrink-0 px-6 pb-4 pt-1">
      <div className="h-0.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={activeIndex + 1}
          aria-valuemin={1}
          aria-valuemax={crmPartnersPasswordRecoverySteps.length}
        />
      </div>
    </nav>
  )
}
