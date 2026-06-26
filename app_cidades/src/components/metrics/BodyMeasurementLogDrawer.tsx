import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native'
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
const KEYBOARD_EXTRA_PADDING = 20
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
  const [showSuccess, setShowSuccess] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingValueRef = useRef<number | null>(null)

  useEffect(() => {
    if (!visible) {
      setKeyboardInset(0)
      return
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    function handleKeyboardShow(event: KeyboardEvent) {
      setKeyboardInset(event.endCoordinates.height)
    }

    function handleKeyboardHide() {
      setKeyboardInset(0)
    }

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow)
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide)

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [visible])

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
    Keyboard.dismiss()

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

  function adjustValue(delta: number) {
    if (!config) return

    Keyboard.dismiss()
    const next = clampValue(value + delta, config.min, config.max, config.step)
    if (next === value) return

    setValue(next)
    setInputDraft(next.toString().replace('.', ','))
    void Haptics.selectionAsync()
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
  const keyboardLift =
    keyboardInset > 0
      ? Math.max(0, keyboardInset - Math.max(insets.bottom, 0) + KEYBOARD_EXTRA_PADDING)
      : 0

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
          enabled={Platform.OS === 'ios'}
        >
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: getModalFooterPadding(insets.bottom, 8),
                transform: [
                  { translateY: sheetTranslateY },
                  { translateY: -keyboardLift },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
              pointerEvents="none"
              style={StyleSheet.absoluteFillObject}
            />
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={28}
                tint="dark"
                pointerEvents="none"
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}

            {!showSuccess ? (
              <LinearGradient
                colors={[...ACCENT_GRADIENT]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                pointerEvents="none"
                style={styles.topAccent}
              />
            ) : null}

            {showSuccess ? (
              <MetricLogSuccessContent
                title="Medida registrada!"
                message={`${formatBodyMeasurementValue(measurementId, value)} adicionados ao seu histórico.`}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                contentContainerStyle={[
                  styles.scrollContent,
                  keyboardInset > 0 && { paddingBottom: KEYBOARD_EXTRA_PADDING },
                ]}
                bounces={keyboardInset === 0}
              >
                <View style={styles.handle} />

                <View style={[styles.headerRow, keyboardInset > 0 && styles.headerRowCompact]}>
                  <View style={styles.iconOrb}>
                    <MaterialCommunityIcons
                      name={config.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.headerTextCol}>
                    <Text style={styles.title}>{config.label}</Text>
                    <Text style={styles.subtitle}>Digite para ajustar</Text>
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

                <View style={styles.valueCard}>
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

                  <View
                    style={[
                      styles.stepperRow,
                      keyboardInset > 0 && styles.stepperRowDimmed,
                    ]}
                    pointerEvents={keyboardInset > 0 ? 'none' : 'auto'}
                  >
                    <Pressable
                      onPress={() => adjustValue(-config.step)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed && styles.stepperButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Diminuir valor"
                    >
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </Pressable>

                    <Text style={styles.stepperValue}>
                      {formatBodyMeasurementValue(measurementId, value)}
                    </Text>

                    <Pressable
                      onPress={() => adjustValue(config.step)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed && styles.stepperButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Aumentar valor"
                    >
                      <Ionicons name="add" size={20} color={colors.text} />
                    </Pressable>
                  </View>
                </View>

                <PrimaryButton label="Registrar medida" onPress={handleRegister} />
              </ScrollView>
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '92%',
  },
  scrollContent: {
    flexGrow: 1,
    gap: 18,
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
  headerRowCompact: {
    marginBottom: -4,
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
  valueCard: {
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 16,
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
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  stepperRowDimmed: {
    opacity: 0.28,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stepperButtonPressed: {
    opacity: 0.8,
  },
  stepperValue: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    minWidth: 72,
    textAlign: 'center',
  },
})
