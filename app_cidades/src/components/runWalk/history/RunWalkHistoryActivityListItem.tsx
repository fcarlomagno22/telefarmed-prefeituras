import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { RunWalkActivitySummary } from '../../../data/runWalkActivitySummaryStorage'
import { colors } from '../../../theme/colors'
import { formatActivityLocationLabel } from '../../../utils/runWalkActivityLocation'
import {
  formatActivityDateLabel,
  didHitDailyGoal,
} from '../../../utils/runWalkHistoryStats'
import {
  formatElapsedActivityTime,
  formatPaceMinPerKm,
} from '../../../utils/runWalkActivityStats'

type RunWalkHistoryActivityListItemProps = {
  activity: RunWalkActivitySummary
  targetMinutesPerDay: number
  onPress: () => void
  onMapPress: () => void
  isLast?: boolean
}

function getModalityIcon(modality: RunWalkActivitySummary['modality']) {
  if (modality === 'run') return 'run-fast'
  if (modality === 'run-walk') return 'run'
  return 'walk'
}

export function RunWalkHistoryActivityListItem({
  activity,
  targetMinutesPerDay,
  onPress,
  onMapPress,
  isLast = false,
}: RunWalkHistoryActivityListItemProps) {
  const hitGoal = didHitDailyGoal(activity, targetMinutesPerDay)
  const hasTrail = activity.trail.length >= 2
  const locationLabel = formatActivityLocationLabel(
    activity.locationCity,
    activity.locationState,
  )

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          onPress()
        }}
        style={({ pressed }) => [styles.mainPress, pressed && styles.pressed]}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name={getModalityIcon(activity.modality)}
            size={16}
            color="#6ee7b7"
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.location} numberOfLines={1}>
              {locationLabel}
            </Text>
            {hitGoal ? (
              <View style={styles.goalBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#6ee7b7" />
              </View>
            ) : null}
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            {formatActivityDateLabel(activity.completedAt)}
          </Text>

          <Text style={styles.metrics} numberOfLines={1}>
            {activity.distanceKm.toFixed(1).replace('.', ',')} km
            {' · '}
            {formatElapsedActivityTime(activity.elapsedSeconds)}
            {' · '}
            {formatPaceMinPerKm(activity.paceMinPerKm)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
      </Pressable>

      {hasTrail ? (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onMapPress()
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
        >
          <Ionicons name="map-outline" size={18} color="#93c5fd" />
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  mainPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  content: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  goalBadge: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  metrics: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  mapButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginRight: 4,
  },
  mapButtonPressed: {
    opacity: 0.85,
  },
})
