import { useMemo, useCallback } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getBibleBookByAbbrev, isBibleNewTestamentBook, BIBLE_TESTAMENT_COLORS } from '../data/bibleCatalog'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { getBibleRouteParams } from '../types/auth'
import { colors } from '../theme/colors'
import { BibleReaderShell } from '../components/bible/BibleReaderShell'

const TAB_BAR_ESTIMATED_HEIGHT = 78
const CHAPTER_COLUMNS = 4
const GRID_PADDING = 20
const GRID_GAP = 10

function useChapterCellSize() {
  const { width: screenWidth } = useWindowDimensions()
  return (screenWidth - GRID_PADDING * 2 - GRID_GAP * (CHAPTER_COLUMNS - 1)) / CHAPTER_COLUMNS
}

export function BibleChaptersScreen() {
  const insets = useSafeAreaInsets()
  const cellSize = useChapterCellSize()
  const { routeParams, goBack, navigateTo } = useAuth()
  const { bookAbbrev } = getBibleRouteParams(routeParams)
  const book = useMemo(
    () => (bookAbbrev ? getBibleBookByAbbrev(bookAbbrev) : null),
    [bookAbbrev],
  )

  const bottomPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 88
  const chapters = useMemo(
    () => (book ? Array.from({ length: book.chapters.length }, (_, index) => index + 1) : []),
    [book],
  )

  useAndroidBackHandler(
    useCallback(() => {
      goBack()
      return true
    }, [goBack]),
  )

  const testamentStripeColor = book
    ? isBibleNewTestamentBook(book)
      ? BIBLE_TESTAMENT_COLORS.new
      : BIBLE_TESTAMENT_COLORS.old
    : BIBLE_TESTAMENT_COLORS.old

  if (!book) {
    return (
      <BibleReaderShell
        title="Bíblia"
        subtitle="Livro não encontrado"
        onBack={goBack}
        onOpenMentalHealth={() => navigateTo('mental-health')}
        showFab={false}
      >
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Não foi possível carregar este livro.</Text>
        </View>
      </BibleReaderShell>
    )
  }

  return (
    <BibleReaderShell
      title={book.name}
      subtitle="Escolha o capítulo"
      onBack={goBack}
      onOpenMentalHealth={() => navigateTo('mental-health')}
    >
      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item)}
        numColumns={CHAPTER_COLUMNS}
        columnWrapperStyle={styles.chapterRow}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: chapterNumber }) => (
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              navigateTo('bible-chapter-verses', { bookAbbrev: book.abbrev, chapter: chapterNumber })
            }}
            style={({ pressed }) => [
              styles.chapterCell,
              { width: cellSize, height: cellSize },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.testamentStripe, { backgroundColor: testamentStripeColor }]} />
            <Text style={styles.chapterNumber}>{chapterNumber}</Text>
          </Pressable>
        )}
      />
    </BibleReaderShell>
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 8,
  },
  chapterRow: {
    justifyContent: 'flex-start',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  chapterCell: {
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  testamentStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  chapterNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
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
})
