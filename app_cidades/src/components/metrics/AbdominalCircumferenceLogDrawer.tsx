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
import { ProfileSnapshot } from '../../types/metrics'
import { getAbdominalCircumferenceZoneCopy } from '../../utils/abdominalCircumference'
import { playSuccessSound } from '../../utils/appSounds'
import { PrimaryButton } from '../PrimaryButton'
import { FullBodyFigure } from './FullBodyFigure'
import { MetricLogSuccessContent } from './MetricLogSuccessContent'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'

const SUCCESS_DISMISS_MS = 2600
const SHEET_OFFSET = 460
const STEP_CM = 1
const MIN_CM = 50
const MAX_CM = 150
const DEFAULT_CM = 88
const KEYBOARD_EXTRA_PADDING = 20

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
  gradient: readonly [string, string, string]
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
      color: '#b91c1c',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(220, 38, 38, 0.4)',
      gradient: ['#fee2e2', '#fca5a5', '#f87171'],
    }
  }

  if (copy.label === 'Acima do ideal') {
    return {
      ...copy,
      color: '#92400e',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(217, 119, 6, 0.4)',
      gradient: ['#fffbeb', '#fde68a', '#fbbf24'],
    }
  }

  return {
    ...copy,
    color: '#047857',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(5, 150, 105, 0.35)',
    gradient: ['#ecfdf5', '#6ee7b7', '#34d399'],
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
  const [showSuccess, setShowSuccess] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRegistrationRef = useRef<AbdominalCircumferenceReading | null>(null)

  const zone = getCircumferenceZone(valueCm, profile.gender)

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
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
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

  function clearSuccessTimer() {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current)
      successTimerRef.current = null
    }
  }

  function handleDismiss() {
    if (!visible) return
    Keyboard.dismiss()
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

  function adjustValue(delta: number) {
    Keyboard.dismiss()
    const next = clampCm(valueCm + delta)
    if (next === valueCm) return

    setValueCm(next)
    setInputDraft(String(next))
    void Haptics.selectionAsync()
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

  const keyboardLift =
    keyboardInset > 0
      ? Math.max(0, keyboardInset - Math.max(insets.bottom, 0) + KEYBOARD_EXTRA_PADDING)
      : 0

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
              colors={[colors.backgroundElevated, '#f0f0f2']}
              pointerEvents="none"
              style={StyleSheet.absoluteFillObject}
            />
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={28}
                tint="light"
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
                title="Circunferência registrada!"
                message={`${valueCm} cm adicionados ao seu histórico.`}
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

                <LinearGradient
                  colors={[...zone.gradient]}
                  start={{ x: 0.12, y: 0 }}
                  end={{ x: 0.88, y: 1 }}
                  style={[styles.zonePill, { borderColor: zone.border }]}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.7 }}
                    style={styles.zonePillGloss}
                    pointerEvents="none"
                  />
                  <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
                  <Text style={styles.zoneHint}>{zone.hint}</Text>
                </LinearGradient>

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

                <View
                  style={[
                    styles.stepperSection,
                    keyboardInset > 0 && styles.stepperSectionDimmed,
                  ]}
                  pointerEvents={keyboardInset > 0 ? 'none' : 'auto'}
                >
                  <Text style={styles.stepperHint}>Ou ajuste com os botões</Text>

                  <View style={styles.stepperRow}>
                    <Pressable
                      onPress={() => adjustValue(-STEP_CM)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed && styles.stepperButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Diminuir medida"
                    >
                      <Ionicons name="remove" size={22} color={colors.text} />
                    </Pressable>

                    <View style={styles.tapeVisual} pointerEvents="none">
                      <FullBodyFigure size={72} color="rgba(0, 0, 0, 0.16)" />
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

                    <Pressable
                      onPress={() => adjustValue(STEP_CM)}
                      style={({ pressed }) => [
                        styles.stepperButton,
                        pressed && styles.stepperButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Aumentar medida"
                    >
                      <Ionicons name="add" size={22} color={colors.text} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    paddingTop: 0,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    maxHeight: '92%',
  },
  scrollContent: {
    flexGrow: 1,
    gap: 12,
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
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    marginTop: 10,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 4,
  },
  headerRowCompact: {
    marginBottom: 0,
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
    backgroundColor: colors.surface,
  },
  closeButtonPressed: {
    opacity: 0.8,
  },
  zonePill: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  zonePillGloss: {
    ...StyleSheet.absoluteFillObject,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    width: '100%',
  },
  zoneHint: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    width: '100%',
  },
  inputCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 12,
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  input: {
    width: '100%',
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingVertical: 8,
    paddingHorizontal: 28,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  inputSuffix: {
    position: 'absolute',
    right: 12,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  stepperSection: {
    gap: 8,
    alignItems: 'center',
  },
  stepperSectionDimmed: {
    opacity: 0.28,
  },
  stepperHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  stepperButtonPressed: {
    opacity: 0.8,
  },
  tapeVisual: {
    width: 108,
    height: 168,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
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
})
