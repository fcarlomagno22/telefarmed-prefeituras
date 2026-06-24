import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { colors } from '../../../theme/colors'

type PieSlice = {
  id: string
  label: string
  value: number
  gradient: readonly [string, string, string]
}

type SudokuVictoryPieChartProps = {
  slices: PieSlice[]
  size?: number
}

const ANIMATION_MS = 1400
const SLICE_GAP_DEG = 2.5

function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  if (endAngle - startAngle <= 0) return ''

  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle)
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle)
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle)
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

export function SudokuVictoryPieChart({ slices, size = 220 }: SudokuVictoryPieChartProps) {
  const progress = useRef(new Animated.Value(0)).current
  const [sweepProgress, setSweepProgress] = useState(0)

  const activeSlices = useMemo(
    () => slices.filter((slice) => slice.value > 0),
    [slices],
  )

  const total = useMemo(
    () => activeSlices.reduce((sum, slice) => sum + slice.value, 0),
    [activeSlices],
  )

  useEffect(() => {
    progress.setValue(0)
    setSweepProgress(0)

    const listenerId = progress.addListener(({ value }) => {
      setSweepProgress(value)
    })

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    animation.start()

    return () => {
      animation.stop()
      progress.removeListener(listenerId)
    }
  }, [activeSlices, progress, total])

  const center = size / 2
  const outerRadius = size / 2 - 3
  const ringThickness = Math.max(12, Math.round(size * 0.15))
  const innerRadius = outerRadius - ringThickness
  const centerBadgeSize = Math.round(innerRadius * 1.72)
  const centerValueSize = Math.max(14, Math.round(centerBadgeSize * 0.34))
  const centerLabelSize = Math.max(7, Math.round(centerBadgeSize * 0.14))

  const sliceLayout = useMemo(() => {
    if (total === 0 || activeSlices.length === 0) return []

    const totalGap = activeSlices.length * SLICE_GAP_DEG
    const sweepableAngle = 360 - totalGap

    let angleCursor = 0
    return activeSlices.map((slice) => {
      const sliceAngle = (slice.value / total) * sweepableAngle
      const startAngle = angleCursor + SLICE_GAP_DEG / 2
      const fullEndAngle = startAngle + sliceAngle
      const segment = {
        ...slice,
        startAngle,
        fullEndAngle,
      }
      angleCursor += sliceAngle + SLICE_GAP_DEG
      return segment
    })
  }, [activeSlices, total])

  const renderedSlices = sliceLayout.map((slice) => {
    const animatedEnd = slice.startAngle + (slice.fullEndAngle - slice.startAngle) * sweepProgress
    const path = describeDonutSlice(center, center, outerRadius, innerRadius, slice.startAngle, animatedEnd)
    return {
      ...slice,
      path,
    }
  })

  if (total === 0) {
    return (
      <View style={[styles.emptyWrap, { width: size, height: size }]}>
        <Text style={styles.emptyLabel}>Sem tentativas registradas</Text>
      </View>
    )
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {renderedSlices.map((slice) => (
            <LinearGradient
              key={`grad-${slice.id}`}
              id={`sudoku-pie-${slice.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor={slice.gradient[0]} />
              <Stop offset="55%" stopColor={slice.gradient[1]} />
              <Stop offset="100%" stopColor={slice.gradient[2]} />
            </LinearGradient>
          ))}
        </Defs>

        {renderedSlices.map((slice) =>
          slice.path ? (
            <Path
              key={slice.id}
              d={slice.path}
              fill={`url(#sudoku-pie-${slice.id})`}
              stroke="rgba(10, 10, 12, 0.45)"
              strokeWidth={0.75}
              strokeLinejoin="round"
            />
          ) : null,
        )}
      </Svg>

      <View
        style={[
          styles.centerBadge,
          {
            width: centerBadgeSize,
            height: centerBadgeSize,
            borderRadius: centerBadgeSize / 2,
          },
        ]}
      >
        <Text style={[styles.centerValue, { fontSize: centerValueSize }]}>{total}</Text>
        <Text style={[styles.centerLabel, { fontSize: centerLabelSize }]}>jogadas</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  centerBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 0,
  },
  centerValue: {
    color: colors.text,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: undefined,
  },
  centerLabel: {
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginTop: -1,
  },
})
