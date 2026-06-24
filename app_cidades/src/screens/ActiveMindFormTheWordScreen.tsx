import { useThemedStyles } from '../hooks/useThemedStyles'
import type { ThemeColors } from '../theme/palettes'
import { useTheme } from '../contexts/ThemeContext'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FormTheWordAnswerRow } from '../components/activeMind/formTheWord/FormTheWordAnswerRow'
import { FormTheWordScramblePool } from '../components/activeMind/formTheWord/FormTheWordScramblePool'
import { SudokuVictoryDrawer } from '../components/activeMind/sudoku/SudokuVictoryDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { appEnv } from '../config/env'
import {
  addFormTheWordChunk,
  countRevealableFormTheWordChunks,
  createFormTheWordSession,
  getFormTheWordTargetChunks,
  hasRevealableFormTheWordChunks,
  isFormTheWordAnswerComplete,
  isFormTheWordSolved,
  removeLastFormTheWordChunk,
  revealAllFormTheWordChunks,
  revealNextFormTheWordChunk,
} from '../data/formTheWordPuzzles'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import {
  emptyFormTheWordFeedbackState,
  emptyFormTheWordSessionStats,
  type FormTheWordFeedbackState,
  type FormTheWordSession,
  type FormTheWordSessionStats,
} from '../types/formTheWord'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import {
  playFormTheWordCorrectSound,
  playFormTheWordWrongSound,
  playPalavrasBackspaceSound,
  playPalavrasClickSound,
  playSudokuRevealSound,
  preloadPalavrasSounds,
  preloadSudokuSounds,
  releasePalavrasSounds,
  releaseSudokuSounds,
} from '../utils/appSounds'

const WRONG_FEEDBACK_DURATION_MS = 1200
const CORRECT_ADVANCE_DELAY_MS = 450

function buildSession(difficulty: ActiveMindPlayDifficulty, excludeId?: string): FormTheWordSession {
  return createFormTheWordSession(difficulty, excludeId)
}

