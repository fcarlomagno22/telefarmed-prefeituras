import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { MyRoutineTimeBlock } from '../../types/myRoutine'
import { MY_ROUTINE_BLOCK_LABELS, MY_ROUTINE_BLOCK_ORDER } from '../../utils/myRoutineTodayHelpers'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

type MyRoutineQuickTaskDrawerProps = {
  visible: boolean
  onClose: () => void
  onConfirm: (title: string, block: MyRoutineTimeBlock) => void
}

export function MyRoutineQuickTaskDrawer({
  visible,
  onClose,
  onConfirm,
}: MyRoutineQuickTaskDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [title, setTitle] = useState('')
  const [block, setBlock] = useState<MyRoutineTimeBlock>('anytime')

  useEffect(() => {
    if (!visible) {
      setTitle('')
      setBlock('anytime')
    }
  }, [visible])

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Tarefa avulsa"
      subtitle="Só para hoje"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Adicionar ao dia"
          disabled={!title.trim()}
          onPress={() => {
            onConfirm(title.trim(), block)
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="O que você quer lembrar de fazer?"
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
          selectionColor={ACCENT}
        />
        <Text style={styles.label}>Parte do dia</Text>
        <View style={styles.chips}>
          {MY_ROUTINE_BLOCK_ORDER.map((item) => {
            const selected = block === item
            return (
              <Pressable
                key={item}
                onPress={() => setBlock(item)}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.chipSelected,
                  pressed && styles.chipPressed,
                ]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {MY_ROUTINE_BLOCK_LABELS[item]}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 12 },
  input: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipSelected: {
    backgroundColor: 'rgba(217, 70, 239, 0.12)',
    borderColor: 'rgba(240, 171, 252, 0.35)',
  },
  chipPressed: { opacity: 0.88 },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: ACCENT_LIGHT, fontWeight: '700' },
  footerBtn: { marginTop: 0 },
}
}

