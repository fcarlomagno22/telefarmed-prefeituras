import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { engineContent } from '../../mentalHealthEngine/content/loadEngineContent'
import { computeAnamnesisCompletion } from '../../mentalHealthEngine/anamnesisScoring'
import type { AnamnesisAnswerRecord } from '../../types/mentalHealthEngine'
import { colors } from '../../theme/colors'
import {
  type AnamnesisDrawerMode,
  filterQuestionsForMode,
} from '../../utils/mentalHealthAnamnesisCore'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type FlatQuestion = ReturnType<typeof filterQuestionsForMode>[number]

type MentalHealthAnamnesisDrawerProps = {
  visible: boolean
  mode?: AnamnesisDrawerMode
  initialAnswers?: Record<string, AnamnesisAnswerRecord>
  onClose: () => void
  onModuleComplete: (
    moduleId: string,
    moduleAnswers: Record<string, AnamnesisAnswerRecord>,
    completionRatio: number,
    completedModuleIds: string[],
  ) => Promise<void> | void
  onComplete: (
    allAnswers: Record<string, AnamnesisAnswerRecord>,
    completionRatio: number,
    completedModuleIds: string[],
  ) => Promise<void> | void
  onPersistAnswers: (answers: Record<string, AnamnesisAnswerRecord>) => Promise<void> | void
  onBackAtFirstQuestion?: () => void
}

function buildAnswerRecord(value: AnamnesisAnswerRecord['value']): AnamnesisAnswerRecord {
  return {
    value,
    answered_at: new Date().toISOString(),
    source: 'anamnesis',
    skipped: value == null,
  }
}


function isQuestionAnswered(question: FlatQuestion, answers: Record<string, AnamnesisAnswerRecord>) {
  const answer = answers[question.id]
  if (!answer || answer.skipped || answer.value == null) return false
  if (question.type === 'multi') return Array.isArray(answer.value) && answer.value.length > 0
  return true
}

function buildFlatQuestions(mode: AnamnesisDrawerMode) {
  return filterQuestionsForMode(mode)
}

function getModuleQuestionIds(moduleId: string, mode: AnamnesisDrawerMode) {
  return filterQuestionsForMode(mode)
    .filter((question) => question.moduleId === moduleId)
    .map((question) => question.id)
}

const PROGRESS_GRADIENT = ['#0e7490', '#0891b2', '#22d3ee', '#a5f3fc'] as const

function AnamnesisProgressBar({ progress }: { progress: number }) {
  const [trackWidth, setTrackWidth] = useState(0)
  const animatedProgress = useRef(new Animated.Value(progress)).current
  const skipAnimationRef = useRef(true)

  useEffect(() => {
    if (skipAnimationRef.current) {
      animatedProgress.setValue(progress)
      skipAnimationRef.current = false
      return
    }

    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 520,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start()
  }, [animatedProgress, progress])

  const fillWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(trackWidth, 1)],
    extrapolate: 'clamp',
  })

  return (
    <View
      style={styles.progressTrack}
      onLayout={(event) => {
        const width = event.nativeEvent.layout.width
        if (width > 0) setTrackWidth(width)
      }}
    >
      {trackWidth > 0 ? (
        <Animated.View style={[styles.progressFillClip, { width: fillWidth }]}>
          <LinearGradient
            colors={[...PROGRESS_GRADIENT]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.progressGradient, { width: trackWidth }]}
          />
        </Animated.View>
      ) : null}
    </View>
  )
}

