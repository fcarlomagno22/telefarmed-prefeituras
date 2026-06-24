import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import {
  BIBLE_HIGHLIGHT_COLORS,
  getBibleHighlightColor,
  getBibleHighlightNeonSwatchStyle,
  type BibleHighlightColorId,
  type BibleVerseHighlight,
} from '../../types/bibleHighlights'
import { colors } from '../../theme/colors'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { BibleNeonHighlightPreview } from './BibleNeonHighlight'

export type BibleHighlightDrawerMode = 'create' | 'edit'

export type BibleHighlightDrawerState = {
  mode: BibleHighlightDrawerMode
  verse: number
  verseText: string
  start: number
  end: number
  selectedText: string
  highlight?: BibleVerseHighlight
}

type BibleVerseHighlightDrawerProps = {
  visible: boolean
  state: BibleHighlightDrawerState | null
  onClose: () => void
  onSave: (input: {
    colorId: BibleHighlightColorId
    comment: string
    highlightId?: string
    start: number
    end: number
  }) => void
  onDelete?: () => void
}

export function BibleVerseHighlightDrawer({
  visible,
  state,
  onClose,
  onSave,
  onDelete,
}: BibleVerseHighlightDrawerProps) {
  const [colorId, setColorId] = useState<BibleHighlightColorId>('yellow')
  const [comment, setComment] = useState('')
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [selectedText, setSelectedText] = useState('')

  useEffect(() => {
    if (!visible || !state) return

    setColorId(state.highlight?.colorId ?? 'yellow')
    setComment(state.highlight?.comment ?? '')
    setSelection({ start: state.start, end: state.end })
    setSelectedText(state.selectedText)
  }, [state, visible])

  const isEdit = state?.mode === 'edit'
  const canSave = Boolean(selectedText.trim()) && Boolean(colorId)

  function handleSelectionChangeInDrawer(
    event: { nativeEvent: { selection: { start: number; end: number } } },
  ) {
    if (!state || isEdit) return

    const { start, end } = event.nativeEvent.selection
    if (start === end) return

    const nextText = state.verseText.slice(start, end)
    if (!nextText.trim()) return

    setSelection({ start, end })
    setSelectedText(nextText)
  }

  function handleSave() {
    if (!canSave || !state) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onSave({
      colorId,
      comment,
      highlightId: state.highlight?.id,
      start: isEdit ? state.start : selection.start,
      end: isEdit ? state.end : selection.end,
    })
  }

  function handleDelete() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    onDelete?.()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title={isEdit ? 'Editar grifo' : 'Grifar trecho'}
      subtitle={
        state
          ? `Versículo ${state.verse}${isEdit ? '' : ' · selecione o trecho abaixo, se quiser ajustar'}`
          : undefined
      }
      onClose={onClose}
      keyboardAware
      footer={
        <View style={styles.footer}>
          {isEdit ? (
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
            >
              <Text style={styles.deleteButtonText}>Excluir grifo</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.saveButton,
              !canSave && styles.saveButtonDisabled,
              pressed && canSave && styles.pressed,
            ]}
          >
            <Text style={styles.saveButtonText}>{isEdit ? 'Salvar alterações' : 'Grifar'}</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.body}>
        {state && !isEdit && !selectedText.trim() ? (
          <View style={styles.selectionBlock}>
            <Text style={styles.fieldLabel}>Selecione o trecho</Text>
            <TextInput
              value={state.verseText}
              editable={false}
              multiline
              selectTextOnFocus={false}
              onSelectionChange={handleSelectionChangeInDrawer}
              style={styles.verseInput}
            />
          </View>
        ) : null}

        <View style={styles.quoteBlock}>
          <Text style={styles.fieldLabel}>{isEdit ? 'Trecho grifado' : 'Prévia'}</Text>
          {selectedText.trim() ? (
            <BibleNeonHighlightPreview
              text={selectedText.trim()}
              color={getBibleHighlightColor(colorId)}
            />
          ) : (
            <Text style={styles.quoteText}>Selecione um trecho na leitura.</Text>
          )}
        </View>

        <View style={styles.colorsBlock}>
          <Text style={styles.fieldLabel}>Cor do grifo</Text>
          <View style={styles.colorsRow}>
            {BIBLE_HIGHLIGHT_COLORS.map((color) => {
              const active = colorId === color.id
              return (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setColorId(color.id)
                  }}
                  style={({ pressed }) => [
                    styles.colorSwatch,
                    getBibleHighlightNeonSwatchStyle(color, active),
                    active && styles.colorSwatchActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Cor ${color.label}`}
                >
                  <View style={[styles.colorSwatchCore, { backgroundColor: color.neon }]} />
                </Pressable>
              )
            })}
          </View>
        </View>

        <View style={styles.commentBlock}>
          <Text style={styles.fieldLabel}>Comentário (opcional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escreva uma reflexão sobre este trecho..."
            placeholderTextColor={colors.textSubtle}
            multiline
            style={styles.commentInput}
          />
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: 18,
  },
  fieldLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  selectionBlock: {
    gap: 0,
  },
  verseInput: {
    minHeight: 88,
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    textAlignVertical: 'top',
  },
  quoteBlock: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quoteText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  colorsBlock: {
    gap: 0,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorSwatch: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.95,
  },
  colorSwatchActive: {
    transform: [{ scale: 1.1 }],
  },
  commentBlock: {
    gap: 0,
  },
  commentInput: {
    minHeight: 96,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    textAlignVertical: 'top',
  },
  footer: {
    gap: 10,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#fbbf24',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: '#1a1208',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  deleteButtonText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.86,
  },
})
