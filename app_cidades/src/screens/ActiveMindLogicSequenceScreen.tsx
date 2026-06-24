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
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LogicSequenceOptionsGrid } from '../components/activeMind/logicSequence/LogicSequenceOptionsGrid'
import { LogicSequencePromptCard } from '../components/activeMind/logicSequence/LogicSequencePromptCard'
import { LogicSequenceRow } from '../components/activeMind/logicSequence/LogicSequenceRow'
import { SudokuVictoryDrawer } from '../components/activeMind/sudoku/SudokuVictoryDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { PrimaryButton } from '../components/PrimaryButton'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { appEnv } from '../config/env'
import {
  clearLogicSequenceSelectedOption,
  createLogicSequenceSession,
  isLogicSequenceAnswerReady,
  isLogicSequenceCorrect,
  setLogicSequenceSelectedOption,
} from '../data/logicSequencePuzzles'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { LogicSequenceItem } from '../types/logicSequence'
import {
  emptyLogicSequenceFeedbackState,
  emptyLogicSequenceSessionStats,
  type LogicSequenceFeedbackState,
  type LogicSequenceSession,
  type LogicSequenceSessionStats,
} from '../types/logicSequence'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import {
  playPalavrasClickSound,
  playSudokuCorrectSound,
  playSudokuWrongSound,
  preloadPalavrasSounds,
  preloadSudokuSounds,
  releasePalavrasSounds,
  releaseSudokuSounds,
} from '../utils/appSounds'

const WRONG_FEEDBACK_DURATION_MS = 1200
const CORRECT_ADVANCE_DELAY_MS = 450

const brainLottie = require('../../assets/brain1.json')

function buildSession(difficulty: ActiveMindPlayDifficulty, excludeId?: string): LogicSequenceSession {
  return createLogicSequenceSession(difficulty, excludeId)
}

export function ActiveMindLogicSequenceScreen() {
  const { backgroundSource, colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)
  const difficulty = activeMindParams.difficulty ?? 'facil'

  const [session, setSession] = useState<LogicSequenceSession>(() => buildSession(difficulty))
  const [victoryVisible, setVictoryVisible] = useState(false)
  const [celebrationSeed, setCelebrationSeed] = useState(0)
  const [sessionStats, setSessionStats] = useState<LogicSequenceSessionStats>(emptyLogicSequenceSessionStats)
  const [feedback, setFeedback] = useState<LogicSequenceFeedbackState>(emptyLogicSequenceFeedbackState)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkingRef = useRef(false)

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomInset = Math.max(insets.bottom, 8)

  const feedbackActive = feedback.active
  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)
  const optionsDisabled = victoryVisible || feedbackActive
  const encerrarDisabled = optionsDisabled

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current == null) return
    clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = null
  }, [])

  const resetFeedback = useCallback(() => {
    clearFeedbackTimeout()
    checkingRef.current = false
    setFeedback(emptyLogicSequenceFeedbackState())
  }, [clearFeedbackTimeout])

  const advanceToNextSequence = useCallback(
    (excludeId: string) => {
      clearFeedbackTimeout()
      checkingRef.current = false
      setFeedback(emptyLogicSequenceFeedbackState())
      setSession(buildSession(difficulty, excludeId))
    },
    [clearFeedbackTimeout, difficulty],
  )

  const scheduleWrongFeedback = useCallback(() => {
    clearFeedbackTimeout()
    feedbackTimeoutRef.current = setTimeout(() => {
      setSession((current) => clearLogicSequenceSelectedOption(current))
      setFeedback(emptyLogicSequenceFeedbackState())
      checkingRef.current = false
      feedbackTimeoutRef.current = null
    }, WRONG_FEEDBACK_DURATION_MS)
  }, [clearFeedbackTimeout])

  const scheduleCorrectAdvance = useCallback(
    (puzzleId: string) => {
      clearFeedbackTimeout()
      feedbackTimeoutRef.current = setTimeout(() => {
        advanceToNextSequence(puzzleId)
        feedbackTimeoutRef.current = null
      }, CORRECT_ADVANCE_DELAY_MS)
    },
    [advanceToNextSequence, clearFeedbackTimeout],
  )

  const submitAnswer = useCallback(
    (currentSession: LogicSequenceSession) => {
      if (victoryVisible || feedbackActive || checkingRef.current) return
      if (!isLogicSequenceAnswerReady(currentSession)) return

      checkingRef.current = true

      setSessionStats((current) => ({
        ...current,
        attempts: current.attempts + 1,
      }))

      if (isLogicSequenceCorrect(currentSession)) {
        playSudokuCorrectSound()
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
        scheduleCorrectAdvance(currentSession.puzzleId)
        return
      }

      playSudokuWrongSound()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setSessionStats((current) => ({
        ...current,
        errors: current.errors + 1,
      }))
      setFeedback({
        active: true,
        kind: 'wrong',
        message: 'Resposta incorreta. Tente novamente.',
      })
      scheduleWrongFeedback()
    },
    [feedbackActive, scheduleCorrectAdvance, scheduleWrongFeedback, victoryVisible],
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
    setSessionStats(emptyLogicSequenceSessionStats())
  }, [difficulty, resetFeedback])

  useEffect(() => {
    submitAnswer(session)
  }, [session, submitAnswer])

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
    setSessionStats(emptyLogicSequenceSessionStats())
  }

  function handleEncerrar() {
    if (victoryVisible || feedbackActive) return

    resetFeedback()
    setVictoryVisible(true)
    setCelebrationSeed((current) => current + 1)
  }

  function handlePickOption(option: LogicSequenceItem) {
    if (optionsDisabled) return
    playPalavrasClickSound()
    setSession((current) => setLogicSequenceSelectedOption(current, option))
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={[...colors.screenOverlay]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Sequência lógica"
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

            <LogicSequencePromptCard enunciado={session.enunciado} tipo={session.tipo} />

            <LogicSequenceRow
              sequencia={session.sequencia}
              tipo={session.tipo}
              feedbackActive={feedbackActive}
              feedbackKind={feedback.kind}
              selectedOption={session.selectedOption}
            />
          </View>

          <View style={styles.controls}>
            <Text style={styles.optionsTitle}>Escolha a resposta</Text>
            <LogicSequenceOptionsGrid
              opcoes={session.opcoes}
              tipo={session.tipo}
              selectedOption={session.selectedOption}
              feedbackActive={feedbackActive}
              feedbackKind={feedback.kind}
              disabled={optionsDisabled}
              onPickOption={handlePickOption}
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

            <NeonSectionDivider embedded style={styles.bottomDivider} />
          </View>
        </View>
      </ImageBackground>

      <SudokuVictoryDrawer
        visible={victoryVisible}
        difficulty={difficulty}
        stats={sessionStats}
        celebrationSeed={celebrationSeed}
        completionKicker="Sequência concluída"
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
    gap: 12,
    paddingTop: 14,
    paddingHorizontal: 4,
  },
  optionsTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  bottomDivider: {
    marginBottom: 0,
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
