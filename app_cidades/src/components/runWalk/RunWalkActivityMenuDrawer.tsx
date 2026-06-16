import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { ActivityMenuAction } from '../../types/runWalk'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkActivityMenuDrawerProps = {
  visible: boolean
  onClose: () => void
  onAction: (action: ActivityMenuAction) => void
}

type MenuOptionTone = 'default' | 'warning' | 'destructive'

type MenuOption = {
  action: ActivityMenuAction
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  tone?: MenuOptionTone
}

const OPTIONS: MenuOption[] = [
  { action: 'later', label: 'Fazer mais tarde', icon: 'clock-outline' },
  { action: 'reschedule', label: 'Remarcar', icon: 'calendar-edit' },
  { action: 'tomorrow', label: 'Fazer amanhã', icon: 'calendar-arrow-right' },
  { action: 'swap-walk', label: 'Trocar corrida por caminhada', icon: 'walk' },
  { action: 'reduce-duration', label: 'Reduzir a duração', icon: 'timer-minus-outline' },
  { action: 'reduce-intensity', label: 'Reduzir a intensidade', icon: 'speedometer-slow' },
  { action: 'free-activity', label: 'Escolher atividade livre', icon: 'map-marker-radius' },
  { action: 'report-tired', label: 'Informar cansaço', icon: 'battery-low' },
  { action: 'report-discomfort', label: 'Informar desconforto', icon: 'bandage' },
  { action: 'skip', label: 'Pular atividade', icon: 'skip-forward-outline', tone: 'warning' },
  {
    action: 'remove-today',
    label: 'Excluir atividade de hoje',
    icon: 'trash-can-outline',
    tone: 'destructive',
  },
]

const TONE_STYLES: Record<
  MenuOptionTone,
  { iconBg: string; iconColor: string; labelColor: string; borderColor: string }
> = {
  default: {
    iconBg: 'rgba(37, 99, 235, 0.12)',
    iconColor: '#93c5fd',
    labelColor: colors.text,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  warning: {
    iconBg: 'rgba(245, 158, 11, 0.16)',
    iconColor: '#fbbf24',
    labelColor: '#fde68a',
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  destructive: {
    iconBg: 'rgba(239, 68, 68, 0.12)',
    iconColor: '#fca5a5',
    labelColor: '#fca5a5',
    borderColor: 'rgba(239, 68, 68, 0.24)',
  },
}

export function RunWalkActivityMenuDrawer({
  visible,
  onClose,
  onAction,
}: RunWalkActivityMenuDrawerProps) {
  function handlePress(action: ActivityMenuAction) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onAction(action)
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Opções da atividade"
      subtitle="O plano será reorganizado conforme sua escolha"
      onClose={onClose}
      scrollable
      fullScreen
    >
      <View style={styles.list}>
        {OPTIONS.map((option) => {
          const tone = option.tone ?? 'default'
          const toneStyle = TONE_STYLES[tone]

          return (
            <Pressable
              key={option.action}
              onPress={() => handlePress(option.action)}
              style={({ pressed }) => [
                styles.option,
                { borderColor: toneStyle.borderColor },
                tone === 'warning' && styles.optionWarning,
                tone === 'destructive' && styles.optionDestructive,
                pressed && styles.optionPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <View style={[styles.iconWrap, { backgroundColor: toneStyle.iconBg }]}>
                <MaterialCommunityIcons
                  name={option.icon}
                  size={18}
                  color={toneStyle.iconColor}
                />
              </View>
              <Text style={[styles.optionLabel, { color: toneStyle.labelColor }]}>
                {option.label}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textSubtle}
              />
            </Pressable>
          )
        })}
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
    paddingBottom: 24,
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
  optionWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  optionDestructive: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  optionPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
})
