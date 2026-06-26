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
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SudokuBoard } from '../components/activeMind/sudoku/SudokuBoard'
import { SudokuNumberPad } from '../components/activeMind/sudoku/SudokuNumberPad'
import { SudokuVictoryDrawer } from '../components/activeMind/sudoku/SudokuVictoryDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { appEnv } from '../config/env'
import {
  clearSudokuCell,
  createSudokuSession,
  getSudokuConflictIndexes,
  getSudokuConflictMessage,
  getSudokuDuplicatePeerIndexes,
  isSudokuCellLocked,
  isSudokuComplete,
  isSudokuSolved,
  revealSudokuCell,
  revealAllSudokuCells,
  hasRevealableSudokuCells,
  countRevealableSudokuCells,
  setSudokuCellValue,
} from '../data/sudokuPuzzles'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import {
  emptySudokuFeedbackState,
  emptySudokuSessionStats,
  type SudokuCellFeedback,
  type SudokuCellValue,
  type SudokuFeedbackState,
  type SudokuSession,
  type SudokuSessionStats,
} from '../types/sudoku'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import {
  playSudokuCorrectSound,
  playSudokuRevealSound,
  playSudokuWrongSound,
  preloadSudokuSounds,
  releaseSudokuSounds,
} from '../utils/appSounds'

const FEEDBACK_DURATION_MS = 1200

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

function buildSession(difficulty: ActiveMindPlayDifficulty, excludeId?: string): SudokuSession {
  return createSudokuSession(difficulty, excludeId)
}

