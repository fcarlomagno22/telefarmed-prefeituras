import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg'
import { colors } from '../../../theme/colors'
import type { SleepWeekSummary } from '../../../types/sleepHistory'
import { formatSleepDuration } from '../../../utils/sleepLogFormat'

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

export function SleepTimeHistoryComboChart({
  summary,
  width,
  animate = true,
  selectedDateIso,
  onSelectDay,
}: SleepTimeHistoryComboChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current
  const [drawProgress, setDrawProgress] = useState(animate ? 0 : 1)

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
  const tooltipLabel = selected?.day.hasData
    ? `${selected.day.weekdayLabel} · ${formatSleepDuration(selected.day.durationMinutes)} · ${selected.day.quality ?? '—'}/5`
    : null

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.12)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Horas dormidas e qualidade</Text>
          {tooltipLabel ? (
            <Text style={styles.tooltipInline} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {tooltipLabel}
            </Text>
          ) : (
            <Text style={styles.subtitle}>Barras = duração · Linha = qualidade (1–5)</Text>
          )}
        </View>

        <View style={styles.chartArea}>
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
                  onPress={() => handleSelectDay(item.index)}
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
                      onPress={() => handleSelectDay(item.index)}
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
  tooltipInline: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  chartArea: {
    width: '100%',
    alignItems: 'center',
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
