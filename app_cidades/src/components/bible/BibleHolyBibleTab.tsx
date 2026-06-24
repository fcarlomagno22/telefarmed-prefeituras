import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useMemo, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import {
  BIBLE_TESTAMENT_COLORS,
  groupBibleBooksByTestament,
  isBibleNewTestamentBook,
} from '../../data/bibleCatalog'
import type { BibleBook } from '../../types/bible'
import { colors } from '../../theme/colors'

type BibleHolyBibleTabProps = {
  bottomPadding: number
  onSelectBook: (book: BibleBook) => void
}

type TestamentFilter = 'all' | 'old' | 'new'

const FILTER_PILLS: { id: TestamentFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'old', label: 'Antigo Testamento' },
  { id: 'new', label: 'Novo Testamento' },
]

function normalizeBibleSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function filterBooksBySearch(books: BibleBook[], search: string) {
  const query = normalizeBibleSearch(search)
  if (!query) return books
  return books.filter((book) => normalizeBibleSearch(book.name).includes(query))
}

export function BibleHolyBibleTab({ bottomPadding, onSelectBook }: BibleHolyBibleTabProps) {
  const { width: screenWidth } = useWindowDimensions()
  const [search, setSearch] = useState('')
  const [testamentFilter, setTestamentFilter] = useState<TestamentFilter>('all')

  const { old: oldTestamentBooks, new: newTestamentBooks } = useMemo(
    () => groupBibleBooksByTestament(),
    [],
  )

  const filteredOldBooks = useMemo(
    () => filterBooksBySearch(oldTestamentBooks, search),
    [oldTestamentBooks, search],
  )
  const filteredNewBooks = useMemo(
    () => filterBooksBySearch(newTestamentBooks, search),
    [newTestamentBooks, search],
  )
  const filteredSingleBooks = useMemo(() => {
    const source = testamentFilter === 'old' ? oldTestamentBooks : newTestamentBooks
    return filterBooksBySearch(source, search)
  }, [newTestamentBooks, oldTestamentBooks, search, testamentFilter])

  const bookCardWidth = (screenWidth - 40 - 10) / 2
  const showSeparatedSections = testamentFilter === 'all'
  const hasResults = showSeparatedSections
    ? filteredOldBooks.length > 0 || filteredNewBooks.length > 0
    : filteredSingleBooks.length > 0

  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Bíblia Sagrada</Text>
          <Text style={styles.heroTitle}>Escolha um livro</Text>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textSubtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar livro..."
            placeholderTextColor={colors.textSubtle}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
            returnKeyType="search"
          />
          {search.length > 0 && Platform.OS !== 'ios' ? (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Limpar busca"
            >
              <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.pillsRow}>
          {FILTER_PILLS.map((pill) => {
            const active = testamentFilter === pill.id
            return (
              <Pressable
                key={pill.id}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setTestamentFilter(pill.id)
                }}
                style={({ pressed }) => [
                  styles.pill,
                  active && styles.pillActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {!hasResults ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nenhum livro encontrado.</Text>
        </View>
      ) : showSeparatedSections ? (
        <>
          <TestamentBookSection
            title="Antigo Testamento"
            accentColor={BIBLE_TESTAMENT_COLORS.old}
            books={filteredOldBooks}
            bookCardWidth={bookCardWidth}
            onSelectBook={onSelectBook}
          />
          <TestamentBookSection
            title="Novo Testamento"
            accentColor={BIBLE_TESTAMENT_COLORS.new}
            books={filteredNewBooks}
            bookCardWidth={bookCardWidth}
            onSelectBook={onSelectBook}
          />
        </>
      ) : (
        <BookGrid
          books={filteredSingleBooks}
          bookCardWidth={bookCardWidth}
          onSelectBook={onSelectBook}
        />
      )}
    </ScrollView>
  )
}

function TestamentBookSection({
  title,
  accentColor,
  books,
  bookCardWidth,
  onSelectBook,
}: {
  title: string
  accentColor: string
  books: BibleBook[]
  bookCardWidth: number
  onSelectBook: (book: BibleBook) => void
}) {
  if (books.length === 0) return null

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionLine, { backgroundColor: accentColor }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <BookGrid books={books} bookCardWidth={bookCardWidth} onSelectBook={onSelectBook} />
    </View>
  )
}

function BookGrid({
  books,
  bookCardWidth,
  onSelectBook,
}: {
  books: BibleBook[]
  bookCardWidth: number
  onSelectBook: (book: BibleBook) => void
}) {
  return (
    <View style={styles.bookGrid}>
      {books.map((book) => (
        <BibleBookCard
          key={book.abbrev}
          book={book}
          width={bookCardWidth}
          onPress={() => onSelectBook(book)}
        />
      ))}
    </View>
  )
}

function BibleBookCard({
  book,
  width,
  onPress,
}: {
  book: BibleBook
  width: number
  onPress: () => void
}) {
  const isNewTestament = isBibleNewTestamentBook(book)
  const stripeColor = isNewTestament ? BIBLE_TESTAMENT_COLORS.new : BIBLE_TESTAMENT_COLORS.old

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [styles.bookCard, { width }, pressed && styles.pressed]}
    >
      <View style={[styles.testamentStripe, { backgroundColor: stripeColor }]} />
      <View style={styles.bookCardBody}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.name}
        </Text>
        <Text style={styles.bookMeta}>{book.chapters.length} capítulos</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 18,
  },
  header: {
    gap: 14,
  },
  hero: { gap: 6 },
  eyebrow: {
    color: 'rgba(251, 191, 36, 0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: -0.3,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    padding: 0,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.14)',
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fbbf24',
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionLine: {
    width: 4,
    height: 18,
    borderRadius: 999,
  },
  sectionTitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  bookCard: {
    minHeight: 88,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  testamentStripe: {
    height: 4,
    width: '100%',
  },
  bookCardBody: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  bookTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  bookMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    textAlign: 'center',
  },
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.82,
  },
})
