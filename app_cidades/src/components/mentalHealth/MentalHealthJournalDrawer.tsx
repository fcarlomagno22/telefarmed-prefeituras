import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type MentalHealthJournalDrawerProps = {
  visible: boolean
  prompt: string
  initialNote?: string | null
  onClose: () => void
  onSave: (note: string) => Promise<void> | void
}

export function MentalHealthJournalDrawer({
  visible,
  prompt,
  initialNote,
  onClose,
  onSave,
}: MentalHealthJournalDrawerProps) {
  const [note, setNote] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!visible) return
    setNote(initialNote ?? '')
  }, [initialNote, visible])

  async function handleSave() {
    const trimmed = note.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await onSave(trimmed)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const footer = (
    <PrimaryButton
      label="Salvar registro"
      onPress={() => void handleSave()}
      loading={saving}
      disabled={!note.trim()}
    />
  )

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Registro breve"
      subtitle="Opcional — só para você"
      onClose={onClose}
      footer={footer}
      keyboardAware
    >
      <Text style={styles.prompt}>{prompt}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Escreva com suas palavras..."
        placeholderTextColor={colors.textSubtle}
        multiline
        maxLength={500}
        style={styles.input}
      />
      <Text style={styles.hint}>Este registro fica no seu aparelho e não substitui o check-in.</Text>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  prompt: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  input: {
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
})
