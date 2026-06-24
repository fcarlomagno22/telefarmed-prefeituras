import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'
import {
  getActiveStepIndex,
  JOURNEY_STEPS,
  JOURNEY_STEP_THEMES,
  type MentalHealthJourneyPhase,
} from '../../utils/mentalHealthJourney'

const CRISIS_THEME = {
  light: '#fda4af',
  main: '#f43f5e',
  border: 'rgba(244, 63, 94, 0.55)',
  glow: 'rgba(244, 63, 94, 0.35)',
}

type MentalHealthJourneyTimelineProps = {
  phase: MentalHealthJourneyPhase
}

export function MentalHealthJourneyTimeline({ phase }: MentalHealthJourneyTimelineProps) {
  const activeIndex = getActiveStepIndex(phase)
  const visibleSteps = JOURNEY_STEPS.filter((step) => step.id !== 'crisis' || phase === 'crisis')

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {visibleSteps.map((step, index) => {
          const globalIndex = JOURNEY_STEPS.findIndex((item) => item.id === step.id)
          const isActive = globalIndex === activeIndex
          const isComplete = globalIndex < activeIndex
          const theme =
            step.id === 'crisis'
              ? CRISIS_THEME
              : JOURNEY_STEP_THEMES[globalIndex] ?? JOURNEY_STEP_THEMES[0]

          return (
            <View key={step.id} style={styles.step}>
              <View
                style={[
                  styles.dot,
                  isComplete && { backgroundColor: theme.main, borderColor: theme.border },
                  isActive && {
                    backgroundColor: theme.main,
                    borderColor: theme.light,
                    shadowColor: theme.glow,
                    shadowOpacity: 0.9,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              />
              <Text
                style={[
                  styles.label,
                  (isActive || isComplete) && { color: isActive ? theme.light : colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
              {index < visibleSteps.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    isComplete && { backgroundColor: theme.border },
                  ]}
                />
              ) : null}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
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
  label: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.1,
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
})
