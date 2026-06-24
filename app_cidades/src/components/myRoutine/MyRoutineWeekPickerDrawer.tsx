import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { buildRecentWeekStarts, formatWeekRangeLabel } from '../../utils/myRoutineWeekStats'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT_LIGHT = '#f0abfc'

type MyRoutineWeekPickerDrawerProps = {
  visible: boolean
  weekStartIso: string
  onClose: () => void
  onSelect: (weekStartIso: string) => void
}

export function MyRoutineWeekPickerDrawer({
  visible,
  weekStartIso,
  onClose,
  onSelect,
}: MyRoutineWeekPickerDrawerProps) {
  const styles = useThemedStyles(createStyles)
  const options = buildRecentWeekStarts(16)

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Escolher semana"
      subtitle="Navegue entre semanas recentes"
      onClose={onClose}
      scrollable={false}
    >
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {options.map((option) => {
          const selected = option === weekStartIso
          return (
            <Pressable
              key={option}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                onSelect(option)
                onClose()
              }}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.copy}>
                <Text style={[styles.label, selected && styles.labelSelected]}>
                  {formatWeekRangeLabel(option)}
                </Text>
                <Text style={styles.meta}>Semana iniciando {option}</Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={18} color={ACCENT_LIGHT} /> : null}
            </Pressable>
          )
        })}
      </ScrollView>
      <PrimaryButton label="Fechar" onPress={onClose} style={styles.footerBtn} />
    </RunWalkSheetDrawer>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  rowSelected: {
    backgroundColor: 'rgba(217, 70, 239, 0.1)',
    borderColor: 'rgba(240, 171, 252, 0.28)',
  },
  rowPressed: { opacity: 0.88 },
  copy: { flex: 1, gap: 2 },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  labelSelected: { color: ACCENT_LIGHT },
  meta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  footerBtn: { marginTop: 8 },
}
}

