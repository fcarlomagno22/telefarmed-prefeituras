import * as Haptics from 'expo-haptics'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { WeeklyCalendarDay } from '../../types/runWalk'
import {
  buildWeeklyChartDays,
  getWeeklyChartDaySummary,
} from '../../utils/runWalkWeeklyChart'
import Svg, {
  Defs,
  Line,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg'

export type RunWalkWeeklyBarCelebrateDay = {
  dateIso: string
  fromMinutes: number
  toMinutes: number
}

type RunWalkWeeklyBarChartProps = {
  days: WeeklyCalendarDay[]
  width: number
  height?: number
  targetMinutesPerDay?: number
  selectedDateIso?: string | null
  onSelectDay?: (dateIso: string) => void
  celebrateDay?: RunWalkWeeklyBarCelebrateDay | null
  layoutMode?: 'calendar-week' | 'chronological'
  scrollable?: boolean
  visibleBars?: number
  showLegend?: boolean
  animate?: boolean
  preserveFinal?: boolean
}

const PADDING_TOP = 12
const PADDING_BOTTOM = 38
const PADDING_LEFT = 4
const PADDING_RIGHT = 4
const HIT_PADDING_X = 4
const TOOLTIP_ESTIMATED_WIDTH = 132
const BAR_ENTRANCE_DURATION = 380
const BAR_ENTRANCE_GAP = 70
const BAR_ENTRANCE_INITIAL_DELAY = 60

type BarGeometry = {
  day: WeeklyCalendarDay
  displayMinutes: number
  index: number
  x: number
  y: number
  barWidth: number
  barHeight: number
  baseHeight: number
  overflowHeight: number
  hasOverflow: boolean
}

export function RunWalkWeeklyBarChart({
  days,
  width,
  height = 148,
  targetMinutesPerDay = 30,
  selectedDateIso = null,
  onSelectDay,
  celebrateDay = null,
  layoutMode = 'calendar-week',
  scrollable = false,
  visibleBars = 7,
  showLegend = false,
  animate = false,
  preserveFinal = true,
}: RunWalkWeeklyBarChartProps) {
  const scrollRef = useRef<ScrollView>(null)
  const entranceLockedRef = useRef(Boolean(celebrateDay))
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [animatedMinutes, setAnimatedMinutes] = useState<number | null>(null)
  const chartDays = useMemo(
    () => (layoutMode === 'chronological' ? days : buildWeeklyChartDays(days)),
    [days, layoutMode],
  )
  const shouldAnimateEntrance = Boolean(animate) && !celebrateDay
  const animateVisibleWindowOnly = scrollable && chartDays.length > visibleBars
  const visibleWindowStartIndex = animateVisibleWindowOnly
    ? chartDays.length - visibleBars
    : 0

  function shouldAnimateBarIndex(index: number) {
    if (!shouldAnimateEntrance) return false
    return index >= visibleWindowStartIndex
  }

  const [barEntranceRatios, setBarEntranceRatios] = useState<number[]>(() =>
    Array.from({ length: chartDays.length }, (_, index) => {
      if (celebrateDay) return 1
      if (shouldAnimateBarIndex(index)) return 0
      if (shouldAnimateEntrance) return 1
      return preserveFinal ? 1 : 0
    }),
  )
  const celebrateProgress = useRef(new Animated.Value(celebrateDay ? 0 : 1)).current
  const barEntranceValues = useRef(
    Array.from({ length: Math.max(chartDays.length, 7) }, () => new Animated.Value(shouldAnimateEntrance ? 0 : 1)),
  ).current

  useEffect(() => {
    if (!scrollable || chartDays.length <= visibleBars) return

    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false })
    }, 0)

    return () => clearTimeout(timer)
  }, [chartDays, scrollable, visibleBars, width])

  function lockEntranceRatios() {
    entranceLockedRef.current = true
    setBarEntranceRatios(Array.from({ length: chartDays.length }, () => 1))
    chartDays.forEach((_, index) => {
      barEntranceValues[index]?.setValue(1)
    })
  }

  useEffect(() => {
    if (celebrateDay) {
      barEntranceValues.forEach((value) => value.stopAnimation())
      lockEntranceRatios()
      return
    }

    if (entranceLockedRef.current) {
      barEntranceValues.forEach((value) => value.stopAnimation())
      lockEntranceRatios()
      return
    }

    if (!shouldAnimateEntrance) {
      const ratio = entranceLockedRef.current ? 1 : preserveFinal ? 1 : 0
      setBarEntranceRatios(Array.from({ length: chartDays.length }, () => ratio))
      barEntranceValues.forEach((value) => value.setValue(ratio))
      if (ratio === 1) {
        entranceLockedRef.current = true
      }
      return
    }

    const nextRatios = Array.from({ length: chartDays.length }, (_, index) =>
      shouldAnimateBarIndex(index) ? 0 : 1,
    )
    setBarEntranceRatios(nextRatios)

    chartDays.forEach((_, index) => {
      barEntranceValues[index]?.setValue(shouldAnimateBarIndex(index) ? 0 : 1)
    })

    const listeners = chartDays.map((_, index) => {
      if (!shouldAnimateBarIndex(index)) return null

      return barEntranceValues[index]?.addListener(({ value: ratio }) => {
        setBarEntranceRatios((current) => {
          if (current[index] === ratio) return current
          const next = [...current]
          next[index] = ratio
          return next
        })
      })
    })

    const animations = chartDays.flatMap((_, index) => {
      if (!shouldAnimateBarIndex(index)) return []

      const visibleIndex = index - visibleWindowStartIndex

      return [
        Animated.timing(barEntranceValues[index]!, {
          toValue: 1,
          duration: BAR_ENTRANCE_DURATION,
          delay:
            BAR_ENTRANCE_INITIAL_DELAY +
            visibleIndex * (BAR_ENTRANCE_DURATION + BAR_ENTRANCE_GAP),
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]
    })

    if (animations.length > 0) {
      Animated.parallel(animations).start(({ finished }) => {
        if (finished) {
          entranceLockedRef.current = true
        }
      })
    } else {
      entranceLockedRef.current = true
    }

    return () => {
      listeners.forEach((listenerId, index) => {
        if (listenerId != null) {
          barEntranceValues[index]?.removeListener(listenerId)
        }
      })
      animations.forEach((animation) => animation.stop())
    }
  }, [
    animate,
    barEntranceValues,
    celebrateDay,
    chartDays,
    preserveFinal,
    shouldAnimateEntrance,
    visibleWindowStartIndex,
  ])

  useEffect(() => {
    if (!celebrateDay) {
      celebrateProgress.setValue(1)
      setAnimatedMinutes(null)
      return
    }

    celebrateProgress.setValue(0)
    setAnimatedMinutes(celebrateDay.fromMinutes)

    const listenerId = celebrateProgress.addListener(({ value }) => {
      const nextMinutes =
        celebrateDay.fromMinutes +
        (celebrateDay.toMinutes - celebrateDay.fromMinutes) * value
      setAnimatedMinutes(nextMinutes)
    })

    const animation = Animated.timing(celebrateProgress, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    })

    animation.start()

    return () => {
      celebrateProgress.removeListener(listenerId)
      animation.stop()
    }
  }, [celebrateDay, celebrateProgress])

  const geometry = useMemo(() => {
    const viewportPlotWidth = width - PADDING_LEFT - PADDING_RIGHT
    const plotHeight = height - PADDING_TOP - PADDING_BOTTOM
    const barGap = 8
    const barCount = Math.max(chartDays.length, 1)
    const barsPerViewport = Math.min(visibleBars, barCount)
    const slotWidth =
      (viewportPlotWidth - barGap * (barsPerViewport - 1)) / Math.max(barsPerViewport, 1)
    const useScrollLayout = scrollable && barCount > visibleBars
    const plotWidth = useScrollLayout
      ? barCount * slotWidth + barGap * (barCount - 1)
      : viewportPlotWidth
    const barWidth = useScrollLayout
      ? slotWidth
      : (plotWidth - barGap * (barCount - 1)) / barCount
    const chartRenderWidth = plotWidth + PADDING_LEFT + PADDING_RIGHT

    const minutesByDay = chartDays.map((day) => {
      if (celebrateDay?.dateIso === day.dateIso && animatedMinutes != null) {
        return animatedMinutes
      }
      return day.activeMinutes
    })

    const maxValue = Math.max(
      targetMinutesPerDay,
      celebrateDay?.toMinutes ?? 0,
      ...minutesByDay,
      1,
    )

    const bars: BarGeometry[] = chartDays.map((day, index) => {
      const displayMinutes = minutesByDay[index] ?? 0
      const hasMinutes = displayMinutes > 0
      const totalRatio = displayMinutes / maxValue
      const targetRatio = targetMinutesPerDay / maxValue
      const barEntrance = celebrateDay ? 1 : (barEntranceRatios[index] ?? 0)
      const barHeight = Math.max(
        hasMinutes ? 6 * barEntrance : 3 * barEntrance,
        totalRatio * plotHeight * barEntrance,
      )
      const baseHeight = Math.min(barHeight, targetRatio * plotHeight * barEntrance)
      const overflowHeight = Math.max(0, barHeight - baseHeight)
      const x = PADDING_LEFT + index * (barWidth + barGap)
      const y = PADDING_TOP + (plotHeight - barHeight)

      return {
        day: {
          ...day,
          activeMinutes: Math.round(displayMinutes),
        },
        displayMinutes,
        index,
        x,
        y,
        barWidth,
        barHeight,
        baseHeight,
        overflowHeight,
        hasOverflow: overflowHeight > 1,
      }
    })

    const gridLines = [0.25, 0.5, 0.75, 1].map((tick) => ({
      y: PADDING_TOP + plotHeight * (1 - tick),
    }))

    const targetLineY = PADDING_TOP + plotHeight * (1 - targetMinutesPerDay / maxValue)

    return {
      bars,
      gridLines,
      plotLeft: PADDING_LEFT,
      plotWidth,
      plotBottom: PADDING_TOP + plotHeight,
      plotHeight,
      targetLineY,
      showTargetLine: maxValue > targetMinutesPerDay * 1.02,
      chartRenderWidth,
    }
  }, [
    animatedMinutes,
    barEntranceRatios,
    celebrateDay,
    chartDays,
    height,
    scrollable,
    targetMinutesPerDay,
    visibleBars,
    width,
  ])

  useEffect(() => {
    if (!selectedDateIso) {
      setSelectedIndex(null)
      return
    }

    const index = chartDays.findIndex((day) => day.dateIso === selectedDateIso)
    setSelectedIndex(index >= 0 ? index : null)
  }, [selectedDateIso, chartDays])

  const selectedBar =
    selectedIndex !== null ? (geometry.bars[selectedIndex] ?? null) : null

  function isBarSelected(bar: BarGeometry) {
    if (selectedDateIso) return bar.day.dateIso === selectedDateIso
    return selectedIndex === bar.index
  }

  function getBarFill(bar: BarGeometry, isSelected: boolean) {
    if (bar.day.isFuture) {
      return 'url(#runWalkBarEmpty)'
    }
    if (bar.day.isToday) {
      return isSelected ? 'url(#runWalkBarTodaySelected)' : 'url(#runWalkBarToday)'
    }
    if (bar.displayMinutes <= 0) {
      return 'url(#runWalkBarEmpty)'
    }
    return isSelected ? 'url(#runWalkBarActiveSelected)' : 'url(#runWalkBarActive)'
  }

  function handleBarPress(index: number) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const bar = geometry.bars[index]
    if (!bar) return

    if (onSelectDay) {
      onSelectDay(bar.day.dateIso)
      setSelectedIndex(index)
      return
    }

    setSelectedIndex((current) => (current === index ? null : index))
  }

  const tooltipLeft = selectedBar
    ? Math.min(
        Math.max(
          selectedBar.x + selectedBar.barWidth / 2 - TOOLTIP_ESTIMATED_WIDTH / 2,
          6,
        ),
        geometry.chartRenderWidth - TOOLTIP_ESTIMATED_WIDTH - 6,
      )
    : 0

  const tooltipTop = selectedBar
    ? Math.max(6, selectedBar.y - 54)
    : 0

  const chartBody = (
    <View style={[styles.root, { width: geometry.chartRenderWidth, height }]} collapsable={false}>
      <Svg width={geometry.chartRenderWidth} height={height}>
        <Defs>
          <LinearGradient id="runWalkBarActive" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#93c5fd" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#2563eb" stopOpacity={0.85} />
          </LinearGradient>
          <LinearGradient id="runWalkBarActiveSelected" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#bfdbfe" stopOpacity={1} />
            <Stop offset="100%" stopColor="#3b82f6" stopOpacity={0.95} />
          </LinearGradient>
          <LinearGradient id="runWalkBarToday" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#6ee7b7" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#10b981" stopOpacity={0.9} />
          </LinearGradient>
          <LinearGradient id="runWalkBarTodaySelected" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#a7f3d0" stopOpacity={1} />
            <Stop offset="100%" stopColor="#059669" stopOpacity={0.95} />
          </LinearGradient>
          <LinearGradient id="runWalkBarOverflow" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fde68a" stopOpacity={1} />
            <Stop offset="100%" stopColor="#f59e0b" stopOpacity={0.95} />
          </LinearGradient>
          <LinearGradient id="runWalkBarEmpty" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.14)" stopOpacity={1} />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" stopOpacity={1} />
          </LinearGradient>
          {geometry.bars
            .filter((bar) => bar.hasOverflow)
            .map((bar) => {
              const gradientId = `runWalkBarStack-${bar.day.dateIso.replace(/[^a-zA-Z0-9]/g, '')}`
              const overflowRatio =
                bar.barHeight > 0
                  ? Math.max(0, Math.min(1, bar.overflowHeight / bar.barHeight))
                  : 0
              const baseColors = bar.day.isToday
                ? ['#a7f3d0', '#059669']
                : ['#bfdbfe', '#3b82f6']

              return (
                <LinearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#fde68a" stopOpacity={1} />
                  <Stop
                    offset={`${overflowRatio * 100}%`}
                    stopColor="#f59e0b"
                    stopOpacity={0.98}
                  />
                  <Stop
                    offset={`${overflowRatio * 100}%`}
                    stopColor={baseColors[0]}
                    stopOpacity={1}
                  />
                  <Stop offset="100%" stopColor={baseColors[1]} stopOpacity={0.95} />
                </LinearGradient>
              )
            })}
        </Defs>

        {geometry.gridLines.map((line, index) => (
          <Line
            key={`grid-${index}`}
            x1={geometry.plotLeft}
            y1={line.y}
            x2={geometry.plotLeft + geometry.plotWidth}
            y2={line.y}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1}
          />
        ))}

        {geometry.showTargetLine ? (
          <Line
            x1={geometry.plotLeft}
            y1={geometry.targetLineY}
            x2={geometry.plotLeft + geometry.plotWidth}
            y2={geometry.targetLineY}
            stroke="rgba(251, 191, 36, 0.35)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}

        {geometry.bars.map((bar) => {
          const isSelected = isBarSelected(bar)
          const gradientId = `runWalkBarStack-${bar.day.dateIso.replace(/[^a-zA-Z0-9]/g, '')}`

          if (bar.hasOverflow) {
            return (
              <Rect
                key={bar.day.dateIso}
                x={bar.x}
                y={bar.y}
                width={bar.barWidth}
                height={bar.barHeight}
                rx={6}
                fill={`url(#${gradientId})`}
                stroke={isSelected ? 'rgba(255, 255, 255, 0.55)' : 'rgba(251, 191, 36, 0.35)'}
                strokeWidth={isSelected ? 1.5 : 1}
              />
            )
          }

          return (
            <Rect
              key={bar.day.dateIso}
              x={bar.x}
              y={bar.y}
              width={bar.barWidth}
              height={bar.barHeight}
              rx={6}
              fill={getBarFill(bar, isSelected)}
              stroke={isSelected ? 'rgba(255, 255, 255, 0.55)' : 'transparent'}
              strokeWidth={isSelected ? 1.5 : 0}
            />
          )
        })}

        {geometry.bars.map((bar) => {
          const labelColor = bar.day.isToday
            ? '#6ee7b7'
            : bar.day.isFuture
              ? 'rgba(245, 245, 247, 0.28)'
              : 'rgba(245, 245, 247, 0.45)'

          return (
            <SvgText
              key={`weekday-${bar.day.dateIso}`}
              x={bar.x + bar.barWidth / 2}
              y={geometry.plotBottom + 12}
              fill={labelColor}
              fontSize={9}
              fontWeight={bar.day.isToday ? '700' : '600'}
              textAnchor="middle"
            >
              {bar.day.weekdayShort}
            </SvgText>
          )
        })}

        {geometry.bars.map((bar) => {
          const labelColor = bar.day.isToday
            ? '#a7f3d0'
            : bar.day.isFuture
              ? 'rgba(245, 245, 247, 0.22)'
              : 'rgba(245, 245, 247, 0.35)'

          return (
            <SvgText
              key={`date-${bar.day.dateIso}`}
              x={bar.x + bar.barWidth / 2}
              y={geometry.plotBottom + 24}
              fill={labelColor}
              fontSize={8}
              fontWeight={bar.day.isToday ? '700' : '500'}
              textAnchor="middle"
            >
              {bar.day.dateShort}
            </SvgText>
          )
        })}
      </Svg>

      {geometry.bars.map((bar) => (
        <Pressable
          key={`hit-${bar.day.dateIso}`}
          onPress={() => handleBarPress(bar.index)}
          accessibilityRole="button"
          accessibilityLabel={`${bar.day.weekdayShort} ${bar.day.dateShort ?? bar.day.dayLabel}: ${getWeeklyChartDaySummary(bar.day)}`}
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
      ))}

      {selectedBar ? (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: tooltipLeft,
              top: tooltipTop,
              width: TOOLTIP_ESTIMATED_WIDTH,
              borderColor: selectedBar.day.isToday
                ? 'rgba(16, 185, 129, 0.45)'
                : 'rgba(59, 130, 246, 0.45)',
            },
          ]}
        >
          <Text style={styles.tooltipWhen}>
            {selectedBar.day.weekdayShort} · {selectedBar.day.dateShort ?? selectedBar.day.dayLabel}
            {selectedBar.day.isToday ? ' · Hoje' : ''}
          </Text>
          <Text
            style={[
              styles.tooltipValue,
              selectedBar.day.isToday && styles.tooltipValueToday,
            ]}
          >
            {getWeeklyChartDaySummary(selectedBar.day)}
          </Text>
          {selectedBar.day.activeMinutes > 0 ? (
            <Text style={styles.tooltipMeta}>
              {selectedBar.day.activities.filter((activity) => activity.type !== 'rest').length}{' '}
              treino
              {selectedBar.day.activities.filter((activity) => activity.type !== 'rest').length ===
              1
                ? ''
                : 's'}
              {selectedBar.hasOverflow ? ' · Meta superada' : ''}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )

  return (
    <View style={styles.container}>
      {scrollable && chartDays.length > visibleBars ? (
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

      {showLegend ? (
        <View style={styles.legend}>
          <LegendItem color="#10b981" label="Hoje" />
          <LegendItem color="#2563eb" label="Minutos ativos" />
          <LegendItem color="#f59e0b" label="Acima da meta" />
          <LegendItem color="rgba(255,255,255,0.12)" label="Sem atividade" isMuted />
        </View>
      ) : null}

      {showLegend && geometry.showTargetLine ? (
        <View style={styles.legendMeta}>
          <View style={styles.legendTargetLine} />
          <Text style={styles.legendMetaText}>Linha tracejada = meta diária ({targetMinutesPerDay} min)</Text>
        </View>
      ) : null}
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
  container: {
    gap: 10,
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
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tooltipValueToday: {
    color: '#6ee7b7',
  },
  tooltipMeta: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendSwatchMuted: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  legendLabel: {
    color: colors.textSubtle,
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
    borderColor: 'rgba(251, 191, 36, 0.55)',
    borderStyle: 'dashed',
  },
  legendMetaText: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
  },
})
