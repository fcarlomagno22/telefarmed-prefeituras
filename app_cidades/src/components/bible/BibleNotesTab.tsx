import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { loadAllBibleVerseHighlights } from '../../data/bibleVerseHighlightsStorage'
import { useAuth } from '../../contexts/AuthContext'
import {
  BIBLE_HIGHLIGHT_COLORS,
  getBibleHighlightColor,
  type BibleHighlightColorId,
} from '../../types/bibleHighlights'
import {
  filterBibleNotes,
  formatBibleNoteDate,
  resolveBibleNotes,
  type ResolvedBibleNote,
} from '../../utils/bibleNotes'
import { colors } from '../../theme/colors'
import { BibleNeonHighlightPreview } from './BibleNeonHighlight'

type BibleNotesTabProps = {
  bottomPadding: number
  isActive: boolean
  onOpenHighlight: (bookAbbrev: string, chapter: number, verse: number) => void
}

type ColorFilter = BibleHighlightColorId | 'all'

const NOTES_PAGE_SIZE = 20

export function BibleNotesTab({ bottomPadding, isActive, onOpenHighlight }: BibleNotesTabProps) {
  const { user } = useAuth()
  const patientCpf = user?.cpf ?? 'guest'
  const [search, setSearch] = useState('')
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all')
  const [highlights, setHighlights] = useState<ResolvedBibleNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [visibleCount, setVisibleCount] = useState(NOTES_PAGE_SIZE)

  const loadNotes = useCallback(async (options?: { refreshing?: boolean }) => {
    if (options?.refreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const stored = await loadAllBibleVerseHighlights(patientCpf)
      setHighlights(resolveBibleNotes(stored))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [patientCpf])

  useEffect(() => {
    if (!isActive) return
    void loadNotes()
  }, [isActive, loadNotes])

  const filteredNotes = useMemo(
    () => filterBibleNotes(highlights, search, colorFilter),
    [colorFilter, highlights, search],
  )

  const visibleNotes = useMemo(
    () => filteredNotes.slice(0, visibleCount),
    [filteredNotes, visibleCount],
  )

  const hasMoreNotes = visibleCount < filteredNotes.length

  useEffect(() => {
    setVisibleCount(NOTES_PAGE_SIZE)
  }, [search, colorFilter, highlights])

  const loadMoreNotes = useCallback(() => {
    setVisibleCount((current) => {
      if (current >= filteredNotes.length) return current
      return Math.min(current + NOTES_PAGE_SIZE, filteredNotes.length)
    })
  }, [filteredNotes.length])

  const availableColorFilters = useMemo(() => {
    const used = new Set(highlights.map((note) => note.highlight.colorId))
    return BIBLE_HIGHLIGHT_COLORS.filter((color) => used.has(color.id))
  }, [highlights])

  const handleOpenNote = useCallback(
    (note: ResolvedBibleNote) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onOpenHighlight(note.highlight.bookAbbrev, note.highlight.chapter, note.highlight.verse)
    },
    [onOpenHighlight],
  )

  const renderNote = useCallback(
    ({ item }: { item: ResolvedBibleNote }) => {
      const color = getBibleHighlightColor(item.highlight.colorId)
      const dateLabel = formatBibleNoteDate(item.highlight.updatedAt)

      return (
        <Pressable
          onPress={() => handleOpenNote(item)}
          style={({ pressed }) => [styles.noteCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Abrir grifo em ${item.reference}`}
        >
          <View style={styles.noteHeader}>
            <View style={[styles.colorStripe, { backgroundColor: color.neon }]} />
            <View style={styles.noteHeaderText}>
              <Text style={styles.reference}>{item.reference}</Text>
              {dateLabel ? <Text style={styles.date}>{dateLabel}</Text> : null}
            </View>
            <Ionicons name="open-outline" size={16} color={colors.textSubtle} />
          </View>

          <View style={styles.highlightPreview}>
            <BibleNeonHighlightPreview
              text={item.highlightedText}
              color={color}
              textStyle={styles.highlightPreviewText}
            />
          </View>

          {item.hasComment ? (
            <View style={styles.commentWrap}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSubtle} />
              <Text style={styles.commentText} numberOfLines={3}>
                {item.highlight.comment}
              </Text>
            </View>
          ) : null}
        </Pressable>
      )
    },
    [handleOpenNote],
  )

  const listHeader = (
    <View style={styles.headerBlock}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Anotações</Text>
        <Text style={styles.heroTitle}>Seus grifos e reflexões</Text>
        <Text style={styles.heroSubtitle}>
          Encontre trechos marcados e anotações feitas durante a leitura da Bíblia.
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSubtle} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por trecho, referência ou anotação..."
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

      {availableColorFilters.length > 0 ? (
        <View style={styles.filtersRow}>
          <Pressable
            onPress={() => setColorFilter('all')}
            style={({ pressed }) => [
              styles.filterChip,
              colorFilter === 'all' && styles.filterChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.filterChipText, colorFilter === 'all' && styles.filterChipTextActive]}>
              Todos
            </Text>
          </Pressable>

          {availableColorFilters.map((color) => {
            const active = colorFilter === color.id
            return (
              <Pressable
                key={color.id}
                onPress={() => setColorFilter(color.id)}
                style={({ pressed }) => [
                  styles.filterChip,
                  active && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
                accessibilityLabel={`Filtrar por ${color.label}`}
              >
                <View style={[styles.filterDot, { backgroundColor: color.neon }]} />
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {color.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {!isLoading && highlights.length > 0 ? (
        <Text style={styles.resultsMeta}>
          Exibindo {visibleNotes.length} de {filteredNotes.length}{' '}
          {filteredNotes.length === 1 ? 'marcação' : 'marcações'}
        </Text>
      ) : null}
    </View>
  )

  const listFooter = hasMoreNotes ? (
    <View style={styles.listFooter}>
      <ActivityIndicator color="#fbbf24" />
      <Text style={styles.listFooterText}>Carregando mais anotações...</Text>
    </View>
  ) : null

  if (isLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingBottom: bottomPadding }]}>
        {listHeader}
        <ActivityIndicator color="#fbbf24" style={styles.loader} />
      </View>
    )
  }

  if (highlights.length === 0) {
    return (
      <FlatList
        data={[]}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="bookmark-outline" size={28} color={colors.textSubtle} />
            <Text style={styles.emptyTitle}>Nenhum grifo ainda</Text>
            <Text style={styles.emptyText}>
              Na leitura da Bíblia, selecione um trecho para grifar e adicionar uma anotação. Elas
              aparecerão aqui.
            </Text>
          </View>
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadNotes({ refreshing: true })}
            tintColor="#fbbf24"
          />
        }
      />
    )
  }

  return (
    <FlatList
      data={visibleNotes}
      keyExtractor={(item) => item.highlight.id}
      renderItem={renderNote}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      onEndReached={loadMoreNotes}
      onEndReachedThreshold={0.35}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nenhuma marcação encontrada para essa busca.</Text>
        </View>
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            setVisibleCount(NOTES_PAGE_SIZE)
            void loadNotes({ refreshing: true })
          }}
          tintColor="#fbbf24"
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerBlock: {
    gap: 14,
    paddingBottom: 8,
  },
  hero: {
    gap: 6,
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
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
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  filterChipActive: {
    borderColor: 'rgba(251, 191, 36, 0.45)',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fbbf24',
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  resultsMeta: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  noteCard: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorStripe: {
    width: 3,
    height: 28,
    borderRadius: 999,
  },
  noteHeaderText: {
    flex: 1,
    gap: 2,
  },
  reference: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  date: {
    color: colors.textSubtle,
    fontSize: 11,
  },
  highlightPreview: {
    alignSelf: 'stretch',
  },
  highlightPreviewText: {
    fontSize: 14,
    lineHeight: 22,
  },
  commentWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 2,
  },
  commentText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  itemSeparator: {
    height: 10,
  },
  listFooter: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  listFooterText: {
    color: colors.textSubtle,
    fontSize: 12,
  },
  loadingWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  loader: {
    marginTop: 32,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
})
