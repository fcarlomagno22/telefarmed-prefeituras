import * as Haptics from 'expo-haptics'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { RunWalkHistoryHeatmapCell } from '../../../types/runWalkHistory'

type RunWalkHistoryHeatmapProps = {
  cells: RunWalkHistoryHeatmapCell[]
  monthLabel: string
  animate?: boolean
  preserveFinal?: boolean
}

const CELL_GAP = 4
const COLS = 7
const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const CELL_REVEAL_DURATION_MS = 3000

function formatHeatmapDate(dateIso: string) {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function buildCalendarWeeks(cells: RunWalkHistoryHeatmapCell[]) {
  if (cells.length === 0) return [] as Array<Array<RunWalkHistoryHeatmapCell | null>>

  const firstWeekday = new Date(`${cells[0].dateIso}T12:00:00`).getDay()
  const paddedCells: Array<RunWalkHistoryHeatmapCell | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...cells,
  ]

  const weeks: Array<Array<RunWalkHistoryHeatmapCell | null>> = []
  for (let index = 0; index < paddedCells.length; index += COLS) {
    const week = paddedCells.slice(index, index + COLS)
    while (week.length < COLS) week.push(null)
    weeks.push(week)
  }

  return weeks
}

function buildCellRevealOrder(weeks: Array<Array<RunWalkHistoryHeatmapCell | null>>) {
  const ordered: RunWalkHistoryHeatmapCell[] = []

  for (const week of weeks) {
    for (const cell of week) {
      if (cell) ordered.push(cell)
    }
  }

  return ordered
}

function HeatmapCell({
  cell,
  isColorRevealed,
  isSelected,
  onPress,
}: {
  cell: RunWalkHistoryHeatmapCell | null
  isColorRevealed: boolean
  isSelected: boolean
  onPress: (cell: RunWalkHistoryHeatmapCell) => void
}) {
  if (!cell) {
    return <View style={styles.cellEmpty} />
  }

  const showActivity = isColorRevealed && cell.hasActivity
  const alpha = 0.12 + cell.intensity * 0.78

  return (
    <Pressable
      onPress={() => onPress(cell)}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: showActivity
            ? `rgba(16, 185, 129, ${alpha})`
            : 'rgba(255, 255, 255, 0.04)',
          borderColor: isSelected
            ? '#6ee7b7'
            : showActivity
              ? `rgba(110, 231, 183, ${0.18 + cell.intensity * 0.4})`
              : 'rgba(255, 255, 255, 0.05)',
        },
        isSelected && styles.cellSelected,
        pressed && styles.cellPressed,
      ]}
    >
      <Text style={[styles.cellDay, showActivity && styles.cellDayActive]}>{cell.day}</Text>
    </Pressable>
  )
}

