import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { WordSearchBoard } from '../components/activeMind/wordSearch/WordSearchBoard'
import { WordSearchHintList } from '../components/activeMind/wordSearch/WordSearchHintList'
import { SudokuVictoryDrawer } from '../components/activeMind/sudoku/SudokuVictoryDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { getActiveMindDifficultyLabel } from '../config/activeMindDifficulty'
import { appEnv } from '../config/env'
import {
  createWordSearchSession,
  findWordSearchEntryForSelection,
  getWordSearchFoundCellKeys,
  isWordSearchSolved,
  markWordSearchEntryFound,
} from '../data/wordSearchPuzzles'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { getActiveMindRouteParams } from '../types/auth'
import type { ActiveMindPlayDifficulty } from '../types/activeMind'
import type { WordSearchSession } from '../types/wordSearch'
import {
  emptyWordSearchSessionStats,
  type WordSearchSessionStats,
} from '../types/wordSearch'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import { buildWordSearchSelectionLine, wordSearchCellKey } from '../utils/wordSearchSelection'
import {
  playFormTheWordCorrectSound,
  playFormTheWordWrongSound,
  playPalavrasClickSound,
  preloadPalavrasSounds,
  preloadSudokuSounds,
  releasePalavrasSounds,
  releaseSudokuSounds,
} from '../utils/appSounds'

const WRONG_FEEDBACK_DURATION_MS = 1200
const TAP_VALIDATE_DELAY_MS = 420

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

function buildSession(difficulty: ActiveMindPlayDifficulty, excludeId?: string): WordSearchSession {
  return createWordSearchSession(difficulty, excludeId)
}

