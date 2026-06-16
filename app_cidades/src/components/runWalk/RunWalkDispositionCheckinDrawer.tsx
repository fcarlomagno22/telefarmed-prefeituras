import * as Haptics from 'expo-haptics'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  getDispositionRecommendation,
  getRecommendationLabel,
} from '../../data/mockRunWalk'
import { colors } from '../../theme/colors'
import type { DispositionCheckinAnswers, DispositionMood } from '../../types/runWalk'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkDispositionCheckinDrawerProps = {
  visible: boolean
  onClose: () => void
  onDismiss?: () => void
  onComplete: (answers: DispositionCheckinAnswers, recommendationLabel: string) => void
  allowSkip?: boolean
}

type Step = 'mood' | 'followup' | 'result'

const MOOD_OPTIONS: { id: DispositionMood; label: string; emoji: string }[] = [
  { id: 'great', label: 'Muito bem', emoji: '😊' },
  { id: 'good', label: 'Bem', emoji: '🙂' },
  { id: 'tired', label: 'Um pouco cansado', emoji: '😴' },
  { id: 'very-tired', label: 'Muito cansado', emoji: '🥱' },
  { id: 'discomfort', label: 'Com algum desconforto', emoji: '😣' },
]

type FollowupKey = keyof Pick<
  DispositionCheckinAnswers,
  'sleptWell' | 'hasPain' | 'lowEnergy' | 'preferLighter' | 'preferWalkOverRun'
>

const FOLLOWUP_QUESTIONS: { key: FollowupKey; label: string }[] = [
  { key: 'sleptWell', label: 'Dormiu bem?' },
  { key: 'hasPain', label: 'Sente alguma dor?' },
  { key: 'lowEnergy', label: 'Está com falta de disposição?' },
  { key: 'preferLighter', label: 'Deseja fazer uma atividade mais leve?' },
  { key: 'preferWalkOverRun', label: 'Prefere caminhar em vez de correr?' },
]

export function RunWalkDispositionCheckinDrawer({
  visible,
  onClose,
  onDismiss,
  onComplete,
  allowSkip = false,
}: RunWalkDispositionCheckinDrawerProps) {
  const [step, setStep] = useState<Step>('mood')
  const [mood, setMood] = useState<DispositionMood | null>(null)
  const [followup, setFollowup] = useState<Partial<Record<FollowupKey, boolean>>>({})

  const answers = useMemo<DispositionCheckinAnswers | null>(() => {
    if (!mood) return null
    return {
      mood,
      sleptWell: followup.sleptWell,
      hasPain: followup.hasPain,
      lowEnergy: followup.lowEnergy,
      preferLighter: followup.preferLighter,
      preferWalkOverRun: followup.preferWalkOverRun,
    }
  }, [followup, mood])

  const recommendation = useMemo(() => {
    if (!answers) return null
    return getDispositionRecommendation(answers)
  }, [answers])

  function reset() {
    setStep('mood')
    setMood(null)
    setFollowup({})
  }

  function handleClose() {
    reset()
    onDismiss?.()
    onClose()
  }

  function handleSkip() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    reset()
    onDismiss?.()
    onClose()
  }

  function handleMoodSelect(value: DispositionMood) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMood(value)
    setStep('followup')
  }

  function toggleFollowup(key: FollowupKey, value: boolean) {
    void Haptics.selectionAsync()
    setFollowup((current) => ({ ...current, [key]: value }))
  }

  function handleShowResult() {
    setStep('result')
  }

  function handleConfirm() {
    if (!answers || !recommendation) return
    onComplete(answers, getRecommendationLabel(recommendation))
    handleClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Como você está hoje?"
      subtitle={
        step === 'mood'
          ? 'Check-in rápido para personalizar sua atividade'
          : step === 'followup'
            ? 'Algumas perguntas para ajustar a recomendação'
            : 'Sugestão com base nas suas respostas'
      }
      onClose={handleClose}
      scrollable={step !== 'result'}
      footer={
        step === 'mood' && allowSkip ? (
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Responder depois"
          >
            <Text style={styles.skipButtonText}>Agora não</Text>
          </Pressable>
        ) : step === 'followup' ? (
          <PrimaryButton label="Ver recomendação" onPress={handleShowResult} />
        ) : step === 'result' ? (
          <PrimaryButton label="Entendi" onPress={handleConfirm} />
        ) : undefined
      }
    >
      {step === 'mood' ? (
        <View style={styles.optionsCol}>
          {MOOD_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => handleMoodSelect(option.id)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={styles.optionLabel}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {step === 'followup' ? (
        <View style={styles.optionsCol}>
          {FOLLOWUP_QUESTIONS.map((question) => (
            <View key={question.key} style={styles.followupBlock}>
              <Text style={styles.followupLabel}>{question.label}</Text>
              <View style={styles.yesNoRow}>
                <Pressable
                  onPress={() => toggleFollowup(question.key, true)}
                  style={[
                    styles.yesNoBtn,
                    followup[question.key] === true && styles.yesNoBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      followup[question.key] === true && styles.yesNoTextActive,
                    ]}
                  >
                    Sim
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => toggleFollowup(question.key, false)}
                  style={[
                    styles.yesNoBtn,
                    followup[question.key] === false && styles.yesNoBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoText,
                      followup[question.key] === false && styles.yesNoTextActive,
                    ]}
                  >
                    Não
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {step === 'result' && recommendation ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultEyebrow}>Recomendação</Text>
          <Text style={styles.resultTitle}>{getRecommendationLabel(recommendation)}</Text>
          <Text style={styles.resultHint}>
            Você pode aceitar a sugestão ou manter o plano original. O app reorganiza sua semana
            quando necessário.
          </Text>
        </View>
      ) : null}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  optionsCol: {
    gap: 8,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  emoji: {
    fontSize: 22,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  followupBlock: {
    gap: 8,
    paddingVertical: 4,
  },
  followupLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  yesNoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  yesNoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  yesNoBtnActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.16)',
    borderColor: 'rgba(255, 107, 0, 0.38)',
  },
  yesNoText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  yesNoTextActive: {
    color: colors.primaryLight,
  },
  resultCard: {
    gap: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.28)',
    marginBottom: 8,
  },
  resultEyebrow: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  resultTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  resultHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    paddingTop: 4,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  skipButtonPressed: {
    opacity: 0.88,
  },
  skipButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
})
