import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import type { ActivityFeedbackKey } from '../../mentalHealthEngine/renderCopyEngine'
import { renderFeedbackThankYou } from '../../mentalHealthEngine/renderCopyEngine'
import { colors } from '../../theme/colors'
import {
  formatActivityTimer,
  getCatalogActivity,
  type CatalogActivity,
} from '../../utils/mentalHealthActivityCatalog'
import { AppModal } from '../AppModal'
import { PrimaryButton } from '../PrimaryButton'
import { MentalHealthActivityFeedback } from './MentalHealthActivityFeedback'
import { MentalHealthActivityExitDrawer } from './MentalHealthActivityExitDrawer'

type SessionPhase = 'step' | 'reflection' | 'feedback' | 'done'
type ExitDrawerVariant = 'exit' | 'support' | null

type MentalHealthActivitySessionProps = {
  visible: boolean
  activityId: string
  planDate: string
  onClose: () => void
  onNotFeelingWell: () => void
  onStarted: (activityId: string, planDate: string) => Promise<void> | void
  onCompleted: (activityId: string, planDate: string) => Promise<void> | void
  onFeedback: (
    activityId: string,
    planDate: string,
    feedback: ActivityFeedbackKey,
  ) => Promise<void> | void
}

export function MentalHealthActivitySession({
  visible,
  activityId,
  planDate,
  onClose,
  onNotFeelingWell,
  onStarted,
  onCompleted,
  onFeedback,
}: MentalHealthActivitySessionProps) {
  const insets = useSafeAreaInsets()
  const activity = useMemo(
    () => (visible ? getCatalogActivity(activityId) : null),
    [activityId, visible],
  )

  const [phase, setPhase] = useState<SessionPhase>('step')
  const [stepIndex, setStepIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null)
  const [exitDrawer, setExitDrawer] = useState<ExitDrawerVariant>(null)
  const hasMarkedStartedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const steps = activity?.steps ?? []
  const currentStep = steps[stepIndex] ?? null
  const hasTimedStep = (currentStep?.duration_sec ?? 0) > 0

  const resetSession = useCallback(() => {
    setPhase('step')
    setStepIndex(0)
    setSecondsLeft(0)
    setIsPaused(false)
    setReflectionText('')
    setSubmittingFeedback(false)
    setThankYouMessage(null)
    setExitDrawer(null)
    hasMarkedStartedRef.current = false
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const advanceFromStep = useCallback(async () => {
    if (!activity) return

    const isLastStep = stepIndex >= steps.length - 1
    if (!isLastStep) {
      setStepIndex((current) => current + 1)
      return
    }

    if (activity.reflection_prompt_optional) {
      setPhase('reflection')
      return
    }

    await Promise.resolve(onCompleted(activityId, planDate))
    setPhase('feedback')
  }, [activity, activityId, onCompleted, planDate, stepIndex, steps.length])

  useEffect(() => {
    if (!visible) {
      resetSession()
      void deactivateKeepAwake()
      return
    }

    void activateKeepAwakeAsync()
    resetSession()
  }, [activityId, planDate, resetSession, visible])

  useEffect(() => {
    if (!visible || !activity || hasMarkedStartedRef.current) return
    hasMarkedStartedRef.current = true
    void Promise.resolve(onStarted(activityId, planDate))
  }, [activity, activityId, onStarted, planDate, visible])

  useEffect(() => {
    if (!visible || !activity || steps.length > 0) return

    if (activity.reflection_prompt_optional) {
      setPhase('reflection')
      return
    }

    void Promise.resolve(onCompleted(activityId, planDate)).then(() => {
      setPhase('feedback')
    })
  }, [activity, activityId, onCompleted, planDate, steps.length, visible])

  useEffect(() => {
    if (!visible || phase !== 'step' || !currentStep) return

    if (!hasTimedStep) {
      setSecondsLeft(0)
      return
    }

    setSecondsLeft(currentStep.duration_sec ?? 0)
    setIsPaused(false)
  }, [currentStep, hasTimedStep, phase, stepIndex, visible])

  useEffect(() => {
    if (!visible || phase !== 'step' || !hasTimedStep || isPaused || secondsLeft <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return current - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [hasTimedStep, isPaused, phase, secondsLeft, visible])

  useEffect(() => {
    if (!visible || phase !== 'step' || !hasTimedStep || isPaused || secondsLeft > 0) return
    void advanceFromStep()
  }, [advanceFromStep, hasTimedStep, isPaused, phase, secondsLeft, visible])

  function handleClosePress() {
    setExitDrawer('exit')
  }

  function handleNotFeelingWell() {
    setExitDrawer('support')
  }

  function handleExitDrawerContinue() {
    setExitDrawer(null)
  }

  function handleExitDrawerConfirm() {
    const variant = exitDrawer
    setExitDrawer(null)
    void deactivateKeepAwake()
    onClose()
    if (variant === 'support') {
      onNotFeelingWell()
    }
  }

  useAndroidBackHandler(() => {
    if (!visible) return false
    handleClosePress()
    return true
  }, visible)

  async function handleContinueStep() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await advanceFromStep()
  }

  async function handleReflectionContinue() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await Promise.resolve(onCompleted(activityId, planDate))
    setPhase('feedback')
  }

  async function handleFeedbackSelect(feedback: ActivityFeedbackKey) {
    setSubmittingFeedback(true)
    try {
      await onFeedback(activityId, planDate, feedback)
      setThankYouMessage(renderFeedbackThankYou(feedback, activityId, planDate))
      setPhase('done')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  function handleDoneClose() {
    void deactivateKeepAwake()
    onClose()
  }

  if (!visible || !activity) return null

  return (
    <AppModal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(8, 145, 178, 0.18)', '#0a0a0c', '#0a0a0c']}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleClosePress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Fechar atividade"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>

          <View style={styles.topCenter}>
            <Text style={styles.eyebrow}>Cuidado guiado</Text>
            <Text style={styles.title} numberOfLines={2}>
              {activity.title}
            </Text>
            {activity.subtitle_user ? (
              <Text style={styles.sessionSubtitle} numberOfLines={2}>
                {activity.subtitle_user}
              </Text>
            ) : null}
          </View>

          <View style={styles.iconBtnSpacer} />
        </View>

        <View style={styles.body}>
          {phase === 'step' && currentStep ? (
            <StepPhase
              activity={activity}
              stepIndex={stepIndex}
              totalSteps={steps.length}
              instruction={currentStep.instruction_user}
              secondsLeft={secondsLeft}
              hasTimedStep={hasTimedStep}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused((current) => !current)}
              onContinue={() => void handleContinueStep()}
            />
          ) : null}

          {phase === 'reflection' ? (
            <ReflectionPhase
              prompt={activity.reflection_prompt_optional ?? ''}
              value={reflectionText}
              onChange={setReflectionText}
              onContinue={() => void handleReflectionContinue()}
            />
          ) : null}

          {phase === 'feedback' ? (
            <View style={styles.centerBlock}>
              <Text style={styles.phaseTitle}>Como foi para você?</Text>
              <MentalHealthActivityFeedback
                activityId={activityId}
                planDate={planDate}
                promptOverride={activity.feedback_question}
                submitting={submittingFeedback}
                onSelect={(feedback) => void handleFeedbackSelect(feedback)}
              />
            </View>
          ) : null}

          {phase === 'done' ? (
            <View style={styles.centerBlock}>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark" size={28} color="#86efac" />
              </View>
              <Text style={styles.phaseTitle}>Obrigado por cuidar de você</Text>
              {thankYouMessage ? <Text style={styles.doneBody}>{thankYouMessage}</Text> : null}
              <PrimaryButton label="Fechar" onPress={handleDoneClose} />
            </View>
          ) : null}
        </View>

        {phase === 'step' ? (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Pressable
              onPress={handleNotFeelingWell}
              style={({ pressed }) => [styles.notWellBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Não estou bem, parar atividade e ver opções de apoio"
            >
              <Text style={styles.notWellText}>Não estou bem, parar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <MentalHealthActivityExitDrawer
        visible={exitDrawer != null}
        variant={exitDrawer ?? 'exit'}
        onContinue={handleExitDrawerContinue}
        onConfirm={handleExitDrawerConfirm}
      />
    </AppModal>
  )
}

function StepPhase({
  activity,
  stepIndex,
  totalSteps,
  instruction,
  secondsLeft,
  hasTimedStep,
  isPaused,
  onTogglePause,
  onContinue,
}: {
  activity: CatalogActivity
  stepIndex: number
  totalSteps: number
  instruction: string
  secondsLeft: number
  hasTimedStep: boolean
  isPaused: boolean
  onTogglePause: () => void
  onContinue: () => void
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepMeta}>
        Passo {stepIndex + 1} de {totalSteps}
      </Text>

      {hasTimedStep ? (
        <View style={styles.timerRing}>
          <Text style={styles.timerValue}>{formatActivityTimer(secondsLeft)}</Text>
          <Text style={styles.timerHint}>{isPaused ? 'Pausado' : 'Siga no seu ritmo'}</Text>
        </View>
      ) : null}

      <Text style={styles.instruction}>{instruction}</Text>

      {activity.objective_user ? (
        <Text style={styles.objective}>{activity.objective_user}</Text>
      ) : null}

      <View style={styles.stepActions}>
        {hasTimedStep ? (
          <Pressable
            onPress={onTogglePause}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryActionText}>{isPaused ? 'Retomar' : 'Pausar'}</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}
        >
          <Text style={styles.primaryActionText}>
            {hasTimedStep && secondsLeft > 0 ? 'Pular para o próximo' : 'Continuar'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#1a1208" />
        </Pressable>
      </View>
    </View>
  )
}

function ReflectionPhase({
  prompt,
  value,
  onChange,
  onContinue,
}: {
  prompt: string
  value: string
  onChange: (value: string) => void
  onContinue: () => void
}) {
  return (
    <View style={styles.reflectionWrap}>
      <Text style={styles.phaseTitle}>Um momento para refletir</Text>
      <Text style={styles.reflectionPrompt}>{prompt}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Opcional — escreva se quiser"
        placeholderTextColor={colors.textSubtle}
        multiline
        maxLength={280}
        style={styles.reflectionInput}
      />
      <PrimaryButton label="Continuar" onPress={onContinue} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconBtnSpacer: {
    width: 40,
    height: 40,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  eyebrow: {
    color: 'rgba(103, 232, 249, 0.85)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  sessionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    paddingTop: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  stepWrap: {
    gap: 20,
    alignItems: 'center',
  },
  stepMeta: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  timerRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(103, 232, 249, 0.35)',
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    gap: 4,
  },
  timerValue: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -1,
  },
  timerHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  instruction: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  objective: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  stepActions: {
    width: '100%',
    gap: 10,
    paddingTop: 8,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#ffb86a',
  },
  primaryActionText: {
    flex: 1,
    color: '#1a1208',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryActionText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  reflectionWrap: {
    gap: 16,
  },
  phaseTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  reflectionPrompt: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  reflectionInput: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  centerBlock: {
    gap: 18,
    alignItems: 'stretch',
  },
  doneIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.28)',
  },
  doneBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  notWellBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  notWellText: {
    color: '#fda4af',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.88,
  },
})
