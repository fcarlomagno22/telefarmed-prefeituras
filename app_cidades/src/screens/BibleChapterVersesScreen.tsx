import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Animated, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BibleHighlightedVerseText, type BibleVerseTextSelection } from '../components/bible/BibleHighlightedVerseText'
import { BibleReaderShell } from '../components/bible/BibleReaderShell'
import { BibleVerseFontControls } from '../components/bible/BibleVerseFontControls'
import {
  BibleVerseHighlightDrawer,
  type BibleHighlightDrawerState,
} from '../components/bible/BibleVerseHighlightDrawer'
import { BibleVerseLikeBurst } from '../components/bible/BibleVerseLikeBurst'
import { BibleVerseLikeButton } from '../components/bible/BibleVerseLikeButton'
import { BibleVerseSelectionAction } from '../components/bible/BibleVerseSelectionAction'
import {
  formatBibleChapterReference,
  getBibleBookByAbbrev,
  getBibleChapterVerses,
} from '../data/bibleCatalog'
import {
  buildHighlightFromSelection,
  deleteBibleVerseHighlight,
  loadBibleChapterHighlights,
  saveBibleVerseHighlight,
} from '../data/bibleVerseHighlightsStorage'
import {
  addBibleVerseLike,
  BIBLE_VERSE_FONT_DEFAULT,
  BIBLE_VERSE_FONT_MAX,
  BIBLE_VERSE_FONT_MIN,
  buildBibleVerseLikeKey,
  loadBibleVerseFontSize,
  loadBibleVerseLikes,
  saveBibleVerseFontSize,
  toggleBibleVerseLike,
} from '../data/bibleVersePreferencesStorage'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { getBibleRouteParams } from '../types/auth'
import type { BibleVerseHighlight } from '../types/bibleHighlights'
import { colors } from '../theme/colors'

const TAB_BAR_ESTIMATED_HEIGHT = 78

