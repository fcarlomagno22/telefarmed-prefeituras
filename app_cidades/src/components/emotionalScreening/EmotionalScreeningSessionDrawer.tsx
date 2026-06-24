import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import type { EmotionalScreeningAnswers, EmotionalScreeningInstrument } from '../../types/emotionalScreening'
import { EMOTIONAL_SCREENING_DISCLAIMER } from '../../types/emotionalScreening'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EmotionalScreeningSessionDrawerProps = {
  visible: boolean
  instrument: EmotionalScreeningInstrument | null
  onClose: () => void
  onComplete: (answers: EmotionalScreeningAnswers) => void
}

const PROGRESS_GRADIENT = ['#6d28d9', '#8b5cf6', '#c4b5fd'] as const

function SessionProgressBar({ progress }: { progress: number }) {
  const [trackWidth, setTrackWidth] = useState(0)
  const animatedProgress = useRef(new Animated.Value(progress)).current

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 420,
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

export function EmotionalScreeningSessionDrawer({
  visible,
  instrument,
  onClose,
  onComplete,
}: EmotionalScreeningSessionDrawerProps) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<EmotionalScreeningAnswers>({})
  const isAdvancingRef = useRef(false)

  const questions = instrument?.questions ?? []
  const currentQuestion = questions[questionIndex]
  const progress = questions.length > 0 ? (questionIndex + 1) / questions.length : 0
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined

  useEffect(() => {
    if (!visible) {
      setQuestionIndex(0)
      setAnswers({})
    }
  }, [visible, instrument?.id])

  const handleBack = useCallback(() => {
    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1)
      return
    }
    onClose()
  }, [onClose, questionIndex])

  useAndroidBackHandler(
    useCallback(() => {
      if (!visible) return false
      handleBack()
      return true
    }, [handleBack, visible]),
  )

  function commitAnswer(value: number | string | boolean, autoAdvance = true) {
    if (!currentQuestion || isAdvancingRef.current) return
    const next = { ...answers, [currentQuestion.id]: value }
    setAnswers(next)
    if (!autoAdvance) return
    isAdvancingRef.current = true
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setTimeout(() => {
      if (questionIndex >= questions.length - 1) {
        onComplete(next)
      } else {
        setQuestionIndex((current) => current + 1)
      }
      isAdvancingRef.current = false
    }, 260)
  }

  if (!instrument || !currentQuestion) return null

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={instrument.title}
      subtitle={`Pergunta ${questionIndex + 1} de ${questions.length}`}
      onClose={handleBack}
      fullScreen
    >
      <View style={styles.content}>
        <SessionProgressBar progress={progress} />
        {instrument.questionPreamble ? (
          <Text style={styles.preamble}>{instrument.questionPreamble}</Text>
        ) : null}
        <Text style={styles.question}>{currentQuestion.text}</Text>

        {currentQuestion.type === 'yes_no' ? (
          <View style={styles.dualRow}>
            <Pressable
              onPress={() => commitAnswer(1)}
              style={[styles.choiceBtn, styles.choiceHalf, currentAnswer === 1 && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, currentAnswer === 1 && styles.choiceTextSelected]}>Sim</Text>
            </Pressable>
            <Pressable
              onPress={() => commitAnswer(0)}
              style={[styles.choiceBtn, styles.choiceHalf, currentAnswer === 0 && styles.choiceSelected]}
            >
              <Text style={[styles.choiceText, currentAnswer === 0 && styles.choiceTextSelected]}>Não</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.optionsList}>
            {(currentQuestion.options ?? []).map((option) => {
              const selected = currentAnswer === option.value
              return (
                <Pressable
                  key={String(option.value)}
                  onPress={() => commitAnswer(option.value as number, true)}
                  style={[styles.choiceBtn, selected && styles.choiceSelected]}
                >
                  <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}

        <Text style={styles.disclaimer}>{EMOTIONAL_SCREENING_DISCLAIMER}</Text>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFillClip: {
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressGradient: {
    height: '100%',
  },
  preamble: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  question: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  optionsList: {
    gap: 10,
  },
  choiceBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  choiceHalf: {
    flex: 1,
    alignItems: 'center',
  },
  choiceSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    borderColor: 'rgba(196, 181, 253, 0.55)',
  },
  choiceText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: colors.text,
    fontWeight: '800',
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 8,
  },
})
