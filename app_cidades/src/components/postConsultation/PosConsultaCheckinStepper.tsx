import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

const STEPS = [
  { id: 'sintomas', label: 'Como está' },
  { id: 'medicacao', label: 'Medicamentos' },
  { id: 'medicoes', label: 'Medições' },
  { id: 'alertas', label: 'Alertas' },
] as const

type PosConsultaCheckinStepperProps = {
  stepIndex: number
}

export function PosConsultaCheckinStepper({ stepIndex }: PosConsultaCheckinStepperProps) {
  return (
    <View style={styles.root}>
      {STEPS.map((item, index) => {
        const isActive = index === stepIndex
        const isDone = index < stepIndex

        return (
          <View key={item.id} style={styles.stepCol}>
            <View style={styles.stepRow}>
              {index > 0 ? (
                <View
                  style={[
                    styles.connector,
                    (isDone || isActive) && styles.connectorActive,
                  ]}
                />
              ) : (
                <View style={styles.connectorSpacer} />
              )}

              <View
                style={[
                  styles.bubble,
                  (isActive || isDone) && styles.bubbleActive,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    (isActive || isDone) && styles.bubbleTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>

              {index < STEPS.length - 1 ? (
                <View
                  style={[styles.connector, isDone && styles.connectorActive]}
                />
              ) : (
                <View style={styles.connectorSpacer} />
              )}
            </View>

            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  connector: {
    flex: 1,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  connectorActive: {
    backgroundColor: '#0ea5e9',
  },
  connectorSpacer: {
    flex: 1,
  },
  bubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#0ea5e9',
  },
  bubbleText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '800',
  },
  bubbleTextActive: {
    color: '#fff',
  },
  label: {
    color: colors.textSubtle,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  labelActive: {
    color: '#7dd3fc',
  },
})
