import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../theme/colors'
import {
  formatActivityDistanceKmParts,
  formatElapsedActivityTime,
  formatSpeedKmhParts,
} from '../../../utils/runWalkActivityStats'
import { PrimaryButton } from '../../PrimaryButton'
import { RunWalkSheetDrawer } from '../RunWalkSheetDrawer'
import { ActivityMetricValue } from './ActivityMetricValue'

type RunWalkActivityFinishDrawerProps = {
  visible: boolean
  elapsedSeconds: number
  distanceKm: number
  speedKmh: number | null
  onClose: () => void
  onConfirm: () => void
}

export function RunWalkActivityFinishDrawer({
  visible,
  elapsedSeconds,
  distanceKm,
  speedKmh,
  onClose,
  onConfirm,
}: RunWalkActivityFinishDrawerProps) {
  function handleConfirm() {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    onConfirm()
    onClose()
  }

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Encerrar treino"
      subtitle="Os dados abaixo serão registrados até aqui"
      onClose={onClose}
      scrollable={false}
      minHeight="52%"
      extraBottomInset={10}
      footer={
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continuar treino"
            onPress={onClose}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Continuar treino</Text>
          </Pressable>

          <PrimaryButton label="Encerrar treino" onPress={handleConfirm} style={styles.primaryButton} />
        </View>
      }
    >
      <View style={styles.hero}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#ffb366', '#ff6b00', '#e55f00']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.icon}
          >
            <Ionicons name="flag-outline" size={24} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.message}>
          Ao encerrar, o tempo, a distância e a velocidade ficam travados nesta sessão.
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <ActivityMetricValue
            parts={formatSpeedKmhParts(speedKmh)}
            valueStyle={styles.summaryValue}
            unitStyle={styles.summaryUnit}
          />
          <Text style={styles.summaryLabel}>Velocidade</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatElapsedActivityTime(elapsedSeconds)}</Text>
          <Text style={styles.summaryLabel}>Tempo</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <ActivityMetricValue
            parts={formatActivityDistanceKmParts(distanceKm)}
            valueStyle={styles.summaryValue}
            unitStyle={styles.summaryUnit}
          />
          <Text style={styles.summaryLabel}>Distância</Text>
        </View>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 4,
  },
  iconWrap: {
    shadowColor: 'rgba(255, 107, 0, 0.35)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  summaryUnit: {
    fontSize: 11,
    letterSpacing: 0,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  footer: {
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.86,
  },
})
