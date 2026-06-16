import Svg, { Circle } from 'react-native-svg'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import type { TimerPhase } from '../../types/functionalTraining'
import { formatTimerDisplay } from '../../utils/functionalTraining'

type ExerciseTimerRingProps = {
  secondsLeft: number
  totalSeconds: number
  phase: TimerPhase
  size?: number
  compact?: boolean
}

const PHASE_COLORS: Record<TimerPhase, string> = {
  idle: colors.primary,
  countdown: '#fbbf24',
  work: '#f97316',
  rest: '#64748b',
  completed: '#22c55e',
}

export function ExerciseTimerRing({
  secondsLeft,
  totalSeconds,
  phase,
  size = 220,
  compact = false,
}: ExerciseTimerRingProps) {
  const strokeWidth = compact ? 8 : 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const safeTotal = Math.max(totalSeconds, 1)
  const clampedSeconds = Math.min(Math.max(secondsLeft, 0), safeTotal)
  const progress = Math.min(Math.max(clampedSeconds / safeTotal, 0), 1)
  const strokeDashoffset = circumference * (1 - progress)
  const color = PHASE_COLORS[phase]
  const displaySeconds = Math.max(Math.ceil(clampedSeconds - 1e-4), 0)

  const display =
    phase === 'countdown'
      ? displaySeconds.toString()
      : formatTimerDisplay(displaySeconds)

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.center}>
        <Text style={[styles.time, compact && styles.timeCompact, phase === 'countdown' && styles.timeCountdown]}>
          {display}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  timeCompact: {
    fontSize: 36,
  },
  timeCountdown: {
    fontSize: 48,
    color: '#fbbf24',
  },
})
