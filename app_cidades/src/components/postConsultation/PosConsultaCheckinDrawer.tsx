import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { AppointmentPosConsultaCheckinItem, AppointmentPosConsultaPlan } from '../../types/appointmentPostConsultation'
import { StoredAppointment } from '../../types/myAppointments'
import {
  buildPosConsultaCheckinContext,
  submitAppointmentPostConsultationCheckin,
} from '../../utils/appointmentPostConsultation'
import { PosConsultaCheckinAlreadyAnswered } from '../postConsultation/PosConsultaCheckinAlreadyAnswered'
import { PosConsultaCheckinWizard } from '../postConsultation/PosConsultaCheckinWizard'

const SHEET_OFFSET = 720

type PosConsultaCheckinDrawerProps = {
  visible: boolean
  appointment: StoredAppointment | null
  plan: AppointmentPosConsultaPlan | null
  checkin: AppointmentPosConsultaCheckinItem | null
  patientCpf?: string
  onClose: () => void
  onSubmitted: () => void
}

export function PosConsultaCheckinDrawer({
  visible,
  appointment,
  plan,
  checkin,
  patientCpf,
  onClose,
  onSubmitted,
}: PosConsultaCheckinDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [wizardStep, setWizardStep] = useState<
    'sintomas' | 'medicacao' | 'medicoes' | 'alertas' | 'success'
  >('sintomas')
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const palette = ACTION_ICON_PALETTES.postConsultation

  const context = useMemo(() => {
    if (!plan || !checkin) return null
    return buildPosConsultaCheckinContext(plan, checkin)
  }, [plan, checkin])

  const mode =
    checkin?.status === 'respondido'
      ? 'view'
      : checkin?.status === 'expirado'
        ? 'expired'
        : checkin?.status === 'pendente'
          ? 'respond'
          : 'unavailable'

  useEffect(() => {
    if (visible && appointment && checkin && plan) {
      setIsMounted(true)
      setSubmitError(null)
      setWizardStep('sintomas')
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
        setSubmitError(null)
      }
    })
  }, [appointment, backdropOpacity, checkin, isMounted, plan, sheetTranslateY, visible])

  if (!isMounted || !appointment || !checkin || !plan || !context) return null

  const isSuccessStep = mode === 'respond' && wizardStep === 'success'

  async function handleSubmit(respostas: Parameters<typeof submitAppointmentPostConsultationCheckin>[3]) {
    if (!patientCpf) {
      throw new Error('Sessão inválida. Faça login novamente.')
    }

    setSubmitError(null)

    try {
      const result = await submitAppointmentPostConsultationCheckin(
        appointment!,
        patientCpf,
        checkin!,
        respostas,
      )
      onSubmitted()
      return result.nextCheckinLabel
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível enviar suas respostas.'
      setSubmitError(message)
      throw error
    }
  }

  function handleSuccessClose() {
    onSubmitted()
    onClose()
  }

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
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
              <Text style={styles.title}>
                {isSuccessStep
                  ? 'Resposta registrada'
                  : `Check-in ${checkin.checkinNumber} de ${plan.totalCheckins}`}
              </Text>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                isSuccessStep && styles.scrollContentSuccess,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              scrollEnabled={!isSuccessStep}
              removeClippedSubviews={!isSuccessStep}
            >
              {mode === 'respond' ? (
                <PosConsultaCheckinWizard
                  context={context}
                  submitError={submitError}
                  onSubmit={handleSubmit}
                  onSuccessClose={handleSuccessClose}
                  onStepChange={setWizardStep}
                />
              ) : null}

              {mode === 'view' ? <PosConsultaCheckinAlreadyAnswered context={context} /> : null}

              {mode === 'expired' ? (
                <View style={styles.messageBlock}>
                  <Text style={styles.messageTitle}>Check-in expirado</Text>
                  <Text style={styles.messageText}>
                    O prazo para responder este check-in encerrou. Aguarde o próximo contato da
                    equipe ou verifique seu e-mail.
                  </Text>
                </View>
              ) : null}

              {mode === 'unavailable' ? (
                <View style={styles.messageBlock}>
                  <Text style={styles.messageTitle}>Ainda não disponível</Text>
                  <Text style={styles.messageText}>
                    {checkin.scheduledDateLabel
                      ? `Este check-in estará disponível em ${checkin.scheduledDateLabel}.`
                      : 'Este check-in ainda não está disponível para resposta.'}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    paddingHorizontal: 16,
    gap: 10,
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
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 2,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
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
  scroll: {
    flexGrow: 0,
    overflow: 'visible',
  },
  scrollContent: {
    paddingBottom: 8,
    paddingTop: 4,
  },
  scrollContentSuccess: {
    flexGrow: 0,
    paddingTop: 6,
    paddingBottom: 4,
    overflow: 'visible',
  },
  messageBlock: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  messageTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  messageText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
})
