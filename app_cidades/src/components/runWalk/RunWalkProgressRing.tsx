import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg'
import { colors } from '../../theme/colors'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
const RING_ANIMATION_DURATION = 750

type RunWalkProgressRingProps = {
  progress: number
  value: string
  label: string
  size?: number
  stroke?: number
  gradientId: string
  gradientColors: readonly [string, string, string]
  animate?: boolean
  preserveFinal?: boolean
  animationDelay?: number
  countTo?: number
  formatCount?: (value: number) => string
}

function getIdleDisplayValue(
  value: string,
  countTo: number | undefined,
  formatCount: ((value: number) => string) | undefined,
  preserveFinal: boolean,
) {
  if (preserveFinal) return value
  if (countTo != null) {
    return formatCount?.(0) ?? '0'
  }
  return value
}

export function RunWalkProgressRing({
  progress,
  value,
  label,
  size = 72,
  stroke = 5,
  gradientId,
  gradientColors,
  animate = true,
  preserveFinal = true,
  animationDelay = 0,
  countTo,
  formatCount,
}: RunWalkProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.min(1, Math.max(0, progress))
  const animatedValue = useRef(
    new Animated.Value(animate ? 0 : preserveFinal ? 1 : 0),
  ).current
  const [displayValue, setDisplayValue] = useState(() =>
    getIdleDisplayValue(value, countTo, formatCount, preserveFinal || animate),
  )
  const countToRef = useRef(countTo)
  const formatCountRef = useRef(formatCount)
  const shouldAnimateCount = animate && countTo != null

  countToRef.current = countTo
  formatCountRef.current = formatCount

  useEffect(() => {
    if (!animate) {
      animatedValue.setValue(preserveFinal ? 1 : 0)
      setDisplayValue(getIdleDisplayValue(value, countTo, formatCount, preserveFinal))
      return
    }

    animatedValue.setValue(0)
    setDisplayValue(
      shouldAnimateCount
        ? (formatCountRef.current?.(0) ?? '0')
        : value,
    )

    const animation = Animated.timing(animatedValue, {
      toValue: 1,
      duration: RING_ANIMATION_DURATION,
      delay: animationDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    animation.start()
    return () => animation.stop()
  }, [animate, animationDelay, animatedValue, preserveFinal, shouldAnimateCount])

  useEffect(() => {
    if (animate || shouldAnimateCount) return
    setDisplayValue(value)
  }, [animate, shouldAnimateCount, value])

  useEffect(() => {
    if (!shouldAnimateCount) return

    const listenerId = animatedValue.addListener(({ value: progressRatio }) => {
      const current = (countToRef.current ?? 0) * progressRatio
      const formatter = formatCountRef.current
      setDisplayValue(formatter ? formatter(current) : String(Math.round(current)))
    })

    return () => {
      animatedValue.removeListener(listenerId)
    }
  }, [animatedValue, shouldAnimateCount])

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, circumference * (1 - clampedProgress)],
  })

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} />
            <Stop offset="55%" stopColor={gradientColors[1]} />
            <Stop offset="100%" stopColor={gradientColors[2]} />
          </SvgLinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={stroke}
          fill="none"
        />

        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={styles.value}>{displayValue}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    paddingHorizontal: 6,
  },
  value: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
})
