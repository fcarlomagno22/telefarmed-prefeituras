import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { scheduleDoctors } from '../../data/mockScheduleCatalog'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type {
  AppointmentPosConsultaCheckinItem,
  PostConsultationPlanEntry,
} from '../../types/appointmentPostConsultation'
import { getPlanStatusLabel } from '../../utils/appointmentPostConsultation'
import { getAppointmentDateTime } from '../../utils/myAppointments'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'
import { AppointmentActionButton } from '../appointments/AppointmentActionButton'

type PostConsultationPlanCardProps = {
  entry: PostConsultationPlanEntry
  featured?: boolean
  pendingCheckin?: AppointmentPosConsultaCheckinItem | null
  onPress: () => void
  onRespondPress?: () => void
}

const PALETTE = ACTION_ICON_PALETTES.postConsultation

function getCardColors(featured: boolean, isActive: boolean) {
  if (featured && isActive) {
    return {
      gradient: [
        'rgba(14, 165, 233, 0.28)',
        'rgba(14, 165, 233, 0.12)',
        'rgba(14, 14, 20, 0.98)',
      ] as const,
      border: 'rgba(14, 165, 233, 0.38)',
    }
  }

  if (isActive) {
    return {
      gradient: [
        'rgba(255, 133, 51, 0.20)',
        'rgba(255, 107, 0, 0.10)',
        'rgba(14, 14, 20, 0.98)',
      ] as const,
      border: 'rgba(255, 133, 51, 0.28)',
    }
  }

  return {
    gradient: [
      'rgba(255, 133, 51, 0.16)',
      'rgba(255, 107, 0, 0.08)',
      'rgba(14, 14, 20, 0.97)',
    ] as const,
    border: 'rgba(255, 255, 255, 0.14)',
  }
}

export function PostConsultationPlanCard({
  entry,
  featured = false,
  pendingCheckin = null,
  onPress,
  onRespondPress,
}: PostConsultationPlanCardProps) {
  const { appointment, plan } = entry
  const doctor = scheduleDoctors.find((item) => item.id === appointment.selectedDoctorId)
  const appointmentDate = getAppointmentDateTime(appointment)
  const isActive = plan.status === 'ativo'
  const cardColors = getCardColors(featured, isActive)
  const progressRatio =
    plan.totalCheckins > 0 ? plan.respondedCount / plan.totalCheckins : 0
  const hasPending = Boolean(pendingCheckin)

  function handleOpen() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[...cardColors.gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { borderColor: cardColors.border }]}
      >
        {featured ? (
          <View style={styles.featuredBadgeRow}>
            <View style={styles.featuredBadge}>
              <Ionicons
                name={hasPending ? 'pulse' : 'time-outline'}
                size={12}
                color="#7dd3fc"
              />
              <Text style={styles.featuredBadgeText}>
                {hasPending ? 'Check-in disponível' : 'Em andamento'}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                isActive ? styles.statusBadgeActive : styles.statusBadgeClosed,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextClosed,
                ]}
              >
                {getPlanStatusLabel(plan.status)}
              </Text>
            </View>
          </View>
        ) : null}

        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => [styles.bodyPressable, pressed && styles.pressed]}
        >
          <Text style={styles.specialty}>{appointment.specialtyName}</Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.ubt} numberOfLines={1}>
              {appointment.selectedUbtName}
            </Text>
          </View>

          <View style={styles.dateTimeRow}>
            <View style={styles.datetimeBlock}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.primaryLight} />
                <Text style={styles.dateText}>{formatScheduleDayLabel(appointmentDate)}</Text>
              </View>
              <Text style={styles.timeText}>às {appointment.selectedTime}</Text>
            </View>

            {!featured ? (
              <View
                style={[
                  styles.statusBadge,
                  isActive ? styles.statusBadgeActive : styles.statusBadgeClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isActive ? styles.statusBadgeTextActive : styles.statusBadgeTextClosed,
                  ]}
                >
                  {getPlanStatusLabel(plan.status)}
                </Text>
              </View>
            ) : null}
          </View>

          {doctor ? (
            <View style={styles.doctorRow}>
              <Image source={{ uri: doctor.avatarUrl }} style={styles.avatar} />
              <View style={styles.doctorTextCol}>
                <Text style={styles.doctorName}>{doctor.name}</Text>
                <Text style={styles.doctorMeta}>{doctor.crm}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.doctorFallback}>com {appointment.selectedDoctorName}</Text>
          )}

          <View style={styles.protocolRow}>
            <Ionicons name="document-text-outline" size={14} color={colors.textSubtle} />
            <Text style={styles.protocol}>Protocolo {appointment.protocol}</Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Dia {plan.planDayNumber} de {plan.planTotalDays}
              </Text>
              <Text style={styles.progressCount}>
                {plan.respondedCount}/{plan.totalCheckins}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.max(4, progressRatio * 100)}%`,
                    backgroundColor: featured && isActive ? '#0ea5e9' : colors.primary,
                  },
                ]}
              />
            </View>
            {plan.nextCheckinLabel && !hasPending ? (
              <Text style={styles.nextLabel}>Próximo check-in em {plan.nextCheckinLabel}</Text>
            ) : null}
          </View>
        </Pressable>

        {hasPending && onRespondPress ? (
          <View style={styles.actionsRow}>
            <AppointmentActionButton
              label={`Responder check-in ${pendingCheckin!.checkinNumber}`}
              icon="clipboard-check-outline"
              palette={PALETTE}
              onPress={onRespondPress}
            />
            <AppointmentActionButton
              label="Ver acompanhamento"
              icon="clipboard-pulse-outline"
              palette={ACTION_ICON_PALETTES.myAppointments}
              onPress={handleOpen}
            />
          </View>
        ) : featured ? (
          <View style={styles.actionsRow}>
            <AppointmentActionButton
              label="Ver acompanhamento"
              icon="clipboard-pulse-outline"
              palette={PALETTE}
              onPress={handleOpen}
            />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.28)',
  },
  featuredBadgeText: {
    color: '#7dd3fc',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  bodyPressable: {
    gap: 10,
  },
  pressed: {
    opacity: 0.92,
  },
  specialty: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ubt: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
  },
  datetimeBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 20,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  doctorTextCol: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  doctorMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  doctorFallback: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protocol: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderColor: 'rgba(14, 165, 233, 0.28)',
  },
  statusBadgeClosed: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  statusBadgeTextActive: {
    color: '#7dd3fc',
  },
  statusBadgeTextClosed: {
    color: colors.textSubtle,
  },
  progressBlock: {
    gap: 6,
    paddingTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressCount: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  nextLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
})
