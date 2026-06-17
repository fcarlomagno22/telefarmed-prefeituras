import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { ProfileSnapshot } from '../../types/metrics'
import { getAbdominalCircumferenceZoneCopy } from '../../utils/abdominalCircumference'
import { playSuccessSound } from '../../utils/appSounds'
import { PrimaryButton } from '../PrimaryButton'
import { FullBodyFigure } from './FullBodyFigure'
import { MetricLogSuccessContent } from './MetricLogSuccessContent'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const SUCCESS_DISMISS_MS = 2600
const SHEET_OFFSET = 460
const STEP_CM = 1
const MIN_CM = 50
const MAX_CM = 150
const DEFAULT_CM = 88
const DRAG_THRESHOLD_PX = 12

const ACCENT_GRADIENT = ['#fdba74', '#f97316', '#c2410c'] as const

export type AbdominalCircumferenceReading = {
  valueCm: number
}

type ZoneStyle = {
  label: string
  hint: string
  color: string
  bg: string
  border: string
}

function clampCm(value: number) {
  const stepped = Math.round(value / STEP_CM) * STEP_CM
  return Math.min(MAX_CM, Math.max(MIN_CM, stepped))
}

function getTapeValueFontSize(valueCm: number) {
  const digits = String(Math.round(valueCm)).length
  if (digits >= 3) return 24
  if (digits === 2) return 30
  return 34
}

