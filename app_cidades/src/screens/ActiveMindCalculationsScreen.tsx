import { useThemedStyles } from '../hooks/useThemedStyles'
import type { ThemeColors } from '../theme/palettes'
import { useTheme } from '../contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalculationsAnswerRow } from '../components/activeMind/calculations/CalculationsAnswerRow'
import { CalculationsNumberPad } from '../components/activeMind/calculations/CalculationsNumberPad'
import { CalculationsQuestionCard } from '../components/activeMind/calculations/CalculationsQuestionCard'
import { SudokuVictoryDrawer } from '../components/activeMind/sudoku/SudokuVictoryDrawer'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { appEnv } from '../config/env'
import {
  appendCalculationsDigit,
  createCalculationsSession,
  isCalculationsAnswerComplete,
  isCalculationsCorrect,
  removeLastCalculationsDigit,
} from '../data/calculosPuzzles'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import {
  emptyCalculationsFeedbackState,
  emptyCalculationsSessionStats,
  type CalculationsFeedbackState,
  type CalculationsSession,
  type CalculationsSessionStats,
} from '../types/calculations'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import {
  playFormTheWordCorrectSound,
  playFormTheWordWrongSound,
  playPalavrasBackspaceSound,
  playPalavrasClickSound,
  preloadPalavrasSounds,
  preloadSudokuSounds,
  releasePalavrasSounds,
  releaseSudokuSounds,
} from '../utils/appSounds'

const WRONG_FEEDBACK_DURATION_MS = 1200
const CORRECT_ADVANCE_DELAY_MS = 450

const brainLottie = require('../../assets/brain1.json')

function buildSession(difficulty: ActiveMindPlayDifficulty, excludeId?: string): CalculationsSession {
  return createCalculationsSession(difficulty, excludeId)
}

