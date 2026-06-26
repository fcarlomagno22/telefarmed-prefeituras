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
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { colors } from '../../theme/colors'
import { playSuccessSound } from '../../utils/appSounds'
import { keyboardAvoidingBehavior } from '../../utils/keyboardLayout'
import { getModalFooterPadding } from '../../utils/modalSafeArea'
import { PrimaryButton } from '../PrimaryButton'
import { AppModal } from '../AppModal'
import { MetricLogSuccessContent } from './MetricLogSuccessContent'

const SUCCESS_DISMISS_MS = 2600
const KEYBOARD_EXTRA_PADDING = 20

const SHEET_OFFSET = 480
const STEP_MG = 5
const MIN_MG = 50
const MAX_MG = 300
const INPUT_MAX_MG = 600
const DEFAULT_MG = 92
const DRAG_THRESHOLD_PX = 10
const RULER_SEGMENTS = 10

const DROP_WIDTH = 95
const DROP_HEIGHT = 167
const DROP_SVG_BOTTOM_PAD = 3
const BLOOD_GRADIENT = ['#fca5a5', '#ef4444', '#991b1b'] as const

type DropGeometry = {
  cx: number
  r: number
  bottomCy: number
  rightBezier: {
    p0: { x: number; y: number }
    p1: { x: number; y: number }
    p2: { x: number; y: number }
    p3: { x: number; y: number }
  }
}

function getDropGeometry(width: number, height: number): DropGeometry {
  const cx = width / 2
  const r = width / 2 - 0.5
  const bottomCy = height - r - 1.5
  const tipY = 1

  return {
    cx,
    r,
    bottomCy,
    rightBezier: {
      p0: { x: cx, y: tipY },
      p1: { x: cx + r * 0.045, y: height * 0.24 },
      p2: { x: cx + r, y: bottomCy - r * 0.5 },
      p3: { x: cx + r, y: bottomCy },
    },
  }
}

function cubicPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
) {
  const u = 1 - t
  const tt = t * t
  const uu = u * u
  const uuu = uu * u
  const ttt = tt * t

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  }
}

