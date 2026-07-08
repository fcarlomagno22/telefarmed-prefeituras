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

function getActivityStyle(type: WeeklyCalendarActivityType) {
  switch (type) {
    case 'walk':
      return { icon: '#ef4444', bg: '#fef2f2' }
    case 'run':
      return { icon: '#f97316', bg: '#fff7ed' }
    case 'run-walk':
      return { icon: '#10b981', bg: '#ecfdf5' }
    case 'strength':
      return { icon: '#8b5cf6', bg: '#f5f3ff' }
    case 'mobility':
      return { icon: '#0891b2', bg: '#ecfeff' }
    case 'free':
      return { icon: '#3b82f6', bg: '#eff6ff' }
    default:
      return { icon: '#6366f1', bg: '#eef2ff' }
  }
}

function isRestDay(day: WeeklyCalendarDay) {
  return day.activities.every((activity) => activity.type === 'rest')
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
      {days.map((day) => {
        const restDay = isRestDay(day)

        return (
        <View
          key={day.dateIso}
          style={[
            styles.dayCard,
            restDay && !day.isToday && styles.dayCardRest,
            day.isToday && styles.dayCardToday,
          ]}
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
              const activityStyle = getActivityStyle(activity.type)
              return (
                <View key={`${activity.label}-${index}`} style={styles.activityRow}>
                  <View style={[styles.activityIcon, { backgroundColor: activityStyle.bg }]}>
                    <MaterialCommunityIcons
                      name={getActivityIcon(activity.type)}
                      size={16}
                      color={activityStyle.icon}
                    />
                  </View>
                  <Text
                    style={[
                      styles.activityLabel,
                      activity.type === 'rest' && styles.activityLabelRest,
                    ]}
                  >
                    {activity.label}
                  </Text>
                  {activity.completed ? (
                    <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                  ) : null}
                </View>
              )
            })}
          </View>
        </View>
        )
      })}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  dayCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dayCardRest: {
    backgroundColor: '#fafbff',
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  dayCardToday: {
    borderColor: 'rgba(255, 107, 0, 0.35)',
    backgroundColor: '#fffaf5',
    shadowColor: '#ff6b00',
    shadowOpacity: 0.08,
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
    backgroundColor: colors.primary,
  },
  todayBadgeText: {
    color: '#ffffff',
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
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  activityLabelRest: {
    color: colors.textMuted,
    fontWeight: '500',
  },
})
