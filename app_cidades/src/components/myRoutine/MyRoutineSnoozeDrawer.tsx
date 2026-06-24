import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useEffect, useState } from 'react'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import { PrimaryButton } from '../PrimaryButton'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'
import { useTheme } from '../../contexts/ThemeContext'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'
const PRESETS = [15, 30, 60] as const

type MyRoutineSnoozeDrawerProps = {
  visible: boolean
  taskTitle?: string
  onClose: () => void
  onConfirm: (minutes: number) => void
}

export function MyRoutineSnoozeDrawer({
  visible,
  taskTitle,
  onClose,
  onConfirm,
}: MyRoutineSnoozeDrawerProps) {
  const { colors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const [customMinutes, setCustomMinutes] = useState('')

  useEffect(() => {
    if (!visible) setCustomMinutes('')
  }, [visible])

  function handlePreset(minutes: number) {
    void Haptics.selectionAsync()
    onConfirm(minutes)
    onClose()
  }

  function handleCustomConfirm() {
    const parsed = Number(customMinutes)
    if (!Number.isFinite(parsed) || parsed <= 0) return
    onConfirm(Math.min(240, Math.round(parsed)))
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Adiar tarefa"
      subtitle={taskTitle ? `“${taskTitle}”` : 'Escolha por quanto tempo'}
      onClose={onClose}
      footer={
        customMinutes.trim() ? (
          <PrimaryButton label="Adiar tempo personalizado" onPress={handleCustomConfirm} style={styles.footerBtn} />
        ) : undefined
      }
    >
      <View style={styles.content}>
        <Text style={styles.hint}>A tarefa volta a aparecer depois do intervalo.</Text>
        <View style={styles.presetsRow}>
          {PRESETS.map((minutes) => (
            <Pressable
              key={minutes}
              onPress={() => handlePreset(minutes)}
              style={({ pressed }) => [styles.presetBtn, pressed && styles.presetPressed]}
            >
              <Text style={styles.presetValue}>{minutes}</Text>
              <Text style={styles.presetLabel}>min</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.customBlock}>
          <Text style={styles.customLabel}>Outro intervalo (minutos)</Text>
          <TextInput
            value={customMinutes}
            onChangeText={setCustomMinutes}
            keyboardType="number-pad"
            placeholder="Ex.: 45"
            placeholderTextColor={colors.textSubtle}
            style={styles.customInput}
            selectionColor={ACCENT}
          />
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 14 },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  presetsRow: { flexDirection: 'row', gap: 10 },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.28)',
  },
  presetPressed: { opacity: 0.88 },
  presetValue: {
    color: ACCENT_LIGHT,
    fontSize: 24,
    fontWeight: '900',
  },
  presetLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  customBlock: { gap: 8 },
  customLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  customInput: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  footerBtn: { marginTop: 0 },
}
}

