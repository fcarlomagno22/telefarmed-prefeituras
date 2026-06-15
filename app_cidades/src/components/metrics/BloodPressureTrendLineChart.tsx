import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg'
import { colors } from '../../theme/colors'
import { BloodPressureTrendBucket } from '../../types/bloodPressure'
import { formatBloodPressureShort } from '../../utils/bloodPressure'
import { buildBloodPressureTrendGeometry } from '../../utils/bloodPressureTrendChart'

type BloodPressureTrendLineChartProps = {
  buckets: BloodPressureTrendBucket[]
  width: number
  height?: number
}

const HIT_RADIUS_PX = 28
const TOOLTIP_ESTIMATED_WIDTH = 156

function getTooltipAnchor(x: number, y: number) {
  const showBelow = y < 58
  const top = showBelow ? y + 16 : Math.max(6, y - 68)
  return { anchorX: x, top, showBelow }
}

export function BloodPressureTrendLineChart({
  buckets,
  width,
  height = 196,
}: BloodPressureTrendLineChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipMeasuredWidth, setTooltipMeasuredWidth] = useState(TOOLTIP_ESTIMATED_WIDTH)

  const geometry = useMemo(
    () => buildBloodPressureTrendGeometry(buckets, width, height),
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
    ? getTooltipAnchor(selectedPoint.x, selectedPoint.ySystolic)
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

        <Path
          d={geometry.diastolicPath}
          stroke="#38bdf8"
          strokeWidth={2.2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          opacity={0.9}
        />

        <Path
          d={geometry.systolicPath}
          stroke="#f59e0b"
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
            stroke="#f59e0b"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.45}
          />
        ) : null}

        {geometry.points.map((point, index) => {
          const isSelected = selectedIndex === index
          return (
            <Circle
              key={`${point.bucket.label}-${index}`}
              cx={point.x}
              cy={point.ySystolic}
              r={isSelected ? 6 : 4}
              fill={isSelected ? '#f59e0b' : '#14141a'}
              stroke={isSelected ? 'rgba(255, 255, 255, 0.95)' : '#f59e0b'}
              strokeWidth={2}
            />
          )
        })}

        {geometry.points.map((point, index) => (
          <Circle
            key={`dia-${point.bucket.label}-${index}`}
            cx={point.x}
            cy={point.yDiastolic}
            r={selectedIndex === index ? 5 : 3.5}
            fill={selectedIndex === index ? '#38bdf8' : '#14141a'}
            stroke="#38bdf8"
            strokeWidth={1.8}
          />
        ))}

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
          key={`hit-${point.bucket.label}-${index}`}
          onPress={() => handlePointPress(index)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Ver média diária de ${point.bucket.label}`}
          style={[
            styles.pointHitTarget,
            {
              left: point.x - HIT_RADIUS_PX,
              top: point.ySystolic - HIT_RADIUS_PX,
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
            },
          ]}
        >
          <Text style={styles.tooltipWhen}>{selectedPoint.bucket.label}</Text>
          <Text style={styles.tooltipValue}>
            Sistólica{' '}
            <Text style={styles.tooltipSys}>
              {formatBloodPressureShort(
                selectedPoint.bucket.avgSystolic,
                selectedPoint.bucket.avgDiastolic,
              ).split('/')[0]}{' '}
              mmHg
            </Text>
          </Text>
          <Text style={styles.tooltipValue}>
            Diastólica{' '}
            <Text style={styles.tooltipDia}>
              {selectedPoint.bucket.avgDiastolic} mmHg
            </Text>
          </Text>
          <Text style={styles.tooltipMeta}>
            {selectedPoint.bucket.count}{' '}
            {selectedPoint.bucket.count === 1 ? 'medição' : 'medições'}
          </Text>
        </View>
      ) : null}

      <View style={styles.legendRow} pointerEvents="none">
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Sistólica</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: '#38bdf8' }]} />
          <Text style={styles.legendText}>Diastólica</Text>
        </View>
      </View>
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
    borderColor: 'rgba(245, 158, 11, 0.35)',
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
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  tooltipSys: {
    color: '#f59e0b',
    fontWeight: '800',
  },
  tooltipDia: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  tooltipMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  legendRow: {
    position: 'absolute',
    right: 8,
    top: 4,
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendDash: {
    width: 14,
    height: 3,
    borderRadius: 999,
  },
  legendText: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
  },
})
