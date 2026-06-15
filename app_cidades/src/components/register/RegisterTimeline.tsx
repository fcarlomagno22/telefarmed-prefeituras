import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { colors } from '../../theme/colors'

const DOT_SIZE = 34

const registerSteps = [
  { id: 1, icon: 'location-outline' as const },
  { id: 2, icon: 'person-outline' as const },
  { id: 3, icon: 'scan-outline' as const },
  { id: 4, icon: 'lock-closed-outline' as const },
  { id: 5, icon: 'document-text-outline' as const },
]

type RegisterTimelineProps = {
  currentStep: number
}

function ConnectorLine({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <LinearGradient
        colors={[colors.primaryLight, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.connectorFilled}
      />
    )
  }

  return <View style={styles.connector} />
}

export function RegisterTimeline({ currentStep }: RegisterTimelineProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.timeline}>
        {registerSteps.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep
          const isFirst = index === 0
          const isLast = index === registerSteps.length - 1
          const leftFilled = step.id <= currentStep && !isFirst
          const rightFilled = step.id < currentStep && !isLast

          return (
            <View key={step.id} style={styles.column}>
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
                        colors={[colors.primaryLight, colors.primary]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dotCurrentGradient}
                      >
                        <Ionicons name={step.icon} size={14} color="#fff" />
                      </LinearGradient>
                    ) : (
                      <Ionicons name={step.icon} size={13} color={colors.textSubtle} />
                    )}
                  </View>
                </View>

                <View style={styles.connectorSide}>
                  {!isLast ? <ConnectorLine filled={rightFilled} /> : null}
                </View>
              </View>
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
    marginBottom: 20,
  },
  timeline: {
    width: '78%',
    maxWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  column: {
    flex: 1,
    alignItems: 'center',
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
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderColor: 'rgba(255, 107, 0, 0.55)',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    shadowColor: colors.primary,
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
  dotUpcoming: {
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
})
