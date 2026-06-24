import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  BibleHighlightedVerseText,
  type BibleVerseTextSelection,
} from './BibleHighlightedVerseText'
import { BibleVerseLikeButton } from './BibleVerseLikeButton'
import { BibleVerseSelectionAction } from './BibleVerseSelectionAction'
import type { BibleVerseHighlight } from '../../types/bibleHighlights'
import { colors } from '../../theme/colors'

type PendingSelection = BibleVerseTextSelection & {
  verseKey: string
  verseText: string
}

type BiblePeaceWordsPhraseCardProps = {
  reference: string
  accentColor: string
  verses: {
    bookAbbrev: string
    chapter: number
    verse: number
    text: string
  }[]
  fontSize: number
  verseNumberSize: number
  verseLineHeight: number
  likedVerseKeys: Set<string>
  fillingLikeKeys: Set<string>
  highlights: BibleVerseHighlight[]
  selectionModeKeys: Set<string>
  pendingSelection: PendingSelection | null
  buildVerseKey: (bookAbbrev: string, chapter: number, verse: number) => string
  onOpenInBible: (bookAbbrev: string, chapter: number, verse: number) => void
  onToggleLike: (bookAbbrev: string, chapter: number, verse: number) => void
  onEnterSelectionMode: (verseKey: string) => void
  onSelectionChange: (
    verseKey: string,
    verseText: string,
    selection: BibleVerseTextSelection | null,
  ) => void
  onHighlightPress: (highlight: BibleVerseHighlight, verseText: string) => void
  onDismissSelection: (verseKey: string) => void
  onCreateHighlight: (verseKey: string, verseText: string, selection: BibleVerseTextSelection) => void
}

export function BiblePeaceWordsPhraseCard({
  reference,
  accentColor,
  verses,
  fontSize,
  verseNumberSize,
  verseLineHeight,
  likedVerseKeys,
  fillingLikeKeys,
  highlights,
  selectionModeKeys,
  pendingSelection,
  buildVerseKey,
  onOpenInBible,
  onToggleLike,
  onEnterSelectionMode,
  onSelectionChange,
  onHighlightPress,
  onDismissSelection,
  onCreateHighlight,
}: BiblePeaceWordsPhraseCardProps) {
  const firstVerse = verses[0]

  return (
    <View style={[styles.card, { borderColor: `${accentColor}22` }]}>
      <Pressable
        onPress={() => {
          if (!firstVerse) return
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onOpenInBible(firstVerse.bookAbbrev, firstVerse.chapter, firstVerse.verse)
        }}
        style={({ pressed }) => [styles.referenceRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${reference} na Bíblia`}
      >
        <Text style={styles.reference}>{reference}</Text>
        <Ionicons name="open-outline" size={15} color={colors.textSubtle} />
      </Pressable>

      <View style={styles.verseList}>
        {verses.map((entry) => {
          const verseKey = buildVerseKey(entry.bookAbbrev, entry.chapter, entry.verse)
          const likeKey = verseKey
          const verseHighlights = highlights.filter(
            (item) =>
              item.bookAbbrev.toLowerCase() === entry.bookAbbrev.toLowerCase() &&
              item.chapter === entry.chapter &&
              item.verse === entry.verse,
          )
          const isSelectionMode = selectionModeKeys.has(verseKey)
          const isPending = pendingSelection?.verseKey === verseKey

          return (
            <View key={verseKey} style={styles.verseBlock}>
              <View style={styles.verseRow}>
                <Text
                  style={[
                    styles.verseNumber,
                    { fontSize: verseNumberSize, lineHeight: verseLineHeight },
                  ]}
                >
                  {entry.verse}
                </Text>

                <BibleHighlightedVerseText
                  text={entry.text}
                  highlights={verseHighlights}
                  fontSize={fontSize}
                  lineHeight={verseLineHeight}
                  selectionMode={isSelectionMode}
                  onEnterSelectionMode={() => onEnterSelectionMode(verseKey)}
                  onSelectionChange={(selection) =>
                    onSelectionChange(verseKey, entry.text, selection)
                  }
                  onHighlightPress={(highlight) => onHighlightPress(highlight, entry.text)}
                />

                <BibleVerseLikeButton
                  isLiked={likedVerseKeys.has(likeKey)}
                  animateFill={fillingLikeKeys.has(likeKey)}
                  onPress={() => onToggleLike(entry.bookAbbrev, entry.chapter, entry.verse)}
                  accessibilityLabel={
                    likedVerseKeys.has(likeKey)
                      ? `Remover curtida do versículo ${entry.verse}`
                      : `Curtir versículo ${entry.verse}`
                  }
                />
              </View>

              {isPending && pendingSelection ? (
                <View style={styles.selectionActionWrap}>
                  <BibleVerseSelectionAction
                    selectedText={pendingSelection.selectedText}
                    onDismiss={() => onDismissSelection(verseKey)}
                    onHighlight={() =>
                      onCreateHighlight(verseKey, entry.text, pendingSelection)
                    }
                  />
                </View>
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
  },
  referenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reference: {
    flex: 1,
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  verseList: {
    gap: 10,
  },
  verseBlock: {
    gap: 0,
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
  pressed: {
    opacity: 0.82,
  },
})
