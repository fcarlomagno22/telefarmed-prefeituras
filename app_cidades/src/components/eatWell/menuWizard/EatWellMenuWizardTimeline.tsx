import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { MENU_WIZARD_TIMELINE_STEPS } from '../../../utils/eatWellMenuWizard'
import { colors } from '../../../theme/colors'

const DOT_SIZE = 34

type EatWellMenuWizardTimelineProps = {
  currentStep: number
}

function ConnectorLine({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <LinearGradient
        colors={['#a3e635', '#84cc16']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.connectorFilled}
      />
    )
  }

  return <View style={styles.connector} />
}

export function EatWellMenuWizardTimeline({ currentStep }: EatWellMenuWizardTimelineProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.timeline}>
        {MENU_WIZARD_TIMELINE_STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep
          const isUpcoming = step.id > currentStep
          const isFirst = index === 0
          const isLast = index === MENU_WIZARD_TIMELINE_STEPS.length - 1
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
                        colors={['#bef264', '#84cc16']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.dotCurrentGradient}
                      >
                        <Ionicons name={step.icon} size={14} color="#0a0a0c" />
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
    marginBottom: 12,
  },
  timeline: {
    width: '72%',
    maxWidth: 260,
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
    backgroundColor: '#84cc16',
    borderColor: '#84cc16',
  },
  dotCurrent: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderColor: 'rgba(163, 230, 53, 0.55)',
    backgroundColor: 'rgba(132, 204, 22, 0.12)',
    shadowColor: '#84cc16',
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
