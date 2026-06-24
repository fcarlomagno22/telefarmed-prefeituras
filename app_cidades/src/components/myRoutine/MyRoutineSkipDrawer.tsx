import { StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'

type MyRoutineSkipDrawerProps = {
  visible: boolean
  taskTitle?: string
  onClose: () => void
  onConfirm: (reason?: string) => void
}

export function MyRoutineSkipDrawer({
  visible,
  taskTitle,
  onClose,
  onConfirm,
}: MyRoutineSkipDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [reason, setReason] = useState('')

  useEffect(() => {
    if (!visible) setReason('')
  }, [visible])

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Pular tarefa"
      subtitle="Sem culpa — a vida acontece"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Pular por hoje"
          onPress={() => {
            onConfirm(reason.trim() || undefined)
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        {taskTitle ? <Text style={styles.taskTitle}>“{taskTitle}”</Text> : null}
        <Text style={styles.body}>
          Pular não é falhar. Se quiser, conte o motivo — isso ajuda na revisão semanal.
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Motivo opcional (ex.: imprevisto, cansaço...)"
          placeholderTextColor={colors.textSubtle}
          multiline
          textAlignVertical="top"
          style={styles.input}
          selectionColor={ACCENT}
        />
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  taskTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  input: {
    minHeight: 96,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  footerBtn: { marginTop: 0 },
}
}

