import { useState } from 'react'
import type { PosConsultaCheckinContext, PosConsultaCheckinRespostas } from '../../types/posConsulta'
import { emptyPosConsultaCheckinRespostas } from '../../types/posConsulta'
import { EvolucaoCheckinStepper } from './EvolucaoCheckinStepper'
import { EvolucaoMedicacaoStep } from './EvolucaoMedicacaoStep'
import { EvolucaoMedicoesStep } from './EvolucaoMedicoesStep'
import { EvolucaoSinaisAlertaStep } from './EvolucaoSinaisAlertaStep'
import { EvolucaoSintomasStep } from './EvolucaoSintomasStep'
import { EvolucaoCheckinSuccess } from './EvolucaoCheckinSuccess'

type WizardStep = 'sintomas' | 'medicacao' | 'medicoes' | 'alertas' | 'success'

const STEP_ORDER: WizardStep[] = ['sintomas', 'medicacao', 'medicoes', 'alertas']

type EvolucaoCheckinWizardProps = {
  context: PosConsultaCheckinContext
  onSubmit: (respostas: PosConsultaCheckinRespostas) => Promise<string | null>
  submitError?: string | null
}

export function EvolucaoCheckinWizard({
  context,
  onSubmit,
  submitError = null,
}: EvolucaoCheckinWizardProps) {
  const [step, setStep] = useState<WizardStep>('sintomas')
  const [respostas, setRespostas] = useState<PosConsultaCheckinRespostas>(
    emptyPosConsultaCheckinRespostas(),
  )
  const [nextCheckinLabel, setNextCheckinLabel] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stepIndex = step === 'success' ? STEP_ORDER.length : STEP_ORDER.indexOf(step)

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const next = await onSubmit(respostas)
      setNextCheckinLabel(next)
      setStep('success')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'success') {
    return (
      <EvolucaoCheckinSuccess
        patientFirstName={context.patientFirstName}
        nextCheckinLabel={nextCheckinLabel ?? context.nextCheckinLabel}
      />
    )
  }

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-[var(--brand-primary)]">
          Acompanhamento pós-consulta · Dia {context.planDayNumber} de {context.planTotalDays}
        </p>
        <h1 className="mt-2 text-lg font-bold text-gray-900 sm:text-xl">
          Olá, {context.patientFirstName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {context.specialtyName} · {context.doctorName}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Check-in {context.checkinNumber} de {context.totalCheckins}
        </p>
      </div>

      <EvolucaoCheckinStepper stepIndex={stepIndex} />

      {submitError ? (
        <p className="mb-4 text-sm font-medium text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}

      {step === 'sintomas' ? (
        <EvolucaoSintomasStep
          respostas={respostas}
          onChange={setRespostas}
          onContinue={() => setStep('medicacao')}
        />
      ) : null}

      {step === 'medicacao' ? (
        <EvolucaoMedicacaoStep
          respostas={respostas}
          onChange={setRespostas}
          onBack={() => setStep('sintomas')}
          onContinue={() => setStep('medicoes')}
        />
      ) : null}

      {step === 'medicoes' ? (
        <EvolucaoMedicoesStep
          respostas={respostas}
          requestedMeasurements={context.requestedMeasurements}
          onChange={setRespostas}
          onBack={() => setStep('medicacao')}
          onContinue={() => setStep('alertas')}
        />
      ) : null}

      {step === 'alertas' ? (
        <EvolucaoSinaisAlertaStep
          respostas={respostas}
          onChange={setRespostas}
          onBack={() => setStep('medicoes')}
          onSubmit={() => void handleSubmit()}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </div>
  )
}
