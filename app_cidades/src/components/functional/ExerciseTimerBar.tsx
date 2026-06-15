import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { TimerPhase } from '../../types/functionalTraining'
import { formatTimerDisplay } from '../../utils/functionalTraining'

type ExerciseTimerBarProps = {
  secondsLeft: number
  totalSeconds: number
  phase: TimerPhase
}

const PHASE_GRADIENTS: Record<TimerPhase, [string, string, string]> = {
  idle: ['#ff8533', '#ff6b00', '#e55f00'],
  countdown: ['#fde68a', '#fbbf24', '#f59e0b'],
  work: ['#fdba74', '#f97316', '#ea580c'],
  rest: ['#94a3b8', '#64748b', '#475569'],
  completed: ['#86efac', '#22c55e', '#16a34a'],
}

const PHASE_GLOW: Record<TimerPhase, string> = {
  idle: 'rgba(255, 107, 0, 0.35)',
  countdown: 'rgba(251, 191, 36, 0.4)',
  work: 'rgba(249, 115, 22, 0.4)',
  rest: 'rgba(100, 116, 139, 0.35)',
  completed: 'rgba(34, 197, 94, 0.35)',
}

export function ExerciseTimerBar({
  secondsLeft,
  totalSeconds,
  phase,
}: ExerciseTimerBarProps) {
  const safeTotal = Math.max(totalSeconds, 1)
  const progress = Math.min(Math.max(secondsLeft / safeTotal, 0), 1)
  const gradient = PHASE_GRADIENTS[phase]
  const glow = PHASE_GLOW[phase]

  const display =
    phase === 'countdown'
      ? secondsLeft.toString()
      : formatTimerDisplay(secondsLeft)

  const isCountdown = phase === 'countdown'

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.time,
          isCountdown && styles.timeCountdown,
          phase === 'rest' && styles.timeRest,
        ]}
      >
        {display}
      </Text>

      <View style={[styles.track, { shadowColor: glow }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  time: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  timeCountdown: {
    fontSize: 72,
    color: '#fbbf24',
    letterSpacing: -3,
  },
  timeRest: {
    color: '#94a3b8',
    fontSize: 44,
  },
  track: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 12,
    elevation: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    minWidth: 8,
  },
})
