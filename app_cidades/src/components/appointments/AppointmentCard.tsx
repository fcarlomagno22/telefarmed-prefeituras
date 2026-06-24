import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { Image, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native'
import { scheduleDoctors } from '../../data/mockScheduleCatalog'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import { StoredAppointment } from '../../types/myAppointments'
import {
  formatAppointmentDuration,
  getAppointmentDateTime,
  getAppointmentDurationMinutes,
  getAppointmentStatusColors,
  getAppointmentStatusLabel,
} from '../../utils/myAppointments'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'
import { AppointmentActionButton } from './AppointmentActionButton'

type AppointmentCardProps = {
  appointment: StoredAppointment
  highlighted?: boolean
  defaultExpanded?: boolean
  onCalendarPress: () => void
  onDirectionsPress: () => void
  onReschedulePress: () => void
  onCancelPress: () => void
  onPostConsultationPress: (appointment: StoredAppointment) => void
  onPrescriptionsPress: () => void
}

export function AppointmentCard({
  appointment,
  highlighted = false,
  defaultExpanded = false,
  onCalendarPress,
  onDirectionsPress,
  onReschedulePress,
  onCancelPress,
  onPostConsultationPress,
  onPrescriptionsPress,
}: AppointmentCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const doctor = scheduleDoctors.find((item) => item.id === appointment.selectedDoctorId)
  const statusColors = getAppointmentStatusColors(appointment.status)
  const isUpcoming =
    appointment.status === 'confirmed' || appointment.status === 'pending'
  const isCompleted = appointment.status === 'completed'
  const date = getAppointmentDateTime(appointment)
  const durationLabel = formatAppointmentDuration(getAppointmentDurationMinutes(appointment))

  function toggleExpanded() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setExpanded((current) => !current)
  }

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={
          highlighted
            ? ['rgba(16, 185, 129, 0.22)', 'rgba(16, 185, 129, 0.08)', 'rgba(14, 14, 20, 0.95)']
            : ['rgba(255, 133, 51, 0.14)', 'rgba(255, 107, 0, 0.06)', 'rgba(14, 14, 20, 0.95)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, highlighted && styles.cardHighlighted]}
      >
        <Pressable
          onPress={toggleExpanded}
          style={({ pressed }) => [styles.summaryPressable, pressed && styles.summaryPressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={
            expanded ? 'Recolher detalhes da consulta' : 'Expandir detalhes da consulta'
          }
        >
          {highlighted ? (
            <View style={styles.summaryHeader}>
              <View style={styles.heroBadge}>
                <Ionicons name="star" size={12} color="#6ee7b7" />
                <Text style={styles.heroBadgeText}>Próxima consulta</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusColors.background,
                    borderColor: statusColors.border,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {getAppointmentStatusLabel(appointment.status)}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.summaryMain}>
            {highlighted ? (
              <Text style={styles.specialty}>{appointment.specialtyName}</Text>
            ) : (
              <View style={styles.specialtyRow}>
                <Text style={[styles.specialty, styles.specialtyInline]} numberOfLines={2}>
                  {appointment.specialtyName}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusColors.background,
                      borderColor: statusColors.border,
                    },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColors.text }]}>
                    {getAppointmentStatusLabel(appointment.status)}
                  </Text>
                </View>
              </View>
            )}

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
                  <Text style={styles.dateText}>{formatScheduleDayLabel(date)}</Text>
                </View>
                <Text style={styles.timeText}>às {appointment.selectedTime}</Text>
              </View>

              <View style={[styles.chevronWrap, expanded && styles.chevronWrapExpanded]}>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={expanded ? colors.primaryLight : colors.textMuted}
                />
              </View>
            </View>
          </View>
        </Pressable>

        {expanded ? (
          <View style={styles.expandedBlock}>
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

            {isCompleted ? (
              <View style={styles.completedMetaBlock}>
                <View style={styles.completedMetaRow}>
                  <Ionicons name="calendar-outline" size={14} color={colors.primaryLight} />
                  <Text style={styles.completedMetaText}>
                    Realizada em {formatScheduleDayLabel(date)} às {appointment.selectedTime}
                  </Text>
                </View>
                <View style={styles.completedMetaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.primaryLight} />
                  <Text style={styles.completedMetaText}>
                    Duração: <Text style={styles.completedMetaStrong}>{durationLabel}</Text>
                  </Text>
                </View>
              </View>
            ) : null}

            {appointment.cancelReason ? (
              <View style={styles.cancelReasonRow}>
                <Ionicons name="information-circle-outline" size={14} color="#fca5a5" />
                <Text style={styles.cancelReason}>{appointment.cancelReason}</Text>
              </View>
            ) : null}

            {isUpcoming ? (
              <View style={styles.actionsGrid}>
                <View style={styles.actionsRow}>
                  <AppointmentActionButton
                    label="Calendário"
                    icon="calendar-plus"
                    palette={ACTION_ICON_PALETTES.schedule}
                    onPress={onCalendarPress}
                  />
                  <AppointmentActionButton
                    label="Como chegar"
                    icon="map-marker-radius"
                    palette={ACTION_ICON_PALETTES.nearbyUnits}
                    onPress={onDirectionsPress}
                  />
                </View>
                <View style={styles.actionsRow}>
                  <AppointmentActionButton
                    label="Reagendar"
                    icon="calendar-refresh"
                    palette={ACTION_ICON_PALETTES.myAppointments}
                    onPress={onReschedulePress}
                  />
                  <AppointmentActionButton
                    label="Cancelar"
                    icon="calendar-remove"
                    palette={{
                      iconGradient: ['#fca5a5', '#ef4444', '#dc2626'],
                      shadowColor: 'rgba(239, 68, 68, 0.4)',
                    }}
                    onPress={onCancelPress}
                  />
                </View>
              </View>
            ) : isCompleted ? (
              <View style={styles.actionsGrid}>
                <View style={styles.actionsRow}>
                  <AppointmentActionButton
                    label="Agendar retorno"
                    icon="calendar-clock"
                    palette={ACTION_ICON_PALETTES.schedule}
                    onPress={onReschedulePress}
                  />
                  <AppointmentActionButton
                    label="Pós-consulta"
                    icon="clipboard-pulse-outline"
                    palette={ACTION_ICON_PALETTES.postConsultation}
                    onPress={() => onPostConsultationPress(appointment)}
                  />
                </View>
                <View style={styles.actionsRow}>
                  <AppointmentActionButton
                    label="Atestados e +"
                    icon="pill"
                    palette={ACTION_ICON_PALETTES.prescriptions}
                    onPress={onPrescriptionsPress}
                  />
                </View>
              </View>
            ) : null}
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
    gap: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.22)',
    borderRadius: 18,
  },
  cardHighlighted: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  summaryPressable: {
    gap: 10,
  },
  summaryPressed: {
    opacity: 0.92,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  heroBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  heroBadgeText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  summaryMain: {
    gap: 6,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  specialty: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  specialtyInline: {
    flex: 1,
    minWidth: 0,
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
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  datetimeBlock: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  dateText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  timeText: {
    paddingLeft: 20,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  chevronWrap: {
    flexShrink: 0,
    width: 32,
    height: 32,
    marginTop: -2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chevronWrapExpanded: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    borderColor: 'rgba(255, 133, 51, 0.28)',
    transform: [{ rotate: '180deg' }],
  },
  expandedBlock: {
    gap: 10,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '500',
  },
  protocolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  protocol: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  completedMetaBlock: {
    gap: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.18)',
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedMetaText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  completedMetaStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  cancelReasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
  },
  cancelReason: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  actionsGrid: {
    gap: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
})