export function ActiveMindCalculationsScreen() {
  const { backgroundSource, colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)
  const difficulty = activeMindParams.difficulty ?? 'facil'

  const [session, setSession] = useState<CalculationsSession>(() => buildSession(difficulty))
  const [victoryVisible, setVictoryVisible] = useState(false)
  const [celebrationSeed, setCelebrationSeed] = useState(0)
  const [sessionStats, setSessionStats] = useState<CalculationsSessionStats>(emptyCalculationsSessionStats)
  const [feedback, setFeedback] = useState<CalculationsFeedbackState>(emptyCalculationsFeedbackState)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkingRef = useRef(false)

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomInset = Math.max(insets.bottom, 8)
  const numberPadButtonHeight = Math.min(52, Math.max(42, Math.round(windowHeight * 0.058)))

  const feedbackActive = feedback.active
  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)
  const padDisabled = victoryVisible || feedbackActive
  const encerrarDisabled = victoryVisible || feedbackActive

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current == null) return
    clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = null
  }, [])

  const resetFeedback = useCallback(() => {
    clearFeedbackTimeout()
    checkingRef.current = false
    setFeedback(emptyCalculationsFeedbackState())
  }, [clearFeedbackTimeout])

  const resetAnswer = useCallback(() => {
    setSession((current) => ({
      ...current,
      answer: '',
    }))
  }, [])

  const advanceToNextCalculation = useCallback(
    (excludeId: string) => {
      clearFeedbackTimeout()
      checkingRef.current = false
      setFeedback(emptyCalculationsFeedbackState())
      setSession(buildSession(difficulty, excludeId))
    },
    [clearFeedbackTimeout, difficulty],
  )

  const scheduleWrongFeedback = useCallback(() => {
    clearFeedbackTimeout()
    feedbackTimeoutRef.current = setTimeout(() => {
      resetAnswer()
      setFeedback(emptyCalculationsFeedbackState())
      checkingRef.current = false
      feedbackTimeoutRef.current = null
    }, WRONG_FEEDBACK_DURATION_MS)
  }, [clearFeedbackTimeout, resetAnswer])

  const scheduleCorrectAdvance = useCallback(
    (puzzleId: string) => {
      clearFeedbackTimeout()
      feedbackTimeoutRef.current = setTimeout(() => {
        advanceToNextCalculation(puzzleId)
        feedbackTimeoutRef.current = null
      }, CORRECT_ADVANCE_DELAY_MS)
    },
    [advanceToNextCalculation, clearFeedbackTimeout],
  )

  useEffect(() => {
    preloadSudokuSounds()
    preloadPalavrasSounds()

    return () => {
      releaseSudokuSounds()
      releasePalavrasSounds()
    }
  }, [])

  useEffect(() => {
    return () => {
      clearFeedbackTimeout()
    }
  }, [clearFeedbackTimeout])

  useEffect(() => {
    resetFeedback()
    setSession(buildSession(difficulty))
    setVictoryVisible(false)
    setSessionStats(emptyCalculationsSessionStats())
  }, [difficulty, resetFeedback])

  useEffect(() => {
    if (!isCalculationsAnswerComplete(session)) return
    if (victoryVisible || feedbackActive || checkingRef.current) return

    checkingRef.current = true

    setSessionStats((current) => ({
      ...current,
      attempts: current.attempts + 1,
    }))

    if (isCalculationsCorrect(session)) {
      playFormTheWordCorrectSound()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSessionStats((current) => ({
        ...current,
        correct: current.correct + 1,
      }))
      setFeedback({
        active: true,
        kind: 'correct',
        message: null,
      })
      scheduleCorrectAdvance(session.puzzleId)
      return
    }

    playFormTheWordWrongSound()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    setSessionStats((current) => ({
      ...current,
      errors: current.errors + 1,
    }))
    setFeedback({
      active: true,
      kind: 'wrong',
      message: 'Resultado incorreto. Tente novamente.',
    })
    scheduleWrongFeedback()
  }, [
    session,
    victoryVisible,
    feedbackActive,
    scheduleCorrectAdvance,
    scheduleWrongFeedback,
  ])

  const handleVictoryClose = useCallback(() => {
    setVictoryVisible(false)
    navigateTo('active-mind')
  }, [navigateTo])

  useAndroidBackHandler(
    useCallback(() => {
      if (victoryVisible) {
        handleVictoryClose()
        return true
      }

      if (canGoBack()) {
        goBack()
        return true
      }
      return false
    }, [canGoBack, goBack, victoryVisible, handleVictoryClose]),
  )

  function handleBack() {
    if (victoryVisible) {
      handleVictoryClose()
      return
    }

    if (canGoBack()) {
      goBack()
      return
    }
    navigateTo('active-mind')
  }

  function handleNewGame() {
    resetFeedback()
    setSession(buildSession(difficulty))
    setVictoryVisible(false)
    setSessionStats(emptyCalculationsSessionStats())
  }

  function handleEncerrar() {
    if (victoryVisible || feedbackActive) return

    resetFeedback()
    setVictoryVisible(true)
    setCelebrationSeed((current) => current + 1)
  }

  function handlePickNumber(value: number) {
    if (padDisabled) return
    playPalavrasClickSound()
    setSession((current) => appendCalculationsDigit(current, value))
  }

  function handleRemoveLast() {
    if (padDisabled) return
    playPalavrasBackspaceSound()
    setSession((current) => removeLastCalculationsDigit(current))
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={[...colors.screenOverlay]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Cálculos"
          subtitle={`Nível ${difficultyLabel}`}
          paddingTop={headerPaddingTop}
          onBack={handleBack}
          headerRight={
            <Pressable
              onPress={handleNewGame}
              style={({ pressed }) => [styles.newGameButton, pressed && styles.newGameButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Novo jogo"
            >
              <Ionicons name="refresh-outline" size={18} color={colors.text} />
            </Pressable>
          }
        />

        <View style={styles.body}>
          <View style={styles.gameArea}>
            <View style={styles.lottieWrap}>
              <LottieView
                source={brainLottie}
                autoPlay
                loop
                resizeMode="contain"
                style={styles.lottie}
              />
            </View>

            <CalculationsQuestionCard pergunta={session.pergunta} />

            <CalculationsAnswerRow
              answer={session.answer}
              feedbackActive={feedbackActive}
              feedbackKind={feedback.kind}
            />
          </View>

          <View style={styles.controls}>
            <View style={styles.toolbarRow}>
              <Pressable
                onPress={handleRemoveLast}
                disabled={padDisabled || session.answer.length === 0}
                style={({ pressed }) => [
                  styles.toolbarEraseButton,
                  (padDisabled || session.answer.length === 0) && styles.toolbarEraseButtonDisabled,
                  pressed && !padDisabled && session.answer.length > 0 && styles.toolbarEraseButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Apagar último dígito"
              >
                <Ionicons
                  name="backspace-outline"
                  size={18}
                  color={padDisabled || session.answer.length === 0 ? colors.textSubtle : '#67e8f9'}
                />
                <Text
                  style={[
                    styles.toolbarEraseLabel,
                    (padDisabled || session.answer.length === 0) && styles.toolbarEraseLabelDisabled,
                  ]}
                >
                  Apagar
                </Text>
              </Pressable>
            </View>

            <CalculationsNumberPad
              onPickNumber={handlePickNumber}
              buttonHeight={numberPadButtonHeight}
              disabled={padDisabled}
            />
          </View>

          <View style={[styles.bottomFill, { minHeight: Math.max(bottomInset, 10) + 48, paddingBottom: bottomInset }]}>
            <View style={styles.feedbackMessageSlot}>
              {feedback.message ? (
                <Text style={styles.feedbackHint}>{feedback.message}</Text>
              ) : null}
            </View>

            <PrimaryButton
              label="Encerrar"
              onPress={handleEncerrar}
              disabled={encerrarDisabled}
              style={styles.encerrarButton}
            />
          </View>
        </View>
      </ImageBackground>

      <SudokuVictoryDrawer
        visible={victoryVisible}
        difficulty={difficulty}
        stats={sessionStats}
        celebrationSeed={celebrationSeed}
        completionKicker="Desafio concluído"
        onPlayAgain={handleNewGame}
        onClose={handleVictoryClose}
      />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 8,
  },
  gameArea: {
    gap: 14,
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 132,
    height: 112,
  },
  controls: {
    gap: 6,
    paddingTop: 12,
  },
  bottomFill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  feedbackMessageSlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  toolbarRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 36,
    paddingHorizontal: 2,
  },
  toolbarEraseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolbarEraseButtonPressed: {
    opacity: 0.85,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  toolbarEraseButtonDisabled: {
    opacity: 0.4,
  },
  toolbarEraseLabel: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '600',
  },
  toolbarEraseLabelDisabled: {
    color: colors.textSubtle,
  },
  newGameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  newGameButtonPressed: {
    opacity: 0.85,
  },
  encerrarButton: {
    marginBottom: 12,
  },
  feedbackHint: {
    color: colors.error,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
}
}
