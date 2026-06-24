import { useMemo, useRef } from 'react'
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from 'react-native'
import type { BibleVerseHighlight } from '../../types/bibleHighlights'
import { buildHighlightSegments } from '../../utils/bibleHighlightSegments'
import { colors } from '../../theme/colors'
import { BibleNeonHighlight } from './BibleNeonHighlight'

export type BibleVerseTextSelection = {
  start: number
  end: number
  selectedText: string
}

type BibleHighlightedVerseTextProps = {
  text: string
  highlights: BibleVerseHighlight[]
  fontSize: number
  lineHeight: number
  selectionMode: boolean
  onEnterSelectionMode: () => void
  onSelectionChange: (selection: BibleVerseTextSelection | null) => void
  onHighlightPress: (highlight: BibleVerseHighlight) => void
}

export function BibleHighlightedVerseText({
  text,
  highlights,
  fontSize,
  lineHeight,
  selectionMode,
  onEnterSelectionMode,
  onSelectionChange,
  onHighlightPress,
}: BibleHighlightedVerseTextProps) {
  const segments = useMemo(() => buildHighlightSegments(text, highlights), [highlights, text])
  const lastSelectionRef = useRef<BibleVerseTextSelection | null>(null)

  function emitSelection(start: number, end: number) {
    if (start === end) {
      lastSelectionRef.current = null
      onSelectionChange(null)
      return
    }

    const selectedText = text.slice(start, end)
    if (!selectedText.trim()) {
      lastSelectionRef.current = null
      onSelectionChange(null)
      return
    }

    const payload = { start, end, selectedText }
    const previous = lastSelectionRef.current
    if (previous?.start === payload.start && previous?.end === payload.end) return

    lastSelectionRef.current = payload
    onSelectionChange(payload)
  }

  function handleSelectionChange(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    const { start, end } = event.nativeEvent.selection
    emitSelection(start, end)
  }

  const showSelectableInput = highlights.length === 0 || selectionMode

  if (showSelectableInput) {
    return (
      <TextInput
        key={selectionMode ? 'selection' : 'reading'}
        value={text}
        editable
        multiline
        scrollEnabled={false}
        selectTextOnFocus={false}
        showSoftInputOnFocus={false}
        caretHidden
        contextMenuHidden={false}
        onChangeText={() => {}}
        onSelectionChange={handleSelectionChange}
        style={[
          styles.selectableInput,
          {
            fontSize,
            lineHeight,
          },
        ]}
      />
    )
  }

  return (
    <Pressable
      onLongPress={onEnterSelectionMode}
      delayLongPress={280}
      style={styles.highlightedWrap}
    >
      <View style={styles.verseFlow}>
        {segments.map((segment) => {
          if (segment.type === 'plain') {
            return (
              <Text
                key={`plain-${segment.offset}`}
                style={[styles.plainSegment, { fontSize, lineHeight }]}
              >
                {segment.text}
              </Text>
            )
          }

          return (
            <BibleNeonHighlight
              key={segment.highlight.id}
              text={segment.text}
              colorId={segment.highlight.colorId}
              fontSize={fontSize}
              lineHeight={lineHeight}
              onPress={() => onHighlightPress(segment.highlight)}
            />
          )
        })}
      </View>
      {Platform.OS === 'android' ? (
        <Text style={styles.hint}>Segure para selecionar um trecho</Text>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  selectableInput: {
    flex: 1,
    color: colors.text,
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  highlightedWrap: {
    flex: 1,
    gap: 6,
  },
  verseFlow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  plainSegment: {
    color: colors.text,
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 11,
  },
})