export function ActiveMindSudokuScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)
  const difficulty = activeMindParams.difficulty ?? 'facil'

  const [session, setSession] = useState<SudokuSession>(() => buildSession(difficulty))
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [completed, setCompleted] = useState(false)
  const [celebrationSeed, setCelebrationSeed] = useState(0)
  const [sessionStats, setSessionStats] = useState<SudokuSessionStats>(emptySudokuSessionStats)
  const [feedback, setFeedback] = useState<SudokuFeedbackState>(emptySudokuFeedbackState)
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomInset = Math.max(insets.bottom, 8)

  const bodyHorizontalPadding = 8
  const boardFramePadding = 8

  const padButtonHeight = Math.max(48, Math.min(56, Math.floor((screenWidth - 48) / 6.5)))
  const toolbarHeight = 34
  const padHeight = padButtonHeight * 3 + 10 * 2
  const controlsGap = 8
  const controlsHeight = padHeight + toolbarHeight + controlsGap + 18
  const bottomFillHeight = Math.max(bottomInset, 10) + 48
  const headerBlockHeight = headerPaddingTop + 46
  const maxGridByWidth = screenWidth - bodyHorizontalPadding * 2 - boardFramePadding
  const maxGridByHeight =
    screenHeight - headerBlockHeight - controlsHeight - bottomFillHeight - 10
  const maxGridSize = Math.min(maxGridByWidth, maxGridByHeight)

  const feedbackActive = feedback.entryIndex != null

  const padDisabled =
    completed ||
    feedbackActive ||
    selectedIndex == null ||
    isSudokuCellLocked(session, selectedIndex ?? -1)

  const conflictIndexes = useMemo(
    () => getSudokuConflictIndexes(session.values),
    [session.values],
  )

  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)
  const hasConflicts = conflictIndexes.size > 0
  const canReveal =
    selectedIndex != null &&
    !completed &&
    !feedbackActive &&
    selectedIndex >= 0 &&
    !isSudokuCellLocked(session, selectedIndex)

  const canRevealAll = !completed && !feedbackActive && hasRevealableSudokuCells(session)

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current == null) return
    clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = null
  }, [])

  const resetFeedback = useCallback(() => {
    clearFeedbackTimeout()
    setFeedback(emptySudokuFeedbackState())
  }, [clearFeedbackTimeout])

  const scheduleFeedbackEnd = useCallback(
    (entryIndex: number, clearCellOnEnd: boolean) => {
      clearFeedbackTimeout()
      feedbackTimeoutRef.current = setTimeout(() => {
        if (clearCellOnEnd) {
          setSession((current) => clearSudokuCell(current, entryIndex))
        }
        setFeedback(emptySudokuFeedbackState())
        feedbackTimeoutRef.current = null
      }, FEEDBACK_DURATION_MS)
    },
    [clearFeedbackTimeout],
  )

  useEffect(() => {
    preloadSudokuSounds()

    return () => {
      clearFeedbackTimeout()
      releaseSudokuSounds()
    }
  }, [clearFeedbackTimeout])

  useEffect(() => {
    resetFeedback()
    setSession(buildSession(difficulty))
    setSelectedIndex(null)
    setCompleted(false)
    setSessionStats(emptySudokuSessionStats())
  }, [difficulty, resetFeedback])

  useEffect(() => {
    if (!isSudokuComplete(session.values)) return
    if (hasConflicts) return
    if (!isSudokuSolved(session)) return
    if (completed) return

    setCompleted(true)
    setCelebrationSeed((current) => current + 1)
  }, [session.values, hasConflicts, session, completed])

  useAndroidBackHandler(
    useCallback(() => {
      if (completed) {
        handleBack()
        return true
      }

      if (canGoBack()) {
        goBack()
        return true
      }
      return false
    }, [canGoBack, goBack, completed]),
  )

  function handleBack() {
    if (canGoBack()) {
      goBack()
      return
    }
    navigateTo('active-mind')
  }

  function handleNewGame() {
    resetFeedback()
    setSession((current) => buildSession(difficulty, current.puzzleId))
    setSelectedIndex(null)
    setCompleted(false)
    setSessionStats(emptySudokuSessionStats())
  }

  function handleSelectCell(index: number) {
    if (feedbackActive) return
    setSelectedIndex(index)
  }

  function handlePickNumber(value: SudokuCellValue) {
    if (selectedIndex == null || completed || feedbackActive) return
    if (isSudokuCellLocked(session, selectedIndex)) return

    const entryIndex = selectedIndex
    const nextSession = setSudokuCellValue(session, entryIndex, value)
    const isCorrect = nextSession.solution[entryIndex] === value

    setSessionStats((current) => ({
      ...current,
      attempts: current.attempts + 1,
      correct: isCorrect ? current.correct + 1 : current.correct,
    }))

    if (isCorrect) {
      playSudokuCorrectSound()
      setSession(nextSession)
      setFeedback({
        cells: { [entryIndex]: 'correct' },
        message: null,
        entryIndex,
      })
      scheduleFeedbackEnd(entryIndex, false)
      return
    }

    const peerIndexes = getSudokuDuplicatePeerIndexes(nextSession.values, entryIndex)

    if (peerIndexes.length > 0) {
      setSessionStats((current) => ({
        ...current,
        errors: current.errors + 1,
      }))
      playSudokuWrongSound()
      setSession(nextSession)

      const cells: Partial<Record<number, SudokuCellFeedback>> = {
        [entryIndex]: 'wrong',
      }

      for (const peerIndex of peerIndexes) {
        cells[peerIndex] = 'conflict-source'
      }

      setFeedback({
        cells,
        message: getSudokuConflictMessage(nextSession.values, entryIndex),
        entryIndex,
      })
      scheduleFeedbackEnd(entryIndex, true)
      return
    }

    // Válido na linha/coluna/bloco, mas não é a solução — permanece no tabuleiro.
    setSession(nextSession)
  }

  function handleRevealCell() {
    if (selectedIndex == null || completed || feedbackActive) return
    if (!canReveal) return

    resetFeedback()
    playSudokuRevealSound()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSessionStats((current) => ({
      ...current,
      reveals: current.reveals + 1,
    }))
    setSession((current) => revealSudokuCell(current, selectedIndex))
  }

  function handleRevealAllCells() {
    if (completed || feedbackActive || !canRevealAll) return

    const revealCount = countRevealableSudokuCells(session)

    resetFeedback()
    playSudokuRevealSound()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setSessionStats((current) => ({
      ...current,
      reveals: current.reveals + revealCount,
    }))
    setSession((current) => revealAllSudokuCells(current))
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Sudoku"
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
          <View style={styles.boardArea}>
            <SudokuBoard
              session={session}
              selectedIndex={selectedIndex}
              conflictIndexes={conflictIndexes}
              cellFeedback={feedback.cells}
              maxGridSize={maxGridSize}
              onSelectCell={handleSelectCell}
            />

          </View>

          <View style={styles.controls}>
            <View style={styles.toolbarRow}>
              <Pressable
                onPress={handleRevealAllCells}
                disabled={!canRevealAll}
                style={({ pressed }) => [
                  styles.revealLinkWrap,
                  !canRevealAll && styles.revealLinkWrapDisabled,
                  pressed && canRevealAll && styles.revealLinkWrapPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Revelar todas as células restantes"
              >
                <Text style={[styles.revealLink, !canRevealAll && styles.revealLinkDisabled]}>
                  Revelar tudo!
                </Text>
              </Pressable>

              <Pressable
                onPress={handleRevealCell}
                disabled={!canReveal}
                style={({ pressed }) => [
                  styles.revealLinkWrap,
                  !canReveal && styles.revealLinkWrapDisabled,
                  pressed && canReveal && styles.revealLinkWrapPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Revelar número correto da célula selecionada"
              >
                <Text style={[styles.revealLink, !canReveal && styles.revealLinkDisabled]}>Revelar</Text>
              </Pressable>
            </View>

            <SudokuNumberPad
              buttonHeight={padButtonHeight}
              onPickNumber={handlePickNumber}
              disabled={padDisabled}
            />
          </View>

          <View style={[styles.bottomFill, { minHeight: bottomFillHeight, paddingBottom: bottomInset }]}>
            <View style={styles.feedbackMessageSlot}>
              {feedback.message ? (
                <Text style={styles.conflictHint}>{feedback.message}</Text>
              ) : null}
            </View>
            <NeonSectionDivider embedded style={styles.bottomDivider} />
          </View>
        </View>
      </ImageBackground>

      <SudokuVictoryDrawer
        visible={completed}
        difficulty={difficulty}
        stats={sessionStats}
        celebrationSeed={celebrationSeed}
        onPlayAgain={handleNewGame}
        onClose={handleBack}
      />
    </View>
  )
}

const styles = StyleSheet.create({
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
  boardArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  controls: {
    gap: 6,
    paddingTop: 8,
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
  revealLinkDisabled: {
    color: colors.textSubtle,
  },
  conflictHint: {
    color: colors.error,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
})
