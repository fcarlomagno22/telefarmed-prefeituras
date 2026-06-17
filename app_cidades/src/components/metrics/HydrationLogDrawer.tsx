import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { AppModal } from '../AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { colors } from '../../theme/colors'
import { playSuccessSound } from '../../utils/appSounds'
import { PrimaryButton } from '../PrimaryButton'
import { MetricLogSuccessContent } from './MetricLogSuccessContent'
import { getModalFooterPadding } from '../../utils/modalSafeArea'

const SUCCESS_DISMISS_MS = 2600

const SHEET_OFFSET = 420
const STEP_ML = 100
const MAX_ML = 1000
const MIN_ML = 0
const DEFAULT_ML = 250
const DRAG_THRESHOLD_PX = 20

const CUP_WIDTH = 108
const CUP_HEIGHT = 168
const CUP_GRADIENT = ['#7dd3fc', '#0ea5e9', '#0369a1'] as const
const CUP_SHAPE_PATH = `M18 12 H${CUP_WIDTH - 18} Q${CUP_WIDTH - 8} 12 ${CUP_WIDTH - 10} 24 L${CUP_WIDTH - 14} ${CUP_HEIGHT - 16} Q${CUP_WIDTH - 16} ${CUP_HEIGHT - 4} ${CUP_WIDTH - 28} ${CUP_HEIGHT - 4} H28 Q16 ${CUP_HEIGHT - 4} 14 ${CUP_HEIGHT - 16} L10 24 Q8 12 18 12 Z`

type BubbleSpec = {
  leftRatio: number
  bottomRatio: number
  size: number
  delay: number
  duration: number
}

const BUBBLE_SPECS: BubbleSpec[] = [
  { leftRatio: 0.24, bottomRatio: 0.22, size: 4, delay: 0, duration: 3400 },
  { leftRatio: 0.52, bottomRatio: 0.38, size: 3, delay: 600, duration: 4200 },
  { leftRatio: 0.68, bottomRatio: 0.16, size: 5, delay: 1100, duration: 3800 },
  { leftRatio: 0.38, bottomRatio: 0.48, size: 2.5, delay: 1700, duration: 4600 },
  { leftRatio: 0.6, bottomRatio: 0.3, size: 3.5, delay: 300, duration: 5100 },
]

function mlToWaterHeight(ml: number) {
  const ratio = ml / MAX_ML
  return Math.max(4, ratio * (CUP_HEIGHT - 28))
}

function buildWavePath(surfaceY: number, amplitude: number, wavelength: number, phase: number) {
  let path = `M -48 ${surfaceY + amplitude + 2}`
  for (let x = -48; x <= CUP_WIDTH + 48; x += 4) {
    const y = surfaceY + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
    path += ` L ${x} ${y}`
  }
  path += ` L ${CUP_WIDTH + 48} ${CUP_HEIGHT + 8} L -48 ${CUP_HEIGHT + 8} Z`
  return path
}

function WaterBubbleView({
  spec,
  waterHeight,
  active,
}: {
  spec: BubbleSpec
  waterHeight: number
  active: boolean
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!active || waterHeight < 16) return

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(spec.delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: spec.duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )

    loop.start()
    return () => loop.stop()
  }, [active, progress, spec.delay, spec.duration, waterHeight])

  if (waterHeight < 16) return null

  const travel = Math.max(14, waterHeight * 0.72)
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -travel],
  })
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.6, 1],
    outputRange: [0, 0.5, 0.32, 0],
  })
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 1.1],
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.waterBubble,
        {
          left: CUP_WIDTH * spec.leftRatio - spec.size,
          bottom: waterHeight * spec.bottomRatio,
          width: spec.size * 2,
          height: spec.size * 2,
          borderRadius: spec.size,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    />
  )
}

