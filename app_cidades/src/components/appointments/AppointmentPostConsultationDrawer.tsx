import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type {
  AppointmentPosConsultaCheckinItem,
  AppointmentPosConsultaPlan,
} from '../../types/appointmentPostConsultation'
import { StoredAppointment } from '../../types/myAppointments'
import {
  fetchAppointmentPostConsultationPlan,
  getPlanStatusLabel,
} from '../../utils/appointmentPostConsultation'
import { getAppointmentDateTime } from '../../utils/myAppointments'
import { formatScheduleDayLabel } from '../../utils/scheduleDate'
import { PosConsultaTimeline } from '../postConsultation/PosConsultaTimeline'

const SHEET_OFFSET = 680

type AppointmentPostConsultationDrawerProps = {
  visible: boolean
  appointment: StoredAppointment | null
  patientCpf?: string
  patientName?: string
  onClose: () => void
  onRespondCheckin: (
    checkin: AppointmentPosConsultaCheckinItem,
    plan: AppointmentPosConsultaPlan,
  ) => void
  refreshKey?: number
}

export function AppointmentPostConsultationDrawer({
  visible,
  appointment,
  patientCpf,
  patientName = 'Paciente',
  onClose,
  onRespondCheckin,
  refreshKey = 0,
}: AppointmentPostConsultationDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [plan, setPlan] = useState<AppointmentPosConsultaPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const palette = ACTION_ICON_PALETTES.postConsultation

  const loadPlan = useCallback(async () => {
    if (!appointment || !patientCpf) return

    setIsLoading(true)
    try {
      const data = await fetchAppointmentPostConsultationPlan(
        appointment,
        patientCpf,
        patientName,
      )
      setPlan(data)
    } finally {
      setIsLoading(false)
    }
  }, [appointment, patientCpf, patientName])

  useEffect(() => {
    if (visible && appointment) {
      setIsMounted(true)
      void loadPlan()
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
      if (finished) {
        setIsMounted(false)
        setPlan(null)
      }
    })
  }, [appointment, backdropOpacity, isMounted, loadPlan, sheetTranslateY, visible])

  useEffect(() => {
    if (visible && appointment && refreshKey > 0) {
      void loadPlan()
    }
  }, [appointment, loadPlan, refreshKey, visible])

  if (!isMounted || !appointment) return null

  const appointmentDate = getAppointmentDateTime(appointment)
  const progressRatio =
    plan && plan.totalCheckins > 0 ? plan.respondedCount / plan.totalCheckins : 0

  function handleCheckinPress(checkin: AppointmentPosConsultaCheckinItem) {
    if (!plan) return

    if (checkin.status === 'respondido' || checkin.id === plan.availableCheckinId) {
      const isAvailable = checkin.id === plan.availableCheckinId
      void Haptics.impactAsync(
        isAvailable
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      )
      onRespondCheckin(checkin, plan)
    }
  }

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
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
          <LinearGradient
            colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={[...palette.iconGradient]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.topAccent}
          />

          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <LinearGradient
              colors={[...palette.iconGradient]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.headerIcon}
            >
              <MaterialCommunityIcons name="clipboard-pulse-outline" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Pós-consulta</Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                {formatScheduleDayLabel(appointmentDate)} · {appointment.selectedDoctorName}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.summaryLine}>
            <View style={styles.summaryDivider} />
            <Text style={styles.summaryText} numberOfLines={1}>
              {appointment.specialtyName} · Protocolo {appointment.protocol}
            </Text>
            <View style={styles.summaryDivider} />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {isLoading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color="#7dd3fc" />
                <Text style={styles.loadingText}>Carregando acompanhamento…</Text>
              </View>
            ) : plan?.status === 'indisponivel' ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="clipboard-off-outline"
                  size={28}
                  color={colors.textSubtle}
                />
                <Text style={styles.emptyTitle}>Sem acompanhamento</Text>
                <Text style={styles.emptyText}>
                  Esta consulta não possui plano de pós-consulta registrado.
                </Text>
              </View>
            ) : plan ? (
              <>
                <View style={styles.statusBlock}>
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>{getPlanStatusLabel(plan.status)}</Text>
                    <Text style={styles.statusCount}>
                      {plan.respondedCount}/{plan.totalCheckins}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.max(4, progressRatio * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.statusMeta}>
                    Dia {plan.planDayNumber} de {plan.planTotalDays}
                    {plan.nextCheckinLabel && !plan.availableCheckinId
                      ? ` · próximo em ${plan.nextCheckinLabel}`
                      : ''}
                  </Text>
                </View>

                <PosConsultaTimeline
                  checkins={plan.checkins}
                  availableCheckinId={plan.availableCheckinId}
                  onCheckinPress={handleCheckinPress}
                />

                <Text style={styles.footerNote}>
                  Durante {POS_CONSULTA_PLAN_TOTAL_DAYS} dias após a consulta, a equipe acompanha sua
                  evolução com check-ins rápidos. Suas respostas ajudam a identificar se está
                  melhorando ou se precisa de atenção.
                </Text>
              </>
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>
    </AppModal>
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
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 12,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 2,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(14, 165, 233, 0.45)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  summaryLine: {
    gap: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  summaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 8,
    gap: 12,
  },
  loadingState: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  statusBlock: {
    gap: 6,
    paddingBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusCount: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  statusMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  progressTrack: {
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0ea5e9',
  },
  footerNote: {
    color: colors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
})
