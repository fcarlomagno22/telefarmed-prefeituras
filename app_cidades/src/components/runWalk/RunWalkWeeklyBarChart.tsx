import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
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

type RunWalkWeeklyBarChartProps = {
  days: WeeklyCalendarDay[]
  width: number
  height?: number
  targetMinutesPerDay?: number
  selectedDateIso?: string | null
  onSelectDay?: (dateIso: string) => void
}

const PADDING_TOP = 12
const PADDING_BOTTOM = 38
const PADDING_LEFT = 4
const PADDING_RIGHT = 4
const HIT_PADDING_X = 4
const TOOLTIP_ESTIMATED_WIDTH = 132

type BarGeometry = {
  day: WeeklyCalendarDay
  index: number
  x: number
  y: number
  barWidth: number
  barHeight: number
}

export function RunWalkWeeklyBarChart({
  days,
  width,
  height = 148,
  targetMinutesPerDay = 30,
  selectedDateIso = null,
  onSelectDay,
}: RunWalkWeeklyBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipMeasuredWidth, setTooltipMeasuredWidth] = useState(TOOLTIP_ESTIMATED_WIDTH)

  const chartDays = useMemo(() => buildWeeklyChartDays(days), [days])

  const geometry = useMemo(() => {
    const plotWidth = width - PADDING_LEFT - PADDING_RIGHT
    const plotHeight = height - PADDING_TOP - PADDING_BOTTOM
    const maxValue = Math.max(
      targetMinutesPerDay,
      ...chartDays.map((day) => day.activeMinutes),
      1,
    )
    const barGap = 8
    const barWidth = (plotWidth - barGap * (chartDays.length - 1)) / chartDays.length

    const bars: BarGeometry[] = chartDays.map((day, index) => {
      const hasMinutes = day.activeMinutes > 0
      const ratio = day.activeMinutes / maxValue
      const barHeight = Math.max(hasMinutes ? 6 : 3, ratio * plotHeight)
      const x = PADDING_LEFT + index * (barWidth + barGap)
      const y = PADDING_TOP + (plotHeight - barHeight)

      return {
        day,
        index,
        x,
        y,
        barWidth,
        barHeight,
      }
    })

    const gridLines = [0.25, 0.5, 0.75, 1].map((tick) => ({
      y: PADDING_TOP + plotHeight * (1 - tick),
    }))

    return {
      bars,
      gridLines,
      plotLeft: PADDING_LEFT,
      plotWidth,
      plotBottom: PADDING_TOP + plotHeight,
      plotHeight,
    }
  }, [chartDays, height, targetMinutesPerDay, width])

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
    if (bar.day.activeMinutes <= 0) {
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
          selectedBar.x + selectedBar.barWidth / 2 - tooltipMeasuredWidth / 2,
          6,
        ),
        width - tooltipMeasuredWidth - 6,
      )
    : 0

  const tooltipTop = selectedBar
    ? Math.max(6, selectedBar.y - 54)
    : 0

  return (
    <View style={[styles.root, { width, height }]} collapsable={false}>
      <Svg width={width} height={height}>
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
          <LinearGradient id="runWalkBarEmpty" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(255,255,255,0.14)" stopOpacity={1} />
            <Stop offset="100%" stopColor="rgba(255,255,255,0.04)" stopOpacity={1} />
          </LinearGradient>
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

        {geometry.bars.map((bar) => {
          const isSelected = isBarSelected(bar)
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
              top: tooltipTop,
              maxWidth: width - 12,
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
              {selectedBar.day.activities[0]?.label ?? 'Atividade registrada'}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
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
})
