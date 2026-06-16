import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { WeeklyCalendarActivityType, WeeklyCalendarDay } from '../../types/runWalk'
import { RunWalkSheetDrawer } from './RunWalkSheetDrawer'

type RunWalkWeeklyCalendarDrawerProps = {
  visible: boolean
  days: WeeklyCalendarDay[]
  onClose: () => void
}

function getActivityIcon(type: WeeklyCalendarActivityType) {
  switch (type) {
    case 'walk':
      return 'walk'
    case 'run':
      return 'run-fast'
    case 'run-walk':
      return 'run'
    case 'strength':
      return 'dumbbell'
    case 'mobility':
      return 'yoga'
    case 'free':
      return 'map-marker-radius'
    default:
      return 'bed'
  }
}

function getActivityColor(type: WeeklyCalendarActivityType) {
  switch (type) {
    case 'walk':
      return '#fca5a5'
    case 'run':
      return '#fdba74'
    case 'run-walk':
      return '#6ee7b7'
    case 'strength':
      return '#c4b5fd'
    case 'mobility':
      return '#67e8f9'
    case 'free':
      return '#93c5fd'
    default:
      return colors.textSubtle
  }
}

export function RunWalkWeeklyCalendarDrawer({
  visible,
  days,
  onClose,
}: RunWalkWeeklyCalendarDrawerProps) {
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Minha semana"
      subtitle="Caminhadas, corridas, fortalecimento e descanso"
      onClose={onClose}
    >
      {days.map((day) => (
        <View
          key={day.dateIso}
          style={[styles.dayCard, day.isToday && styles.dayCardToday]}
        >
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.weekday}>{day.weekdayShort}</Text>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
            </View>
            {day.isToday ? (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Hoje</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.activitiesCol}>
            {day.activities.map((activity, index) => {
              const accent = getActivityColor(activity.type)
              return (
                <View key={`${activity.label}-${index}`} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: `${accent}22` }]}>
                    <MaterialCommunityIcons
                      name={getActivityIcon(activity.type)}
                      size={16}
                      color={accent}
                    />
                  </View>
                  <Text style={styles.activityLabel}>{activity.label}</Text>
                  {activity.completed ? (
                    <MaterialCommunityIcons name="check-circle" size={16} color="#6ee7b7" />
                  ) : null}
                </View>
              )
            })}
          </View>
        </View>
      ))}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  dayCard: {
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  dayCardToday: {
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekday: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dayLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.32)',
  },
  todayBadgeText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  activitiesCol: {
    gap: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
})
