import { StyleSheet, Text, View } from 'react-native'
import type { RunWalkDayEnergy } from '../../types/eatWell'
import { colors } from '../../theme/colors'
import { formatCalories } from '../../utils/eatWellNutritionStats'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EatWellRunWalkEnergyDrawerProps = {
  visible: boolean
  energy: RunWalkDayEnergy
  baseCalories: number
  adjustedCalorieTarget: number
  onClose: () => void
}

function formatActivityDateTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const dateLabel = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
  const timeLabel = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${dateLabel} · ${timeLabel}`
}

function formatActivityLocation(city?: string | null, state?: string | null) {
  const parts = [city, state].filter(Boolean)
  if (parts.length === 0) return 'Local não informado'
  return parts.join(' · ')
}

export function EatWellRunWalkEnergyDrawer({
  visible,
  energy,
  baseCalories,
  adjustedCalorieTarget,
  onClose,
}: EatWellRunWalkEnergyDrawerProps) {
  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Energia de movimento"
      subtitle="Atividades registradas hoje"
      minHeight="52%"
      onClose={onClose}
    >
      <Text style={styles.summary}>
        Com base no que você registrou em Corrida e Caminhada, somamos{' '}
        {formatCalories(energy.totalCaloriesBurned)} hoje. Sua meta passou de{' '}
        {formatCalories(baseCalories)} para {formatCalories(adjustedCalorieTarget)}.
      </Text>

      {energy.activities.map((activity) => (
        <View key={activity.id} style={styles.activityRow}>
          <View style={styles.activityTextCol}>
            <Text style={styles.activityTitle}>Atividade</Text>
            <Text style={styles.activityMeta}>
              {formatActivityDateTime(activity.completedAt)} ·{' '}
              {formatActivityLocation(activity.locationCity, activity.locationState)} ·{' '}
              {activity.activeMinutes} min
            </Text>
          </View>
          <Text style={styles.activityCalories}>
            {formatCalories(activity.estimatedCalories)}
          </Text>
        </View>
      ))}
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  summary: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  activityTextCol: {
    flex: 1,
    gap: 3,
    paddingRight: 8,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  activityMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  activityCalories: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '800',
  },
})
