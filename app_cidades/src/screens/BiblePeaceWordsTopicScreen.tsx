import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BiblePeaceWordsPhraseCard } from '../components/bible/BiblePeaceWordsPhraseCard'
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
  formatBibleVerseReference,
  getBibleBookByAbbrev,
  getBibleVerse,
} from '../data/bibleCatalog'
import {
  buildHighlightFromSelection,
  deleteBibleVerseHighlight,
  loadAllBibleVerseHighlights,
  saveBibleVerseHighlight,
} from '../data/bibleVerseHighlightsStorage'
import { getPeaceWordsPhrasesDocument } from '../data/peaceWordsPhrases'
import { getPeaceWordsTopicById } from '../data/peaceWordsCatalog'
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
import { getPeaceWordsRouteParams } from '../types/auth'
import type { BibleVerseHighlight } from '../types/bibleHighlights'
import type { PeaceWordsPhrase } from '../types/peaceWordsPhrases'
import {
  buildBibleVerseScopeKey,
  filterHighlightsForVerse,
  resolvePeaceWordsPhraseVerses,
} from '../utils/bibleVerseScope'
import { colors } from '../theme/colors'

const TAB_BAR_ESTIMATED_HEIGHT = 78

type TopicHighlightDrawerState = BibleHighlightDrawerState & {
  bookAbbrev: string
  chapter: number
}

type PendingSelection = BibleVerseTextSelection & {
  verseKey: string
  verseText: string
}