export function RunWalkHistoryHeatmap({
  cells,
  monthLabel,
  animate = false,
  preserveFinal = true,
}: RunWalkHistoryHeatmapProps) {
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null)
  const [gridWidth, setGridWidth] = useState(0)
  const weeks = useMemo(() => buildCalendarWeeks(cells), [cells])
  const revealOrder = useMemo(() => buildCellRevealOrder(weeks), [weeks])
  const revealIndexByDate = useMemo(() => {
    const map = new Map<string, number>()
    revealOrder.forEach((cell, index) => {
      map.set(cell.dateIso, index)
    })
    return map
  }, [revealOrder])

  const totalRevealCells = revealOrder.length
  const [revealedCellCount, setRevealedCellCount] = useState(
    preserveFinal ? totalRevealCells : 0,
  )
  const progress = useRef(new Animated.Value(preserveFinal ? totalRevealCells : 0)).current

  useEffect(() => {
    progress.stopAnimation()

    if (!animate) {
      const target = preserveFinal ? totalRevealCells : 0
      progress.setValue(target)
      setRevealedCellCount(target)
      return
    }

    progress.setValue(0)
    setRevealedCellCount(0)

    const listenerId = progress.addListener(({ value }) => {
      setRevealedCellCount(Math.min(totalRevealCells, Math.max(0, Math.floor(value))))
    })

    const animation = Animated.timing(progress, {
      toValue: totalRevealCells,
      duration: CELL_REVEAL_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    })

    animation.start(({ finished }) => {
      if (finished) {
        setRevealedCellCount(totalRevealCells)
        progress.setValue(totalRevealCells)
      }
    })

    return () => {
      progress.removeListener(listenerId)
      animation.stop()
    }
  }, [animate, preserveFinal, progress, totalRevealCells])

  const selectedCell = useMemo(
    () => cells.find((cell) => cell.dateIso === selectedDateIso) ?? null,
    [cells, selectedDateIso],
  )

  const selectedPosition = useMemo(() => {
    if (!selectedCell || gridWidth <= 0) return null

    for (let weekIndex = 0; weekIndex < weeks.length; weekIndex += 1) {
      for (let dayIndex = 0; dayIndex < weeks[weekIndex].length; dayIndex += 1) {
        const cell = weeks[weekIndex][dayIndex]
        if (cell?.dateIso === selectedCell.dateIso) {
          const cellSize = (gridWidth - CELL_GAP * (COLS - 1)) / COLS
          return {
            x: dayIndex * (cellSize + CELL_GAP) + cellSize / 2,
            y: weekIndex * (cellSize + CELL_GAP) + cellSize / 2,
          }
        }
      }
    }

    return null
  }, [gridWidth, selectedCell, weeks])

  function handleCellPress(cell: RunWalkHistoryHeatmapCell) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedDateIso((current) => (current === cell.dateIso ? null : cell.dateIso))
  }

  function handleGridLayout(event: LayoutChangeEvent) {
    setGridWidth(event.nativeEvent.layout.width)
  }

  function isCellColorRevealed(cell: RunWalkHistoryHeatmapCell | null) {
    if (!cell) return false
    const revealIndex = revealIndexByDate.get(cell.dateIso)
    if (revealIndex == null) return preserveFinal
    return revealIndex < revealedCellCount
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Heatmap mensal</Text>
        <Text style={styles.subtitle}>{monthLabel}</Text>
      </View>

      <View style={styles.weekdays}>
        {WEEKDAY_LABELS.map((label, index) => (
          <View key={`weekday-${index}`} style={styles.weekdayCell}>
            <Text style={styles.weekday}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.gridStage} onLayout={handleGridLayout}>
        <View style={styles.grid}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {week.map((cell, dayIndex) => (
                <HeatmapCell
                  key={cell?.dateIso ?? `empty-${weekIndex}-${dayIndex}`}
                  cell={cell}
                  isColorRevealed={isCellColorRevealed(cell)}
                  isSelected={cell?.dateIso === selectedDateIso}
                  onPress={handleCellPress}
                />
              ))}
            </View>
          ))}
        </View>

        {selectedCell && selectedPosition ? (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                left: Math.min(Math.max(selectedPosition.x - 72, 8), gridWidth - 152),
                top: Math.max(selectedPosition.y - 58, 8),
              },
            ]}
          >
            <Text style={styles.tooltipValue}>
              {selectedCell.hasActivity
                ? `${selectedCell.activeMinutes} min · ${selectedCell.distanceKm
                    .toFixed(1)
                    .replace('.', ',')} km`
                : 'Sem atividade'}
            </Text>
            <Text style={styles.tooltipDate}>{formatHeatmapDate(selectedCell.dateIso)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  weekdays: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekday: {
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
  },
  gridStage: {
    position: 'relative',
    minHeight: 120,
  },
  grid: {
    gap: CELL_GAP,
  },
  weekRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  cellEmpty: {
    flex: 1,
    aspectRatio: 1,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cellSelected: {
    transform: [{ scale: 1.04 }],
  },
  cellPressed: {
    opacity: 0.9,
  },
  cellDay: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
  },
  cellDayActive: {
    color: colors.text,
  },
  tooltip: {
    position: 'absolute',
    width: 144,
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
    fontSize: 13,
    fontWeight: '800',
  },
  tooltipDate: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
