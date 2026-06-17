import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, {
  Circle,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg'
import { colors } from '../../../theme/colors'
import type { RunWalkHistoryTrendPoint } from '../../../types/runWalkHistory'
import { buildHistoryTrendGeometry } from '../../../utils/runWalkHistoryStats'

type RunWalkHistoryTrendChartProps = {
  points: RunWalkHistoryTrendPoint[]
  width: number
  height?: number
  animate?: boolean
  preserveFinal?: boolean
  onPointPress?: (activityId: string) => void
}

const ENTRANCE_DURATION_MS = 1800

function buildSmoothTrendPaths(
  geometry: NonNullable<ReturnType<typeof buildHistoryTrendGeometry>>,
  pathProgress: number,
) {
  const coords = geometry.points
  const totalPoints = coords.length

  if (totalPoints === 0 || pathProgress <= 0) {
    return { linePath: '', areaPath: '', visiblePointCount: 0 }
  }

  if (totalPoints === 1) {
    return {
      linePath: '',
      areaPath: '',
      visiblePointCount: pathProgress >= 0.5 ? 1 : 0,
    }
  }

  const maxProgress = totalPoints - 1
  const progress = Math.min(maxProgress, Math.max(0, pathProgress))
  const segmentIndex = Math.floor(progress)
  const fraction = progress - segmentIndex

  const partial = coords.slice(0, segmentIndex + 1)
  if (fraction > 0 && segmentIndex < totalPoints - 1) {
    const from = coords[segmentIndex]
    const to = coords[segmentIndex + 1]
    partial.push({
      x: from.x + (to.x - from.x) * fraction,
      y: from.y + (to.y - from.y) * fraction,
      index: segmentIndex,
    })
  }

  const linePath = partial
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const baseY = geometry.plotTop + geometry.plotHeight
  const areaPath =
    partial.length >= 2
      ? `${linePath} L ${partial[partial.length - 1].x} ${baseY} L ${partial[0].x} ${baseY} Z`
      : ''

  const visiblePointCount = Math.min(totalPoints, Math.floor(progress) + 1)

  return { linePath, areaPath, visiblePointCount }
}

export function RunWalkHistoryTrendChart({
  points,
  width,
  height = 184,
  animate = false,
  preserveFinal = true,
  onPointPress,
}: RunWalkHistoryTrendChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [pathProgress, setPathProgress] = useState(0)
  const progress = useRef(new Animated.Value(preserveFinal ? 1 : 0)).current

  const geometry = useMemo(
    () => buildHistoryTrendGeometry(points, width, height),
    [height, points, width],
  )

  const totalPoints = geometry?.points.length ?? 0
  const maxPathProgress = totalPoints > 1 ? totalPoints - 1 : totalPoints === 1 ? 1 : 0

  useEffect(() => {
    setSelectedIndex(null)
  }, [points, width])

  useEffect(() => {
    if (!geometry || totalPoints === 0) return

    progress.stopAnimation()

    if (!animate) {
      progress.setValue(preserveFinal ? 1 : 0)
      setPathProgress(preserveFinal ? maxPathProgress : 0)
      return
    }

    progress.setValue(0)
    setPathProgress(0)

    const listenerId = progress.addListener(({ value }) => {
      setPathProgress(value * maxPathProgress)
    })

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ENTRANCE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    animation.start(({ finished }) => {
      if (finished) {
        setPathProgress(maxPathProgress)
        progress.setValue(1)
      }
    })

    return () => {
      progress.removeListener(listenerId)
      animation.stop()
    }
  }, [animate, geometry, maxPathProgress, preserveFinal, progress, totalPoints])

  if (!geometry || points.length === 0) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Sem treinos suficientes para a linha de evolução.</Text>
      </View>
    )
  }

  const { linePath, areaPath, visiblePointCount } = buildSmoothTrendPaths(geometry, pathProgress)
  const selectedPoint =
    selectedIndex != null && selectedIndex < visiblePointCount
      ? geometry.points[selectedIndex]
      : null
  const selectedData =
    selectedIndex != null && selectedIndex < visiblePointCount ? points[selectedIndex] : null

  return (
    <View style={[styles.root, { width, height }]}>
      <Svg width={width} height={height} pointerEvents="none">
        {geometry.yTicks.map((tick) => (
          <Line
            key={`grid-${tick.value}`}
            x1={geometry.plotLeft}
            y1={tick.y}
            x2={geometry.plotLeft + geometry.plotWidth}
            y2={tick.y}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1}
          />
        ))}

        {geometry.yTicks.map((tick) => (
          <SvgText
            key={`ylabel-${tick.value}`}
            x={geometry.plotLeft - 8}
            y={tick.y + 3}
            fill="rgba(245, 245, 247, 0.35)"
            fontSize={9}
            fontWeight="600"
            textAnchor="end"
          >
            {tick.value.toFixed(1).replace('.', ',')}
          </SvgText>
        ))}

        {areaPath ? (
          <Path d={areaPath} fill="rgba(110, 231, 183, 0.14)" />
        ) : null}

        {linePath ? (
          <Path
            d={linePath}
            stroke="#6ee7b7"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {selectedPoint ? (
          <Line
            x1={selectedPoint.x}
            y1={geometry.plotTop}
            x2={selectedPoint.x}
            y2={geometry.plotTop + geometry.plotHeight}
            stroke="rgba(110, 231, 183, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}

        {geometry.points.slice(0, visiblePointCount).map((point) => (
          <Circle
            key={`point-${point.index}`}
            cx={point.x}
            cy={point.y}
            r={selectedIndex === point.index ? 5 : 3.5}
            fill={selectedIndex === point.index ? '#6ee7b7' : '#93c5fd'}
            stroke="#0a0a0c"
            strokeWidth={2}
          />
        ))}
      </Svg>

      {geometry.points.slice(0, visiblePointCount).map((point) => (
        <Pressable
          key={`hit-${point.index}`}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setSelectedIndex((current) => (current === point.index ? null : point.index))
            onPointPress?.(points[point.index]?.id ?? '')
          }}
          hitSlop={6}
          style={[
            styles.hit,
            {
              left: point.x - 22,
              top: point.y - 22,
            },
          ]}
        />
      ))}

      {selectedData && selectedPoint ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: Math.min(Math.max(selectedPoint.x - 70, 8), width - 148),
              top: Math.max(selectedPoint.y - 58, 8),
            },
          ]}
        >
          <Text style={styles.tooltipValue}>
            {selectedData.value.toFixed(1).replace('.', ',')} km
          </Text>
          <Text style={styles.tooltipDate}>{selectedData.label}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    overflow: 'visible',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  hit: {
    position: 'absolute',
    width: 44,
    height: 44,
    zIndex: 2,
  },
  tooltip: {
    position: 'absolute',
    width: 140,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 14, 20, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(110, 231, 183, 0.28)',
    gap: 2,
    zIndex: 3,
  },
  tooltipValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  tooltipDate: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