function WaterCupVisual({ amountMl, active }: { amountMl: number; active: boolean }) {
  const [wavePhase, setWavePhase] = useState(0)

  useEffect(() => {
    if (!active) return

    const timer = setInterval(() => {
      setWavePhase((prev) => prev + 0.14)
    }, 48)

    return () => clearInterval(timer)
  }, [active])

  const waterHeight = mlToWaterHeight(amountMl)
  const surfaceY = CUP_HEIGHT - waterHeight - 8
  const waterBottom = CUP_HEIGHT - 6
  const showEffects = waterHeight > 12
  const waveBackPath = buildWavePath(surfaceY + 3, 2.4, 34, wavePhase)
  const waveFrontPath = buildWavePath(surfaceY - 1, 1.8, 26, wavePhase + Math.PI / 3)

  return (
    <View style={styles.cupVisualRoot} pointerEvents="none">
      <Svg width={CUP_WIDTH} height={CUP_HEIGHT} viewBox={`0 0 ${CUP_WIDTH} ${CUP_HEIGHT}`}>
        <Defs>
          <ClipPath id="hydrationCupClip">
            <Path d={CUP_SHAPE_PATH} />
          </ClipPath>

          <SvgLinearGradient id="waterDeepGradient" x1="0" y1="1" x2="0.25" y2="0">
            <Stop offset="0%" stopColor="#042f4a" />
            <Stop offset="28%" stopColor="#075985" />
            <Stop offset="58%" stopColor="#0284c7" />
            <Stop offset="82%" stopColor="#0ea5e9" />
            <Stop offset="100%" stopColor="#38bdf8" />
          </SvgLinearGradient>

          <RadialGradient id="waterDepthGlow" cx="50%" cy="100%" rx="58%" ry="72%">
            <Stop offset="0%" stopColor="#0369a1" stopOpacity={0.85} />
            <Stop offset="55%" stopColor="#0284c7" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
          </RadialGradient>

          <SvgLinearGradient id="waterWaveBack" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#0284c7" stopOpacity={0.65} />
          </SvgLinearGradient>

          <SvgLinearGradient id="waterWaveFront" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#e0f2fe" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#38bdf8" stopOpacity={0.45} />
          </SvgLinearGradient>

          <SvgLinearGradient id="waterSurfaceSheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <Stop offset="45%" stopColor="rgba(255,255,255,0.55)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </SvgLinearGradient>

          <SvgLinearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </SvgLinearGradient>
        </Defs>

        <Path
          d={CUP_SHAPE_PATH}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={1.5}
        />

        <G clipPath="url(#hydrationCupClip)">
          <Rect
            x={0}
            y={surfaceY + 2}
            width={CUP_WIDTH}
            height={waterBottom - surfaceY + 8}
            fill="url(#waterDeepGradient)"
          />

          <Rect
            x={0}
            y={surfaceY + 6}
            width={CUP_WIDTH}
            height={waterBottom - surfaceY + 4}
            fill="url(#waterDepthGlow)"
            opacity={0.55}
          />

          {showEffects ? (
            <>
              <Path d={waveBackPath} fill="url(#waterWaveBack)" opacity={0.55} />
              <Path d={waveFrontPath} fill="url(#waterWaveFront)" opacity={0.72} />
            </>
          ) : null}

          <Rect
            x={0}
            y={surfaceY - 1}
            width={CUP_WIDTH}
            height={3}
            fill="url(#waterSurfaceSheen)"
            opacity={showEffects ? 0.85 : 0.5}
          />
        </G>

        <Path d={CUP_SHAPE_PATH} fill="url(#glassGradient)" opacity={0.35} />
      </Svg>

      {showEffects
        ? BUBBLE_SPECS.map((spec, index) => (
            <WaterBubbleView
              key={`bubble-${index}`}
              spec={spec}
              waterHeight={waterHeight}
              active={active}
            />
          ))
        : null}
    </View>
  )
}

type HydrationLogDrawerProps = {
  visible: boolean
  onClose: () => void
  onRegister: (amountMl: number) => void
}

function clampMl(value: number) {
  const stepped = Math.round(value / STEP_ML) * STEP_ML
  return Math.min(MAX_ML, Math.max(MIN_ML, stepped))
}

function formatMlLabel(ml: number) {
  return `${ml.toLocaleString('pt-BR')} ml`
}

function formatTickLabel(tickMl: number) {
  if (tickMl === 0) return '0'
  if (tickMl >= MAX_ML) return '1L'
  return String(tickMl)
}

