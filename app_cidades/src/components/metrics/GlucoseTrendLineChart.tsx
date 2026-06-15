import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { colors } from '../../theme/colors'
import { GlucoseTrendBucket } from '../../types/glucose'
import { buildTrendLineGeometry } from '../../utils/glucoseTrendChart'

type GlucoseTrendLineChartProps = {
  buckets: GlucoseTrendBucket[]
  width: number
  height?: number
  accentColor?: string
}

const HIT_RADIUS_PX = 28
const TOOLTIP_ESTIMATED_WIDTH = 140

function getTooltipAnchor(x: number, y: number) {
  const showBelow = y < 58
  const top = showBelow ? y + 16 : Math.max(6, y - 58)
  return { anchorX: x, top, showBelow }
}

export function GlucoseTrendLineChart({
  buckets,
  width,
  height = 184,
  accentColor = '#ef4444',
}: GlucoseTrendLineChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipMeasuredWidth, setTooltipMeasuredWidth] = useState(TOOLTIP_ESTIMATED_WIDTH)

  const geometry = useMemo(
    () => buildTrendLineGeometry(buckets, width, height),
    [buckets, height, width],
  )

  useEffect(() => {
    setSelectedIndex(null)
  }, [buckets, height, width])

  function handlePointPress(index: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIndex((current) => (current === index ? null : index))
  }

  if (!geometry) return null

  const selectedPoint =
    selectedIndex !== null ? (geometry.points[selectedIndex] ?? null) : null
  const tooltipAnchor = selectedPoint
    ? getTooltipAnchor(selectedPoint.x, selectedPoint.y)
    : null
  const tooltipWidth = tooltipMeasuredWidth || TOOLTIP_ESTIMATED_WIDTH
  const tooltipLeft = tooltipAnchor
    ? Math.min(
        Math.max(tooltipAnchor.anchorX - tooltipWidth / 2, 6),
        width - tooltipWidth - 6,
      )
    : 0

  return (
    <View style={[styles.root, { width, height }]} collapsable={false}>
      <Svg width={width} height={height} pointerEvents="none">
        <Defs>
          <LinearGradient id="glucoseTrendArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fca5a5" stopOpacity={0.38} />
            <Stop offset="100%" stopColor="#fca5a5" stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

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
            {tick.value}
          </SvgText>
        ))}

        {geometry.areaPath ? (
          <Path d={geometry.areaPath} fill="url(#glucoseTrendArea)" />
        ) : null}

        <Path
          d={geometry.linePath}
          stroke={accentColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {selectedPoint ? (
          <Line
            x1={selectedPoint.x}
            y1={geometry.plotTop}
            x2={selectedPoint.x}
            y2={geometry.plotBottom}
            stroke={accentColor}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.45}
          />
        ) : null}

        {geometry.points.map((point, index) => {
          const isSelected = selectedIndex === index
          return (
            <Circle
              key={`${point.bucket.label}-${point.bucket.avg}-${index}`}
              cx={point.x}
              cy={point.y}
              r={isSelected ? 6 : 4}
              fill={isSelected ? accentColor : '#14141a'}
              stroke={isSelected ? 'rgba(255, 255, 255, 0.95)' : accentColor}
              strokeWidth={2}
            />
          )
        })}

        {geometry.xLabels.map((label) => (
          <SvgText
            key={`xlabel-${label.label}-${label.x}`}
            x={label.x}
            y={geometry.height - 8}
            fill="rgba(245, 245, 247, 0.35)"
            fontSize={8}
            fontWeight="600"
            textAnchor="middle"
          >
            {label.label}
          </SvgText>
        ))}
      </Svg>

      {geometry.points.map((point, index) => (
        <Pressable
          key={`hit-${point.bucket.label}-${point.bucket.avg}-${index}`}
          onPress={() => handlePointPress(index)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Ver média diária de ${point.bucket.label}`}
          style={[
            styles.pointHitTarget,
            {
              left: point.x - HIT_RADIUS_PX,
              top: point.y - HIT_RADIUS_PX,
              width: HIT_RADIUS_PX * 2,
              height: HIT_RADIUS_PX * 2,
            },
          ]}
        />
      ))}

      {selectedPoint && tooltipAnchor ? (
        <View
          pointerEvents="none"
          onLayout={(event) => {
            const nextWidth = Math.ceil(event.nativeEvent.layout.width)
            if (nextWidth > 0 && nextWidth !== tooltipMeasuredWidth) {
              setTooltipMeasuredWidth(nextWidth)
            }
          }}
          style={[
            styles.tooltip,
            {
              left: tooltipLeft,
              top: tooltipAnchor.top,
              maxWidth: width - 12,
              borderColor: `${accentColor}66`,
            },
          ]}
        >
          <Text style={styles.tooltipWhen}>{selectedPoint.bucket.label}</Text>
          <Text style={styles.tooltipValue}>
            Média diária{' '}
            <Text style={[styles.tooltipValueAccent, { color: accentColor }]}>
              {selectedPoint.bucket.avg} mg/dL
            </Text>
          </Text>
          <Text style={styles.tooltipMeta}>
            {selectedPoint.bucket.count}{' '}
            {selectedPoint.bucket.count === 1 ? 'medição' : 'medições'}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    zIndex: 2,
  },
  pointHitTarget: {
    position: 'absolute',
    zIndex: 10,
  },
  tooltip: {
    position: 'absolute',
    zIndex: 20,
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(18, 18, 24, 0.96)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  tooltipWhen: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  tooltipValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  tooltipValueAccent: {
    fontWeight: '800',
  },
  tooltipMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
})
