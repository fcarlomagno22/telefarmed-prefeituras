import { StyleSheet, Text, View } from 'react-native'
import type { MentalHealthWeekDay, MentalHealthWeekDayLevel } from '../../types/mentalHealth'
import { colors } from '../../theme/colors'

const LEVEL_COLORS: Record<MentalHealthWeekDayLevel, string> = {
  good: '#4ade80',
  moderate: '#67e8f9',
  low: '#fb923c',
  empty: 'rgba(255,255,255,0.08)',
}

const LEVEL_HEIGHTS: Record<MentalHealthWeekDayLevel, number> = {
  good: 56,
  moderate: 40,
  low: 28,
  empty: 10,
}

type MentalHealthMoodWeekChartProps = {
  days: MentalHealthWeekDay[]
}

export function MentalHealthMoodWeekChart({ days }: MentalHealthMoodWeekChartProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.chartRow}>
        {days.map((day) => (
          <View key={day.label} style={styles.dayCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: LEVEL_HEIGHTS[day.level],
                    backgroundColor: LEVEL_COLORS[day.level],
                    opacity: day.level === 'empty' ? 1 : 0.9,
                  },
                ]}
              />
            </View>
            <Text style={styles.dayLabel}>{day.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.legendRow}>
        <LegendDot color={LEVEL_COLORS.good} label="Mais leve" />
        <LegendDot color={LEVEL_COLORS.moderate} label="Neutro" />
        <LegendDot color={LEVEL_COLORS.low} label="Mais pesado" />
      </View>
    </View>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 72,
    paddingTop: 8,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    height: 56,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  bar: {
    width: '72%',
    maxWidth: 28,
    borderRadius: 8,
  },
  dayLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
  },
})
