import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { RemoteCareUrgencyLevel } from '../../types/remoteCareRequest'
import { REMOTE_CARE_URGENCY_OPTIONS } from '../../utils/remoteCareUrgency'
import { ScheduleStepTitle } from './ScheduleStepTitle'

type ScheduleRemoteCareUrgencyStepProps = {
  selectedLevel: RemoteCareUrgencyLevel | ''
  specialtyName?: string
  onSelect: (level: RemoteCareUrgencyLevel) => void
  onBack?: () => void
}

export function ScheduleRemoteCareUrgencyStep({
  selectedLevel,
  specialtyName,
  onSelect,
  onBack,
}: ScheduleRemoteCareUrgencyStepProps) {
  function handleSelect(level: RemoteCareUrgencyLevel) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelect(level)
  }

  return (
    <View style={styles.wrap}>
      <ScheduleStepTitle title="Qual a urgência?" onBack={onBack} />

      {specialtyName ? (
        <View style={styles.contextChip}>
          <Ionicons name="medkit-outline" size={14} color={colors.primaryLight} />
          <Text style={styles.contextChipText}>{specialtyName}</Text>
        </View>
      ) : null}

      <Text style={styles.description}>
        Isso ajuda a equipe a priorizar sua solicitação. Em caso de emergência, procure atendimento
        presencial imediato.
      </Text>

      <View style={styles.options}>
        {REMOTE_CARE_URGENCY_OPTIONS.map((option) => {
          const selected = selectedLevel === option.id

          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label}. ${option.hint}`}
            >
              <View style={[styles.iconShell, selected && styles.iconShellSelected]}>
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? colors.primaryLight : colors.textMuted}
                />
              </View>

              <View style={styles.optionBody}>
                <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
                  {option.label}
                </Text>
                <Text style={styles.optionHint}>{option.hint}</Text>
              </View>

              {selected ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.primaryLight} />
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  contextChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.22)',
  },
  contextChipText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(14, 14, 20, 0.75)',
  },
  optionSelected: {
    borderColor: 'rgba(255, 133, 51, 0.55)',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  iconShell: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconShellSelected: {
    backgroundColor: 'rgba(255, 107, 0, 0.18)',
    borderColor: 'rgba(255, 133, 51, 0.4)',
  },
  optionBody: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionTitleSelected: {
    color: colors.primaryLight,
  },
  optionHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.82,
  },
})