export function BibleChapterVersesScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, goBack, user, navigateTo } = useAuth()
  const patientCpf = user?.cpf ?? 'guest'
  const { bookAbbrev, chapter, verse: focusVerse } = getBibleRouteParams(routeParams)

  const [fontSize, setFontSize] = useState(BIBLE_VERSE_FONT_DEFAULT)
  const [likedVerseKeys, setLikedVerseKeys] = useState<Set<string>>(new Set())
  const [likeBurstVisible, setLikeBurstVisible] = useState(false)
  const [highlights, setHighlights] = useState<BibleVerseHighlight[]>([])
  const [highlightDrawerVisible, setHighlightDrawerVisible] = useState(false)
  const [highlightDrawerState, setHighlightDrawerState] = useState<BibleHighlightDrawerState | null>(
    null,
  )
  const [pendingSelection, setPendingSelection] = useState<
    (BibleVerseTextSelection & { verse: number; verseText: string }) | null
  >(null)
  const [selectionModeVerses, setSelectionModeVerses] = useState<Set<number>>(new Set())
  const [fillingLikeKeys, setFillingLikeKeys] = useState<Set<string>>(new Set())
  const scrollRef = useRef<ScrollView>(null)
  const verseOffsetsRef = useRef<Map<number, number>>(new Map())
  const hasScrolledToFocusRef = useRef(false)
  const focusPulse = useRef(new Animated.Value(0)).current

  const book = useMemo(
    () => (bookAbbrev ? getBibleBookByAbbrev(bookAbbrev) : null),
    [bookAbbrev],
  )
  const chapterNumber = chapter ?? 0
  const verses = useMemo(() => {
    if (!book || chapterNumber < 1) return []
    return getBibleChapterVerses(book, chapterNumber)
  }, [book, chapterNumber])

  const bottomPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24
  const reference =
    book && chapterNumber > 0
      ? formatBibleChapterReference(book.name, chapterNumber)
      : 'Capítulo'

  const verseNumberSize = Math.max(11, Math.round(fontSize * 0.8125))
  const verseLineHeight = Math.round(fontSize * 1.625)

  const highlightsByVerse = useMemo(() => {
    const map = new Map<number, BibleVerseHighlight[]>()
    for (const highlight of highlights) {
      const current = map.get(highlight.verse) ?? []
      current.push(highlight)
      map.set(highlight.verse, current)
    }
    return map
  }, [highlights])

  useEffect(() => {
    void loadBibleVerseFontSize().then(setFontSize)
  }, [])

  useEffect(() => {
    if (!bookAbbrev || chapterNumber < 1) return
    void loadBibleVerseLikes(patientCpf).then(setLikedVerseKeys)
  }, [bookAbbrev, chapterNumber, patientCpf])

  useEffect(() => {
    if (!bookAbbrev || chapterNumber < 1) return
    void loadBibleChapterHighlights(patientCpf, bookAbbrev, chapterNumber).then(setHighlights)
  }, [bookAbbrev, chapterNumber, patientCpf])

  useEffect(() => {
    hasScrolledToFocusRef.current = false
    verseOffsetsRef.current = new Map()
  }, [bookAbbrev, chapterNumber, focusVerse])

  const closeHighlightDrawer = useCallback(() => {
    setHighlightDrawerVisible(false)
    setHighlightDrawerState(null)
  }, [])

  useAndroidBackHandler(
    useCallback(() => {
      if (highlightDrawerVisible) {
        closeHighlightDrawer()
        return true
      }
      goBack()
      return true
    }, [closeHighlightDrawer, goBack, highlightDrawerVisible]),
  )

  const handleDecreaseFont = useCallback(() => {
    setFontSize((current) => {
      const next = Math.max(BIBLE_VERSE_FONT_MIN, current - 1)
      void saveBibleVerseFontSize(next)
      return next
    })
  }, [])

  const handleIncreaseFont = useCallback(() => {
    setFontSize((current) => {
      const next = Math.min(BIBLE_VERSE_FONT_MAX, current + 1)
      void saveBibleVerseFontSize(next)
      return next
    })
  }, [])

  const handleLikeBurstComplete = useCallback(() => {
    setLikeBurstVisible(false)
  }, [])

  const handleToggleLike = useCallback(
    (verseNumber: number) => {
      if (!book) return

      const likeKey = buildBibleVerseLikeKey(book.abbrev, chapterNumber, verseNumber)
      const alreadyLiked = likedVerseKeys.has(likeKey)

      if (alreadyLiked) {
        void toggleBibleVerseLike(patientCpf, likeKey).then(({ likes }) => setLikedVerseKeys(likes))
        setFillingLikeKeys((current) => {
          const next = new Set(current)
          next.delete(likeKey)
          return next
        })
        return
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setFillingLikeKeys((current) => new Set(current).add(likeKey))
      setLikeBurstVisible(true)
      void addBibleVerseLike(patientCpf, likeKey).then(setLikedVerseKeys)
    },
    [book, chapterNumber, likedVerseKeys, patientCpf],
  )

  useEffect(() => {
    if (fillingLikeKeys.size === 0) return

    const timer = setTimeout(() => {
      setFillingLikeKeys(new Set())
    }, 900)

    return () => clearTimeout(timer)
  }, [fillingLikeKeys])

  const openCreateHighlightDrawer = useCallback(
    (
      verseNumber: number,
      verseText: string,
      selection: BibleVerseTextSelection,
    ) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setPendingSelection(null)
      setSelectionModeVerses((current) => {
        const next = new Set(current)
        next.delete(verseNumber)
        return next
      })
      setHighlightDrawerState({
        mode: 'create',
        verse: verseNumber,
        verseText,
        start: selection.start,
        end: selection.end,
        selectedText: selection.selectedText,
      })
      setHighlightDrawerVisible(true)
    },
    [],
  )

  const handleVerseSelectionChange = useCallback(
    (verseNumber: number, verseText: string, selection: BibleVerseTextSelection | null) => {
      if (!selection) {
        setPendingSelection((current) => (current?.verse === verseNumber ? null : current))
        return
      }

      setPendingSelection({
        verse: verseNumber,
        verseText,
        ...selection,
      })
    },
    [],
  )

  const handleEnterSelectionMode = useCallback((verseNumber: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectionModeVerses((current) => new Set(current).add(verseNumber))
    setPendingSelection(null)
  }, [])

  const openEditHighlightDrawer = useCallback((highlight: BibleVerseHighlight, verseText: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setHighlightDrawerState({
      mode: 'edit',
      verse: highlight.verse,
      verseText,
      start: highlight.start,
      end: highlight.end,
      selectedText: verseText.slice(highlight.start, highlight.end),
      highlight,
    })
    setHighlightDrawerVisible(true)
  }, [])

  const handleSaveHighlight = useCallback(
    async (input: {
      colorId: BibleVerseHighlight['colorId']
      comment: string
      highlightId?: string
      start: number
      end: number
    }) => {
      if (!book || !highlightDrawerState) return

      try {
        const nextHighlight = buildHighlightFromSelection({
          id: input.highlightId,
          bookAbbrev: book.abbrev,
          chapter: chapterNumber,
          verse: highlightDrawerState.verse,
          start: input.start,
          end: input.end,
          colorId: input.colorId,
          comment: input.comment,
        })

        const next = await saveBibleVerseHighlight(patientCpf, nextHighlight)
        setHighlights(next)
        closeHighlightDrawer()
      } catch (error) {
        Alert.alert(
          'Não foi possível salvar',
          error instanceof Error ? error.message : 'Tente selecionar outro trecho.',
        )
      }
    },
    [book, chapterNumber, closeHighlightDrawer, highlightDrawerState, patientCpf],
  )

  const handleDeleteHighlight = useCallback(async () => {
    if (!book || !highlightDrawerState?.highlight) return

    const next = await deleteBibleVerseHighlight(
      patientCpf,
      highlightDrawerState.highlight.id,
      book.abbrev,
      chapterNumber,
    )
    setHighlights(next)
    closeHighlightDrawer()
  }, [book, chapterNumber, closeHighlightDrawer, highlightDrawerState, patientCpf])

  const fontControls = (
    <BibleVerseFontControls
      fontSize={fontSize}
      minSize={BIBLE_VERSE_FONT_MIN}
      maxSize={BIBLE_VERSE_FONT_MAX}
      onDecrease={handleDecreaseFont}
      onIncrease={handleIncreaseFont}
    />
  )

  if (!book || chapterNumber < 1 || verses.length === 0) {
    return (
      <BibleReaderShell
        title="Bíblia"
        subtitle="Capítulo não encontrado"
        onBack={goBack}
        onOpenMentalHealth={() => navigateTo('mental-health')}
        showFab={false}
      >
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Não foi possível carregar este capítulo.</Text>
        </View>
      </BibleReaderShell>
    )
  }

  return (
    <BibleReaderShell
      title={reference}
      subtitle={
        focusVerse
          ? `${verses.length} versículos · destaque ${focusVerse}`
          : `${verses.length} versículos`
      }
      onBack={goBack}
      onOpenMentalHealth={() => navigateTo('mental-health')}
      showFab={false}
      headerRight={fontControls}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        {verses.map((verse) => {
          const likeKey = buildBibleVerseLikeKey(book.abbrev, chapterNumber, verse.verse)
          const isLiked = likedVerseKeys.has(likeKey)
          const verseHighlights = highlightsByVerse.get(verse.verse) ?? []
          const isSelectionMode = selectionModeVerses.has(verse.verse)
          const isFocusedVerse = focusVerse === verse.verse
          const focusBackground = isFocusedVerse
            ? focusPulse.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(251, 191, 36, 0)', 'rgba(251, 191, 36, 0.14)'],
              })
            : 'transparent'

          return (
            <Animated.View
              key={verse.verse}
              style={[styles.verseBlock, { backgroundColor: focusBackground, borderRadius: 12 }]}
              onLayout={(event) => {
                verseOffsetsRef.current.set(verse.verse, event.nativeEvent.layout.y)

                if (
                  focusVerse === verse.verse &&
                  !hasScrolledToFocusRef.current &&
                  scrollRef.current
                ) {
                  hasScrolledToFocusRef.current = true
                  scrollRef.current.scrollTo({
                    y: Math.max(0, event.nativeEvent.layout.y - 24),
                    animated: true,
                  })
                  focusPulse.setValue(0)
                  Animated.sequence([
                    Animated.timing(focusPulse, {
                      toValue: 1,
                      duration: 450,
                      useNativeDriver: false,
                    }),
                    Animated.timing(focusPulse, {
                      toValue: 0,
                      duration: 1200,
                      useNativeDriver: false,
                    }),
                  ]).start()
                }
              }}
            >
              <View style={styles.verseRow}>
                <Text
                  style={[
                    styles.verseNumber,
                    { fontSize: verseNumberSize, lineHeight: verseLineHeight },
                  ]}
                >
                  {verse.verse}
                </Text>

                <BibleHighlightedVerseText
                  text={verse.text}
                  highlights={verseHighlights}
                  fontSize={fontSize}
                  lineHeight={verseLineHeight}
                  selectionMode={isSelectionMode}
                  onEnterSelectionMode={() => handleEnterSelectionMode(verse.verse)}
                  onSelectionChange={(selection) =>
                    handleVerseSelectionChange(verse.verse, verse.text, selection)
                  }
                  onHighlightPress={(highlight) => openEditHighlightDrawer(highlight, verse.text)}
                />

                <BibleVerseLikeButton
                  isLiked={isLiked}
                  animateFill={fillingLikeKeys.has(likeKey)}
                  onPress={() => handleToggleLike(verse.verse)}
                  accessibilityLabel={
                    isLiked
                      ? `Remover curtida do versículo ${verse.verse}`
                      : `Curtir versículo ${verse.verse}`
                  }
                />
              </View>

              {pendingSelection?.verse === verse.verse ? (
                <View style={styles.selectionActionWrap}>
                  <BibleVerseSelectionAction
                    selectedText={pendingSelection.selectedText}
                    onDismiss={() => {
                      setPendingSelection(null)
                      setSelectionModeVerses((current) => {
                        const next = new Set(current)
                        next.delete(verse.verse)
                        return next
                      })
                    }}
                    onHighlight={() =>
                      openCreateHighlightDrawer(verse.verse, verse.text, pendingSelection)
                    }
                  />
                </View>
              ) : null}
            </Animated.View>
          )
        })}
      </ScrollView>

      <BibleVerseLikeBurst visible={likeBurstVisible} onComplete={handleLikeBurstComplete} />

      <BibleVerseHighlightDrawer
        visible={highlightDrawerVisible}
        state={highlightDrawerState}
        onClose={closeHighlightDrawer}
        onSave={(input) => void handleSaveHighlight(input)}
        onDelete={
          highlightDrawerState?.mode === 'edit' ? () => void handleDeleteHighlight() : undefined
        }
      />
    </BibleReaderShell>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  verseBlock: {
    gap: 0,
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  selectionActionWrap: {
    marginLeft: 38,
    marginBottom: 4,
  },
  verseNumber: {
    width: 28,
    color: '#fbbf24',
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
})
