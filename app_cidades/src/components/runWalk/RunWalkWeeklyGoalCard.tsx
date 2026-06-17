import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { ACTION_ICON_PALETTES } from '../../theme/actionIconColors'
import { colors } from '../../theme/colors'
import type { WeeklyCalendarDay, WeeklyGoalStats } from '../../types/runWalk'
import { hasWeeklyGoal } from '../../utils/runWalkWeeklyGoal'
import { AppointmentActionButton } from '../appointments/AppointmentActionButton'
import { RunWalkProgressRing } from './RunWalkProgressRing'
import {
  RunWalkWeeklyBarChart,
  type RunWalkWeeklyBarCelebrateDay,
} from './RunWalkWeeklyBarChart'

type RunWalkWeeklyGoalCardProps = {
  stats: WeeklyGoalStats
  days: WeeklyCalendarDay[]
  onViewWeekPress: () => void
  onGoalActionPress: () => void
  celebrateDay?: RunWalkWeeklyBarCelebrateDay | null
  animateRings?: boolean
}

export function RunWalkWeeklyGoalCard({
  stats,
  days,
  onViewWeekPress,
  onGoalActionPress,
  celebrateDay = null,
  animateRings = true,
}: RunWalkWeeklyGoalCardProps) {
  const { width: screenWidth } = useWindowDimensions()
  const chartWidth = screenWidth - 32 - 28
  const goalDefined = hasWeeklyGoal(stats)

  const activityProgress = goalDefined
    ? stats.completedActivities / stats.targetActivities
    : 0
  const minutesProgress = goalDefined
    ? stats.activeMinutes / stats.targetActiveMinutes
    : 0
  const movementProgress = goalDefined
    ? stats.movementDays / stats.targetMovementDays
    : 0

  function handleGoalActionPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onGoalActionPress()
  }

  return (
    <View style={styles.cardWrap}>
    <LinearGradient
      colors={['rgba(37, 99, 235, 0.24)', 'rgba(29, 78, 216, 0.1)', 'rgba(14, 14, 20, 0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar" size={18} color="#93c5fd" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Meta semanal</Text>
          <Text style={styles.subtitle}>
            {goalDefined
              ? 'Regularidade, minutos e dias em movimento'
              : 'Defina sua meta para acompanhar a semana'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={goalDefined ? 'Editar meta semanal' : 'Adicionar meta semanal'}
          onPress={handleGoalActionPress}
          style={({ pressed }) => [styles.goalAction, pressed && styles.goalActionPressed]}
        >
          <Text style={styles.goalActionText}>
            {goalDefined ? 'Editar meta' : 'Adicionar meta'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.ringsRow}>
        <View style={styles.ringBlock}>
          <RunWalkProgressRing
            progress={activityProgress}
            value={
              goalDefined
                ? `${stats.completedActivities}/${stats.targetActivities}`
                : '—'
            }
            countTo={goalDefined ? stats.completedActivities : undefined}
            formatCount={
              goalDefined
                ? (current) =>
                    `${Math.round(current)}/${stats.targetActivities}`
                : undefined
            }
            label="Atividades"
            gradientId="runWalkActivitiesRing"
            gradientColors={['#93c5fd', '#3b82f6', '#1d4ed8']}
            animate={animateRings}
            preserveFinal={false}
            animationDelay={0}
          />
          <Text style={styles.ringCaption}>
            {goalDefined ? 'concluídas' : 'sem meta'}
          </Text>
        </View>

        <View style={styles.ringDivider} />

        <View style={styles.ringBlock}>
          <RunWalkProgressRing
            progress={minutesProgress}
            value={goalDefined ? `${stats.activeMinutes}` : '—'}
            countTo={goalDefined ? stats.activeMinutes : undefined}
            formatCount={goalDefined ? (current) => String(Math.round(current)) : undefined}
            label="Minutos"
            gradientId="runWalkMinutesRing"
            gradientColors={['#bfdbfe', '#60a5fa', '#2563eb']}
            animate={animateRings}
            preserveFinal={false}
            animationDelay={50}
          />
          <Text style={styles.ringCaption}>
            {goalDefined ? `de ${stats.targetActiveMinutes} min` : 'sem meta'}
          </Text>
        </View>

        <View style={styles.ringDivider} />

        <View style={styles.ringBlock}>
          <RunWalkProgressRing
            progress={movementProgress}
            value={goalDefined ? `${stats.movementDays}` : '—'}
            countTo={goalDefined ? stats.movementDays : undefined}
            formatCount={goalDefined ? (current) => String(Math.round(current)) : undefined}
            label="Dias"
            gradientId="runWalkDaysRing"
            gradientColors={['#c4b5fd', '#818cf8', '#6366f1']}
            animate={animateRings}
            preserveFinal={false}
            animationDelay={100}
          />
          <Text style={styles.ringCaption}>
            {goalDefined
              ? `de ${stats.targetMovementDays} em movimento`
              : 'sem meta'}
          </Text>
        </View>
      </View>

      <View style={styles.chartBlock}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Minutos ativos por dia</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotActive]} />
              <Text style={styles.legendText}>Ativo</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotToday]} />
              <Text style={styles.legendText}>Hoje</Text>
            </View>
          </View>
        </View>

        <RunWalkWeeklyBarChart
          days={days}
          width={chartWidth}
          celebrateDay={celebrateDay}
          animate={animateRings}
          preserveFinal={false}
        />
      </View>

      <View style={styles.movementRow}>
        <Ionicons name="footsteps-outline" size={16} color="#93c5fd" />
        <Text style={styles.movementText}>
          Você se movimentou em {stats.movementDays} dias desta semana
        </Text>
      </View>

      <AppointmentActionButton
        label="Ver minha semana"
        icon="calendar-week"
        palette={ACTION_ICON_PALETTES.myGoals}
        onPress={onViewWeekPress}
      />
    </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  cardWrap: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.28)',
  },
  card: {
    borderRadius: 18,
    padding: 14,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
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
  goalAction: {
    paddingTop: 2,
    paddingLeft: 4,
    flexShrink: 0,
  },
  goalActionPressed: {
    opacity: 0.7,
  },
  goalActionText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '700',
  },
  ringsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  ringBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  ringCaption: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  ringDivider: {
    width: 1,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  chartBlock: {
    gap: 8,
    paddingTop: 2,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'visible',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  chartTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendDotActive: {
    backgroundColor: '#60a5fa',
  },
  legendDotToday: {
    backgroundColor: '#34d399',
  },
  legendText: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
  },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  movementText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
})
