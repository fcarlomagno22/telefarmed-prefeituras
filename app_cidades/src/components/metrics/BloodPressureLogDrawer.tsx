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
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import LottieView from 'lottie-react-native'
import bloodPressureAnimation from '../../../assets/bloodpressure.json'
import { colors } from '../../theme/colors'
import { playSuccessSound } from '../../utils/appSounds'
import { PrimaryButton } from '../PrimaryButton'
import { AppModal } from '../AppModal'
import { MetricLogSuccessContent } from './MetricLogSuccessContent'

const SUCCESS_DISMISS_MS = 2600
const SHEET_OFFSET = 510

const STEP = 2
const DRAG_THRESHOLD_PX = 10
const RULER_SEGMENTS = 12

const MIN_SYSTOLIC = 80
const MAX_SYSTOLIC = 200
const DEFAULT_SYSTOLIC = 120

const MIN_DIASTOLIC = 40
const MAX_DIASTOLIC = 130
const DEFAULT_DIASTOLIC = 80

const LOTTIE_WIDTH = 132
const LOTTIE_HEIGHT = 158
const VISUAL_HEIGHT = LOTTIE_HEIGHT + 36
const CONTENT_MIN_HEIGHT = VISUAL_HEIGHT + 32

const BP_GRADIENT = ['#fbbf24', '#f59e0b', '#d97706'] as const

export type BloodPressureReading = {
  systolic: number
  diastolic: number
}

type AdjustTarget = 'systolic' | 'diastolic'

type ZoneStyle = {
  label: string
  color: string
  bg: string
  border: string
}

function clampSystolic(value: number) {
  const stepped = Math.round(value / STEP) * STEP
  return Math.min(MAX_SYSTOLIC, Math.max(MIN_SYSTOLIC, stepped))
}

function clampDiastolic(value: number) {
  const stepped = Math.round(value / STEP) * STEP
  return Math.min(MAX_DIASTOLIC, Math.max(MIN_DIASTOLIC, stepped))
}

function clampInput(value: number, min: number, max: number) {
  const stepped = Math.round(value / STEP) * STEP
  return Math.min(max, Math.max(min, stepped))
}

function formatReadingLabel(systolic: number, diastolic: number) {
  return `${systolic}/${diastolic}`
}

function formatTickLabel(value: number, target: AdjustTarget) {
  const min = target === 'systolic' ? MIN_SYSTOLIC : MIN_DIASTOLIC
  const max = target === 'systolic' ? MAX_SYSTOLIC : MAX_DIASTOLIC
  const rounded = Math.round(value)
  if (rounded <= min) return String(min)
  if (rounded >= max) return String(max)
  return String(rounded)
}

function getBloodPressureZone(systolic: number, diastolic: number): ZoneStyle {
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Alta',
      color: '#f87171',
      bg: 'rgba(239, 68, 68, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (systolic >= 130 || diastolic >= 80 || systolic >= 120) {
    return {
      label: 'Elevada',
      color: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.14)',
      border: 'rgba(251, 191, 36, 0.35)',
    }
  }

  return {
    label: 'Normal',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
  }
}

type BloodPressureLogDrawerProps = {
  visible: boolean
  onClose: () => void
  onRegister: (reading: BloodPressureReading) => void
}