export function ActiveMindFormTheWordScreen() {
  const { backgroundSource, colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)
  const difficulty = activeMindParams.difficulty ?? 'facil'

  const [session, setSession] = useState<FormTheWordSession>(() => buildSession(difficulty))
  const [victoryVisible, setVictoryVisible] = useState(false)
  const [celebrationSeed, setCelebrationSeed] = useState(0)
  const [sessionStats, setSessionStats] = useState<FormTheWordSessionStats>(emptyFormTheWordSessionStats)
  const [feedback, setFeedback] = useState<FormTheWordFeedbackState>(emptyFormTheWordFeedbackState)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkingRef = useRef(false)

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomInset = Math.max(insets.bottom, 8)

  const targetChunks = useMemo(() => getFormTheWordTargetChunks(session), [session])
  const feedbackActive = feedback.active
  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)

  const canReveal = !victoryVisible && !feedbackActive && hasRevealableFormTheWordChunks(session)
  const canRevealAll = canReveal

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current == null) return
    clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = null
  }, [])

  const resetFeedback = useCallback(() => {
    clearFeedbackTimeout()
    checkingRef.current = false
    setFeedback(emptyFormTheWordFeedbackState())
  }, [clearFeedbackTimeout])

  const resetAnswer = useCallback(() => {
    setSession((current) => ({
      ...current,
      answer: [],
      usedPoolIndexes: new Set<number>(),
    }))
  }, [])

  const advanceToNextWord = useCallback(
    (excludeId: string) => {
      clearFeedbackTimeout()
      checkingRef.current = false
      setFeedback(emptyFormTheWordFeedbackState())
      setSession(buildSession(difficulty, excludeId))
    },
    [clearFeedbackTimeout, difficulty],
  )

  const scheduleWrongFeedback = useCallback(() => {
    clearFeedbackTimeout()
    feedbackTimeoutRef.current = setTimeout(() => {
      resetAnswer()
      setFeedback(emptyFormTheWordFeedbackState())
      checkingRef.current = false
      feedbackTimeoutRef.current = null
    }, WRONG_FEEDBACK_DURATION_MS)
  }, [clearFeedbackTimeout, resetAnswer])

  const scheduleCorrectAdvance = useCallback(
    (puzzleId: string) => {
      clearFeedbackTimeout()
      feedbackTimeoutRef.current = setTimeout(() => {
        advanceToNextWord(puzzleId)
        feedbackTimeoutRef.current = null
      }, CORRECT_ADVANCE_DELAY_MS)
    },
    [advanceToNextWord, clearFeedbackTimeout],
  )

  useEffect(() => {
    preloadSudokuSounds()
    preloadPalavrasSounds()

    return () => {
      clearFeedbackTimeout()
      releaseSudokuSounds()
      releasePalavrasSounds()
    }
  }, [clearFeedbackTimeout])

  useEffect(() => {
    resetFeedback()
    setSession(buildSession(difficulty))
    setVictoryVisible(false)
    setSessionStats(emptyFormTheWordSessionStats())
  }, [difficulty, resetFeedback])

  useEffect(() => {
    if (!isFormTheWordAnswerComplete(session)) return
    if (victoryVisible || feedbackActive || checkingRef.current) return

    checkingRef.current = true

    setSessionStats((current) => ({
      ...current,
      attempts: current.attempts + 1,
    }))

    if (isFormTheWordSolved(session)) {
      playFormTheWordCorrectSound()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setSessionStats((current) => ({
        ...current,
        correct: current.correct + 1,
      }))
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
      message: 'Essa combinação não forma a palavra. Tente novamente.',
    })
    scheduleWrongFeedback()
  }, [session, victoryVisible, feedbackActive, scheduleCorrectAdvance, scheduleWrongFeedback])

  useAndroidBackHandler(
    useCallback(() => {
      if (victoryVisible) {
        handleBack()
        return true
      }

      if (canGoBack()) {
        goBack()
        return true
      }
      return false
    }, [canGoBack, goBack, victoryVisible]),
  )

  function handleBack() {
    if (victoryVisible) {
      setVictoryVisible(false)
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
    setSessionStats(emptyFormTheWordSessionStats())
  }

  function handleEncerrar() {
    if (victoryVisible || feedbackActive) return

    resetFeedback()
    setVictoryVisible(true)
    setCelebrationSeed((current) => current + 1)
  }

  function handlePickChunk(poolIndex: number) {
    if (victoryVisible || feedbackActive) return
    playPalavrasClickSound()
    setSession((current) => addFormTheWordChunk(current, poolIndex))
  }

  function handleRemoveLast() {
    if (victoryVisible || feedbackActive) return
    playPalavrasBackspaceSound()
    setSession((current) => removeLastFormTheWordChunk(current))
  }

  function handleRevealNext() {
    if (!canReveal) return

    resetFeedback()
    playSudokuRevealSound()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSessionStats((current) => ({
      ...current,
      reveals: current.reveals + 1,
    }))
    setSession((current) => revealNextFormTheWordChunk(current))
  }

  function handleRevealAll() {
    if (!canRevealAll) return

    const revealCount = countRevealableFormTheWordChunks(session)

    resetFeedback()
    playSudokuRevealSound()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setSessionStats((current) => ({
      ...current,
      reveals: current.reveals + revealCount,
    }))
    setSession((current) => revealAllFormTheWordChunks(current))
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={[...colors.screenOverlay]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Forme a palavra"
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
            <View style={styles.hintCard}>
              <Text style={styles.hintLabel}>Dica</Text>
              <Text style={styles.hintText}>{session.hint}</Text>
            </View>

            <FormTheWordAnswerRow
              slots={session.answer}
              totalSlots={targetChunks.length}
              feedbackActive={feedbackActive}
              feedbackKind={feedback.kind}
              onRemoveLast={handleRemoveLast}
            />

            <FormTheWordScramblePool
              scrambled={session.scrambled}
              usedPoolIndexes={session.usedPoolIndexes}
              disabled={victoryVisible || feedbackActive}
              onPickChunk={handlePickChunk}
            />
          </View>

          <View style={styles.controls}>
            <View style={styles.toolbarRow}>
              <Pressable
                onPress={handleRevealAll}
                disabled={!canRevealAll}
                style={({ pressed }) => [
                  styles.revealLinkWrap,
                  !canRevealAll && styles.revealLinkWrapDisabled,
                  pressed && canRevealAll && styles.revealLinkWrapPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Revelar todas as letras restantes"
              >
                <Text style={[styles.revealLink, !canRevealAll && styles.revealLinkDisabled]}>
                  Revelar tudo!
                </Text>
              </Pressable>

              <Pressable
                onPress={handleRevealNext}
                disabled={!canReveal}
                style={({ pressed }) => [
                  styles.revealLinkWrap,
                  !canReveal && styles.revealLinkWrapDisabled,
                  pressed && canReveal && styles.revealLinkWrapPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Revelar próxima letra correta"
              >
                <Text style={[styles.revealLink, !canReveal && styles.revealLinkDisabled]}>Revelar</Text>
              </Pressable>

              <Pressable
                onPress={handleEncerrar}
                disabled={victoryVisible || feedbackActive}
                style={({ pressed }) => [
                  styles.revealLinkWrap,
                  (victoryVisible || feedbackActive) && styles.revealLinkWrapDisabled,
                  pressed && !victoryVisible && !feedbackActive && styles.revealLinkWrapPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Encerrar partida"
              >
                <Text
                  style={[
                    styles.encerrarLink,
                    (victoryVisible || feedbackActive) && styles.revealLinkDisabled,
                  ]}
                >
                  Encerrar
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.bottomFill, { minHeight: Math.max(bottomInset, 10) + 48, paddingBottom: bottomInset }]}>
            <View style={styles.feedbackMessageSlot}>
              {feedback.message ? (
                <Text style={styles.feedbackHint}>{feedback.message}</Text>
              ) : null}
            </View>
            <NeonSectionDivider embedded style={styles.bottomDivider} />
          </View>
        </View>
      </ImageBackground>

      <SudokuVictoryDrawer
        visible={victoryVisible}
        difficulty={difficulty}
        stats={sessionStats}
        celebrationSeed={celebrationSeed}
        completionKicker="Palavra formada"
        onPlayAgain={handleNewGame}
        onClose={handleBack}
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
    gap: 18,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  hintCard: {
    gap: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hintLabel: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hintText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
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
  bottomDivider: {
    marginBottom: 0,
  },
  toolbarRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
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
  revealLinkWrap: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  revealLinkWrapPressed: {
    opacity: 0.75,
  },
  revealLinkWrapDisabled: {
    opacity: 0.4,
  },
  revealLink: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  encerrarLink: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  revealLinkDisabled: {
    color: colors.textSubtle,
  },
  feedbackHint: {
    color: colors.error,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
}
}