function getCircumferenceZone(valueCm: number, gender: string): ZoneStyle {
  const copy = getAbdominalCircumferenceZoneCopy(valueCm, gender)

  if (copy.label === 'Risco elevado') {
    return {
      ...copy,
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (copy.label === 'Acima do ideal') {
    return {
      ...copy,
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(251, 191, 36, 0.35)',
    }
  }

  return {
    ...copy,
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
  }
}

type AbdominalCircumferenceLogDrawerProps = {
  visible: boolean
  profile: ProfileSnapshot
  initialValueCm?: number
  onClose: () => void
  onRegister: (reading: AbdominalCircumferenceReading) => void
}

export function AbdominalCircumferenceLogDrawer({
  visible,
  profile,
  initialValueCm = DEFAULT_CM,
  onClose,
  onRegister,
}: AbdominalCircumferenceLogDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [valueCm, setValueCm] = useState(initialValueCm)
  const [inputDraft, setInputDraft] = useState(String(initialValueCm))
  const [gesturesReady, setGesturesReady] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRegistrationRef = useRef<AbdominalCircumferenceReading | null>(null)

  const valueRef = useRef(valueCm)
  const dragStartValue = useRef(initialValueCm)
  const appliedStepsRef = useRef(0)
  const gesturesReadyRef = useRef(false)

  valueRef.current = valueCm
  gesturesReadyRef.current = gesturesReady

  const zone = getCircumferenceZone(valueCm, profile.gender)

  useEffect(() => {
    if (visible) {
      const startValue = clampCm(initialValueCm)
      setShowSuccess(false)
      pendingRegistrationRef.current = null
      setValueCm(startValue)
      setInputDraft(String(startValue))
      setIsMounted(true)
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()

      setGesturesReady(false)
      const timer = setTimeout(() => setGesturesReady(true), 350)
      return () => clearTimeout(timer)
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible, initialValueCm])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const rulerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gesturesReadyRef.current,
      onMoveShouldSetPanResponder: () => gesturesReadyRef.current,
      onPanResponderGrant: () => {
        Keyboard.dismiss()
        dragStartValue.current = valueRef.current
        appliedStepsRef.current = 0
      },
      onPanResponderMove: (_, gesture) => {
        const steps = Math.trunc(-gesture.dy / DRAG_THRESHOLD_PX)
        if (steps === appliedStepsRef.current) return

        appliedStepsRef.current = steps
        const next = clampCm(dragStartValue.current + steps * STEP_CM)
        if (next === valueRef.current) return

        setValueCm(next)
        setInputDraft(String(next))
        void Haptics.selectionAsync()
      },
      onPanResponderRelease: () => {
        appliedStepsRef.current = 0
      },
      onPanResponderTerminate: () => {
        appliedStepsRef.current = 0
      },
    }),
  ).current

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function clearSuccessTimer() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  function handleDismiss() {
    if (!visible) return
    clearSuccessTimer()
    const pending = pendingRegistrationRef.current
    pendingRegistrationRef.current = null
    closeSheet(() => {
      if (pending) onRegister(pending)
      onClose()
    })
  }

  function handleInputChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    setInputDraft(digits)

    if (!digits) return

    const parsed = Number(digits)
    if (Number.isFinite(parsed)) {
      setValueCm(clampCm(parsed))
    }
  }

  function handleInputBlur() {
    setInputDraft(String(valueCm))
  }

  function handleRegister() {
    if (showSuccess) return
    Keyboard.dismiss()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    void playSuccessSound()
    setShowSuccess(true)
    pendingRegistrationRef.current = { valueCm }

    clearSuccessTimer()
    successTimerRef.current = setTimeout(() => {
      handleDismiss()
    }, SUCCESS_DISMISS_MS)
  }

  if (!isMounted) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={showSuccess ? undefined : handleDismiss}
            disabled={showSuccess}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: getModalFooterPadding(insets.bottom, 8),
                transform: [{ translateY: sheetTranslateY }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
              style={StyleSheet.absoluteFillObject}
            />
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}

            {!showSuccess ? (
              <LinearGradient
                colors={[...ACCENT_GRADIENT]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.topAccent}
              />
            ) : null}

            {showSuccess ? (
              <MetricLogSuccessContent
                title="Circunferência registrada!"
                message={`${valueCm} cm adicionados ao seu histórico.`}
              />
            ) : (
              <>
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                  <LinearGradient
                    colors={[...ACCENT_GRADIENT]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.fieldIconOrb}
                  >
                    <MaterialCommunityIcons name="tape-measure" size={22} color="#fff" />
                  </LinearGradient>

                  <View style={styles.headerTextCol}>
                    <Text style={styles.headerTitle}>Circunf. abdominal</Text>
                    <Text style={styles.subtitle}>Registre a medida da cintura</Text>
                  </View>

                  <Pressable
                    onPress={handleDismiss}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar registro de circunferência"
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.contentRow}>
                  <View style={styles.rulerColumn}>
                    <Text style={styles.rulerHint}>Arraste para ajustar</Text>

                    <View style={styles.rulerStage}>
                      <View style={styles.visualTouchArea} {...rulerPanResponder.panHandlers}>
                        <View style={styles.tapeVisual}>
                          <FullBodyFigure size={72} />
                          <Text
                            style={[
                              styles.tapeValue,
                              { fontSize: getTapeValueFontSize(valueCm) },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.72}
                          >
                            {valueCm}
                          </Text>
                          <Text style={styles.tapeUnit}>cm</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.valueColumn}>
                    <View style={[styles.zonePill, { backgroundColor: zone.bg, borderColor: zone.border }]}>
                      <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
                      <Text style={styles.zoneHint}>{zone.hint}</Text>
                    </View>

                    <View style={styles.inputCard}>
                      <Text style={styles.inputLabel}>Ou digite</Text>
                      <View style={styles.inputWrap}>
                        <TextInput
                          value={inputDraft}
                          onChangeText={handleInputChange}
                          onBlur={handleInputBlur}
                          placeholder="Ex: 88"
                          placeholderTextColor={colors.textSubtle}
                          keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
                          style={styles.input}
                          selectionColor={colors.primary}
                          maxLength={3}
                        />
                        <Text style={styles.inputSuffix}>cm</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <PrimaryButton label="Registrar medida" onPress={handleRegister} />
              </>
            )}
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  fieldIconOrb: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 2,
  },
  headerTextCol: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
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
    opacity: 0.8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
    minHeight: 204,
  },
  rulerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rulerHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  rulerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 176,
  },
  visualTouchArea: {
    width: 108,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapeVisual: {
    width: 108,
    height: 168,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  tapeValue: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tapeUnit: {
    color: '#fb923c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: -2,
  },
  valueColumn: {
    flex: 1,
    gap: 10,
    justifyContent: 'center',
  },
  zonePill: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  zoneHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  inputCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingVertical: 8,
  },
  inputSuffix: {
    color: '#fb923c',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
})
