import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../theme/colors'
import { BodyMeasurementId } from '../../types/bodyMeasurements'
import { playSuccessSound } from '../../utils/appSounds'
import {
  formatBodyMeasurementValue,
  getBodyMeasurementConfig,
} from '../../utils/bodyMeasurements'
import { PrimaryButton } from '../PrimaryButton'
import { MetricLogSuccessContent } from './MetricLogSuccessContent'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'

const SUCCESS_DISMISS_MS = 2600
const SHEET_OFFSET = 440
const DRAG_THRESHOLD_PX = 12
const ACCENT_GRADIENT = ['#f0abfc', '#d946ef', '#a21caf'] as const

type BodyMeasurementLogDrawerProps = {
  visible: boolean
  measurementId: BodyMeasurementId | null
  initialValue: number
  onClose: () => void
  onRegister: (measurementId: BodyMeasurementId, value: number) => void
}

function clampValue(value: number, min: number, max: number, step: number) {
  const stepped = Math.round(value / step) * step
  const clamped = Math.min(max, Math.max(min, stepped))
  return Number(clamped.toFixed(step < 1 ? 1 : 0))
}

export function BodyMeasurementLogDrawer({
  visible,
  measurementId,
  initialValue,
  onClose,
  onRegister,
}: BodyMeasurementLogDrawerProps) {
  const insets = useSafeAreaInsets()
  const config = measurementId ? getBodyMeasurementConfig(measurementId) : null

  const [isMounted, setIsMounted] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [inputDraft, setInputDraft] = useState(String(initialValue))
  const [gesturesReady, setGesturesReady] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingValueRef = useRef<number | null>(null)

  const valueRef = useRef(value)
  const dragStartValue = useRef(initialValue)
  const appliedStepsRef = useRef(0)
  const gesturesReadyRef = useRef(false)

  valueRef.current = value
  gesturesReadyRef.current = gesturesReady

  useEffect(() => {
    if (!visible || !config) return

    const startValue = clampValue(initialValue, config.min, config.max, config.step)
    setShowSuccess(false)
    pendingValueRef.current = null
    setValue(startValue)
    setInputDraft(startValue.toString().replace('.', ','))
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
  }, [visible, initialValue, measurementId, config])

  useEffect(() => {
    if (visible || !isMounted) return
    closeSheet(onClose)
  }, [visible])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current)
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
        if (!config) return
        const steps = Math.trunc(-gesture.dy / DRAG_THRESHOLD_PX)
        if (steps === appliedStepsRef.current) return

        appliedStepsRef.current = steps
        const next = clampValue(
          dragStartValue.current + steps * config.step,
          config.min,
          config.max,
          config.step,
        )
        if (next === valueRef.current) return

        setValue(next)
        setInputDraft(next.toString().replace('.', ','))
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

  function handleDismiss() {
    if (!visible || !measurementId) return

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }

    const pending = pendingValueRef.current
    pendingValueRef.current = null
    closeSheet(() => {
      if (pending !== null) onRegister(measurementId, pending)
      onClose()
    })
  }

  function handleInputChange(raw: string) {
    if (!config) return

    const normalized = raw.replace(',', '.')
    setInputDraft(raw)

    if (!normalized) return

    const parsed = Number(normalized)
    if (Number.isFinite(parsed)) {
      setValue(clampValue(parsed, config.min, config.max, config.step))
    }
  }

  function handleInputBlur() {
    setInputDraft(value.toString().replace('.', ','))
  }

  function handleRegister() {
    if (!measurementId || !config || showSuccess) return

    Keyboard.dismiss()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    void playSuccessSound()
    setShowSuccess(true)
    pendingValueRef.current = value

    successTimerRef.current = setTimeout(() => {
      handleDismiss()
    }, SUCCESS_DISMISS_MS)
  }

  if (!isMounted || !config || !measurementId) return null

  const unitLabel = config.unit || 'índice'

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
          behavior={keyboardAvoidingBehavior}
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
                title="Medida registrada!"
                message={`${formatBodyMeasurementValue(measurementId, value)} adicionados ao seu histórico.`}
              />
            ) : (
              <>
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                  <View style={styles.iconOrb}>
                    <MaterialCommunityIcons
                      name={config.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.headerTextCol}>
                    <Text style={styles.title}>{config.label}</Text>
                    <Text style={styles.subtitle}>Arraste ou digite para ajustar</Text>
                  </View>
                  <Pressable
                    onPress={handleDismiss}
                    hitSlop={10}
                    style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar"
                  >
                    <Ionicons name="close" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.rulerCard} {...rulerPanResponder.panHandlers}>
                  <Text style={styles.rulerHint}>Deslize para cima ou para baixo</Text>
                  <View style={styles.valueRow}>
                    <TextInput
                      value={inputDraft}
                      onChangeText={handleInputChange}
                      onBlur={handleInputBlur}
                      keyboardType="decimal-pad"
                      style={styles.valueInput}
                      selectionColor={ACCENT_GRADIENT[1]}
                    />
                    <Text style={styles.valueUnit}>{unitLabel}</Text>
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
    paddingTop: 10,
    gap: 18,
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
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconOrb: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217, 70, 239, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(240, 171, 252, 0.35)',
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
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
  rulerCard: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 10,
  },
  rulerHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  valueInput: {
    minWidth: 88,
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 0,
  },
  valueUnit: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
    paddingBottom: 8,
  },
})