/** Ponta fina no topo + base semicircular larga (ícone clássico de gota). */
function buildBloodDropPath(width: number, height: number) {
  const { cx, r, bottomCy, rightBezier } = getDropGeometry(width, height)
  const { p0, p1, p2, p3 } = rightBezier
  const flankSegments = 44
  const arcSegments = 38
  const parts = [`M ${cx.toFixed(2)} ${p0.y.toFixed(2)}`]

  for (let i = 1; i <= flankSegments; i++) {
    const point = cubicPoint(p0, p1, p2, p3, i / flankSegments)
    parts.push(`L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
  }

  for (let i = 1; i <= arcSegments; i++) {
    const angle = (i / arcSegments) * Math.PI
    const x = cx + r * Math.cos(angle)
    const y = bottomCy + r * Math.sin(angle)
    parts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  for (let i = flankSegments - 1; i >= 0; i--) {
    const point = cubicPoint(p0, p1, p2, p3, i / flankSegments)
    parts.push(`L ${(2 * cx - point.x).toFixed(2)} ${point.y.toFixed(2)}`)
  }

  parts.push('Z')
  return parts.join(' ')
}

/** Reflexo único no flanco esquerdo, como ícone de referência. */
function buildDropShinePath(width: number, height: number) {
  const { cx, rightBezier } = getDropGeometry(width, height)
  const { p0, p1, p2, p3 } = rightBezier
  const inset = width * 0.06
  const samples: { x: number; y: number }[] = []

  for (let i = 6; i <= 30; i++) {
    const t = i / 30
    const right = cubicPoint(p0, p1, p2, p3, t)
    samples.push({
      x: 2 * cx - right.x + inset,
      y: right.y,
    })
  }

  if (samples.length < 2) return ''

  let path = `M ${samples[0].x.toFixed(1)} ${samples[0].y.toFixed(1)}`
  for (let i = 1; i < samples.length; i++) {
    path += ` L ${samples[i].x.toFixed(1)} ${samples[i].y.toFixed(1)}`
  }
  return path
}

const DROP_SHAPE_PATH = buildBloodDropPath(DROP_WIDTH, DROP_HEIGHT)
const DROP_SHINE_PATH = buildDropShinePath(DROP_WIDTH, DROP_HEIGHT)

export type GlucoseReadingContext = 'fasting' | 'pre_meal' | 'post_meal' | 'bedtime' | 'other'

export type GlucoseReading = {
  amountMg: number
  context: GlucoseReadingContext
}

type ContextOption = {
  id: GlucoseReadingContext
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
}

const CONTEXT_OPTIONS: ContextOption[] = [
  { id: 'fasting', label: 'Jejum', icon: 'weather-sunset-up' },
  { id: 'pre_meal', label: 'Pré-refeição', icon: 'silverware-fork-knife' },
  { id: 'post_meal', label: 'Pós-refeição', icon: 'food-apple' },
  { id: 'bedtime', label: 'Antes de dormir', icon: 'moon-waning-crescent' },
  { id: 'other', label: 'Outro', icon: 'dots-horizontal' },
]

type CellSpec = {
  leftRatio: number
  bottomRatio: number
  size: number
  delay: number
  duration: number
  drift: number
}

const CELL_SPECS: CellSpec[] = [
  { leftRatio: 0.34, bottomRatio: 0.18, size: 5, delay: 0, duration: 3000, drift: 4 },
  { leftRatio: 0.66, bottomRatio: 0.18, size: 5, delay: 200, duration: 3200, drift: -4 },
  { leftRatio: 0.42, bottomRatio: 0.34, size: 4.2, delay: 500, duration: 3600, drift: 3 },
  { leftRatio: 0.58, bottomRatio: 0.34, size: 4.2, delay: 700, duration: 3800, drift: -3 },
  { leftRatio: 0.38, bottomRatio: 0.5, size: 3.6, delay: 1000, duration: 4100, drift: 3 },
  { leftRatio: 0.62, bottomRatio: 0.5, size: 3.6, delay: 1200, duration: 4300, drift: -3 },
]

function mgToFillHeight(mg: number) {
  const ratio = (mg - MIN_MG) / (MAX_MG - MIN_MG)
  return Math.max(12, ratio * (DROP_HEIGHT - 42))
}

function buildBloodWavePath(surfaceY: number, amplitude: number, wavelength: number, phase: number) {
  let path = `M -20 ${surfaceY + amplitude + 2}`
  for (let x = -20; x <= DROP_WIDTH + 20; x += 3) {
    const y = surfaceY + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude
    path += ` L ${x} ${y}`
  }
  path += ` L ${DROP_WIDTH + 20} ${DROP_HEIGHT + 6} L -20 ${DROP_HEIGHT + 6} Z`
  return path
}

function dropHalfWidthAtY(width: number, height: number, y: number) {
  const { cx, r, bottomCy, rightBezier } = getDropGeometry(width, height)
  const clampedY = Math.max(0, Math.min(height, y))

  if (clampedY >= bottomCy) {
    const sinA = Math.max(0, Math.min(1, (clampedY - bottomCy) / r))
    return r * Math.cos(Math.asin(sinA))
  }

  let lo = 0
  let hi = 1
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    const point = cubicPoint(
      rightBezier.p0,
      rightBezier.p1,
      rightBezier.p2,
      rightBezier.p3,
      mid,
    )
    if (point.y < clampedY) lo = mid
    else hi = mid
  }

  const edge = cubicPoint(
    rightBezier.p0,
    rightBezier.p1,
    rightBezier.p2,
    rightBezier.p3,
    (lo + hi) / 2,
  )
  return Math.max(0, edge.x - cx)
}

function buildMeniscusPath(surfaceY: number, phase: number) {
  const cx = DROP_WIDTH / 2
  const halfW = dropHalfWidthAtY(DROP_WIDTH, DROP_HEIGHT, surfaceY) * 0.82
  const left = cx - halfW
  const right = cx + halfW
  let path = `M ${left.toFixed(1)} ${(surfaceY + 0.5).toFixed(1)}`
  for (let x = left; x <= right; x += 2) {
    const y = surfaceY + Math.sin((x / 16) * Math.PI * 2 + phase) * 1.2
    path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return path
}

type ZoneStyle = {
  label: string
  color: string
  bg: string
  border: string
}

function getGlucoseZone(mg: number, context: GlucoseReadingContext): ZoneStyle {
  if (mg < 70) {
    return {
      label: 'Baixa',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.14)',
      border: 'rgba(56, 189, 248, 0.35)',
    }
  }

  if (context === 'post_meal') {
    if (mg <= 140) {
      return {
        label: 'Normal',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.14)',
        border: 'rgba(52, 211, 153, 0.35)',
      }
    }
    if (mg <= 180) {
      return {
        label: 'Elevada',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.14)',
        border: 'rgba(251, 191, 36, 0.35)',
      }
    }
    return {
      label: 'Alta',
      color: '#f87171',
      bg: 'rgba(248, 113, 113, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (context === 'bedtime') {
    if (mg <= 120) {
      return {
        label: 'Normal',
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.14)',
        border: 'rgba(52, 211, 153, 0.35)',
      }
    }
    if (mg <= 160) {
      return {
        label: 'Elevada',
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.14)',
        border: 'rgba(251, 191, 36, 0.35)',
      }
    }
    return {
      label: 'Alta',
      color: '#f87171',
      bg: 'rgba(248, 113, 113, 0.14)',
      border: 'rgba(248, 113, 113, 0.35)',
    }
  }

  if (mg <= 99) {
    return {
      label: 'Normal',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.14)',
      border: 'rgba(52, 211, 153, 0.35)',
    }
  }
  if (mg <= 125) {
    return {
      label: 'Elevada',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.14)',
      border: 'rgba(251, 191, 36, 0.35)',
    }
  }
  return {
    label: 'Alta',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.14)',
    border: 'rgba(248, 113, 113, 0.35)',
  }
}

function BloodCellView({
  spec,
  fillHeight,
  active,
}: {
  spec: CellSpec
  fillHeight: number
  active: boolean
}) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!active || fillHeight < 18) return

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
  }, [active, fillHeight, progress, spec.delay, spec.duration])

  if (fillHeight < 18) return null

  const travel = Math.max(18, fillHeight * 0.82)
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -travel],
  })
  const translateX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, spec.drift, spec.drift * 0.35],
  })
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.5, 1],
    outputRange: [0, 0.62, 0.38, 0],
  })
  const scaleX = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1.35, 1.1, 0.95],
  })
  const scaleY = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.72, 0.82, 0.88],
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bloodCell,
        {
          left: DROP_WIDTH * spec.leftRatio - spec.size,
          bottom: fillHeight * spec.bottomRatio,
          width: spec.size * 2.2,
          height: spec.size * 1.5,
          borderRadius: spec.size,
          opacity,
          transform: [{ translateY }, { translateX }, { scaleX }, { scaleY }],
        },
      ]}
    />
  )
}

function BloodDropVisual({ amountMg, active }: { amountMg: number; active: boolean }) {
  const [wavePhase, setWavePhase] = useState(0)
  const pulse = useRef(new Animated.Value(0)).current
  const cx = DROP_WIDTH / 2

  useEffect(() => {
    if (!active) return

    const waveTimer = setInterval(() => {
      setWavePhase((prev) => prev + 0.13)
    }, 48)

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 960,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 960,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    pulseLoop.start()
    return () => {
      clearInterval(waveTimer)
      pulseLoop.stop()
    }
  }, [active, pulse])

  const fillHeight = mgToFillHeight(amountMg)
  const surfaceY = DROP_HEIGHT - fillHeight - 2
  const showEffects = fillHeight > 18
  const waveBackPath = buildBloodWavePath(surfaceY + 2, 2, 24, wavePhase)
  const waveFrontPath = buildBloodWavePath(surfaceY - 0.5, 1.4, 17, wavePhase + Math.PI / 2.2)
  const meniscusPath = buildMeniscusPath(surfaceY - 0.5, wavePhase * 0.5)

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  })
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.22],
  })

  const svgHeight = DROP_HEIGHT + DROP_SVG_BOTTOM_PAD
  const svgViewBox = `0 0 ${DROP_WIDTH} ${svgHeight}`

  return (
    <View style={styles.dropVisualRoot} pointerEvents="none">
      <Svg
        width={DROP_WIDTH + 10}
        height={svgHeight + 8}
        viewBox={`${-5} ${-2} ${DROP_WIDTH + 10} ${svgHeight + 8}`}
        style={styles.dropShadowSvg}
      >
        <Ellipse
          cx={cx}
          cy={DROP_HEIGHT + 2}
          rx={DROP_WIDTH * 0.28}
          ry={5}
          fill="rgba(0, 0, 0, 0.35)"
        />
      </Svg>

      <Animated.View
        style={[
          styles.dropPulseShell,
          {
            opacity: pulseOpacity,
            transform: [{ scale: pulseScale }],
          },
        ]}
      >
        <Svg width={DROP_WIDTH} height={svgHeight} viewBox={svgViewBox}>
          <Path
            d={DROP_SHAPE_PATH}
            fill="none"
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth={1}
          />
        </Svg>
      </Animated.View>

      <Svg width={DROP_WIDTH} height={svgHeight} viewBox={svgViewBox}>
        <Defs>
          <ClipPath id="glucoseDropClip">
            <Path d={DROP_SHAPE_PATH} />
          </ClipPath>

          <SvgLinearGradient id="bloodMassGradient" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="#8b1010" />
            <Stop offset="38%" stopColor="#c41616" />
            <Stop offset="72%" stopColor="#dc2626" />
            <Stop offset="100%" stopColor="#991b1b" />
          </SvgLinearGradient>

          <RadialGradient id="bloodBulbGlow" cx="50%" cy="80%" rx="40%" ry="34%">
            <Stop offset="0%" stopColor="#f87171" stopOpacity={0.7} />
            <Stop offset="100%" stopColor="#991b1b" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="bloodCenterLight" cx="34%" cy="42%" rx="22%" ry="34%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.34} />
            <Stop offset="55%" stopColor="#fecaca" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#fecaca" stopOpacity={0} />
          </RadialGradient>

          <RadialGradient id="bloodEdgeVignette" cx="50%" cy="50%" rx="50%" ry="52%">
            <Stop offset="68%" stopColor="#450a0a" stopOpacity={0} />
            <Stop offset="100%" stopColor="#450a0a" stopOpacity={0.45} />
          </RadialGradient>

          <SvgLinearGradient id="bloodWaveBack" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fecdd3" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#be123c" stopOpacity={0.45} />
          </SvgLinearGradient>

          <SvgLinearGradient id="bloodWaveFront" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fff1f2" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#fb7185" stopOpacity={0.3} />
          </SvgLinearGradient>

          <SvgLinearGradient id="dropShellSheen" x1="0.5" y1="0" x2="0.5" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <Stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
            <Stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </SvgLinearGradient>
        </Defs>

        <G clipPath="url(#glucoseDropClip)">
          <Path d={DROP_SHAPE_PATH} fill="rgba(28, 6, 6, 0.82)" />

          <Rect
            x={0}
            y={surfaceY}
            width={DROP_WIDTH}
            height={DROP_HEIGHT - surfaceY + 4}
            fill="url(#bloodMassGradient)"
          />

          <Rect
            x={0}
            y={surfaceY}
            width={DROP_WIDTH}
            height={DROP_HEIGHT - surfaceY + 4}
            fill="url(#bloodBulbGlow)"
            opacity={0.72}
          />

          <Path d={DROP_SHAPE_PATH} fill="url(#bloodCenterLight)" opacity={0.65} />
          <Path d={DROP_SHAPE_PATH} fill="url(#bloodEdgeVignette)" opacity={0.55} />

          {showEffects ? (
            <>
              <Path d={waveBackPath} fill="url(#bloodWaveBack)" opacity={0.45} />
              <Path d={waveFrontPath} fill="url(#bloodWaveFront)" opacity={0.58} />
              <Path
                d={meniscusPath}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={1.2}
                strokeLinecap="round"
              />
            </>
          ) : null}

          <Path
            d={DROP_SHINE_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={6}
            strokeLinecap="round"
          />
        </G>

        <Path d={DROP_SHAPE_PATH} fill="url(#dropShellSheen)" opacity={0.16} />
        <Path
          d={DROP_SHAPE_PATH}
          fill="none"
          stroke="rgba(255,255,255,0.28)"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />

        <Circle cx={cx} cy={1.6} r={0.9} fill="rgba(255,255,255,0.82)" />
      </Svg>

      {showEffects
        ? CELL_SPECS.map((spec, index) => (
            <BloodCellView
              key={`cell-${index}`}
              spec={spec}
              fillHeight={fillHeight}
              active={active}
            />
          ))
        : null}
    </View>
  )
}

function GlucoseContextChip({
  option,
  selected,
  onPress,
}: {
  option: ContextOption
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.contextChip,
        selected && styles.contextChipSelected,
        pressed && styles.contextChipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={option.label}
    >
      <MaterialCommunityIcons
        name={option.icon}
        size={14}
        color={selected ? '#fecaca' : colors.textMuted}
      />
      <Text style={[styles.contextChipLabel, selected && styles.contextChipLabelSelected]}>
        {option.label}
      </Text>
    </Pressable>
  )
}

type GlucoseLogDrawerProps = {
  visible: boolean
  onClose: () => void
  onRegister: (reading: GlucoseReading) => void
}

function clampMg(value: number) {
  const stepped = Math.round(value / STEP_MG) * STEP_MG
  return Math.min(MAX_MG, Math.max(MIN_MG, stepped))
}

function clampInputMg(value: number) {
  const stepped = Math.round(value / STEP_MG) * STEP_MG
  return Math.min(INPUT_MAX_MG, Math.max(MIN_MG, stepped))
}

function formatMgLabel(mg: number) {
  return `${mg.toLocaleString('pt-BR')} mg/dL`
}

function formatTickLabel(tickMg: number) {
  const rounded = Math.round(tickMg)
  if (rounded <= MIN_MG) return String(MIN_MG)
  if (rounded >= MAX_MG) return String(MAX_MG)
  return String(rounded)
}

export function GlucoseLogDrawer({ visible, onClose, onRegister }: GlucoseLogDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const [amountMg, setAmountMg] = useState(DEFAULT_MG)
  const [inputDraft, setInputDraft] = useState(String(DEFAULT_MG))
  const [readingContext, setReadingContext] = useState<GlucoseReadingContext>('fasting')
  const [dropGesturesReady, setDropGesturesReady] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [keyboardInset, setKeyboardInset] = useState(0)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRegistrationRef = useRef<GlucoseReading | null>(null)
  const scrollRef = useRef<ScrollView>(null)

  const amountRef = useRef(amountMg)
  const dragStartMg = useRef(DEFAULT_MG)
  const appliedStepsRef = useRef(0)
  const dropGesturesReadyRef = useRef(false)

  amountRef.current = amountMg
  dropGesturesReadyRef.current = dropGesturesReady

  useEffect(() => {
    if (visible) {
      setShowSuccess(false)
      pendingRegistrationRef.current = null
      setAmountMg(DEFAULT_MG)
      setInputDraft(String(DEFAULT_MG))
      setReadingContext('fasting')
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

      setDropGesturesReady(false)
      const dropTimer = setTimeout(() => setDropGesturesReady(true), 350)
      return () => clearTimeout(dropTimer)
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible])

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
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  const dropPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dropGesturesReadyRef.current,
      onMoveShouldSetPanResponder: () => dropGesturesReadyRef.current,
      onPanResponderGrant: () => {
        Keyboard.dismiss()
        dragStartMg.current = amountRef.current
        appliedStepsRef.current = 0
      },
      onPanResponderMove: (_, gesture) => {
        const steps = Math.trunc(-gesture.dy / DRAG_THRESHOLD_PX)
        if (steps === appliedStepsRef.current) return

        appliedStepsRef.current = steps
        const nextMg = clampMg(dragStartMg.current + steps * STEP_MG)
        if (nextMg === amountRef.current) return

        setAmountMg(nextMg)
        setInputDraft(String(nextMg))
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

    if (!digits) {
      setAmountMg(MIN_MG)
      return
    }

    const parsed = Number(digits)
    if (Number.isFinite(parsed)) {
      setAmountMg(clampInputMg(parsed))
    }
  }

  function handleInputBlur() {
    setAmountMg(clampInputMg(amountMg))
    setInputDraft(String(clampInputMg(amountMg)))
  }

  function handleContextSelect(context: GlucoseReadingContext) {
    if (context === readingContext) return
    void Haptics.selectionAsync()
    setReadingContext(context)
  }

  function handleRegister() {
    if (amountMg < MIN_MG || showSuccess) return
    Keyboard.dismiss()
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    void playSuccessSound()
    setShowSuccess(true)
    pendingRegistrationRef.current = { amountMg, context: readingContext }

    clearSuccessTimer()
    successTimerRef.current = setTimeout(() => {
      handleDismiss()
    }, SUCCESS_DISMISS_MS)
  }

  const fillRatio = (amountMg - MIN_MG) / (MAX_MG - MIN_MG)
  const fillIndicatorTop = (1 - fillRatio) * (DROP_HEIGHT - 12) + 4
  const zone = getGlucoseZone(amountMg, readingContext)
  const rulerStepMg = (MAX_MG - MIN_MG) / RULER_SEGMENTS
  const selectedContextLabel =
    CONTEXT_OPTIONS.find((option) => option.id === readingContext)?.label ?? 'Jejum'
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
              colors={['rgba(36, 36, 46, 0.98)', 'rgba(14, 14, 20, 0.99)']}
              style={StyleSheet.absoluteFillObject}
            />
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}

            {!showSuccess ? (
              <LinearGradient
                colors={[...BLOOD_GRADIENT]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.topAccent}
              />
            ) : null}

            {showSuccess ? (
              <MetricLogSuccessContent
                title="Glicemia registrada!"
                message={`${formatMgLabel(amountMg)} · ${selectedContextLabel} salvos no seu histórico.`}
              />
            ) : (
              <ScrollView
                ref={scrollRef}
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
                    colors={[...BLOOD_GRADIENT]}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.85, y: 1 }}
                    style={styles.fieldIconOrb}
                  >
                    <MaterialCommunityIcons name="blood-bag" size={22} color="#fff" />
                  </LinearGradient>

                  <View style={styles.headerTextCol}>
                    <Text style={styles.headerTitle}>Glicemia</Text>
                    <Text style={styles.subtitle}>Registre sua medição agora</Text>
                  </View>

                  <Pressable
                    onPress={handleDismiss}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Fechar registro de glicemia"
                  >
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.contentRow}>
                  {keyboardInset === 0 ? (
                    <View style={styles.dropColumn}>
                      <Text style={styles.dropHint}>Arraste na gota</Text>

                      <View style={styles.dropStage}>
                        <View style={styles.tickColumn} pointerEvents="none">
                          <View style={[styles.fillIndicator, { top: fillIndicatorTop }]} />

                          {Array.from({ length: RULER_SEGMENTS + 1 }, (_, index) => {
                            const tickMg = MAX_MG - index * rulerStepMg
                            const active = amountMg >= tickMg
                            const showLabel =
                              index % 2 === 0 || tickMg === MIN_MG || tickMg === MAX_MG
                            return (
                              <View key={tickMg} style={styles.tickRow}>
                                <View style={[styles.tickMark, active && styles.tickMarkActive]} />
                                {showLabel ? (
                                  <Text style={[styles.tickLabel, active && styles.tickLabelActive]}>
                                    {formatTickLabel(tickMg)}
                                  </Text>
                                ) : (
                                  <View style={styles.tickLabelSpacer} />
                                )}
                              </View>
                            )
                          })}
                        </View>

                        <View style={styles.dropTouchArea} {...dropPanResponder.panHandlers}>
                          <BloodDropVisual amountMg={amountMg} active={dropGesturesReady} />
                        </View>
                      </View>
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.amountColumn,
                      keyboardInset > 0 && styles.amountColumnExpanded,
                    ]}
                  >
                    <Text style={styles.amountLabel}>Medição</Text>

                    <View style={styles.amountDisplayCard}>
                      <Text style={styles.amountValue}>{formatMgLabel(amountMg)}</Text>
                      <View
                        style={[
                          styles.zoneBadge,
                          { backgroundColor: zone.bg, borderColor: zone.border },
                        ]}
                      >
                        <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
                        <Text style={[styles.zoneLabel, { color: zone.color }]}>{zone.label}</Text>
                      </View>
                      <Text style={styles.zoneHint}>
                        Referência para {selectedContextLabel.toLowerCase()}
                      </Text>
                    </View>

                    <View style={styles.inputCard}>
                      <Text style={styles.inputLabel}>Ou digite</Text>
                      <View style={styles.inputWrap}>
                        <TextInput
                          value={inputDraft}
                          onChangeText={handleInputChange}
                          onBlur={handleInputBlur}
                          placeholder="Ex: 92"
                          placeholderTextColor={colors.textSubtle}
                          keyboardType="number-pad"
                          style={styles.input}
                          selectionColor={colors.primary}
                          maxLength={3}
                          onFocus={() => {
                            requestAnimationFrame(() => {
                              scrollRef.current?.scrollTo({ y: 120, animated: true })
                            })
                          }}
                        />
                        <Text style={styles.inputSuffix}>mg/dL</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.contextLabel}>Momento da medição</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.contextRow}
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                >
                  {CONTEXT_OPTIONS.map((option) => (
                    <GlucoseContextChip
                      key={option.id}
                      option={option}
                      selected={readingContext === option.id}
                      onPress={() => handleContextSelect(option.id)}
                    />
                  ))}
                </ScrollView>

                <PrimaryButton label="Registrar glicemia" onPress={handleRegister} />
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
    paddingTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    maxHeight: '92%',
  },
  scrollContent: {
    flexGrow: 1,
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
  headerRowCompact: {
    marginBottom: 10,
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
    gap: 10,
    marginBottom: 10,
    height: DROP_HEIGHT + 28,
  },
  dropColumn: {
    flex: 1,
    alignItems: 'center',
    height: DROP_HEIGHT + 28,
  },
  dropHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dropStage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: DROP_HEIGHT + 4,
  },
  tickColumn: {
    height: DROP_HEIGHT,
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
    backgroundColor: '#f87171',
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 10,
  },
  tickMark: {
    width: 8,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tickMarkActive: {
    backgroundColor: '#ef4444',
    width: 10,
  },
  tickLabel: {
    color: colors.textSubtle,
    fontSize: 8,
    fontWeight: '600',
    width: 26,
  },
  tickLabelActive: {
    color: '#fca5a5',
  },
  tickLabelSpacer: {
    width: 26,
  },
  dropTouchArea: {
    width: DROP_WIDTH,
    height: DROP_HEIGHT + DROP_SVG_BOTTOM_PAD + 10,
    alignItems: 'center',
    marginTop: 10,
  },
  dropVisualRoot: {
    width: DROP_WIDTH,
    height: DROP_HEIGHT + DROP_SVG_BOTTOM_PAD + 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dropShadowSvg: {
    position: 'absolute',
    bottom: 0,
    left: -4,
  },
  dropPulseShell: {
    position: 'absolute',
    top: 0,
    width: DROP_WIDTH,
    height: DROP_HEIGHT + DROP_SVG_BOTTOM_PAD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodCell: {
    position: 'absolute',
    backgroundColor: 'rgba(254, 202, 202, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(127, 29, 29, 0.5)',
  },
  amountColumn: {
    flex: 1,
    height: DROP_HEIGHT + 28,
    justifyContent: 'center',
    gap: 8,
  },
  amountColumnExpanded: {
    height: undefined,
    minHeight: 0,
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  amountValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  zoneBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  zoneDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  zoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  zoneHint: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  inputCard: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  inputLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 4,
  },
  inputSuffix: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  contextLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  contextChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contextChipSelected: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(248, 113, 113, 0.45)',
  },
  contextChipPressed: {
    opacity: 0.85,
  },
  contextChipLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  contextChipLabelSelected: {
    color: '#fecaca',
  },
})
