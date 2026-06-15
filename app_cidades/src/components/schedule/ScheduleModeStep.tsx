import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScheduleViewMode } from '../../types/scheduleAppointment'
import { colors } from '../../theme/colors'

type ScheduleModeStepProps = {
  specialtyName: string
  selectedMode: ScheduleViewMode
  onSelectMode: (mode: ScheduleViewMode) => void
}

export function ScheduleModeStep({
  specialtyName,
  selectedMode,
  onSelectMode,
}: ScheduleModeStepProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Como prefere agendar?</Text>
      <Text style={styles.description}>
        Em {specialtyName}, escolha se quer começar pela data ou pelo médico.
      </Text>

      <View style={styles.options}>
        <Pressable
          onPress={() => onSelectMode('by_day')}
          style={[styles.option, selectedMode === 'by_day' && styles.optionSelected]}
        >
          <View style={[styles.iconShell, selectedMode === 'by_day' && styles.iconShellSelected]}>
            <Ionicons
              name="calendar"
              size={24}
              color={selectedMode === 'by_day' ? colors.primaryLight : colors.textMuted}
            />
          </View>
          <View style={styles.optionBody}>
            <Text style={[styles.optionTitle, selectedMode === 'by_day' && styles.optionTitleSelected]}>
              Por data
            </Text>
            <Text style={styles.optionMeta}>
              Escolha o dia, depois o médico disponível e o horário.
            </Text>
          </View>
          {selectedMode === 'by_day' ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primaryLight} />
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => onSelectMode('by_doctor')}
          style={[styles.option, selectedMode === 'by_doctor' && styles.optionSelected]}
        >
          <View style={[styles.iconShell, selectedMode === 'by_doctor' && styles.iconShellSelected]}>
            <MaterialCommunityIcons
              name="doctor"
              size={24}
              color={selectedMode === 'by_doctor' ? colors.primaryLight : colors.textMuted}
            />
          </View>
          <View style={styles.optionBody}>
            <Text
              style={[styles.optionTitle, selectedMode === 'by_doctor' && styles.optionTitleSelected]}
            >
              Agenda do médico
            </Text>
            <Text style={styles.optionMeta}>
              Escolha o profissional, veja os dias em que atende e o horário.
            </Text>
          </View>
          {selectedMode === 'by_doctor' ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primaryLight} />
          ) : null}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    width: 48,
    height: 48,
    borderRadius: 14,
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
  optionMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
})
