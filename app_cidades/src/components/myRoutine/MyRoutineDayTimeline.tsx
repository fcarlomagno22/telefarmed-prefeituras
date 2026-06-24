import { StyleSheet, Text, View } from 'react-native'
import type { MyRoutineDayPhase } from '../../utils/myRoutineTodayHelpers'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

const DAY_PHASE_STEPS: { id: MyRoutineDayPhase; label: string }[] = [
  { id: 'planned', label: 'Planejado' },
  { id: 'in_progress', label: 'Em andamento' },
  { id: 'minimal_ok', label: 'Mínima ok' },
  { id: 'day_closed', label: 'Encerrado' },
]

const PHASE_ORDER: MyRoutineDayPhase[] = [
  'planned',
  'in_progress',
  'minimal_ok',
  'day_closed',
]

type MyRoutineDayTimelineProps = {
  phase: MyRoutineDayPhase
}

function getPhaseIndex(phase: MyRoutineDayPhase): number {
  return PHASE_ORDER.indexOf(phase)
}

export function MyRoutineDayTimeline({ phase }: MyRoutineDayTimelineProps) {
  const styles = useThemedStyles(createStyles)
  const activeIndex = getPhaseIndex(phase)

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {DAY_PHASE_STEPS.map((step, index) => {
          const stepIndex = getPhaseIndex(step.id)
          const isActive = stepIndex === activeIndex
          const isComplete = stepIndex < activeIndex

          return (
            <View key={step.id} style={styles.step}>
              <View
                style={[
                  styles.dot,
                  isComplete && styles.dotComplete,
                  isActive && styles.dotActive,
                ]}
              />
              <Text
                style={[
                  styles.label,
                  (isActive || isComplete) && styles.labelActive,
                  isActive && styles.labelCurrent,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
              {index < DAY_PHASE_STEPS.length - 1 ? (
                <View style={[styles.connector, isComplete && styles.connectorComplete]} />
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  wrap: {
    paddingBottom: 4,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dotComplete: {
    backgroundColor: ACCENT,
    borderColor: 'rgba(240, 171, 252, 0.55)',
  },
  dotActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT_LIGHT,
    shadowColor: 'rgba(217, 70, 239, 0.45)',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.textMuted,
  },
  labelCurrent: {
    color: ACCENT_LIGHT,
    fontWeight: '700',
  },
  connector: {
    position: 'absolute',
    top: 4,
    left: '58%',
    right: '-42%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: -1,
  },
  connectorComplete: {
    backgroundColor: 'rgba(217, 70, 239, 0.45)',
  },
}
}

