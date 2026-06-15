import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import {
  PosConsultaCheckinContext,
  PosConsultaCheckinRespostas,
  emptyPosConsultaCheckinRespostas,
} from '../../types/posConsulta'
import { PosConsultaCheckinStepper } from './PosConsultaCheckinStepper'
import { PosConsultaCheckinSuccess } from './PosConsultaCheckinSuccess'
import { PosConsultaMedicacaoStep } from './PosConsultaMedicacaoStep'
import { PosConsultaMedicoesStep } from './PosConsultaMedicoesStep'
import { PosConsultaSinaisAlertaStep } from './PosConsultaSinaisAlertaStep'
import { PosConsultaSintomasStep } from './PosConsultaSintomasStep'

type WizardStep = 'sintomas' | 'medicacao' | 'medicoes' | 'alertas' | 'success'

const STEP_ORDER: WizardStep[] = ['sintomas', 'medicacao', 'medicoes', 'alertas']

type PosConsultaCheckinWizardProps = {
  context: PosConsultaCheckinContext
  onSubmit: (respostas: PosConsultaCheckinRespostas) => Promise<string | null>
  submitError?: string | null
  onSuccessClose: () => void
  onStepChange?: (step: WizardStep) => void
}

export function PosConsultaCheckinWizard({
  context,
  onSubmit,
  submitError = null,
  onSuccessClose,
  onStepChange,
}: PosConsultaCheckinWizardProps) {
  const [step, setStep] = useState<WizardStep>('sintomas')
  const [respostas, setRespostas] = useState<PosConsultaCheckinRespostas>(
    emptyPosConsultaCheckinRespostas(),
  )
  const [nextCheckinLabel, setNextCheckinLabel] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stepIndex = step === 'success' ? STEP_ORDER.length : STEP_ORDER.indexOf(step)

  useEffect(() => {
    onStepChange?.(step)
  }, [onStepChange, step])

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
      <PosConsultaCheckinSuccess
        patientFirstName={context.patientFirstName}
        nextCheckinLabel={nextCheckinLabel ?? context.nextCheckinLabel}
        onClose={onSuccessClose}
      />
    )
  }

  return (
    <View>
      <Text style={styles.badge}>
        Acompanhamento pós-consulta · Dia {context.planDayNumber} de {context.planTotalDays}
      </Text>
      <Text style={styles.greeting}>Olá, {context.patientFirstName}</Text>
      <Text style={styles.meta}>
        {context.specialtyName} · {context.doctorName}
      </Text>
      <Text style={styles.metaSub}>
        Check-in {context.checkinNumber} de {context.totalCheckins}
      </Text>

      <PosConsultaCheckinStepper stepIndex={stepIndex} />

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      {step === 'sintomas' ? (
        <PosConsultaSintomasStep
          respostas={respostas}
          onChange={setRespostas}
          onContinue={() => setStep('medicacao')}
        />
      ) : null}

      {step === 'medicacao' ? (
        <PosConsultaMedicacaoStep
          respostas={respostas}
          onChange={setRespostas}
          onBack={() => setStep('sintomas')}
          onContinue={() => setStep('medicoes')}
        />
      ) : null}

      {step === 'medicoes' ? (
        <PosConsultaMedicoesStep
          respostas={respostas}
          requestedMeasurements={context.requestedMeasurements}
          onChange={setRespostas}
          onBack={() => setStep('medicacao')}
          onContinue={() => setStep('alertas')}
        />
      ) : null}

      {step === 'alertas' ? (
        <PosConsultaSinaisAlertaStep
          respostas={respostas}
          onChange={setRespostas}
          onBack={() => setStep('medicoes')}
          onSubmit={() => void handleSubmit()}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
  },
  greeting: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  metaSub: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.25)',
    backgroundColor: colors.errorBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
})
