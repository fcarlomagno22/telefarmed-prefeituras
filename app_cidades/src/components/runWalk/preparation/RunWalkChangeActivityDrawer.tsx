import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { ActivityModality } from '../../../types/auth'
import { colors } from '../../../theme/colors'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'

export type ChangeActivityAction =
  | 'swap-run-to-walk'
  | 'swap-walk-to-run-walk'
  | 'reduce-duration'
  | 'increase-duration'
  | 'choose-other-workout'
  | 'start-free-activity'
  | 'use-saved-route'

type ChangeActivityOption = {
  id: ChangeActivityAction
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}

const OPTIONS: ChangeActivityOption[] = [
  {
    id: 'swap-run-to-walk',
    label: 'Trocar corrida por caminhada',
    icon: 'walk',
  },
  {
    id: 'swap-walk-to-run-walk',
    label: 'Trocar caminhada por corrida e caminhada',
    icon: 'run',
  },
  {
    id: 'reduce-duration',
    label: 'Reduzir duração',
    icon: 'minus-circle-outline',
  },
  {
    id: 'increase-duration',
    label: 'Aumentar duração',
    icon: 'plus-circle-outline',
  },
  {
    id: 'choose-other-workout',
    label: 'Escolher outro treino',
    icon: 'format-list-bulleted',
  },
  {
    id: 'start-free-activity',
    label: 'Iniciar atividade livre',
    icon: 'lightning-bolt',
  },
  {
    id: 'use-saved-route',
    label: 'Usar uma rota salva',
    icon: 'map-marker-path',
  },
]

type RunWalkChangeActivityDrawerProps = {
  visible: boolean
  onClose: () => void
  onAction: (action: ChangeActivityAction) => void
  currentModality: ActivityModality
}

export function RunWalkChangeActivityDrawer({
  visible,
  onClose,
  onAction,
}: RunWalkChangeActivityDrawerProps) {
  function handlePress(action: ChangeActivityAction) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onAction(action)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Alterar atividade"
      subtitle="Ajuste a modalidade, duração ou treino antes de começar"
      onClose={onClose}
    >
      <View style={styles.list}>
        {OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => handlePress(option.id)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            <MaterialCommunityIcons name={option.icon} size={18} color="#fdba74" />
            <Text style={styles.label}>{option.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSubtle} />
          </Pressable>
        ))}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
})
