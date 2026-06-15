import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
import { AppointmentQuickAction } from './AppointmentQuickAction'

const SHEET_OFFSET = 520

type AppointmentDetailDrawerProps = {
  visible: boolean
  appointment: StoredAppointment | null
  onClose: () => void
  onCalendarPress: () => void
  onDirectionsPress: () => void
  onReschedulePress: () => void
  onCancelPress: () => void
  onPostConsultationPress: () => void
  onPrescriptionsPress: () => void
}

export function AppointmentDetailDrawer({
  visible,
  appointment,
  onClose,
  onCalendarPress,
  onDirectionsPress,
  onReschedulePress,
  onCancelPress,
  onPostConsultationPress,
  onPrescriptionsPress,
}: AppointmentDetailDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible && appointment) {
      setIsMounted(true)
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!isMounted) return

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false)
    })
  }, [appointment, backdropOpacity, isMounted, sheetTranslateY, visible])

  if (!isMounted || !appointment) return null

  const doctor = scheduleDoctors.find((item) => item.id === appointment.selectedDoctorId)
  const statusColors = getAppointmentStatusColors(appointment.status)
  const date = getAppointmentDateTime(appointment)
  const isUpcoming =
    appointment.status === 'confirmed' || appointment.status === 'pending'
  const isCompleted = appointment.status === 'completed'
  const durationLabel = formatAppointmentDuration(getAppointmentDurationMinutes(appointment))

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerIconWrap}>
                <LinearGradient
                  colors={[...ACTION_ICON_PALETTES.myAppointments.iconGradient]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.headerIcon}
                >
                  <MaterialCommunityIcons name="stethoscope" size={22} color="#fff" />
                </LinearGradient>
              </View>

              <View style={styles.headerTextCol}>
                <Text style={styles.title}>Detalhes da consulta</Text>
                <Text style={styles.subtitle}>Protocolo {appointment.protocol}</Text>
              </View>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <LinearGradient
              colors={['rgba(16, 185, 129, 0.18)', 'rgba(16, 185, 129, 0.06)', 'rgba(14, 14, 20, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <View style={styles.summaryTop}>
                <Text style={styles.specialty}>{appointment.specialtyName}</Text>
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

              <Text style={styles.ubtName}>{appointment.selectedUbtName}</Text>
              <Text style={styles.ubtAddress}>{appointment.selectedUbtAddress}</Text>

              <View style={styles.datetimeRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.primaryLight} />
                <Text style={styles.datetime}>
                  {isCompleted ? 'Realizada em ' : ''}
                  {formatScheduleDayLabel(date)} às{' '}
                  <Text style={styles.datetimeStrong}>{appointment.selectedTime}</Text>
                </Text>
              </View>

              {isCompleted ? (
                <View style={styles.datetimeRow}>
                  <Ionicons name="time-outline" size={16} color={colors.primaryLight} />
                  <Text style={styles.datetime}>
                    Duração da consulta:{' '}
                    <Text style={styles.datetimeStrong}>{durationLabel}</Text>
                  </Text>
                </View>
              ) : null}

              {doctor ? (
                <View style={styles.doctorRow}>
                  <Image source={{ uri: doctor.avatarUrl }} style={styles.avatar} />
                  <View style={styles.doctorTextCol}>
                    <Text style={styles.doctorName}>{doctor.name}</Text>
                    <Text style={styles.doctorMeta}>{doctor.crm}</Text>
                  </View>
                </View>
              ) : null}
            </LinearGradient>

            {isUpcoming ? (
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>Orientações</Text>
                <Text style={styles.tipsItem}>• Chegue com 15 minutos de antecedência</Text>
                <Text style={styles.tipsItem}>• Leve documento com foto e cartão do SUS</Text>
                <Text style={styles.tipsItem}>• Em caso de atraso, avise a recepção da unidade</Text>
              </View>
            ) : null}

            {isUpcoming ? (
              <View style={styles.actionsGrid}>
                <AppointmentQuickAction
                  label="Calendário"
                  icon="calendar-plus"
                  palette={ACTION_ICON_PALETTES.schedule}
                  onPress={onCalendarPress}
                />
                <AppointmentQuickAction
                  label="Como chegar"
                  icon="map-marker-radius"
                  palette={ACTION_ICON_PALETTES.nearbyUnits}
                  onPress={onDirectionsPress}
                />
                <AppointmentQuickAction
                  label="Reagendar"
                  icon="calendar-refresh"
                  palette={ACTION_ICON_PALETTES.myAppointments}
                  onPress={onReschedulePress}
                />
                <AppointmentQuickAction
                  label="Cancelar"
                  icon="calendar-remove"
                  palette={{
                    iconGradient: ['#fca5a5', '#ef4444', '#dc2626'],
                    shadowColor: 'rgba(239, 68, 68, 0.4)',
                  }}
                  onPress={onCancelPress}
                />
              </View>
            ) : isCompleted ? (
              <View style={styles.actionsGrid}>
                <AppointmentQuickAction
                  label="Agendar retorno"
                  icon="calendar-clock"
                  palette={ACTION_ICON_PALETTES.schedule}
                  onPress={onReschedulePress}
                />
                <AppointmentQuickAction
                  label="Pós-consulta"
                  icon="clipboard-pulse-outline"
                  palette={ACTION_ICON_PALETTES.postConsultation}
                  onPress={onPostConsultationPress}
                />
                <AppointmentQuickAction
                  label="Receitas e +"
                  icon="pill"
                  palette={ACTION_ICON_PALETTES.prescriptions}
                  onPress={onPrescriptionsPress}
                />
              </View>
            ) : null}

            {appointment.cancelReason ? (
              <View style={styles.cancelReasonCard}>
                <Text style={styles.cancelReasonTitle}>Motivo do cancelamento</Text>
                <Text style={styles.cancelReasonText}>{appointment.cancelReason}</Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#121218',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrap: {
    shadowColor: ACTION_ICON_PALETTES.myAppointments.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  specialty: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  ubtName: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  ubtAddress: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  datetimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  datetime: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  datetimeStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  doctorTextCol: {
    flex: 1,
    gap: 2,
  },
  doctorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  doctorMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
  tipsCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tipsTitle: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  tipsItem: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  cancelReasonCard: {
    borderRadius: 14,
    padding: 14,
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
  },
  cancelReasonTitle: {
    color: '#fca5a5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cancelReasonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
})
