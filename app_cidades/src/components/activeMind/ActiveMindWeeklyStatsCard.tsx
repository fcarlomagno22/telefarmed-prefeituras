import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import type { ActiveMindWeeklyStats } from '../../data/activeMindWeeklyStats'
import { colors } from '../../theme/colors'

type ActiveMindWeeklyStatsCardProps = {
  stats: ActiveMindWeeklyStats | null
  loading?: boolean
}

function SkeletonBlock({ width, height }: { width: number | `${number}%`; height: number }) {
  return <View style={[styles.skeleton, { width, height }]} />
}

export function ActiveMindWeeklyStatsCard({
  stats,
  loading = false,
}: ActiveMindWeeklyStatsCardProps) {
  const isEmpty = !loading && (!stats || stats.totalSessions === 0)
  const topGameLabel = stats?.topGameTitle ?? '—'
  const sessionsLabel = stats?.totalSessions ?? 0
  const minutesLabel = stats?.totalMinutes ?? 0

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar" size={18} color="#be185d" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Esta semana</Text>
          <Text style={styles.subtitle}>
            {isEmpty
              ? 'Jogue um pouco e acompanhe seu ritmo aqui'
              : 'Sessões concluídas desde segunda-feira'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <SkeletonBlock width={36} height={24} />
            <SkeletonBlock width={52} height={10} />
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <SkeletonBlock width={36} height={24} />
            <SkeletonBlock width={52} height={10} />
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <SkeletonBlock width={64} height={24} />
            <SkeletonBlock width={52} height={10} />
          </View>
        </View>
      ) : (
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, isEmpty && styles.metricValueMuted]}>
              {sessionsLabel}
            </Text>
            <Text style={styles.metricLabel}>sessões</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text style={[styles.metricValue, isEmpty && styles.metricValueMuted]}>
              {minutesLabel}
            </Text>
            <Text style={styles.metricLabel}>minutos</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text
              style={[styles.metricValueGame, isEmpty && styles.metricValueMuted]}
              numberOfLines={2}
            >
              {isEmpty ? '—' : topGameLabel}
            </Text>
            <Text style={styles.metricLabel}>mais jogado</Text>
          </View>
        </View>
      )}
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
    backgroundColor: 'rgba(244, 114, 182, 0.16)',
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
    gap: 4,
    minHeight: 44,
    justifyContent: 'center',
  },
  metricValue: {
    color: '#be185d',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metricValueGame: {
    color: '#be185d',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 16,
  },
  metricValueMuted: {
    color: colors.textSubtle,
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
    backgroundColor: 'rgba(244, 114, 182, 0.18)',
  },
  skeleton: {
    borderRadius: 6,
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
  },
})
