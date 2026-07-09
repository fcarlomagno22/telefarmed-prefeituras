import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { WeeklyTrainingStats } from '../../types/functionalTraining'

type FunctionalWeeklyStatsCardProps = {
  stats: WeeklyTrainingStats
}

export function FunctionalWeeklyStatsCard({ stats }: FunctionalWeeklyStatsCardProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="flame" size={18} color="#4338ca" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Sua semana</Text>
          <Text style={styles.subtitle}>Treinos concluídos nos últimos 7 dias</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{stats.sessionsCount}</Text>
          <Text style={styles.metricLabel}>treinos</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{stats.totalActiveMinutes}</Text>
          <Text style={styles.metricLabel}>min ativos</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{stats.uniqueExercises}</Text>
          <Text style={styles.metricLabel}>exercícios</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricValue: {
    color: '#3730a3',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
})