export function HydrationLogDrawer({
  visible,
  onClose,
  onRegister,
}: HydrationLogDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [amountMl, setAmountMl] = useState(DEFAULT_ML)
  const [inputDraft, setInputDraft] = useState(String(DEFAULT_ML))
  const [cupGesturesReady, setCupGesturesReady] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRegistrationRef = useRef<number | null>(null)

  const amountRef = useRef(amountMl)
  const dragStartMl = useRef(DEFAULT_ML)
  const appliedStepsRef = useRef(0)
  const cupGesturesReadyRef = useRef(false)

  amountRef.current = amountMl
  cupGesturesReadyRef.current = cupGesturesReady

  useEffect(() => {
    if (visible) {
      setShowSuccess(false)
      pendingRegistrationRef.current = null
      setAmountMl(DEFAULT_ML)
      setInputDraft(String(DEFAULT_ML))
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

      setCupGesturesReady(false)
      const cupTimer = setTimeout(() => setCupGesturesReady(true), 350)
      return () => clearTimeout(cupTimer)
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

  const cupPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => cupGesturesReadyRef.current,
      onMoveShouldSetPanResponder: () => cupGesturesReadyRef.current,
      onPanResponderGrant: () => {
        Keyboard.dismiss()
        dragStartMl.current = amountRef.current
        appliedStepsRef.current = 0
      },
      onPanResponderMove: (_, gesture) => {
        const steps = Math.trunc(-gesture.dy / DRAG_THRESHOLD_PX)
        if (steps === appliedStepsRef.current) return

        appliedStepsRef.current = steps
        const nextMl = clampMl(dragStartMl.current + steps * STEP_ML)
        if (nextMl === amountRef.current) return

        setAmountMl(nextMl)
        setInputDraft(String(nextMl))
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
      if (pending !== null) onRegister(pending)
      onClose()
    })
  }

  function handleInputChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    setInputDraft(digits)

    if (!digits) {
      setAmountMl(0)
      return
    }

    const parsed = Number(digits)
    if (Number.isFinite(parsed)) {
      const next = clampMl(parsed)
      setAmountMl(next)
    }
  }

  function handleInputBlur() {
    setInputDraft(String(amountMl))
  }

  function handleRegister() {
    if (amountMl <= 0 || showSuccess) return
    Keyboard.dismiss()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    void playSuccessSound()
    setShowSuccess(true)
    pendingRegistrationRef.current = amountMl

    clearSuccessTimer()
    successTimerRef.current = setTimeout(() => {
      handleDismiss()
    }, SUCCESS_DISMISS_MS)
  }

  const tickSteps = MAX_ML / STEP_ML
  const fillRatio = amountMl / MAX_ML
  const fillIndicatorTop = (1 - fillRatio) * (CUP_HEIGHT - 12) + 4

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
                colors={[...CUP_GRADIENT]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.topAccent}
              />
            ) : null}

            {showSuccess ? (
              <MetricLogSuccessContent
                title="Hidratação registrada!"
                message={`${formatMlLabel(amountMl)} adicionados ao seu registro.`}
              />
            ) : (
              <>
                <View style={styles.handle} />

                <View style={styles.headerRow}>
                  <LinearGradient
                    colors={[...CUP_GRADIENT]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.fieldIconOrb}
                  >
                    <MaterialCommunityIcons name="cup-water" size={22} color="#fff" />
                  </LinearGradient>

                  <View style={styles.headerTextCol}>
                    <Text style={styles.headerTitle}>Hidratação</Text>
                    <Text style={styles.subtitle}>Registre o quanto você bebeu agora</Text>
                  </View>

                  <Pressable
                    onPress={handleDismiss}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar registro de água"
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.contentRow}>
                  <View style={styles.cupColumn}>
                    <Text style={styles.cupHint}>Segure e arraste no copo</Text>

                    <View style={styles.cupStage}>
                      <View style={styles.tickColumn} pointerEvents="none">
                        <View style={[styles.fillIndicator, { top: fillIndicatorTop }]} />

                        {Array.from({ length: tickSteps + 1 }, (_, index) => {
                          const tickMl = MAX_ML - index * STEP_ML
                          const active = amountMl >= tickMl && tickMl > 0
                          return (
                            <View key={tickMl} style={styles.tickRow}>
                              <View style={[styles.tickMark, active && styles.tickMarkActive]} />
                              {index % 2 === 0 ? (
                                <Text style={[styles.tickLabel, active && styles.tickLabelActive]}>
                                  {formatTickLabel(tickMl)}
                                </Text>
                              ) : (
                                <View style={styles.tickLabelSpacer} />
                              )}
                            </View>
                          )
                        })}
                      </View>

                      <View style={styles.cupTouchArea} {...cupPanResponder.panHandlers}>
                        <WaterCupVisual amountMl={amountMl} active={cupGesturesReady} />
                      </View>
                    </View>
                  </View>

                  <View style={styles.amountColumn}>
                    <Text style={styles.amountLabel}>Vai registrar</Text>

                    <View style={styles.amountDisplayCard}>
                      <Text style={styles.amountValue}>{formatMlLabel(amountMl)}</Text>
                    </View>

                    <View style={styles.inputCard}>
                      <Text style={styles.inputLabel}>Ou digite</Text>
                      <View style={styles.inputWrap}>
                        <TextInput
                          value={inputDraft}
                          onChangeText={handleInputChange}
                          onBlur={handleInputBlur}
                          placeholder="Ex: 250"
                          placeholderTextColor={colors.textSubtle}
                          keyboardType="number-pad"
                          style={styles.input}
                          selectionColor={colors.primary}
                          maxLength={4}
                        />
                        <Text style={styles.inputSuffix}>ml</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <PrimaryButton label="Hidratar" onPress={handleRegister} disabled={amountMl <= 0} />
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
    height: CUP_HEIGHT + 36,
  },
  cupColumn: {
    flex: 1.05,
    alignItems: 'center',
    height: CUP_HEIGHT + 36,
  },
  cupHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cupStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: CUP_HEIGHT + 8,
  },
  tickColumn: {
    height: CUP_HEIGHT,
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
    backgroundColor: '#7dd3fc',
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
    backgroundColor: '#38bdf8',
    width: 10,
  },
  tickLabel: {
    color: colors.textSubtle,
    fontSize: 8,
    fontWeight: '600',
    width: 22,
  },
  tickLabelActive: {
    color: '#7dd3fc',
  },
  tickLabelSpacer: {
    width: 22,
  },
  cupTouchArea: {
    width: CUP_WIDTH,
    height: CUP_HEIGHT,
  },
  cupVisualRoot: {
    width: CUP_WIDTH,
    height: CUP_HEIGHT,
  },
  waterBubble: {
    position: 'absolute',
    backgroundColor: 'rgba(224, 242, 254, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  amountColumn: {
    flex: 1,
    height: CUP_HEIGHT + 36,
    justifyContent: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    height: 78,
    justifyContent: 'center',
  },
  amountValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
    minWidth: 120,
    textAlign: 'center',
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
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
})