export function MentalHealthAnamnesisDrawer({
  visible,
  mode = 'initial',
  initialAnswers = {},
  onClose,
  onModuleComplete,
  onComplete,
  onPersistAnswers,
  onBackAtFirstQuestion,
}: MentalHealthAnamnesisDrawerProps) {
  const flatQuestions = useMemo(() => buildFlatQuestions(mode), [mode])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnamnesisAnswerRecord>>({})
  const [isSaving, setIsSaving] = useState(false)
  const savedModulesRef = useRef<Set<string>>(new Set())
  const hasInitializedRef = useRef(false)
  const isAdvancingRef = useRef(false)

  const currentQuestion = flatQuestions[questionIndex]
  const totalQuestions = flatQuestions.length
  const progressRatio = totalQuestions ? (questionIndex + 1) / totalQuestions : 0

  useEffect(() => {
    if (!visible) {
      hasInitializedRef.current = false
      isAdvancingRef.current = false
      return
    }

    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    setAnswers(initialAnswers)
    savedModulesRef.current = new Set()

    const firstIncomplete = flatQuestions.findIndex(
      (question) => !isQuestionAnswered(question, initialAnswers),
    )

    if (flatQuestions.length === 0) return

    setQuestionIndex(firstIncomplete >= 0 ? firstIncomplete : 0)
    setIsSaving(false)
  }, [flatQuestions, initialAnswers, visible])

  const persistModuleIfNeeded = useCallback(
    async (moduleId: string, nextAnswers: Record<string, AnamnesisAnswerRecord>) => {
      if (savedModulesRef.current.has(moduleId)) return

      const moduleQuestionIds = getModuleQuestionIds(moduleId, mode)
      const moduleComplete = moduleQuestionIds.every((id) => {
        const q = flatQuestions.find((item) => item.id === id)
        return q ? isQuestionAnswered(q, nextAnswers) : true
      })

      if (!moduleComplete) return

      const moduleAnswers: Record<string, AnamnesisAnswerRecord> = {}
      for (const id of moduleQuestionIds) {
        if (nextAnswers[id]) moduleAnswers[id] = nextAnswers[id]
      }

      const completion = computeAnamnesisCompletion(nextAnswers)
      await onModuleComplete(
        moduleId,
        moduleAnswers,
        completion.completion_ratio,
        completion.completed_module_ids,
      )
      savedModulesRef.current.add(moduleId)
    },
    [flatQuestions, mode, onModuleComplete],
  )

  const handleCloseDrawer = useCallback(async () => {
    if (Object.keys(answers).length > 0) {
      await onPersistAnswers(answers)
    }
    onClose()
  }, [answers, onClose, onPersistAnswers])

  const goNext = useCallback(
    async (nextAnswers: Record<string, AnamnesisAnswerRecord>) => {
      if (!currentQuestion) return

      const isLastQuestion = questionIndex >= flatQuestions.length - 1
      const isLastInModule =
        questionIndex === flatQuestions.length - 1 ||
        flatQuestions[questionIndex + 1]?.moduleId !== currentQuestion.moduleId

      if (isLastInModule) {
        await persistModuleIfNeeded(currentQuestion.moduleId, nextAnswers)
      }

      if (isLastQuestion) {
        setIsSaving(true)
        try {
          const completion = computeAnamnesisCompletion(nextAnswers)
          await onComplete(
            nextAnswers,
            completion.completion_ratio,
            completion.completed_module_ids,
          )
        } finally {
          setIsSaving(false)
        }
        return
      }

      setQuestionIndex((current) => current + 1)
    },
    [currentQuestion, flatQuestions, onClose, onComplete, persistModuleIfNeeded, questionIndex],
  )

  const handleBack = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1)
      return
    }
    if (onBackAtFirstQuestion) {
      onBackAtFirstQuestion()
      return
    }
    void handleCloseDrawer()
  }, [handleCloseDrawer, onBackAtFirstQuestion, questionIndex])

  useAndroidBackHandler(
    useCallback(() => {
      if (!visible) return false
      handleBack()
      return true
    }, [handleBack, visible]),
  )

  function commitAnswer(questionId: string, value: AnamnesisAnswerRecord['value'], autoAdvance = false) {
    if (autoAdvance && isAdvancingRef.current) return

    const next = { ...answers, [questionId]: buildAnswerRecord(value) }
    setAnswers(next)
    void Promise.resolve(onPersistAnswers(next))

    if (!autoAdvance) return

    isAdvancingRef.current = true
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTimeout(() => {
      void goNext(next).finally(() => {
        isAdvancingRef.current = false
      })
    }, 280)
  }

  function toggleMultiAnswer(questionId: string, optionValue: string) {
    const existing = answers[questionId]?.value
    const selected = Array.isArray(existing) ? existing : []
    const nextValues = selected.includes(optionValue)
      ? selected.filter((item) => item !== optionValue)
      : [...selected, optionValue]
    commitAnswer(questionId, nextValues, false)
  }

  const currentAnswered = currentQuestion
    ? isQuestionAnswered(currentQuestion, answers)
    : false

  const needsManualContinue =
    currentQuestion?.type === 'multi' || currentQuestion?.type === 'duration'

  function renderOptions(question: FlatQuestion) {
    const answer = answers[question.id]

    if (question.type === 'yes_no') {
      const value = answer?.value
      return (
        <View style={styles.dualRow}>
          <Pressable
            onPress={() => commitAnswer(question.id, 'yes', true)}
            style={[styles.choiceBtn, styles.choiceHalf, (value === 'yes' || value === true) && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, (value === 'yes' || value === true) && styles.choiceTextSelected]}>
              Sim
            </Text>
          </Pressable>
          <Pressable
            onPress={() => commitAnswer(question.id, 'no', true)}
            style={[styles.choiceBtn, styles.choiceHalf, (value === 'no' || value === false) && styles.choiceSelected]}
          >
            <Text style={[styles.choiceText, (value === 'no' || value === false) && styles.choiceTextSelected]}>
              Não
            </Text>
          </Pressable>
        </View>
      )
    }

    if (question.type === 'single') {
      return (
        <View style={styles.optionsList}>
          {(question.options ?? []).map((option) => {
            const selected = String(answer?.value) === String(option.value)
            return (
              <Pressable
                key={String(option.value)}
                onPress={() => commitAnswer(question.id, option.value, true)}
                style={[styles.choiceBtn, selected && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                  {option.label_user}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )
    }

    if (question.type === 'multi') {
      const selected = Array.isArray(answer?.value) ? answer.value : []
      return (
        <View style={styles.optionsList}>
          {(question.options ?? []).map((option) => {
            const isSelected = selected.includes(String(option.value))
            return (
              <Pressable
                key={String(option.value)}
                onPress={() => toggleMultiAnswer(question.id, String(option.value))}
                style={[styles.choiceBtn, isSelected && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>
                  {option.label_user}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )
    }

    if (question.type === 'scale') {
      const min = question.scale_min ?? 0
      const max = question.scale_max ?? 4
      const labels = question.scale_labels ?? []
      const values = Array.from({ length: max - min + 1 }, (_, index) => min + index)

      return (
        <View style={styles.scaleGrid}>
          {values.map((value) => {
            const selected = answer?.value === value
            const label = labels[value - min] ?? ''
            return (
              <Pressable
                key={value}
                onPress={() => commitAnswer(question.id, value, true)}
                style={[styles.scaleCell, selected && styles.scaleCellSelected]}
              >
                <Text style={[styles.scaleNumber, selected && styles.scaleTextSelected]}>{value}</Text>
                {label ? (
                  <Text style={[styles.scaleLabel, selected && styles.scaleTextSelected]}>{label}</Text>
                ) : null}
              </Pressable>
            )
          })}
        </View>
      )
    }

    if (question.type === 'duration') {
      return (
        <TextInput
          value={typeof answer?.value === 'number' ? String(answer.value) : ''}
          onChangeText={(text) => {
            const parsed = Number(text.replace(/\D/g, ''))
            commitAnswer(question.id, Number.isFinite(parsed) ? parsed : null, false)
          }}
          keyboardType="number-pad"
          placeholder="Quantidade de dias"
          placeholderTextColor={colors.textSubtle}
          style={styles.durationInput}
        />
      )
    }

    return null
  }

  if (!visible || !currentQuestion) return null

  const isFirstInModule =
    questionIndex === 0 || flatQuestions[questionIndex - 1]?.moduleId !== currentQuestion.moduleId

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title=""
      onClose={() => void handleCloseDrawer()}
      fullScreen
      dense
      hideCloseButton
      keyboardAware
      footer={
        needsManualContinue ? (
          <PrimaryButton
            label={questionIndex >= totalQuestions - 1 ? 'Concluir' : 'Continuar'}
            onPress={() => void goNext(answers)}
            disabled={!currentAnswered || isSaving}
            loading={isSaving}
          />
        ) : undefined
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </Pressable>
          <AnamnesisProgressBar
            key={visible ? 'open' : 'closed'}
            progress={progressRatio}
          />
          <Text style={styles.progressCount}>
            {questionIndex + 1}/{totalQuestions}
          </Text>
        </View>

        {isFirstInModule ? (
          <Text style={styles.moduleEyebrow}>{currentQuestion.moduleTitle}</Text>
        ) : null}

        <View style={styles.questionBody}>
          <Text style={styles.questionText}>{currentQuestion.text_user}</Text>
          {currentQuestion.help_text_user ? (
            <Text style={styles.questionHelp}>{currentQuestion.help_text_user}</Text>
          ) : null}
          {renderOptions(currentQuestion)}
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 20,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFillClip: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressGradient: {
    height: '100%',
    borderRadius: 999,
  },
  progressCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 42,
    textAlign: 'right',
  },
  moduleEyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  questionBody: {
    flex: 1,
    gap: 24,
    paddingTop: 8,
  },
  questionText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 30,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  questionHelp: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: -12,
  },
  optionsList: {
    gap: 10,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceHalf: {
    flex: 1,
  },
  choiceBtn: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  choiceSelected: {
    backgroundColor: 'rgba(8, 145, 178, 0.16)',
    borderColor: 'rgba(103, 232, 249, 0.35)',
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: '#a5f3fc',
  },
  scaleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  scaleCell: {
    width: '47%',
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  scaleCellSelected: {
    backgroundColor: 'rgba(8, 145, 178, 0.16)',
    borderColor: 'rgba(103, 232, 249, 0.35)',
  },
  scaleNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scaleLabel: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  scaleTextSelected: {
    color: '#a5f3fc',
  },
  durationInput: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
})
