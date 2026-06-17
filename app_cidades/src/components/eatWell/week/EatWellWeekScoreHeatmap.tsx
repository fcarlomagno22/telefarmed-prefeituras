import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EatWellWeekSummary } from '../../../types/eatWell'
import { colors } from '../../../theme/colors'
import { getBalanceHeatmapColor } from '../../../utils/eatWellWeekStats'

type EatWellWeekScoreHeatmapProps = {
  summary: EatWellWeekSummary
  selectedDateIso?: string | null
  onSelectDay?: (dateIso: string) => void
}

const GRID_GAP = 6

export function EatWellWeekScoreHeatmap({
  summary,
  selectedDateIso,
  onSelectDay,
}: EatWellWeekScoreHeatmapProps) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(16, 185, 129, 0.1)', 'rgba(14, 14, 20, 0.98)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.title}>Mapa de equilíbrio</Text>
        <Text style={styles.subtitle}>Toque em um dia para abrir no Diário</Text>

        <View style={styles.grid}>
          {summary.dayStats.map((day) => {
            const selected = selectedDateIso === day.dateIso
            const bg = getBalanceHeatmapColor(day.balanceScore, day.hasData, day.isFuture)

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
                  <View style={styles.cellCluster}>
                    <Text style={styles.cellWeekday} numberOfLines={1}>
                      {day.weekdayLabel}
                    </Text>
                    <Text style={styles.cellDay} numberOfLines={1}>
                      {day.dayNumber}
                    </Text>
                    {!day.isFuture ? (
                      <Text style={styles.cellScore} numberOfLines={1}>
                        {day.hasData ? day.balanceScore : '—'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        <View style={styles.legendRow}>
          <LegendSwatch color="rgba(248, 113, 113, 0.55)" label="< 40" />
          <LegendSwatch color="rgba(245, 158, 11, 0.55)" label="40–59" />
          <LegendSwatch color="rgba(132, 204, 22, 0.55)" label="60–79" />
          <LegendSwatch color="rgba(16, 185, 129, 0.72)" label="≥ 80" />
        </View>
      </LinearGradient>
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
    borderColor: 'rgba(16, 185, 129, 0.16)',
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
    gap: GRID_GAP,
  },
  cellOuter: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cellOuterSelected: {
    borderColor: '#a3e635',
    borderWidth: 2,
  },
  cellFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  cellFuture: {
    opacity: 0.35,
  },
  cellPressed: {
    opacity: 0.88,
  },
  cellCluster: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellWeekday: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 9,
    marginBottom: 0.6,
  },
  cellDay: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 15,
  },
  cellScore: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 9,
    marginTop: 0.6,
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
