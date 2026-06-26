import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { colors } from '../../../theme/colors'
import type { SleepWeekSummary } from '../../../types/sleepHistory'
import { formatSleepDuration, getSleepQualityLabel } from '../../../utils/sleepLogFormat'

type SleepTimeHistoryComboChartProps = {
  summary: SleepWeekSummary
  width: number
  animate?: boolean
  selectedDateIso?: string | null
  onSelectDay?: (dateIso: string) => void
}

const CHART_HEIGHT = 180
const WRAP_PADDING = 16
const CARD_PADDING = 14
const PADDING = { top: 16, right: 8, bottom: 34, left: 8 }
const BAR_RADIUS = 7
const TARGET_MINUTES = 8 * 60
const HIT_PADDING_X = 4
const TOOLTIP_ESTIMATED_WIDTH = 156
const TOOLTIP_HEIGHT = 68

export function SleepTimeHistoryComboChart({
  summary,
  width,
  animate = true,
  selectedDateIso,
  onSelectDay,
}: SleepTimeHistoryComboChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const progress = useRef(new Animated.Value(0)).current
  const [drawProgress, setDrawProgress] = useState(0)

  const days = summary.dayStats
  const activeDays = days.filter((day) => !day.isFuture && day.hasData)
  const maxDuration = Math.max(...activeDays.map((day) => day.durationMinutes), TARGET_MINUTES, 1)

  const chartWidth = width - (WRAP_PADDING + CARD_PADDING) * 2
  const plotWidth = chartWidth - PADDING.left - PADDING.right
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom
  const slotWidth = plotWidth / Math.max(days.length, 1)
  const barWidth = Math.max(12, slotWidth - 10)

  const barGeometries = useMemo(
    () =>
      days.map((day, index) => {
        const x = PADDING.left + index * slotWidth + (slotWidth - barWidth) / 2
        const rawHeight =
          day.isFuture || !day.hasData
            ? 0
            : (day.durationMinutes / maxDuration) * plotHeight * drawProgress
        const barHeight = Math.max(rawHeight, day.hasData ? 4 : 0)
        const y = PADDING.top + plotHeight - barHeight
        const qualityY =
          day.isFuture || !day.hasData || day.quality == null
            ? PADDING.top + plotHeight
            : PADDING.top + plotHeight - (day.quality / 5) * plotHeight * drawProgress

        return { day, index, x, y, barHeight, barWidth, qualityY }
      }),
    [barWidth, days, drawProgress, maxDuration, plotHeight, slotWidth],
  )

  const linePath = barGeometries
    .filter((item) => !item.day.isFuture && item.day.hasData && item.day.quality != null)
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x + item.barWidth / 2} ${item.qualityY}`)
    .join(' ')

  useEffect(() => {
    if (!animate) {
      progress.setValue(1)
      setDrawProgress(1)
      return
    }

    progress.setValue(0)
    setDrawProgress(0)
    const listenerId = progress.addListener(({ value }) => setDrawProgress(value))
    Animated.timing(progress, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()

    return () => progress.removeListener(listenerId)
  }, [animate, progress, summary.weekLabel])

  useEffect(() => {
    if (!selectedDateIso) {
      setSelectedIndex(null)
      return
    }
    const index = days.findIndex((day) => day.dateIso === selectedDateIso)
    setSelectedIndex(index >= 0 ? index : null)
  }, [days, selectedDateIso])

  function handleSelectDay(index: number) {
    const day = days[index]
    if (!day || day.isFuture) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIndex(index)
    onSelectDay?.(day.dateIso)
  }

  const selected = selectedIndex != null ? barGeometries[selectedIndex] : null

  const tooltipLeft = selected
    ? Math.min(
        Math.max(selected.x + selected.barWidth / 2 - TOOLTIP_ESTIMATED_WIDTH / 2, 4),
        chartWidth - TOOLTIP_ESTIMATED_WIDTH - 4,
      )
    : 0

  const tooltipAnchorY = selected
    ? Math.min(selected.y, selected.qualityY)
    : 0

  const tooltipTop = selected
    ? Math.max(4, tooltipAnchorY - TOOLTIP_HEIGHT - 8)
    : 0

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.12)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Esta semana</Text>
          <Text style={styles.subtitle}>Barras = horas dormidas · Linha = qualidade do sono (1–5)</Text>
        </View>

        <View style={[styles.chartArea, { width: chartWidth, height: CHART_HEIGHT }]}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <SvgLinearGradient id="sleepDurationBar" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#c7d2fe" stopOpacity={1} />
                <Stop offset="100%" stopColor="#4338ca" stopOpacity={0.92} />
              </SvgLinearGradient>
              <SvgLinearGradient id="sleepDurationBarSelected" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#e0e7ff" stopOpacity={1} />
                <Stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
              </SvgLinearGradient>
            </Defs>

            <Line
              x1={PADDING.left}
              y1={PADDING.top + plotHeight - (TARGET_MINUTES / maxDuration) * plotHeight}
              x2={PADDING.left + plotWidth}
              y2={PADDING.top + plotHeight - (TARGET_MINUTES / maxDuration) * plotHeight}
              stroke="rgba(165, 180, 252, 0.35)"
              strokeDasharray="4 4"
            />

            {barGeometries.map((item) => {
              const isSelected = selectedIndex === item.index || selectedDateIso === item.day.dateIso
              const fill = isSelected ? 'url(#sleepDurationBarSelected)' : 'url(#sleepDurationBar)'

              return (
                <Rect
                  key={`bar-${item.day.dateIso}`}
                  x={item.x}
                  y={item.y}
                  width={item.barWidth}
                  height={Math.max(item.barHeight, item.day.isFuture ? 6 : 0)}
                  rx={BAR_RADIUS}
                  fill={item.day.isFuture ? 'rgba(255,255,255,0.06)' : fill}
                  opacity={item.day.isFuture ? 0.55 : item.day.hasData ? 1 : 0.35}
                />
              )
            })}

            {linePath ? (
              <>
                <Path
                  d={linePath}
                  stroke="#f0abfc"
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {barGeometries
                  .filter((item) => !item.day.isFuture && item.day.hasData && item.day.quality != null)
                  .map((item) => (
                    <Circle
                      key={`dot-${item.day.dateIso}`}
                      cx={item.x + item.barWidth / 2}
                      cy={item.qualityY}
                      r={selectedIndex === item.index ? 5 : 3.5}
                      fill="#e879f9"
                    />
                  ))}
              </>
            ) : null}

            {barGeometries.map((item) => (
              <SvgText
                key={`label-${item.day.dateIso}`}
                x={item.x + item.barWidth / 2}
                y={CHART_HEIGHT - 10}
                fill={item.day.isFuture ? 'rgba(245,245,247,0.28)' : colors.textSubtle}
                fontSize={10}
                fontWeight="700"
                textAnchor="middle"
              >
                {item.day.weekdayLabel}
              </SvgText>
            ))}

            <Line
              x1={PADDING.left}
              y1={PADDING.top + plotHeight}
              x2={PADDING.left + plotWidth}
              y2={PADDING.top + plotHeight}
              stroke="rgba(255,255,255,0.08)"
            />
          </Svg>

          {barGeometries.map((item) =>
            item.day.isFuture ? null : (
              <Pressable
                key={`hit-${item.day.dateIso}`}
                onPress={() => handleSelectDay(item.index)}
                accessibilityRole="button"
                accessibilityLabel={
                  item.day.hasData
                    ? `${item.day.weekdayLabel}: ${formatSleepDuration(item.day.durationMinutes)}, qualidade ${item.day.quality ?? '—'} de 5`
                    : `${item.day.weekdayLabel}: sem registro`
                }
                style={[
                  styles.barHitTarget,
                  {
                    left: item.x - HIT_PADDING_X,
                    top: PADDING.top,
                    width: item.barWidth + HIT_PADDING_X * 2,
                    height: plotHeight,
                  },
                ]}
              />
            ),
          )}

          {selected ? (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  left: tooltipLeft,
                  top: tooltipTop,
                  width: TOOLTIP_ESTIMATED_WIDTH,
                  borderColor: selected.day.isToday
                    ? 'rgba(165, 180, 252, 0.55)'
                    : 'rgba(99, 102, 241, 0.45)',
                },
              ]}
            >
              <Text style={styles.tooltipWhen}>
                {selected.day.weekdayLabel} · {selected.day.dayNumber}
                {selected.day.isToday ? ' · Hoje' : ''}
              </Text>
              {selected.day.hasData ? (
                <>
                  <Text style={styles.tooltipValue}>
                    {formatSleepDuration(selected.day.durationMinutes)}
                  </Text>
                  <Text style={styles.tooltipMeta}>
                    Qualidade{' '}
                    {selected.day.quality != null
                      ? `${selected.day.quality}/5 · ${getSleepQualityLabel(selected.day.quality)}`
                      : 'não informada'}
                  </Text>
                </>
              ) : (
                <Text style={styles.tooltipEmpty}>Sem registro neste dia</Text>
              )}
            </View>
          ) : null}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Horas dormidas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e879f9' }]} />
            <Text style={styles.legendText}>Qualidade</Text>
          </View>
          <Text style={styles.targetHint}>Meta 8h</Text>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: WRAP_PADDING,
  },
  card: {
    borderRadius: 22,
    padding: CARD_PADDING,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.16)',
    overflow: 'visible',
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
  },
  chartArea: {
    position: 'relative',
    overflow: 'visible',
    alignSelf: 'center',
  },
  barHitTarget: {
    position: 'absolute',
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 14, 20, 0.96)',
    borderWidth: 1,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipWhen: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tooltipValue: {
    color: '#c7d2fe',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tooltipMeta: {
    color: '#f0abfc',
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipEmpty: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#818cf8',
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  targetHint: {
    marginLeft: 'auto',
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
})
