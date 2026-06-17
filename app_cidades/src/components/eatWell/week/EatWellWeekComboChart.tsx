import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Defs, Line, LinearGradient as SvgLinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg'
import type { EatWellWeekChartMode, EatWellWeekSummary } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { formatCalories, formatLitersFromMl } from '../../../utils/eatWellNutritionStats'

type EatWellWeekComboChartProps = {
  summary: EatWellWeekSummary
  width: number
  animate?: boolean
}

const CHART_HEIGHT = 180
const WRAP_PADDING = 16
const CARD_PADDING = 14
const PADDING = { top: 16, right: 8, bottom: 34, left: 8 }
const BAR_RADIUS = 7

export function EatWellWeekComboChart({
  summary,
  width,
  animate = true,
}: EatWellWeekComboChartProps) {
  const [mode, setMode] = useState<EatWellWeekChartMode>('both')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current
  const [drawProgress, setDrawProgress] = useState(animate ? 0 : 1)

  const days = summary.dayStats
  const activeDays = days.filter((day) => !day.isFuture)
  const maxCalories = Math.max(...activeDays.map((day) => day.calories), 1)
  const maxWater = Math.max(...activeDays.map((day) => day.waterMl), 1)

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
          day.isFuture || day.calories <= 0
            ? 0
            : (day.calories / maxCalories) * plotHeight * drawProgress
        const barHeight = Math.max(rawHeight, day.calories > 0 ? 4 : 0)
        const y = PADDING.top + plotHeight - barHeight
        const waterY =
          day.isFuture || day.waterMl <= 0
            ? PADDING.top + plotHeight
            : PADDING.top + plotHeight - (day.waterMl / maxWater) * plotHeight * drawProgress

        return { day, index, x, y, barHeight, barWidth, waterY }
      }),
    [barWidth, days, drawProgress, maxCalories, maxWater, plotHeight, slotWidth],
  )

  const linePath = barGeometries
    .filter((item) => !item.day.isFuture && item.day.waterMl > 0)
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x + item.barWidth / 2} ${item.waterY}`)
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

  function handleModePress(nextMode: EatWellWeekChartMode) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setMode(nextMode)
  }

  function handleSelectDay(index: number) {
    const day = days[index]
    if (day?.isFuture) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIndex(index)
  }

  const selected = selectedIndex != null ? barGeometries[selectedIndex] : null
  const tooltipLabel = selected
    ? `${selected.day.weekdayLabel} · ${selected.day.dayNumber} · ${formatCalories(selected.day.calories)} · ${formatLitersFromMl(selected.day.waterMl)}`
    : null

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(245, 158, 11, 0.1)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Calorias e água por dia</Text>
          <View style={styles.controlsRow}>
            <View style={styles.toggleRow}>
              {(['both', 'calories', 'water'] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => handleModePress(item)}
                  style={[styles.toggleChip, mode === item && styles.toggleChipActive]}
                >
                  <Text style={[styles.toggleText, mode === item && styles.toggleTextActive]}>
                    {item === 'both' ? 'Ambos' : item === 'calories' ? 'Kcal' : 'Água'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tooltipLabel ? (
              <Text style={styles.tooltipInline} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                {tooltipLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.chartArea}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
          <Defs>
            <SvgLinearGradient id="eatWellCalorieBar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fde68a" stopOpacity={1} />
              <Stop offset="100%" stopColor="#d97706" stopOpacity={0.92} />
            </SvgLinearGradient>
            <SvgLinearGradient id="eatWellCalorieBarSelected" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#fef08a" stopOpacity={1} />
              <Stop offset="100%" stopColor="#f59e0b" stopOpacity={1} />
            </SvgLinearGradient>
            <SvgLinearGradient id="eatWellCalorieBarFuture" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" stopOpacity={1} />
              <Stop offset="100%" stopColor="rgba(255,255,255,0.03)" stopOpacity={1} />
            </SvgLinearGradient>
          </Defs>

          {barGeometries.map((item) => {
            const isSelected = selectedIndex === item.index
            const showBar = mode === 'both' || mode === 'calories'
            if (!showBar) return null

            const fill = item.day.isFuture
              ? 'url(#eatWellCalorieBarFuture)'
              : isSelected
                ? 'url(#eatWellCalorieBarSelected)'
                : 'url(#eatWellCalorieBar)'

            return (
              <Rect
                key={`bar-${item.day.dateIso}`}
                x={item.x}
                y={item.y}
                width={item.barWidth}
                height={Math.max(item.barHeight, item.day.isFuture ? 6 : 0)}
                rx={BAR_RADIUS}
                fill={fill}
                opacity={item.day.isFuture ? 0.55 : 1}
                onPress={() => handleSelectDay(item.index)}
              />
            )
          })}

          {(mode === 'both' || mode === 'water') && linePath ? (
            <>
              <Path
                d={linePath}
                stroke="#22d3ee"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {barGeometries
                .filter((item) => !item.day.isFuture && item.day.waterMl > 0)
                .map((item) => (
                  <Circle
                    key={`dot-${item.day.dateIso}`}
                    cx={item.x + item.barWidth / 2}
                    cy={item.waterY}
                    r={selectedIndex === item.index ? 5 : 3.5}
                    fill="#67e8f9"
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

          {barGeometries.map((item) => (
            <Rect
              key={`hit-${item.day.dateIso}`}
              x={PADDING.left + item.index * slotWidth}
              y={PADDING.top}
              width={slotWidth}
              height={plotHeight}
              fill="transparent"
              onPress={() => handleSelectDay(item.index)}
            />
          ))}
        </Svg>
        </View>

        <View style={styles.legendRow}>
          {(mode === 'both' || mode === 'calories') && (
            <View style={styles.legendItem}>
              <View style={styles.legendDot} />
              <Text style={styles.legendText}>Calorias</Text>
            </View>
          )}
          {(mode === 'both' || mode === 'water') && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22d3ee' }]} />
              <Text style={styles.legendText}>Água</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 22,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.16)',
  },
  header: {
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  toggleChipActive: {
    backgroundColor: 'rgba(132, 204, 22, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(132, 204, 22, 0.35)',
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#a3e635',
  },
  tooltipInline: {
    flex: 1,
    color: colors.text,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
    letterSpacing: -0.1,
  },
  chartArea: {
    width: '100%',
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
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
    backgroundColor: '#fbbf24',
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
})
