import { useCallback, useEffect, useMemo, useRef } from 'react'
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

const isWeb = Platform.OS === 'web'

function syncWebTextareaHeight(node: TextInput | null) {
  if (!isWeb || !node) return

  const textarea = node as unknown as HTMLTextAreaElement
  textarea.style.setProperty('overflow', 'hidden', 'important')
  textarea.style.setProperty('overflow-y', 'hidden', 'important')
  textarea.style.setProperty('overflow-x', 'hidden', 'important')
  textarea.style.setProperty('resize', 'none')
  textarea.style.height = '0px'
  const nextHeight = textarea.scrollHeight
  textarea.style.height = `${nextHeight}px`
  textarea.style.maxHeight = `${nextHeight}px`
}

type SelectableVerseInputProps = {
  text: string
  fontSize: number
  lineHeight: number
  onSelectionChange: (selection: BibleVerseTextSelection | null) => void
}

function SelectableVerseInput({
  text,
  fontSize,
  lineHeight,
  onSelectionChange,
}: SelectableVerseInputProps) {
  const inputRef = useRef<TextInput>(null)
  const lastSelectionRef = useRef<BibleVerseTextSelection | null>(null)

  const syncHeight = useCallback(() => {
    syncWebTextareaHeight(inputRef.current)
  }, [])

  useEffect(() => {
    syncHeight()
  }, [text, fontSize, lineHeight, syncHeight])

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

  return (
    <TextInput
      ref={inputRef}
      value={text}
      editable
      multiline
      scrollEnabled={false}
      selectTextOnFocus={false}
      showSoftInputOnFocus={false}
      caretHidden={!isWeb}
      contextMenuHidden={false}
      onChangeText={() => {}}
      onSelectionChange={handleSelectionChange}
      onContentSizeChange={syncHeight}
      {...(isWeb ? ({ className: 'bible-verse-select' } as const) : null)}
      style={[
        styles.selectableInput,
        isWeb && styles.selectableInputWeb,
        {
          fontSize,
          lineHeight,
        },
      ]}
    />
  )
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

  const webDoubleClickProps =
    isWeb && !selectionMode
      ? ({
          onDoubleClick: (event: { preventDefault?: () => void }) => {
            event.preventDefault?.()
            onEnterSelectionMode()
          },
        } as const)
      : null

  if (selectionMode || (isWeb && highlights.length === 0)) {
    return (
      <SelectableVerseInput
        text={text}
        fontSize={fontSize}
        lineHeight={lineHeight}
        onSelectionChange={onSelectionChange}
      />
    )
  }

  if (highlights.length === 0) {
    return (
      <Pressable
        onLongPress={onEnterSelectionMode}
        delayLongPress={280}
        style={styles.highlightedWrap}
      >
        <Text style={[styles.plainSegment, { fontSize, lineHeight }]}>{text}</Text>
        {Platform.OS === 'android' ? (
          <Text style={styles.hint}>Segure para selecionar um trecho</Text>
        ) : null}
      </Pressable>
    )
  }

  return (
    <Pressable
      onLongPress={onEnterSelectionMode}
      delayLongPress={280}
      style={styles.highlightedWrap}
    >
      <View style={styles.verseFlow} {...webDoubleClickProps}>
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
      ) : isWeb ? (
        <Text style={styles.hint}>Duplo clique no versículo para selecionar um trecho</Text>
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
  selectableInputWeb: {
    overflow: 'hidden' as const,
    maxHeight: 'none' as const,
    resize: 'none' as const,
    outlineStyle: 'none' as const,
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
