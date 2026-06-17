import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { RunWalkActivitySummary } from '../../../data/runWalkActivitySummaryStorage'
import { ACTIVITY_MODALITY_LABELS } from '../../../data/runWalkModalityConfig'
import { colors } from '../../../theme/colors'
import {
  formatActivityDateLabel,
  didHitDailyGoal,
} from '../../../utils/runWalkHistoryStats'
import {
  formatCaloriesBurned,
  formatElapsedActivityTime,
  formatPaceMinPerKm,
} from '../../../utils/runWalkActivityStats'
import { RunWalkActivityTrailMap } from '../liveActivity/RunWalkActivityTrailMap'

type RunWalkHistoryActivityCardProps = {
  activity: RunWalkActivitySummary
  targetMinutesPerDay: number
  profilePhotoUri?: string | null
  onPress: () => void
}

function getModalityIcon(modality: RunWalkActivitySummary['modality']) {
  if (modality === 'run') return 'run-fast'
  if (modality === 'run-walk') return 'run'
  return 'walk'
}

export function RunWalkHistoryActivityCard({
  activity,
  targetMinutesPerDay,
  profilePhotoUri,
  onPress,
}: RunWalkHistoryActivityCardProps) {
  const hitGoal = didHitDailyGoal(activity, targetMinutesPerDay)

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress()
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.mapWrap}>
        <RunWalkActivityTrailMap
          trail={activity.trail}
          height={92}
          profilePhotoUri={profilePhotoUri}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={getModalityIcon(activity.modality)}
                size={14}
                color="#6ee7b7"
              />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{activity.activityName}</Text>
              <Text style={styles.date}>{formatActivityDateLabel(activity.completedAt)}</Text>
            </View>
          </View>

          {hitGoal ? (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={12} color="#6ee7b7" />
              <Text style={styles.badgeText}>Meta</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.modality}>{ACTIVITY_MODALITY_LABELS[activity.modality]}</Text>

        <View style={styles.metrics}>
          <Metric label="Distância" value={`${activity.distanceKm.toFixed(1).replace('.', ',')} km`} />
          <Metric label="Tempo" value={formatElapsedActivityTime(activity.elapsedSeconds)} />
          <Metric label="Ritmo" value={formatPaceMinPerKm(activity.paceMinPerKm)} />
          <Metric label="Calorias" value={formatCaloriesBurned(activity.estimatedCalories)} />
        </View>
      </View>
    </Pressable>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.92,
  },
  mapWrap: {
    height: 92,
  },
  content: {
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  date: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  modality: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    width: '47%',
    gap: 2,
  },
  metricLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
  },
  badgeText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '700',
  },
})