export function BloodPressureLogDrawer({
  visible,
  onClose,
  onRegister,
}: BloodPressureLogDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [systolic, setSystolic] = useState(DEFAULT_SYSTOLIC)
  const [diastolic, setDiastolic] = useState(DEFAULT_DIASTOLIC)
  const [systolicDraft, setSystolicDraft] = useState(String(DEFAULT_SYSTOLIC))
  const [diastolicDraft, setDiastolicDraft] = useState(String(DEFAULT_DIASTOLIC))
  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget>('systolic')
  const [gesturesReady, setGesturesReady] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRegistrationRef = useRef<BloodPressureReading | null>(null)

  const systolicRef = useRef(systolic)
  const diastolicRef = useRef(diastolic)
  const adjustTargetRef = useRef(adjustTarget)
  const dragStartValue = useRef(DEFAULT_SYSTOLIC)
  const appliedStepsRef = useRef(0)
  const gesturesReadyRef = useRef(false)

  systolicRef.current = systolic
  diastolicRef.current = diastolic
  adjustTargetRef.current = adjustTarget
  gesturesReadyRef.current = gesturesReady

  useEffect(() => {
    if (visible) {
      setShowSuccess(false)
      pendingRegistrationRef.current = null
      setSystolic(DEFAULT_SYSTOLIC)
      setDiastolic(DEFAULT_DIASTOLIC)
      setSystolicDraft(String(DEFAULT_SYSTOLIC))
      setDiastolicDraft(String(DEFAULT_DIASTOLIC))
      setAdjustTarget('systolic')
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
  }, [visible])

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gesturesReadyRef.current,
      onMoveShouldSetPanResponder: () => gesturesReadyRef.current,
      onPanResponderGrant: () => {
        Keyboard.dismiss()
        dragStartValue.current =
          adjustTargetRef.current === 'systolic'
            ? systolicRef.current
            : diastolicRef.current
        appliedStepsRef.current = 0
      },
      onPanResponderMove: (_, gesture) => {
        const steps = Math.trunc(-gesture.dy / DRAG_THRESHOLD_PX)
        if (steps === appliedStepsRef.current) return

        appliedStepsRef.current = steps

        if (adjustTargetRef.current === 'systolic') {
          const next = clampSystolic(dragStartValue.current + steps * STEP)
          if (next === systolicRef.current) return
          setSystolic(next)
          setSystolicDraft(String(next))
        } else {
          const next = clampDiastolic(dragStartValue.current + steps * STEP)
          if (next === diastolicRef.current) return
          setDiastolic(next)
          setDiastolicDraft(String(next))
        }

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

  function handleSystolicChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    setSystolicDraft(digits)
    if (!digits) return
    const parsed = Number(digits)
    if (Number.isFinite(parsed)) {
      setSystolic(clampInput(parsed, MIN_SYSTOLIC, MAX_SYSTOLIC))
    }
  }

  function handleDiastolicChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    setDiastolicDraft(digits)
    if (!digits) return
    const parsed = Number(digits)
    if (Number.isFinite(parsed)) {
      setDiastolic(clampInput(parsed, MIN_DIASTOLIC, MAX_DIASTOLIC))
    }
  }

  function handleSystolicBlur() {
    const next = clampSystolic(systolic)
    setSystolic(next)
    setSystolicDraft(String(next))
  }

  function handleDiastolicBlur() {
    const next = clampDiastolic(diastolic)
    setDiastolic(next)
    setDiastolicDraft(String(next))
  }

  function handleTargetSelect(target: AdjustTarget) {
    if (target === adjustTarget) return
    void Haptics.selectionAsync()
    setAdjustTarget(target)
  }

  function handleRegister() {
    if (diastolic >= systolic || showSuccess) return
    Keyboard.dismiss()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    void playSuccessSound()
    setShowSuccess(true)
    pendingRegistrationRef.current = { systolic, diastolic }

    clearSuccessTimer()
    successTimerRef.current = setTimeout(() => {
      handleDismiss()
    }, SUCCESS_DISMISS_MS)
  }

  const activeValue = adjustTarget === 'systolic' ? systolic : diastolic
  const activeMin = adjustTarget === 'systolic' ? MIN_SYSTOLIC : MIN_DIASTOLIC
  const activeMax = adjustTarget === 'systolic' ? MAX_SYSTOLIC : MAX_DIASTOLIC
  const rulerStep = (activeMax - activeMin) / RULER_SEGMENTS
  const fillRatio = (activeValue - activeMin) / (activeMax - activeMin)
  const fillIndicatorTop = (1 - fillRatio) * (LOTTIE_HEIGHT - 12) + 4
  const zone = getBloodPressureZone(systolic, diastolic)
  const isValidReading = diastolic < systolic

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
                paddingBottom: Math.max(insets.bottom, 16) + 16,
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
                colors={[...BP_GRADIENT]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.topAccent}
              />
            ) : null}

            {showSuccess ? (
              <MetricLogSuccessContent
                title="Pressão registrada!"
                message={`${formatReadingLabel(systolic, diastolic)} mmHg salvos no seu histórico.`}
              />
            ) : (
              <>
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                  <LinearGradient
                    colors={[...BP_GRADIENT]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.fieldIconOrb}
                  >
                    <MaterialCommunityIcons name="heart-pulse" size={22} color="#fff" />
                  </LinearGradient>

                  <View style={styles.headerTextCol}>
                    <Text style={styles.headerTitle}>Pressão arterial</Text>
                    <Text style={styles.subtitle}>Registre sua medição agora</Text>
                  </View>

                  <Pressable
                    onPress={handleDismiss}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar registro de pressão arterial"
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.targetRow}>
                  <AdjustTargetChip
                    label="Sistólica"
                    selected={adjustTarget === 'systolic'}
                    onPress={() => handleTargetSelect('systolic')}
                  />
                  <AdjustTargetChip
                    label="Diastólica"
                    selected={adjustTarget === 'diastolic'}
                    onPress={() => handleTargetSelect('diastolic')}
                  />
                </View>

                <View style={styles.contentRow}>
                  <View style={styles.visualColumn}>
                    <Text style={styles.visualHint}>
                      Arraste para ajustar a {adjustTarget === 'systolic' ? 'sistólica' : 'diastólica'}
                    </Text>

                    <View style={styles.visualStage}>
                      <View style={styles.tickColumn} pointerEvents="none">
                        <View style={[styles.fillIndicator, { top: fillIndicatorTop }]} />

                        {Array.from({ length: RULER_SEGMENTS + 1 }, (_, index) => {
                          const tickValue = activeMax - index * rulerStep
                          const active = activeValue >= tickValue
                          const showLabel =
                            index % 2 === 0 ||
                            tickValue === activeMin ||
                            tickValue === activeMax
                          return (
                            <View key={`${adjustTarget}-${tickValue}`} style={styles.tickRow}>
                              <View style={[styles.tickMark, active && styles.tickMarkActive]} />
                              {showLabel ? (
                                <Text style={[styles.tickLabel, active && styles.tickLabelActive]}>
                                  {formatTickLabel(tickValue, adjustTarget)}
                                </Text>
                              ) : (
                                <View style={styles.tickLabelSpacer} />
                              )}
                            </View>
                          )
                        })}
                      </View>

                      <View style={styles.lottieTouchArea} {...panResponder.panHandlers}>
                        <LottieView
                          source={bloodPressureAnimation}
                          autoPlay
                          loop
                          style={styles.lottieAnimation}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.amountColumn}>
                    <Text style={styles.amountLabel}>Medição</Text>

                    <View style={styles.amountDisplayCard}>
                      <Text style={styles.amountValue}>
                        {formatReadingLabel(systolic, diastolic)}
                      </Text>
                      <Text style={styles.amountUnit}>mmHg</Text>
                      <View
                        style={[
                          styles.zoneBadge,
                          { backgroundColor: zone.bg, borderColor: zone.border },
                        ]}
                      >
                        <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                        <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
                      </View>
                    </View>

                    <View style={styles.inputCard}>
                      <Text style={styles.inputLabel}>Ou digite</Text>

                      <View style={styles.dualInputRow}>
                        <View style={styles.inputFieldCol}>
                          <Text style={styles.inputFieldLabel}>Sistólica</Text>
                          <View style={styles.inputWrap}>
                            <TextInput
                              value={systolicDraft}
                              onChangeText={handleSystolicChange}
                              onBlur={handleSystolicBlur}
                              placeholder="120"
                              placeholderTextColor={colors.textSubtle}
                              keyboardType="number-pad"
                              style={styles.input}
                              selectionColor={colors.primary}
                              maxLength={3}
                            />
                          </View>
                        </View>

                        <Text style={styles.inputDivider}>/</Text>

                        <View style={styles.inputFieldCol}>
                          <Text style={styles.inputFieldLabel}>Diastólica</Text>
                          <View style={styles.inputWrap}>
                            <TextInput
                              value={diastolicDraft}
                              onChangeText={handleDiastolicChange}
                              onBlur={handleDiastolicBlur}
                              placeholder="80"
                              placeholderTextColor={colors.textSubtle}
                              keyboardType="number-pad"
                              style={styles.input}
                              selectionColor={colors.primary}
                              maxLength={3}
                            />
                          </View>
                        </View>
                      </View>

                      {!isValidReading ? (
                        <Text style={styles.validationHint}>
                          A diastólica deve ser menor que a sistólica.
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.registerButtonWrap}>
                  <PrimaryButton
                    label="Registrar pressão"
                    onPress={handleRegister}
                    disabled={!isValidReading}
                  />
                </View>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </AppModal>
  )
}

