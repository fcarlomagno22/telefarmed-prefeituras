import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
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
import { CrosswordBoard } from '../components/activeMind/crosswords/CrosswordBoard'
import { CrosswordLetterPad } from '../components/activeMind/crosswords/CrosswordLetterPad'
import { SudokuVictoryDrawer } from '../components/activeMind/sudoku/SudokuVictoryDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { appEnv } from '../config/env'
import {
  clearCrosswordCell,
  clearCrosswordEntryInput,
  createCrosswordSession,
  getCrosswordEntriesAtCell,
  getCrosswordEntriesStartingAtCell,
  getCrosswordEntryAtCell,
  getCrosswordEntryCells,
  getNextCrosswordCellInEntry,
  isCrosswordCellLockedByOtherSolvedEntry,
  isCrosswordEntryComplete,
  isCrosswordEntryCorrect,
  isCrosswordPlayableCell,
  isCrosswordSolved,
  markCrosswordEntrySolved,
  revealCrosswordCell,
  setCrosswordCellValue,
} from '../data/crosswordPuzzles'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { CrosswordDirection, CrosswordEntry, CrosswordSession } from '../types/crossword'
import {
  emptyCrosswordFeedbackState,
  emptyCrosswordSessionStats,
  type CrosswordCellFeedback,
  type CrosswordFeedbackState,
  type CrosswordSessionStats,
} from '../types/crossword'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import { normalizeWordAnswer } from '../utils/formTheWordChunks'
import {
  playFormTheWordCorrectSound,
  playFormTheWordWrongSound,
  playPalavrasBackspaceSound,
  playSudokuRevealSound,
  preloadPalavrasSounds,
  preloadSudokuSounds,
  releasePalavrasSounds,
  releaseSudokuSounds,
} from '../utils/appSounds'

const WRONG_FEEDBACK_DURATION_MS = 1200

const brainLottie = require('../../assets/brain1.json')

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

function buildSession(difficulty: ActiveMindPlayDifficulty, excludeId?: string): CrosswordSession {
  return createCrosswordSession(difficulty, excludeId)
}

export function ActiveMindCrosswordsScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)
  const difficulty = activeMindParams.difficulty ?? 'facil'

  const [session, setSession] = useState<CrosswordSession>(() => buildSession(difficulty))
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [activeDirection, setActiveDirection] = useState<CrosswordDirection>('across')
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)
  const [hintTooltipEntry, setHintTooltipEntry] = useState<CrosswordEntry | null>(null)
  const [victoryVisible, setVictoryVisible] = useState(false)
  const [celebrationSeed, setCelebrationSeed] = useState(0)
  const [sessionStats, setSessionStats] = useState<CrosswordSessionStats>(emptyCrosswordSessionStats)
  const [feedback, setFeedback] = useState<CrosswordFeedbackState>(emptyCrosswordFeedbackState)
  const [cellFeedback, setCellFeedback] = useState<Record<string, CrosswordCellFeedback>>({})
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkingRef = useRef(false)
  const lastTappedCellRef = useRef<string | null>(null)

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomInset = Math.max(insets.bottom, 8)
  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)

  const bodyHorizontalPadding = 8
  const padWidth = screenWidth - bodyHorizontalPadding * 2
  const padKeyGap = 4
  const padRowGap = 6
  const keyboardRows = 3
  const firstRowKeyCount = 10
  const toolbarHeight = 36
  const controlsGap = 8
  const boardControlsGap = 12
  const feedbackSlotHeight = 34
  const brainLottieHeight = 88
  const bottomReserved = Math.max(bottomInset, 8) + feedbackSlotHeight + brainLottieHeight + 10
  const headerBlockHeight = headerPaddingTop + 46
  const minBoardSize = 132

  const keySizeByWidth = Math.floor(
    (padWidth - padKeyGap * Math.max(0, firstRowKeyCount - 1)) / firstRowKeyCount,
  )

  const availableContentHeight = screenHeight - headerBlockHeight - bottomReserved
  const maxKeySizeByHeight = Math.floor(
    (availableContentHeight -
      minBoardSize -
      toolbarHeight -
      controlsGap -
      boardControlsGap -
      brainLottieHeight -
      padRowGap * (keyboardRows - 1)) /
      keyboardRows,
  )

  const padKeySize = Math.max(30, Math.min(keySizeByWidth, maxKeySizeByHeight))
  const padHeight = padKeySize * keyboardRows + padRowGap * (keyboardRows - 1)
  const controlsHeight = toolbarHeight + controlsGap + boardControlsGap + padHeight
  const maxBoardByWidth = screenWidth - 48
  const maxBoardByHeight = availableContentHeight - controlsHeight
  const maxBoardSize = Math.min(maxBoardByWidth, Math.max(minBoardSize, maxBoardByHeight))

  const feedbackActive = feedback.active

  const activeEntry = useMemo(
    () => session.entries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId, session.entries],
  )

  const activeEntryCellKeys = useMemo(
    () => (activeEntryId ? getCrosswordEntryCells(session, activeEntryId) : []),
    [activeEntryId, session],
  )

  const solvedCellKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const entry of session.entries) {
      if (!session.solvedEntryIds.has(entry.id)) continue
      for (const key of entry.cellKeys) {
        keys.add(key)
      }
    }
    return keys
  }, [session])

  const isActiveEntrySolved =
    activeEntryId != null && session.solvedEntryIds.has(activeEntryId)

  const canRevealCell =
    !victoryVisible &&
    !feedbackActive &&
    selectedCell != null &&
    isCrosswordPlayableCell(session, selectedCell.row, selectedCell.col) &&
    !isCrosswordCellLockedByOtherSolvedEntry(session, selectedCell.row, selectedCell.col, activeEntryId)

  const selectedPlayable =
    selectedCell != null && isCrosswordPlayableCell(session, selectedCell.row, selectedCell.col)

  const padDisabled =
    victoryVisible ||
    feedbackActive ||
    selectedCell == null ||
    activeEntryId == null ||
    !selectedPlayable ||
    isActiveEntrySolved

  const clearFeedbackTimeout = useCallback(() => {
    if (feedbackTimeoutRef.current == null) return
    clearTimeout(feedbackTimeoutRef.current)
    feedbackTimeoutRef.current = null
  }, [])

  const resetFeedback = useCallback(() => {
    clearFeedbackTimeout()
    checkingRef.current = false
    setFeedback(emptyCrosswordFeedbackState())
    setCellFeedback({})
  }, [clearFeedbackTimeout])

  const selectEntry = useCallback(
    (entryId: string, row: number, col: number, direction: CrosswordDirection) => {
      setActiveEntryId(entryId)
      setActiveDirection(direction)
      setSelectedCell({ row, col })
    },
    [],
  )

  const focusEntryAtStart = useCallback(
    (entry: CrosswordEntry, options?: { showHint?: boolean }) => {
      selectEntry(entry.id, entry.row, entry.col, entry.direction)
      setHintTooltipEntry(options?.showHint && entry.hint ? entry : null)
    },
    [selectEntry],
  )

  const ensureInitialSelection = useCallback((nextSession: CrosswordSession) => {
    const firstEntry = nextSession.entries[0]
    if (!firstEntry) return

    const [row, col] = firstEntry.cellKeys[0].split(',').map(Number)
    setActiveEntryId(firstEntry.id)
    setActiveDirection(firstEntry.direction)
    setSelectedCell({ row, col })
    setHintTooltipEntry(null)
  }, [])

  const advanceToNextPuzzle = useCallback(
    (excludeId: string) => {
      clearFeedbackTimeout()
      checkingRef.current = false
      resetFeedback()
      const nextSession = buildSession(difficulty, excludeId)
      setSession(nextSession)
      ensureInitialSelection(nextSession)
    },
    [clearFeedbackTimeout, difficulty, ensureInitialSelection, resetFeedback],
  )

  const showPuzzleVictory = useCallback(() => {
    clearFeedbackTimeout()
    checkingRef.current = false
    setCellFeedback({})
    setVictoryVisible(true)
    setCelebrationSeed((current) => current + 1)
  }, [clearFeedbackTimeout])

  const scheduleWrongFeedback = useCallback(
    (entryId: string) => {
      clearFeedbackTimeout()
      feedbackTimeoutRef.current = setTimeout(() => {
        setSession((current) => clearCrosswordEntryInput(current, entryId))
        setFeedback(emptyCrosswordFeedbackState())
        setCellFeedback({})
        checkingRef.current = false
        feedbackTimeoutRef.current = null
      }, WRONG_FEEDBACK_DURATION_MS)
    },
    [clearFeedbackTimeout],
  )

  const validateActiveEntryIfComplete = useCallback(() => {
    if (!activeEntryId) return
    if (session.solvedEntryIds.has(activeEntryId)) return
    if (!isCrosswordEntryComplete(session, activeEntryId)) return
    if (victoryVisible || feedbackActive || checkingRef.current) return

    checkingRef.current = true

    setSessionStats((current) => ({
      ...current,
      attempts: current.attempts + 1,
    }))

    if (isCrosswordEntryCorrect(session, activeEntryId)) {
      playFormTheWordCorrectSound()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

      const entryCells = getCrosswordEntryCells(session, activeEntryId)
      const nextCellFeedback: Record<string, CrosswordCellFeedback> = {}
      for (const key of entryCells) {
        nextCellFeedback[key] = 'correct'
      }
      setCellFeedback(nextCellFeedback)

      setSessionStats((current) => ({
        ...current,
        correct: current.correct + 1,
      }))

      setSession((current) => markCrosswordEntrySolved(current, activeEntryId))

      const solvedIds = new Set([...session.solvedEntryIds, activeEntryId])
      if (isCrosswordSolved({ ...session, solvedEntryIds: solvedIds })) {
        showPuzzleVictory()
      } else {
        const nextEntry = session.entries.find((entry) => !solvedIds.has(entry.id))
        if (nextEntry) {
          focusEntryAtStart(nextEntry, { showHint: true })
        }
        checkingRef.current = false
        setCellFeedback({})
      }

      return
    }

    playFormTheWordWrongSound()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

    const entryCells = getCrosswordEntryCells(session, activeEntryId)
    const nextCellFeedback: Record<string, CrosswordCellFeedback> = {}
    for (const key of entryCells) {
      nextCellFeedback[key] = 'wrong'
    }

    setSessionStats((current) => ({
      ...current,
      errors: current.errors + 1,
    }))
    setFeedback({
      active: true,
      kind: 'wrong',
      message: 'Essa palavra não está correta. Tente novamente.',
      entryId: activeEntryId,
      cellKeys: entryCells,
    })
    setCellFeedback(nextCellFeedback)
    scheduleWrongFeedback(activeEntryId)
  }, [
    activeEntryId,
    feedbackActive,
    focusEntryAtStart,
    scheduleWrongFeedback,
    session,
    showPuzzleVictory,
    victoryVisible,
  ])

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
    const nextSession = buildSession(difficulty)
    setSession(nextSession)
    setVictoryVisible(false)
    setSessionStats(emptyCrosswordSessionStats())
    ensureInitialSelection(nextSession)
  }, [difficulty, ensureInitialSelection, resetFeedback])

  useEffect(() => {
    validateActiveEntryIfComplete()
  }, [validateActiveEntryIfComplete])

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
    checkingRef.current = false
    setVictoryVisible(false)
    setSessionStats(emptyCrosswordSessionStats())
    advanceToNextPuzzle(session.puzzleId)
  }

  function handleSelectCell(row: number, col: number) {
    if (victoryVisible || feedbackActive) return
    if (!isCrosswordPlayableCell(session, row, col)) return

    const key = cellKey(row, col)
    const cell = session.cells[key]
    const isNumberedCell = cell?.number != null
    const entries = getCrosswordEntriesAtCell(session, row, col)
    if (entries.length === 0) return

    const startingEntries = getCrosswordEntriesStartingAtCell(session, row, col)

    if (startingEntries.length > 0) {
      if (lastTappedCellRef.current === key && startingEntries.length > 1) {
        const currentIndex = startingEntries.findIndex((entry) => entry.id === activeEntryId)
        const nextEntry = startingEntries[(currentIndex + 1) % startingEntries.length]
        selectEntry(nextEntry.id, row, col, nextEntry.direction)
        setHintTooltipEntry(isNumberedCell ? nextEntry : null)
        return
      }

      lastTappedCellRef.current = key
      const preferredStart =
        startingEntries.find((entry) => entry.id === activeEntryId) ??
        startingEntries.find((entry) => !session.solvedEntryIds.has(entry.id)) ??
        startingEntries[0]
      selectEntry(preferredStart.id, row, col, preferredStart.direction)
      if (isNumberedCell && preferredStart.hint) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      }
      setHintTooltipEntry(isNumberedCell ? preferredStart : null)
      return
    }

    setHintTooltipEntry(null)

    if (lastTappedCellRef.current === key && entries.length > 1) {
      const nextDirection: CrosswordDirection = activeDirection === 'across' ? 'down' : 'across'
      const alternate =
        getCrosswordEntryAtCell(session, row, col, nextDirection) ??
        getCrosswordEntryAtCell(session, row, col, activeDirection) ??
        entries[0]
      selectEntry(alternate.id, row, col, alternate.direction)
      return
    }

    lastTappedCellRef.current = key

    const preferred =
      getCrosswordEntryAtCell(session, row, col, activeDirection) ??
      entries.find((entry) => !session.solvedEntryIds.has(entry.id)) ??
      entries[0]

    selectEntry(preferred.id, row, col, preferred.direction)
  }

  function handlePickLetter(letter: string) {
    if (victoryVisible || feedbackActive) return
    if (padDisabled || selectedCell == null || activeEntryId == null) return

    const { row, col } = selectedCell
    const key = cellKey(row, col)
    const cell = session.cells[key]
    if (!cell || cell.isBlock) return

    const lockedCrossing = isCrosswordCellLockedByOtherSolvedEntry(
      session,
      row,
      col,
      activeEntryId,
    )

    if (lockedCrossing) {
      if (normalizeWordAnswer(letter) !== normalizeWordAnswer(cell.solution)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }

      const nextCell = getNextCrosswordCellInEntry(session, activeEntryId, row, col, 1)
      if (nextCell) {
        setSelectedCell(nextCell)
        setHintTooltipEntry(null)
      }
      validateActiveEntryIfComplete()
      return
    }

    const alreadyFilled =
      cell.user && normalizeWordAnswer(cell.user) === normalizeWordAnswer(cell.solution)

    if (alreadyFilled && normalizeWordAnswer(letter) === normalizeWordAnswer(cell.solution)) {
      const nextCell = getNextCrosswordCellInEntry(session, activeEntryId, row, col, 1)
      if (nextCell) {
        setSelectedCell(nextCell)
        setHintTooltipEntry(null)
      }
      validateActiveEntryIfComplete()
      return
    }

    setSession((current) => {
      const updated = setCrosswordCellValue(current, row, col, letter)
      const nextCell = getNextCrosswordCellInEntry(updated, activeEntryId, row, col, 1)

      if (nextCell) {
        setSelectedCell(nextCell)
        setHintTooltipEntry(null)
      }

      return updated
    })
  }

  function handleBackspace() {
    if (victoryVisible || feedbackActive) return
    playPalavrasBackspaceSound()
    if (padDisabled || selectedCell == null || activeEntryId == null) return

    const { row, col } = selectedCell
    const key = cellKey(row, col)

    if (isCrosswordCellLockedByOtherSolvedEntry(session, row, col, activeEntryId)) {
      const previousCell = getNextCrosswordCellInEntry(session, activeEntryId, row, col, -1)
      if (!previousCell) return

      setSelectedCell(previousCell)
      setHintTooltipEntry(null)
      return
    }

    const cell = session.cells[key]

    if (cell?.user) {
      setSession((current) => clearCrosswordCell(current, row, col))
      return
    }

    const previousCell = getNextCrosswordCellInEntry(session, activeEntryId, row, col, -1)
    if (!previousCell) return

    setSelectedCell(previousCell)
    setHintTooltipEntry(null)
    setSession((current) => clearCrosswordCell(current, previousCell.row, previousCell.col))
  }

  function handleRevealCell() {
    if (!canRevealCell || selectedCell == null) return

    resetFeedback()
    playSudokuRevealSound()
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSessionStats((current) => ({
      ...current,
      reveals: current.reveals + 1,
    }))
    setSession((current) => revealCrosswordCell(current, selectedCell.row, selectedCell.col))
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Palavras cruzadas"
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
          <View style={[styles.boardArea, { maxHeight: maxBoardSize + 20 }]}>
            <CrosswordBoard
              rows={session.rows}
              cols={session.cols}
              cells={session.cells}
              selectedCell={selectedCell}
              hintTooltipEntry={hintTooltipEntry}
              activeEntryCellKeys={activeEntryCellKeys}
              activeEntrySolved={isActiveEntrySolved}
              solvedCellKeys={solvedCellKeys}
              cellFeedback={cellFeedback}
              maxSize={maxBoardSize}
              onSelectCell={handleSelectCell}
            />
          </View>

          <View style={styles.controls}>
            <View style={styles.toolbarRow}>
              <Pressable
                onPress={handleRevealCell}
                disabled={!canRevealCell}
                style={({ pressed }) => [
                  styles.toolbarActionWrap,
                  !canRevealCell && styles.toolbarActionWrapDisabled,
                  pressed && canRevealCell && styles.toolbarActionWrapPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Revelar letra selecionada"
              >
                <Text style={[styles.toolbarLink, !canRevealCell && styles.toolbarLinkDisabled]}>Revelar</Text>
              </Pressable>

              <Pressable
                onPress={handleBackspace}
                disabled={padDisabled}
                style={({ pressed }) => [
                  styles.toolbarEraseButton,
                  padDisabled && styles.toolbarEraseButtonDisabled,
                  pressed && !padDisabled && styles.toolbarEraseButtonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Apagar letra"
              >
                <Ionicons
                  name="backspace-outline"
                  size={18}
                  color={padDisabled ? colors.textSubtle : '#67e8f9'}
                />
                <Text style={[styles.toolbarEraseLabel, padDisabled && styles.toolbarEraseLabelDisabled]}>
                  Apagar
                </Text>
              </Pressable>
            </View>

            <CrosswordLetterPad
              keySize={padKeySize}
              keyGap={padKeyGap}
              rowGap={padRowGap}
              padWidth={padWidth}
              disabled={padDisabled}
              onPickLetter={handlePickLetter}
            />
          </View>

          <View style={styles.brainLottieWrap}>
            <LottieView
              source={brainLottie}
              autoPlay
              loop
              resizeMode="contain"
              style={styles.brainLottie}
            />
          </View>

          <View style={[styles.bottomFill, { paddingBottom: bottomInset }]}>
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
        completionKicker="Cruzadinha completa!"
        onPlayAgain={handleNewGame}
        onClose={handleVictoryClose}
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
    justifyContent: 'flex-start',
  },
  boardArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    flexShrink: 1,
    minHeight: 0,
  },
  controls: {
    gap: 8,
    paddingTop: 12,
    alignSelf: 'stretch',
    flexShrink: 0,
  },
  brainLottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 2,
    flexShrink: 0,
  },
  brainLottie: {
    width: 120,
    height: 88,
  },
  bottomFill: {
    flexShrink: 0,
  },
  feedbackMessageSlot: {
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  bottomDivider: {
    marginBottom: 0,
  },
  toolbarRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    paddingHorizontal: 2,
  },
  toolbarActionWrap: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  toolbarActionWrapPressed: {
    opacity: 0.75,
  },
  toolbarActionWrapDisabled: {
    opacity: 0.4,
  },
  toolbarLink: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  toolbarLinkDisabled: {
    color: colors.textSubtle,
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
  feedbackHint: {
    color: colors.error,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 12,
  },
})