export function ActiveMindWordSearchScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const { routeParams, goBack, canGoBack, navigateTo } = useAuth()
  const activeMindParams = getActiveMindRouteParams(routeParams)
  const difficulty = activeMindParams.difficulty ?? 'facil'

  const [session, setSession] = useState<WordSearchSession>(() => buildSession(difficulty))
  const [activeSelectionKeys, setActiveSelectionKeys] = useState<Set<string>>(new Set())
  const [wrongSelectionKeys, setWrongSelectionKeys] = useState<Set<string>>(new Set())
  const [victoryVisible, setVictoryVisible] = useState(false)
  const [celebrationSeed, setCelebrationSeed] = useState(0)
  const [sessionStats, setSessionStats] = useState<WordSearchSessionStats>(emptyWordSearchSessionStats)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [tapAnchor, setTapAnchor] = useState<{ row: number; col: number } | null>(null)
  const wrongFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tapValidateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const validatingRef = useRef(false)

  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomInset = Math.max(insets.bottom, 8)
  const difficultyLabel = getActiveMindDifficultyLabel(difficulty)

  const bodyHorizontalPadding = 8
  const cardWidth = screenWidth - bodyHorizontalPadding * 2
  const feedbackSlotHeight = 8
  const bottomReserved = Math.max(bottomInset, 8) + feedbackSlotHeight + 10
  const headerBlockHeight = headerPaddingTop + 46
  const minBoardSize = 132
  const boardControlsGap = 6

  const availableContentHeight = screenHeight - headerBlockHeight - bottomReserved
  const hintsAreaHeight = Math.floor(availableContentHeight * 0.32)
  const maxBoardSize = Math.min(
    cardWidth,
    Math.max(minBoardSize, availableContentHeight - hintsAreaHeight - boardControlsGap - 16),
  )

  const foundCellKeys = useMemo(() => getWordSearchFoundCellKeys(session), [session])
  const inputDisabled = victoryVisible

  const clearWrongFeedbackTimeout = useCallback(() => {
    if (wrongFeedbackTimeoutRef.current == null) return
    clearTimeout(wrongFeedbackTimeoutRef.current)
    wrongFeedbackTimeoutRef.current = null
  }, [])

  const clearTapValidateTimeout = useCallback(() => {
    if (tapValidateTimeoutRef.current == null) return
    clearTimeout(tapValidateTimeoutRef.current)
    tapValidateTimeoutRef.current = null
  }, [])

  const showPuzzleVictory = useCallback(() => {
    setCelebrationSeed((current) => current + 1)
    setVictoryVisible(true)
    validatingRef.current = false
    setTapAnchor(null)
    setActiveSelectionKeys(new Set())
    setWrongSelectionKeys(new Set())
    setFeedbackMessage(null)
    clearTapValidateTimeout()
  }, [clearTapValidateTimeout])

  const advanceToNextPuzzle = useCallback((excludeId: string) => {
    setSession(buildSession(difficulty, excludeId))
    setTapAnchor(null)
    setActiveSelectionKeys(new Set())
    setWrongSelectionKeys(new Set())
    setFeedbackMessage(null)
    validatingRef.current = false
    clearTapValidateTimeout()
  }, [clearTapValidateTimeout, difficulty])

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
      clearWrongFeedbackTimeout()
      clearTapValidateTimeout()
    }
  }, [clearTapValidateTimeout, clearWrongFeedbackTimeout])

  useEffect(() => {
    clearWrongFeedbackTimeout()
    clearTapValidateTimeout()
    setSession(buildSession(difficulty))
    setVictoryVisible(false)
    setSessionStats(emptyWordSearchSessionStats())
    setTapAnchor(null)
    setActiveSelectionKeys(new Set())
    setWrongSelectionKeys(new Set())
    setFeedbackMessage(null)
    validatingRef.current = false
  }, [clearTapValidateTimeout, clearWrongFeedbackTimeout, difficulty])

  const handleSelectionChange = useCallback((cellKeys: string[]) => {
    if (victoryVisible) return
    setActiveSelectionKeys(new Set(cellKeys))
    setWrongSelectionKeys(new Set())
  }, [victoryVisible])

  const handleSelectionComplete = useCallback(
    (cellKeys: string[]) => {
      clearTapValidateTimeout()
      setTapAnchor(null)

      if (victoryVisible || validatingRef.current) {
        setActiveSelectionKeys(new Set())
        return
      }

      setActiveSelectionKeys(new Set())

      if (cellKeys.length < 2) return

      playPalavrasClickSound()
      validatingRef.current = true

      const matchedEntry = findWordSearchEntryForSelection(session, cellKeys)

      setSessionStats((current) => ({
        ...current,
        attempts: current.attempts + 1,
      }))

      if (matchedEntry) {
        playFormTheWordCorrectSound()
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        setSessionStats((current) => ({
          ...current,
          correct: current.correct + 1,
        }))

        const nextSession = markWordSearchEntryFound(session, matchedEntry.id)
        setSession(nextSession)
        setFeedbackMessage(`Palavra encontrada: ${matchedEntry.word}`)

        if (isWordSearchSolved(nextSession)) {
          showPuzzleVictory()
        } else {
          validatingRef.current = false
        }

        return
      }

      playFormTheWordWrongSound()
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

      setSessionStats((current) => ({
        ...current,
        errors: current.errors + 1,
      }))
      setWrongSelectionKeys(new Set(cellKeys))
      setFeedbackMessage('Essa seleção não corresponde a nenhuma palavra.')

      clearWrongFeedbackTimeout()
      wrongFeedbackTimeoutRef.current = setTimeout(() => {
        setWrongSelectionKeys(new Set())
        setFeedbackMessage(null)
        validatingRef.current = false
        wrongFeedbackTimeoutRef.current = null
      }, WRONG_FEEDBACK_DURATION_MS)
    },
    [clearTapValidateTimeout, clearWrongFeedbackTimeout, session, showPuzzleVictory, victoryVisible],
  )

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (victoryVisible || validatingRef.current) return

      playPalavrasClickSound()
      clearTapValidateTimeout()
      setWrongSelectionKeys(new Set())

      if (!tapAnchor) {
        setTapAnchor({ row, col })
        setActiveSelectionKeys(new Set([wordSearchCellKey(row, col)]))
        return
      }

      if (tapAnchor.row === row && tapAnchor.col === col) {
        const currentKeys = [...activeSelectionKeys]
        if (currentKeys.length >= 2) {
          handleSelectionComplete(currentKeys)
          return
        }

        setTapAnchor(null)
        setActiveSelectionKeys(new Set())
        return
      }

      const keys = buildWordSearchSelectionLine(tapAnchor, { row, col }, session.rows, session.cols)
      setActiveSelectionKeys(new Set(keys))

      if (keys.length < 2) {
        setTapAnchor({ row, col })
        setActiveSelectionKeys(new Set([wordSearchCellKey(row, col)]))
        return
      }

      tapValidateTimeoutRef.current = setTimeout(() => {
        handleSelectionComplete(keys)
        tapValidateTimeoutRef.current = null
      }, TAP_VALIDATE_DELAY_MS)
    },
    [
      activeSelectionKeys,
      clearTapValidateTimeout,
      handleSelectionComplete,
      session.cols,
      session.rows,
      tapAnchor,
      victoryVisible,
    ],
  )

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
    clearWrongFeedbackTimeout()
    clearTapValidateTimeout()
    validatingRef.current = false
    setTapAnchor(null)
    setVictoryVisible(false)
    setSessionStats(emptyWordSearchSessionStats())
    setActiveSelectionKeys(new Set())
    setWrongSelectionKeys(new Set())
    setFeedbackMessage(null)
    advanceToNextPuzzle(session.puzzleId)
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Caça-palavras"
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
            <WordSearchBoard
              rows={session.rows}
              cols={session.cols}
              cells={session.cells}
              activeSelectionKeys={activeSelectionKeys}
              foundCellKeys={foundCellKeys}
              wrongSelectionKeys={wrongSelectionKeys}
              layoutWidth={cardWidth}
              maxSize={maxBoardSize}
              disabled={inputDisabled}
              onSelectionChange={handleSelectionChange}
              onSelectionComplete={handleSelectionComplete}
              onCellPress={handleCellPress}
            />
          </View>

          <View style={[styles.controls, { marginTop: boardControlsGap }]}>
            <WordSearchHintList
              entries={session.entries}
              foundEntryIds={session.foundEntryIds}
              feedbackMessage={feedbackMessage}
              layoutWidth={cardWidth}
            />
          </View>

          <View style={[styles.bottomFill, { paddingBottom: bottomInset }]}>
            <NeonSectionDivider embedded style={styles.bottomDivider} />
          </View>
        </View>
      </ImageBackground>

      <SudokuVictoryDrawer
        visible={victoryVisible}
        difficulty={difficulty}
        stats={sessionStats}
        celebrationSeed={celebrationSeed}
        completionKicker="Caça-palavras completo!"
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
    alignItems: 'stretch',
    flexShrink: 0,
  },
  controls: {
    flex: 1,
    minHeight: 0,
    alignSelf: 'stretch',
  },
  bottomFill: {
    flexShrink: 0,
  },
  bottomDivider: {
    marginBottom: 0,
  },
  newGameButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  newGameButtonPressed: {
    opacity: 0.8,
  },
})