function AdjustTargetChip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.targetChip,
        selected && styles.targetChipSelected,
        pressed && styles.targetChipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Ajustar ${label.toLowerCase()}`}
    >
      <Text style={[styles.targetChipLabel, selected && styles.targetChipLabelSelected]}>
        {label}
      </Text>
    </Pressable>
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
    marginBottom: 12,
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
  targetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  targetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  targetChipSelected: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(251, 191, 36, 0.42)',
  },
  targetChipPressed: {
    opacity: 0.86,
  },
  targetChipLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  targetChipLabelSelected: {
    color: '#fde68a',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
    minHeight: CONTENT_MIN_HEIGHT,
  },
  visualColumn: {
    flex: 1.05,
    alignItems: 'center',
    minHeight: CONTENT_MIN_HEIGHT,
  },
  visualHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
    textAlign: 'center',
  },
  visualStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: LOTTIE_HEIGHT + 8,
  },
  tickColumn: {
    height: LOTTIE_HEIGHT,
    justifyContent: 'space-between',
    paddingBottom: 6,
    position: 'relative',
  },
  fillIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#fbbf24',
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 10,
  },
  tickMark: {
    width: 8,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tickMarkActive: {
    backgroundColor: '#fbbf24',
    width: 10,
  },
  tickLabel: {
    color: colors.textSubtle,
    fontSize: 8,
    fontWeight: '600',
    width: 24,
  },
  tickLabelActive: {
    color: '#fde68a',
  },
  tickLabelSpacer: {
    width: 24,
  },
  lottieTouchArea: {
    width: LOTTIE_WIDTH,
    height: LOTTIE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieAnimation: {
    width: LOTTIE_WIDTH,
    height: LOTTIE_HEIGHT,
  },
  amountColumn: {
    flex: 1,
    minHeight: CONTENT_MIN_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 2,
    gap: 10,
  },
  amountLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  amountDisplayCard: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    alignItems: 'center',
    minHeight: 108,
    justifyContent: 'center',
    gap: 2,
  },
  amountValue: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  amountUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  zoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  zoneLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    gap: 8,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dualInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputFieldCol: {
    flex: 1,
    gap: 6,
  },
  inputFieldLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  inputDivider: {
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '700',
    paddingBottom: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  validationHint: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  registerButtonWrap: {
    marginTop: 2,
  },
})
