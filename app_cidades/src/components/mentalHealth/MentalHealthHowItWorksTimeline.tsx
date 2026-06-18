import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { MENTAL_HEALTH_HOW_IT_WORKS_STEPS } from '../../types/mentalHealth'
import { colors } from '../../theme/colors'

const DOT_SIZE = 34

type MentalHealthHowItWorksTimelineProps = {
  currentStep: number
  onStepPress: (step: number) => void
}

function ConnectorLine({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <LinearGradient
        colors={['#67e8f9', '#0891b2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.connectorFilled}
      />
    )
  }

  return <View style={styles.connector} />
}

export function MentalHealthHowItWorksTimeline({
  currentStep,
  onStepPress,
}: MentalHealthHowItWorksTimelineProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.timeline}>
        {MENTAL_HEALTH_HOW_IT_WORKS_STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep
          const isFirst = index === 0
          const isLast = index === MENTAL_HEALTH_HOW_IT_WORKS_STEPS.length - 1
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
                          colors={['#67e8f9', '#0891b2']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.dotCurrentGradient}
                        >
                          <Text style={styles.dotCurrentNumber}>{step.id}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={styles.dotUpcomingNumber}>{step.id}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.connectorSide}>
                    {!isLast ? <ConnectorLine filled={rightFilled} /> : null}
                  </View>
                </View>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeline: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  dotPressable: {
    width: '100%',
  },
  dotPressablePressed: {
    opacity: 0.88,
  },
  dotRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: DOT_SIZE,
  },
  connectorSide: {
    flex: 1,
    justifyContent: 'center',
  },
  connector: {
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  connectorFilled: {
    height: 2,
    borderRadius: 999,
  },
  dotSlot: {
    width: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  dotCompleted: {
    backgroundColor: '#0891b2',
    borderColor: '#0891b2',
  },
  dotCurrent: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderColor: 'rgba(103, 232, 249, 0.55)',
    backgroundColor: 'rgba(8, 145, 178, 0.12)',
    shadowColor: '#0891b2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  dotCurrentGradient: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCurrentNumber: {
    color: '#0a0a0c',
    fontSize: 15,
    fontWeight: '900',
  },
  dotUpcoming: {
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  dotUpcomingNumber: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '800',
  },
})
