import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ScheduleCareMode } from '../../types/scheduleAppointment'
import { colors } from '../../theme/colors'
import { ScheduleStepTitle } from './ScheduleStepTitle'

type ScheduleCareModeStepProps = {
  selectedMode: ScheduleCareMode | ''
  onSelectMode: (mode: ScheduleCareMode) => void
  onBack?: () => void
}

export function ScheduleCareModeStep({
  selectedMode,
  onSelectMode,
  onBack,
}: ScheduleCareModeStepProps) {
  return (
    <View style={styles.wrap}>
      <ScheduleStepTitle title="Como você prefere ser atendido?" onBack={onBack} />
      <Text style={styles.description}>
        Escolha se deseja ir até uma unidade de saúde ou receber atendimento pelo celular.
      </Text>

      <View style={styles.options}>
        <Pressable
          onPress={() => onSelectMode('in_person')}
          style={[styles.option, selectedMode === 'in_person' && styles.optionSelected]}
        >
          <View style={[styles.iconShell, selectedMode === 'in_person' && styles.iconShellSelected]}>
            <MaterialCommunityIcons
              name="hospital-building"
              size={24}
              color={selectedMode === 'in_person' ? colors.primaryLight : colors.textMuted}
            />
          </View>
          <View style={styles.optionBody}>
            <Text
              style={[styles.optionTitle, selectedMode === 'in_person' && styles.optionTitleSelected]}
            >
              Atendimento presencial
            </Text>
            <Text style={styles.optionMeta}>
              Compareça a uma unidade de saúde da rede para a consulta.
            </Text>
          </View>
          {selectedMode === 'in_person' ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primaryLight} />
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => onSelectMode('remote')}
          style={[styles.option, selectedMode === 'remote' && styles.optionSelected]}
        >
          <View style={[styles.iconShell, selectedMode === 'remote' && styles.iconShellSelected]}>
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              color={selectedMode === 'remote' ? colors.primaryLight : colors.textMuted}
            />
          </View>
          <View style={styles.optionBody}>
            <Text
              style={[styles.optionTitle, selectedMode === 'remote' && styles.optionTitleSelected]}
            >
              Atendimento pelo celular
            </Text>
            <Text style={styles.optionMeta}>
              Consulta por vídeo no seu aparelho, sem precisar se deslocar.
            </Text>
          </View>
          {selectedMode === 'remote' ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primaryLight} />
          ) : null}
        </Pressable>
      </View>

      {selectedMode === 'remote' ? (
        <View style={styles.remoteNotice}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primaryLight} />
          <Text style={styles.remoteNoticeText}>
            O atendimento remoto é aprovado apenas para pessoas acamadas ou com dificuldade de
            locomoção, mediante análise da equipe de saúde.
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
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
  remoteNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  remoteNoticeText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
})
