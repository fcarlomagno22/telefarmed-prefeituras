import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, StyleSheet, Text, View } from 'react-native'
import { ScheduleAppointmentDraft } from '../../types/scheduleAppointment'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'
import { colors } from '../../theme/colors'
import { AuthUser } from '../../types/auth'
import { scheduleDoctors } from '../../data/mockScheduleCatalog'
import { ScheduleStepTitle } from './ScheduleStepTitle'

type ScheduleConfirmStepProps = {
  user: AuthUser
  draft: ScheduleAppointmentDraft
  onBack?: () => void
}

export function ScheduleConfirmStep({ user, draft, onBack }: ScheduleConfirmStepProps) {
  const doctor = scheduleDoctors.find((d) => d.id === draft.selectedDoctorId)

  return (
    <View style={styles.wrap}>
      <ScheduleStepTitle title="Confirme seu agendamento" onBack={onBack} />
      <Text style={styles.description}>
        Revise os dados antes de confirmar. Você receberá a confirmação no app.
      </Text>

      <View style={styles.patientCard}>
        <LinearGradient
          colors={['rgba(255, 133, 51, 0.2)', 'rgba(255, 107, 0, 0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.patientCardBorder}
        >
          <View style={styles.patientCardInner}>
            <View style={styles.patientHeader}>
              <Ionicons name="person-circle-outline" size={22} color={colors.primaryLight} />
              <Text style={styles.patientHeaderText}>Paciente</Text>
            </View>
            <Text style={styles.patientName}>{user.name}</Text>
            <Text style={styles.patientMeta}>{user.phone}</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons name="stethoscope" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Especialidade</Text>
            <Text style={styles.detailValue}>{draft.specialtyName}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <MaterialCommunityIcons name="hospital-building" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>UBT</Text>
            <Text style={styles.detailValue}>{draft.selectedUbtName}</Text>
            {draft.selectedUbtAddress ? (
              <Text style={styles.detailMeta}>{draft.selectedUbtAddress}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIcon}>
            <Ionicons name="calendar" size={18} color={colors.primaryLight} />
          </View>
          <View style={styles.detailBody}>
            <Text style={styles.detailLabel}>Data e horário</Text>
            <Text style={styles.detailValue}>
              {formatScheduleDayLabel(draft.selectedDate)} às {draft.selectedTime}
            </Text>
          </View>
        </View>

        {doctor ? (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Image source={{ uri: doctor.avatarUrl }} style={styles.doctorThumb} />
              <View style={styles.detailBody}>
                <Text style={styles.detailLabel}>Profissional</Text>
                <Text style={styles.detailValue}>{doctor.name}</Text>
                <Text style={styles.detailMeta}>{doctor.crm}</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color={colors.primaryLight} />
        <Text style={styles.noticeText}>
          Chegue com 15 minutos de antecedência e leve documento com foto.
        </Text>
      </View>
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
  patientCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  patientCardBorder: {
    borderRadius: 16,
    padding: 1,
  },
  patientCardInner: {
    borderRadius: 15,
    backgroundColor: 'rgba(14, 14, 20, 0.92)',
    padding: 14,
    gap: 4,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  patientHeaderText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  patientName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  patientMeta: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(14, 14, 20, 0.85)',
    padding: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.25)',
  },
  doctorThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  detailBody: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  detailMeta: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.2)',
  },
  noticeText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
})
