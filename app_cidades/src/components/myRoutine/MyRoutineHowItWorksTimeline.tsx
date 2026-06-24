import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MY_ROUTINE_HOW_IT_WORKS_STEPS } from '../../types/myRoutine'
import type { ThemeColors } from '../../theme/palettes'
import { useThemedStyles } from '../../hooks/useThemedStyles'

const DOT_SIZE = 34
const ACCENT = '#d946ef'
const ACCENT_LIGHT = '#f0abfc'

type MyRoutineHowItWorksTimelineProps = {
  currentStep: number
  onStepPress: (step: number) => void
}

function ConnectorLine({ filled }: { filled: boolean }) {
  const styles = useThemedStyles(createStyles)
  if (filled) {
    return (
      <LinearGradient
        colors={[ACCENT_LIGHT, ACCENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.connectorFilled}
      />
    )
  }

  return <View style={styles.connector} />
}

export function MyRoutineHowItWorksTimeline({
  currentStep,
  onStepPress,
}: MyRoutineHowItWorksTimelineProps) {
  const styles = useThemedStyles(createStyles)
  return (
    <View style={styles.wrapper}>
      <View style={styles.timeline}>
        {MY_ROUTINE_HOW_IT_WORKS_STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep
          const isFirst = index === 0
          const isLast = index === MY_ROUTINE_HOW_IT_WORKS_STEPS.length - 1
          const leftFilled = step.id <= currentStep && !isFirst
          const rightFilled = step.id < currentStep && !isLast

          return (
            <View key={step.id} style={styles.column}>
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  onStepPress(step.id)
                }}
                style={({ pressed }) => [styles.dotPressable, pressed && styles.dotPressablePressed]}
                accessibilityRole="button"
                accessibilityLabel={`Passo ${step.id}: ${step.title}`}
                accessibilityState={{ selected: isCurrent }}
              >
                <View style={styles.dotRow}>
                  <View style={styles.connectorSide}>
                    {!isFirst ? <ConnectorLine filled={leftFilled} /> : null}
                  </View>

                  <View style={styles.dotSlot}>
                    <View
                      style={[
                        styles.dot,
                        isCompleted && styles.dotCompleted,
                        isCurrent && styles.dotCurrent,
                        isUpcoming && styles.dotUpcoming,
                      ]}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : isCurrent ? (
                        <LinearGradient
                          colors={[ACCENT_LIGHT, ACCENT]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.dotCurrentGradient}
                        >
                          <Text style={styles.dotCurrentText}>{step.id}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.dotUpcomingText}>{step.id}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.connectorSide}>
                    {!isLast ? <ConnectorLine filled={rightFilled} /> : null}
                  </View>
                </View>
              </Pressable>

              <Text
                style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}
                numberOfLines={2}
              >
                {step.title}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return {
  wrapper: {
    paddingVertical: 4,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dotPressable: {
    width: '100%',
    alignItems: 'center',
  },
  dotPressablePressed: {
    opacity: 0.88,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  connectorSide: {
    flex: 1,
    height: DOT_SIZE,
    justifyContent: 'center',
  },
  connector: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
  },
  connectorFilled: {
    height: 2,
    borderRadius: 999,
  },
  dotSlot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dotCompleted: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  dotCurrent: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  dotUpcoming: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dotCurrentGradient: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrentText: {
    color: '#0a0a0c',
    fontSize: 13,
    fontWeight: '900',
  },
  dotUpcomingText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  stepLabelCurrent: {
    color: ACCENT_LIGHT,
  },
}
}

