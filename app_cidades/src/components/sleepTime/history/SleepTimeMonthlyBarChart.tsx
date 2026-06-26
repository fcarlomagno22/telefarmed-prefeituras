import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Svg, {
  Defs,
  Line,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { colors } from '../../../theme/colors'
import type { SleepDayStat } from '../../../types/sleepHistory'
import { formatSleepDuration, getSleepQualityLabel } from '../../../utils/sleepLogFormat'

type SleepTimeMonthlyBarChartProps = {
  dayStats: SleepDayStat[]
  width: number
  monthLabel: string
  targetMinutesPerDay?: number
  selectedDateIso?: string | null
  onSelectDay?: (dateIso: string) => void
  visibleBars?: number
  animate?: boolean
}

const CHART_HEIGHT = 148
const PADDING_TOP = 12
const PADDING_BOTTOM = 38
const PADDING_LEFT = 4
const PADDING_RIGHT = 4
const HIT_PADDING_X = 4
const BAR_GAP = 8
const TOOLTIP_WIDTH = 156
const TOOLTIP_HEIGHT = 68
const VISIBLE_BARS_DEFAULT = 7

type BarGeometry = {
  day: SleepDayStat
  index: number
  x: number
  y: number
  barWidth: number
  barHeight: number
  baseHeight: number
  overflowHeight: number
  hasOverflow: boolean
}

export function SleepTimeMonthlyBarChart({
  dayStats,
  width,
  monthLabel,
  targetMinutesPerDay = 8 * 60,
  selectedDateIso = null,
  onSelectDay,
  visibleBars = VISIBLE_BARS_DEFAULT,
  animate = false,
}: SleepTimeMonthlyBarChartProps) {
  const scrollRef = useRef<ScrollView>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const progress = useRef(new Animated.Value(0)).current
  const [drawProgress, setDrawProgress] = useState(0)

  const scrollable = dayStats.length > visibleBars

  useEffect(() => {
    if (!scrollable) return
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false })
    }, 0)
    return () => clearTimeout(timer)
  }, [dayStats, scrollable, width])

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
  }, [animate, dayStats, progress])

  useEffect(() => {
    if (!selectedDateIso) {
      setSelectedIndex(null)
      return
    }
    const index = dayStats.findIndex((day) => day.dateIso === selectedDateIso)
    setSelectedIndex(index >= 0 ? index : null)
  }, [dayStats, selectedDateIso])

  const geometry = useMemo(() => {
    const viewportPlotWidth = width - PADDING_LEFT - PADDING_RIGHT
    const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
    const barCount = Math.max(dayStats.length, 1)
    const barsPerViewport = Math.min(visibleBars, barCount)
    const slotWidth =
      (viewportPlotWidth - BAR_GAP * (barsPerViewport - 1)) / Math.max(barsPerViewport, 1)
    const plotWidth = scrollable
      ? barCount * slotWidth + BAR_GAP * (barCount - 1)
      : viewportPlotWidth
    const barWidth = scrollable ? slotWidth : (plotWidth - BAR_GAP * (barCount - 1)) / barCount
    const chartRenderWidth = plotWidth + PADDING_LEFT + PADDING_RIGHT

    const maxValue = Math.max(
      targetMinutesPerDay,
      ...dayStats.map((day) => (day.hasData ? day.durationMinutes : 0)),
      1,
    )

    const plotBottom = PADDING_TOP + plotHeight
    const targetLineY = plotBottom - (targetMinutesPerDay / maxValue) * plotHeight

    const bars: BarGeometry[] = dayStats.map((day, index) => {
      const minutes = day.hasData ? day.durationMinutes : 0
      const scaledMinutes = minutes * drawProgress
      const x = PADDING_LEFT + index * (barWidth + BAR_GAP)
      const rawHeight = day.isFuture ? 6 : (scaledMinutes / maxValue) * plotHeight
      const barHeight = Math.max(rawHeight, day.hasData ? 4 : day.isFuture ? 6 : 0)
      const y = plotBottom - barHeight
      const baseMinutes = Math.min(scaledMinutes, targetMinutesPerDay)
      const overflowMinutes = Math.max(0, scaledMinutes - targetMinutesPerDay)
      const baseHeight =
        minutes > 0 ? Math.max((baseMinutes / maxValue) * plotHeight, 4) : barHeight
      const overflowHeight =
        overflowMinutes > 0 ? (overflowMinutes / maxValue) * plotHeight : 0
      const hasOverflow = overflowMinutes > 0

      return {
        day,
        index,
        x,
        y,
        barWidth,
        barHeight,
        baseHeight,
        overflowHeight,
        hasOverflow,
      }
    })

    return {
      bars,
      plotHeight,
      plotBottom,
      plotLeft: PADDING_LEFT,
      plotWidth,
      chartRenderWidth,
      targetLineY,
      showTargetLine: maxValue >= targetMinutesPerDay * 0.5,
    }
  }, [dayStats, drawProgress, scrollable, targetMinutesPerDay, visibleBars, width])

  const selectedBar =
    selectedIndex != null ? (geometry.bars[selectedIndex] ?? null) : null

  function isBarSelected(bar: BarGeometry) {
    if (selectedDateIso) return bar.day.dateIso === selectedDateIso
    return selectedIndex === bar.index
  }

  function handleBarPress(index: number) {
    const bar = geometry.bars[index]
    if (!bar || bar.day.isFuture) return
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedIndex(index)
    onSelectDay?.(bar.day.dateIso)
  }

  function getBarFillId(bar: BarGeometry, selected: boolean) {
    if (bar.day.isFuture) return 'sleepBarFuture'
    if (!bar.day.hasData) return 'sleepBarEmpty'
    if (bar.day.isToday) return selected ? 'sleepBarTodaySelected' : 'sleepBarToday'
    if (bar.hasOverflow) {
      const safeId = bar.day.dateIso.replace(/[^a-zA-Z0-9]/g, '')
      return `sleepBarOverflow-${safeId}`
    }
    return selected ? 'sleepBarActiveSelected' : 'sleepBarActive'
  }

  const tooltipLeft = selectedBar
    ? Math.min(
        Math.max(
          selectedBar.x + selectedBar.barWidth / 2 - TOOLTIP_WIDTH / 2,
          6,
        ),
        geometry.chartRenderWidth - TOOLTIP_WIDTH - 6,
      )
    : 0

  const tooltipTop = selectedBar ? Math.max(6, selectedBar.y - TOOLTIP_HEIGHT - 8) : 0

  const chartBody = (
    <View style={[styles.root, { width: geometry.chartRenderWidth, height: CHART_HEIGHT }]}>
      <Svg width={geometry.chartRenderWidth} height={CHART_HEIGHT}>
        <Defs>
          <SvgLinearGradient id="sleepBarActive" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#c7d2fe" stopOpacity={1} />
            <Stop offset="100%" stopColor="#4338ca" stopOpacity={0.95} />
          </SvgLinearGradient>
          <SvgLinearGradient id="sleepBarActiveSelected" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#e0e7ff" stopOpacity={1} />
            <Stop offset="100%" stopColor="#6366f1" stopOpacity={1} />
          </SvgLinearGradient>
          <SvgLinearGradient id="sleepBarToday" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ddd6fe" stopOpacity={1} />
            <Stop offset="100%" stopColor="#7c3aed" stopOpacity={0.95} />
          </SvgLinearGradient>
          <SvgLinearGradient id="sleepBarTodaySelected" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#ede9fe" stopOpacity={1} />
            <Stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
          </SvgLinearGradient>
          <SvgLinearGradient id="sleepBarEmpty" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.1)" stopOpacity={1} />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" stopOpacity={1} />
          </SvgLinearGradient>
          <SvgLinearGradient id="sleepBarFuture" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.08)" stopOpacity={1} />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.03)" stopOpacity={1} />
          </SvgLinearGradient>
          {geometry.bars
            .filter((bar) => bar.hasOverflow)
            .map((bar) => {
              const gradientId = `sleepBarOverflow-${bar.day.dateIso.replace(/[^a-zA-Z0-9]/g, '')}`
              const overflowRatio =
                bar.barHeight > 0
                  ? Math.max(0, Math.min(1, bar.overflowHeight / bar.barHeight))
                  : 0

              return (
                <SvgLinearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#fde68a" stopOpacity={1} />
                  <Stop offset={`${overflowRatio * 100}%`} stopColor="#f59e0b" stopOpacity={0.98} />
                  <Stop offset={`${overflowRatio * 100}%`} stopColor="#c7d2fe" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#4338ca" stopOpacity={0.95} />
                </SvgLinearGradient>
              )
            })}
        </Defs>

        {geometry.showTargetLine ? (
          <Line
            x1={geometry.plotLeft}
            y1={geometry.targetLineY}
            x2={geometry.plotLeft + geometry.plotWidth}
            y2={geometry.targetLineY}
            stroke="rgba(165, 180, 252, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}

        {geometry.bars.map((bar) => {
          const selected = isBarSelected(bar)
          return (
            <Rect
              key={bar.day.dateIso}
              x={bar.x}
              y={bar.y}
              width={bar.barWidth}
              height={bar.barHeight}
              rx={6}
              fill={`url(#${getBarFillId(bar, selected)})`}
              stroke={selected ? 'rgba(255, 255, 255, 0.55)' : 'transparent'}
              strokeWidth={selected ? 1.5 : 0}
              opacity={bar.day.isFuture ? 0.55 : 1}
            />
          )
        })}

        {geometry.bars.map((bar) => (
          <SvgText
            key={`weekday-${bar.day.dateIso}`}
            x={bar.x + bar.barWidth / 2}
            y={geometry.plotBottom + 12}
            fill={
              bar.day.isToday
                ? '#c4b5fd'
                : bar.day.isFuture
                  ? 'rgba(245, 245, 247, 0.28)'
                  : 'rgba(245, 245, 247, 0.45)'
            }
            fontSize={9}
            fontWeight={bar.day.isToday ? '700' : '600'}
            textAnchor="middle"
          >
            {bar.day.weekdayLabel}
          </SvgText>
        ))}

        {geometry.bars.map((bar) => (
          <SvgText
            key={`date-${bar.day.dateIso}`}
            x={bar.x + bar.barWidth / 2}
            y={geometry.plotBottom + 24}
            fill={
              bar.day.isToday
                ? '#ddd6fe'
                : bar.day.isFuture
                  ? 'rgba(245, 245, 247, 0.22)'
                  : 'rgba(245, 245, 247, 0.35)'
            }
            fontSize={8}
            fontWeight={bar.day.isToday ? '700' : '500'}
            textAnchor="middle"
          >
            {bar.day.dayNumber}
          </SvgText>
        ))}
      </Svg>

      {geometry.bars.map((bar) =>
        bar.day.isFuture ? null : (
          <Pressable
            key={`hit-${bar.day.dateIso}`}
            onPress={() => handleBarPress(bar.index)}
            accessibilityRole="button"
            accessibilityLabel={
              bar.day.hasData
                ? `${bar.day.weekdayLabel} ${bar.day.dayNumber}: ${formatSleepDuration(bar.day.durationMinutes)}, qualidade ${bar.day.quality ?? '—'} de 5`
                : `${bar.day.weekdayLabel} ${bar.day.dayNumber}: sem registro`
            }
            style={[
              styles.barHitTarget,
              {
                left: bar.x - HIT_PADDING_X,
                top: PADDING_TOP,
                width: bar.barWidth + HIT_PADDING_X * 2,
                height: geometry.plotHeight,
              },
            ]}
          />
        ),
      )}

      {selectedBar ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: tooltipLeft,
              top: tooltipTop,
              width: TOOLTIP_WIDTH,
              borderColor: selectedBar.day.isToday
                ? 'rgba(165, 180, 252, 0.55)'
                : 'rgba(99, 102, 241, 0.45)',
            },
          ]}
        >
          <Text style={styles.tooltipWhen}>
            {selectedBar.day.weekdayLabel} · {selectedBar.day.dayNumber}
            {selectedBar.day.isToday ? ' · Hoje' : ''}
          </Text>
          {selectedBar.day.hasData ? (
            <>
              <Text style={styles.tooltipValue}>
                {formatSleepDuration(selectedBar.day.durationMinutes)}
              </Text>
              <Text style={styles.tooltipMeta}>
                Qualidade{' '}
                {selectedBar.day.quality != null
                  ? `${selectedBar.day.quality}/5 · ${getSleepQualityLabel(selectedBar.day.quality)}`
                  : 'não informada'}
                {selectedBar.hasOverflow ? ' · Acima de 8h' : ''}
              </Text>
            </>
          ) : (
            <Text style={styles.tooltipEmpty}>Sem registro neste dia</Text>
          )}
        </View>
      ) : null}
    </View>
  )

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(99, 102, 241, 0.1)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Horas dormidas em {monthLabel}</Text>
          <Text style={styles.subtitle}>Toque em uma barra para ver horas e qualidade do dia</Text>
        </View>

        {scrollable ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
          >
            {chartBody}
          </ScrollView>
        ) : (
          chartBody
        )}

        <View style={styles.legend}>
          <LegendItem color="#8b5cf6" label="Hoje" />
          <LegendItem color="#6366f1" label="Horas dormidas" />
          <LegendItem color="#f59e0b" label="Acima de 8h" />
          <LegendItem color="rgba(255,255,255,0.12)" label="Sem registro" isMuted />
        </View>

        {geometry.showTargetLine ? (
          <View style={styles.legendMeta}>
            <View style={styles.legendTargetLine} />
            <Text style={styles.legendMetaText}>Linha tracejada = meta de 8 horas de sono</Text>
          </View>
        ) : null}
      </LinearGradient>
    </View>
  )
}

function LegendItem({
  color,
  label,
  isMuted = false,
}: {
  color: string
  label: string
  isMuted?: boolean
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }, isMuted && styles.legendSwatchMuted]} />
      <Text style={styles.legendLabel}>{label}</Text>
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
    gap: 10,
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
  scrollContent: {
    flexGrow: 0,
  },
  root: {
    overflow: 'visible',
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendSwatchMuted: {
    opacity: 0.7,
  },
  legendLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  legendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendTargetLine: {
    width: 18,
    height: 1,
    borderTopWidth: 1,
    borderColor: 'rgba(165, 180, 252, 0.45)',
    borderStyle: 'dashed',
  },
  legendMetaText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
})
