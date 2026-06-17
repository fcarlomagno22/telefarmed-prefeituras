import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import type { RunWalkActivitySummary } from '../../../data/runWalkActivitySummaryStorage'
import { colors } from '../../../theme/colors'
import type { RunWalkHistoryMonthGroup } from '../../../types/runWalkHistory'
import { groupHistoryByMonth } from '../../../utils/runWalkHistoryStats'
import { RunWalkHistoryActivityListItem } from './RunWalkHistoryActivityListItem'

type RunWalkHistoryFeedProps = {
  activities: RunWalkActivitySummary[]
  targetMinutesPerDay: number
  animate?: boolean
  preserveFinal?: boolean
  onActivityPress: (activity: RunWalkActivitySummary) => void
  onActivityMapPress: (activity: RunWalkActivitySummary) => void
}

function AnimatedFeedGroup({
  group,
  targetMinutesPerDay,
  animate,
  preserveFinal,
  onActivityPress,
  onActivityMapPress,
}: {
  group: RunWalkHistoryMonthGroup
  targetMinutesPerDay: number
  animate: boolean
  preserveFinal: boolean
  onActivityPress: (activity: RunWalkActivitySummary) => void
  onActivityMapPress: (activity: RunWalkActivitySummary) => void
}) {
  const opacity = useRef(new Animated.Value(animate ? 0 : preserveFinal ? 1 : 0)).current
  const translateY = useRef(new Animated.Value(animate ? 10 : 0)).current

  useEffect(() => {
    if (!animate) {
      opacity.setValue(preserveFinal ? 1 : 0)
      translateY.setValue(0)
      return
    }

    opacity.setValue(0)
    translateY.setValue(10)

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [animate, opacity, preserveFinal, translateY])

  return (
    <Animated.View style={[styles.group, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.groupTitle}>{group.label}</Text>
      <View style={styles.listCard}>
        {group.activities.map((activity, index) => (
          <RunWalkHistoryActivityListItem
            key={activity.id}
            activity={activity}
            targetMinutesPerDay={targetMinutesPerDay}
            isLast={index === group.activities.length - 1}
            onPress={() => onActivityPress(activity)}
            onMapPress={() => onActivityMapPress(activity)}
          />
        ))}
      </View>
    </Animated.View>
  )
}

export function RunWalkHistoryFeed({
  activities,
  targetMinutesPerDay,
  animate = false,
  preserveFinal = true,
  onActivityPress,
  onActivityMapPress,
}: RunWalkHistoryFeedProps) {
  const groups: RunWalkHistoryMonthGroup[] = groupHistoryByMonth(activities)

  if (groups.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Nenhum treino neste filtro</Text>
        <Text style={styles.emptyText}>Ajuste o período ou remova filtros avançados.</Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      {groups.map((group) => (
        <AnimatedFeedGroup
          key={group.key}
          group={group}
          targetMinutesPerDay={targetMinutesPerDay}
          animate={animate}
          preserveFinal={preserveFinal}
          onActivityPress={onActivityPress}
          onActivityMapPress={onActivityMapPress}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'capitalize',
  },
  listCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
  },
  empty: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
})
