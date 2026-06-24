import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'
import type { MyRoutineWeekendMode } from '../../types/myRoutine'
import { MY_ROUTINE_WEEKEND_MODE_OPTIONS } from '../../types/myRoutine'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutineWeekendModeDrawerProps = {
  visible: boolean
  currentMode: MyRoutineWeekendMode
  onClose: () => void
  onApply: (mode: MyRoutineWeekendMode) => void
}

export function MyRoutineWeekendModeDrawer({
  visible,
  currentMode,
  onClose,
  onApply,
}: MyRoutineWeekendModeDrawerProps) {
  const styles = useThemedStyles(createStyles)
  const [draft, setDraft] = useState<MyRoutineWeekendMode>(currentMode)

  useEffect(() => {
    if (visible) setDraft(currentMode)
  }, [currentMode, visible])

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Modo fim de semana"
      subtitle="Como tratar sábado e domingo"
      onClose={onClose}
      footer={
        <PrimaryButton
          label="Aplicar modo"
          onPress={() => {
            onApply(draft)
            onClose()
          }}
          style={styles.footerBtn}
        />
      }
    >
      <View style={styles.content}>
        {MY_ROUTINE_WEEKEND_MODE_OPTIONS.map((option) => {
          const selected = draft === option.id
          return (
            <Pressable
              key={option.id}
              onPress={() => setDraft(option.id)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={styles.copy}>
                <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
                <Text style={styles.description}>{option.description}</Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} /> : null}
            </Pressable>
          )
        })}
      </View>
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  content: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionSelected: {
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderColor: 'rgba(240, 171, 252, 0.28)',
  },
  copy: { flex: 1, gap: 2 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  labelSelected: { color: ACCENT_LIGHT },
  description: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  footerBtn: { marginTop: 0 },
}
}