export function BiblePeaceWordsTopicScreen() {
  const insets = useSafeAreaInsets()
  const { routeParams, goBack, navigateTo, user } = useAuth()
  const patientCpf = user?.cpf ?? 'guest'
  const { topicId } = getPeaceWordsRouteParams(routeParams)
  const match = useMemo(
    () => (topicId ? getPeaceWordsTopicById(topicId) : null),
    [topicId],
  )

  const [fontSize, setFontSize] = useState(BIBLE_VERSE_FONT_DEFAULT)
  const [likedVerseKeys, setLikedVerseKeys] = useState<Set<string>>(new Set())
  const [likeBurstVisible, setLikeBurstVisible] = useState(false)
  const [highlights, setHighlights] = useState<BibleVerseHighlight[]>([])
  const [highlightDrawerVisible, setHighlightDrawerVisible] = useState(false)
  const [highlightDrawerState, setHighlightDrawerState] = useState<TopicHighlightDrawerState | null>(
    null,
  )
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null)
  const [selectionModeKeys, setSelectionModeKeys] = useState<Set<string>>(new Set())
  const [fillingLikeKeys, setFillingLikeKeys] = useState<Set<string>>(new Set())

  const bottomPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 88
  const verseNumberSize = Math.max(11, Math.round(fontSize * 0.8125))
  const verseLineHeight = Math.round(fontSize * 1.625)

  const phrasesDocument = useMemo(() => {
    if (!match?.topic.phrasesFile) return null
    return getPeaceWordsPhrasesDocument(match.topic.phrasesFile)
  }, [match?.topic.phrasesFile])

  const phrases = phrasesDocument?.frases ?? []

  const resolvedVerses = useMemo(() => {
    if (!match?.topic.verses?.length) return []

    return match.topic.verses
      .map((ref) => {
        const book = getBibleBookByAbbrev(ref.abbrev)
        const verse = getBibleVerse(ref.abbrev, ref.chapter, ref.verse)
        if (!book || !verse) return null

        return {
          ref,
          reference: formatBibleVerseReference(book.name, ref.chapter, ref.verse),
          text: verse.text,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry != null)
  }, [match])

  const refreshHighlights = useCallback(async () => {
    const next = await loadAllBibleVerseHighlights(patientCpf)
    setHighlights(next)
  }, [patientCpf])

  useEffect(() => {
    void loadBibleVerseFontSize().then(setFontSize)
  }, [])

  useEffect(() => {
    void loadBibleVerseLikes(patientCpf).then(setLikedVerseKeys)
    void refreshHighlights()
  }, [patientCpf, refreshHighlights])

  useEffect(() => {
    if (fillingLikeKeys.size === 0) return
    const timer = setTimeout(() => setFillingLikeKeys(new Set()), 900)
    return () => clearTimeout(timer)
  }, [fillingLikeKeys])

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

  const handleToggleLike = useCallback(
    (bookAbbrev: string, chapter: number, verse: number) => {
      const likeKey = buildBibleVerseLikeKey(bookAbbrev, chapter, verse)
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
    [likedVerseKeys, patientCpf],
  )

  const parseVerseKey = useCallback((verseKey: string) => {
    const [bookAbbrev, chapterRaw, verseRaw] = verseKey.split(':')
    return {
      bookAbbrev,
      chapter: Number(chapterRaw),
      verse: Number(verseRaw),
    }
  }, [])

  const openCreateHighlightDrawer = useCallback(
    (verseKey: string, verseText: string, selection: BibleVerseTextSelection) => {
      const { bookAbbrev, chapter, verse } = parseVerseKey(verseKey)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setPendingSelection(null)
      setSelectionModeKeys((current) => {
        const next = new Set(current)
        next.delete(verseKey)
        return next
      })
      setHighlightDrawerState({
        mode: 'create',
        bookAbbrev,
        chapter,
        verse,
        verseText,
        start: selection.start,
        end: selection.end,
        selectedText: selection.selectedText,
      })
      setHighlightDrawerVisible(true)
    },
    [parseVerseKey],
  )

  const handleVerseSelectionChange = useCallback(
    (verseKey: string, verseText: string, selection: BibleVerseTextSelection | null) => {
      if (!selection) {
        setPendingSelection((current) => (current?.verseKey === verseKey ? null : current))
        return
      }

      setPendingSelection({
        verseKey,
        verseText,
        ...selection,
      })
    },
    [],
  )

  const handleEnterSelectionMode = useCallback((verseKey: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectionModeKeys((current) => new Set(current).add(verseKey))
    setPendingSelection(null)
  }, [])

  const openEditHighlightDrawer = useCallback(
    (highlight: BibleVerseHighlight, verseText: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setHighlightDrawerState({
        mode: 'edit',
        bookAbbrev: highlight.bookAbbrev,
        chapter: highlight.chapter,
        verse: highlight.verse,
        verseText,
        start: highlight.start,
        end: highlight.end,
        selectedText: verseText.slice(highlight.start, highlight.end),
        highlight,
      })
      setHighlightDrawerVisible(true)
    },
    [],
  )

  const handleSaveHighlight = useCallback(
    async (input: {
      colorId: BibleVerseHighlight['colorId']
      comment: string
      highlightId?: string
      start: number
      end: number
    }) => {
      if (!highlightDrawerState) return

      try {
        const nextHighlight = buildHighlightFromSelection({
          id: input.highlightId,
          bookAbbrev: highlightDrawerState.bookAbbrev,
          chapter: highlightDrawerState.chapter,
          verse: highlightDrawerState.verse,
          start: input.start,
          end: input.end,
          colorId: input.colorId,
          comment: input.comment,
        })

        await saveBibleVerseHighlight(patientCpf, nextHighlight)
        await refreshHighlights()
        closeHighlightDrawer()
      } catch (error) {
        Alert.alert(
          'Não foi possível salvar',
          error instanceof Error ? error.message : 'Tente selecionar outro trecho.',
        )
      }
    },
    [closeHighlightDrawer, highlightDrawerState, patientCpf, refreshHighlights],
  )

  const handleDeleteHighlight = useCallback(async () => {
    if (!highlightDrawerState?.highlight) return

    await deleteBibleVerseHighlight(
      patientCpf,
      highlightDrawerState.highlight.id,
      highlightDrawerState.bookAbbrev,
      highlightDrawerState.chapter,
    )
    await refreshHighlights()
    closeHighlightDrawer()
  }, [closeHighlightDrawer, highlightDrawerState, patientCpf, refreshHighlights])

  const handleOpenVerse = useCallback(
    (bookAbbrev: string, chapter: number, verse: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      navigateTo('bible-chapter-verses', { bookAbbrev, chapter, verse })
    },
    [navigateTo],
  )

  const handleDismissSelection = useCallback((verseKey: string) => {
    setPendingSelection(null)
    setSelectionModeKeys((current) => {
      const next = new Set(current)
      next.delete(verseKey)
      return next
    })
  }, [])

  const fontControls = (
    <BibleVerseFontControls
      fontSize={fontSize}
      minSize={BIBLE_VERSE_FONT_MIN}
      maxSize={BIBLE_VERSE_FONT_MAX}
      onDecrease={handleDecreaseFont}
      onIncrease={handleIncreaseFont}
    />
  )

  const renderPhraseItem = useCallback(
    ({ item }: { item: PeaceWordsPhrase }) => (
      <BiblePeaceWordsPhraseCard
        reference={item.referencia}
        accentColor={match?.category.accent ?? '#fbbf24'}
        verses={resolvePeaceWordsPhraseVerses(item)}
        fontSize={fontSize}
        verseNumberSize={verseNumberSize}
        verseLineHeight={verseLineHeight}
        likedVerseKeys={likedVerseKeys}
        fillingLikeKeys={fillingLikeKeys}
        highlights={highlights}
        selectionModeKeys={selectionModeKeys}
        pendingSelection={pendingSelection}
        buildVerseKey={buildBibleVerseScopeKey}
        onOpenInBible={handleOpenVerse}
        onToggleLike={handleToggleLike}
        onEnterSelectionMode={handleEnterSelectionMode}
        onSelectionChange={handleVerseSelectionChange}
        onHighlightPress={openEditHighlightDrawer}
        onDismissSelection={handleDismissSelection}
        onCreateHighlight={openCreateHighlightDrawer}
      />
    ),
    [
      match?.category.accent,
      fontSize,
      verseNumberSize,
      verseLineHeight,
      likedVerseKeys,
      fillingLikeKeys,
      highlights,
      selectionModeKeys,
      pendingSelection,
      handleOpenVerse,
      handleToggleLike,
      handleEnterSelectionMode,
      handleVerseSelectionChange,
      openEditHighlightDrawer,
      handleDismissSelection,
      openCreateHighlightDrawer,
    ],
  )

  if (!match) {
    return (
      <BibleReaderShell
        title="Palavras de Paz"
        subtitle="Tema não encontrado"
        onBack={goBack}
        onOpenMentalHealth={() => navigateTo('mental-health')}
        showFab={false}
      >
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Não foi possível carregar este tema.</Text>
        </View>
      </BibleReaderShell>
    )
  }

  const { category, topic } = match
  const usesPhrases = Boolean(topic.phrasesFile && phrases.length > 0)

  return (
    <BibleReaderShell
      title={topic.label}
      subtitle={
        usesPhrases
          ? `${phrases.length} passagens · ${category.title}`
          : category.title
      }
      onBack={goBack}
      onOpenMentalHealth={() => navigateTo('mental-health')}
      showFab={false}
      headerRight={fontControls}
    >
      {usesPhrases ? (
        <>
          <FlatList
            data={phrases}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
            ListHeaderComponent={
              <View style={[styles.introCard, { borderColor: `${category.accent}33` }]}>
                <View style={[styles.introAccent, { backgroundColor: category.accent }]} />
                <Text style={styles.introText}>
                  Segure um trecho para grifar e anotar. Use o coração para curtir. Toque na
                  referência para abrir o capítulo completo na Bíblia.
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            renderItem={renderPhraseItem}
          />

          <BibleVerseLikeBurst
            visible={likeBurstVisible}
            onComplete={() => setLikeBurstVisible(false)}
          />

          <BibleVerseHighlightDrawer
            visible={highlightDrawerVisible}
            state={highlightDrawerState}
            onClose={closeHighlightDrawer}
            onSave={(input) => void handleSaveHighlight(input)}
            onDelete={
              highlightDrawerState?.mode === 'edit' ? () => void handleDeleteHighlight() : undefined
            }
          />
        </>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.introCard, { borderColor: `${category.accent}33` }]}>
            <View style={[styles.introAccent, { backgroundColor: category.accent }]} />
            <Text style={styles.introText}>
              Versículos selecionados para este momento. Toque em um deles para ler no contexto
              completo da Bíblia.
            </Text>
          </View>

          <View style={styles.simpleVerseList}>
            {resolvedVerses.map((entry, index) => {
              const verseKey = buildBibleVerseScopeKey(
                entry.ref.abbrev,
                entry.ref.chapter,
                entry.ref.verse,
              )
              const verseHighlights = filterHighlightsForVerse(
                highlights,
                entry.ref.abbrev,
                entry.ref.chapter,
                entry.ref.verse,
              )
              const isSelectionMode = selectionModeKeys.has(verseKey)
              const isPending = pendingSelection?.verseKey === verseKey

              return (
                <View
                  key={verseKey}
                  style={[styles.simpleVerseCard, { borderColor: `${category.accent}22` }]}
                >
                  <Pressable
                    onPress={() =>
                      handleOpenVerse(entry.ref.abbrev, entry.ref.chapter, entry.ref.verse)
                    }
                    style={({ pressed }) => [styles.referenceRow, pressed && styles.pressed]}
                  >
                    <View style={styles.verseIndexWrap}>
                      <Text style={[styles.verseIndex, { color: category.accent }]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={styles.reference}>{entry.reference}</Text>
                    <Ionicons name="open-outline" size={16} color={colors.textSubtle} />
                  </Pressable>

                  <View style={styles.verseRow}>
                    <Text
                      style={[
                        styles.verseNumber,
                        { fontSize: verseNumberSize, lineHeight: verseLineHeight },
                      ]}
                    >
                      {entry.ref.verse}
                    </Text>

                    <BibleHighlightedVerseText
                      text={entry.text}
                      highlights={verseHighlights}
                      fontSize={fontSize}
                      lineHeight={verseLineHeight}
                      selectionMode={isSelectionMode}
                      onEnterSelectionMode={() => handleEnterSelectionMode(verseKey)}
                      onSelectionChange={(selection) =>
                        handleVerseSelectionChange(verseKey, entry.text, selection)
                      }
                      onHighlightPress={(highlight) => openEditHighlightDrawer(highlight, entry.text)}
                    />

                    <BibleVerseLikeButton
                      isLiked={likedVerseKeys.has(verseKey)}
                      animateFill={fillingLikeKeys.has(verseKey)}
                      onPress={() =>
                        handleToggleLike(entry.ref.abbrev, entry.ref.chapter, entry.ref.verse)
                      }
                      accessibilityLabel={
                        likedVerseKeys.has(verseKey)
                          ? `Remover curtida do versículo ${entry.ref.verse}`
                          : `Curtir versículo ${entry.ref.verse}`
                      }
                    />
                  </View>

                  {isPending && pendingSelection ? (
                    <View style={styles.selectionActionWrap}>
                      <BibleVerseSelectionAction
                        selectedText={pendingSelection.selectedText}
                        onDismiss={() => handleDismissSelection(verseKey)}
                        onHighlight={() =>
                          openCreateHighlightDrawer(verseKey, entry.text, pendingSelection)
                        }
                      />
                    </View>
                  ) : null}
                </View>
              )
            })}
          </View>

          <BibleVerseLikeBurst
            visible={likeBurstVisible}
            onComplete={() => setLikeBurstVisible(false)}
          />

          <BibleVerseHighlightDrawer
            visible={highlightDrawerVisible}
            state={highlightDrawerState}
            onClose={closeHighlightDrawer}
            onSave={(input) => void handleSaveHighlight(input)}
            onDelete={
              highlightDrawerState?.mode === 'edit' ? () => void handleDeleteHighlight() : undefined
            }
          />
        </ScrollView>
      )}
    </BibleReaderShell>
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  introCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    marginBottom: 16,
  },
  introAccent: {
    width: 3,
    borderRadius: 999,
    alignSelf: 'stretch',
  },
  introText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  itemSeparator: {
    height: 10,
  },
  simpleVerseList: {
    gap: 10,
  },
  simpleVerseCard: {
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verseIndexWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  verseIndex: {
    fontSize: 12,
    fontWeight: '700',
  },
  reference: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 2,
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
