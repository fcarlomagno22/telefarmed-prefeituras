import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { StoredAppointment } from '../../types/myAppointments'
import { PrimaryButton } from '../PrimaryButton'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'

const SHEET_OFFSET = 360

type AppointmentCancelDrawerProps = {
  visible: boolean
  appointment: StoredAppointment | null
  loading?: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function AppointmentCancelDrawer({
  visible,
  appointment,
  loading = false,
  onClose,
  onConfirm,
}: AppointmentCancelDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [reason, setReason] = useState('')
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible && appointment) {
      setReason('')
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

  return (
    <AppModal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView behavior={keyboardAvoidingBehavior} style={styles.keyboardWrap}>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: getModalFooterPadding(insets.bottom),
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.handle} />

              <View style={styles.iconWrap}>
                <LinearGradient
                  colors={['#fca5a5', '#ef4444', '#dc2626']}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={styles.icon}
                >
                  <Ionicons name="calendar-clear-outline" size={24} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={styles.title}>Cancelar consulta?</Text>
              <Text style={styles.message}>
                Você está cancelando a consulta de{' '}
                <Text style={styles.messageStrong}>{appointment.specialtyName}</Text> em{' '}
                {appointment.selectedDate.split('-').reverse().join('/')} às {appointment.selectedTime}.
              </Text>

              <Text style={styles.inputLabel}>Motivo (opcional)</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Ex: conflito de horário"
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                multiline
                maxLength={120}
              />
            </ScrollView>

            <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={loading}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>Manter consulta</Text>
            </Pressable>

            <PrimaryButton
              label={loading ? 'Cancelando…' : 'Confirmar cancelamento'}
              onPress={() => onConfirm(reason)}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
            />
          </View>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#121218',
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 16,
    gap: 10,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
  },
  iconWrap: {
    alignSelf: 'center',
    marginTop: 4,
    shadowColor: 'rgba(239, 68, 68, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  messageStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    minHeight: 72,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.86,
  },
})
