import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import type { SleepWeekSummary } from '../../../types/sleepHistory'
import { getSleepQualityHeatmapColor } from '../../../utils/sleepHistoryStats'

type SleepTimeHistoryQualityHeatmapProps = {
  summary: SleepWeekSummary
  selectedDateIso?: string | null
  onSelectDay?: (dateIso: string) => void
}

export function SleepTimeHistoryQualityHeatmap({
  summary,
  selectedDateIso,
  onSelectDay,
}: SleepTimeHistoryQualityHeatmapProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.title}>Qualidade da semana</Text>
        <Text style={styles.subtitle}>Toque em um dia para ver horas e qualidade do sono</Text>

        <View style={styles.grid}>
          {summary.dayStats.map((day) => {
            const selected = selectedDateIso === day.dateIso
            const bg = getSleepQualityHeatmapColor(day.quality, day.hasData, day.isFuture)

            return (
              <Pressable
                key={day.dateIso}
                disabled={day.isFuture}
                onPress={() => {
                  if (day.isFuture) return
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onSelectDay?.(day.dateIso)
                }}
                style={({ pressed }) => [
                  styles.cellOuter,
                  selected && styles.cellOuterSelected,
                  day.isFuture && styles.cellFuture,
                  pressed && !day.isFuture && styles.cellPressed,
                ]}
              >
                <View style={[styles.cellFill, { backgroundColor: bg }]}>
                  <Text style={styles.cellWeekday}>{day.weekdayLabel}</Text>
                  <Text style={styles.cellDay}>{day.dayNumber}</Text>
                  {!day.isFuture ? (
                    <Text style={styles.cellScore}>{day.hasData ? `${day.quality}/5` : '—'}</Text>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.legendRow}>
          <LegendSwatch color="#fecaca" label="1–2" />
          <LegendSwatch color="#fef3c7" label="3" />
          <LegendSwatch color="#ddd6fe" label="4" />
          <LegendSwatch color="#c7d2fe" label="5" />
        </View>
      </View>
    </View>
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.backgroundElevated,
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
    marginTop: -6,
  },
  grid: {
    flexDirection: 'row',
    gap: 6,
  },
  cellOuter: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cellOuterSelected: {
    borderColor: '#6366f1',
    borderWidth: 2,
  },
  cellFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cellFuture: {
    opacity: 0.35,
  },
  cellPressed: {
    opacity: 0.88,
  },
  cellWeekday: {
    color: colors.textSubtle,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cellDay: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  cellScore: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: '800',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  legendText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '600',
  },
})
