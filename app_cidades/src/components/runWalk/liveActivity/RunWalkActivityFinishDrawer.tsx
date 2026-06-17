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
      dense
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
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#ffb366', '#ff6b00', '#e55f00']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={styles.icon}
            >
              <Ionicons name="flag-outline" size={20} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.message}>
            Tempo, distância e velocidade ficam travados nesta sessão.
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
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    shadowColor: 'rgba(255, 107, 0, 0.35)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  summaryUnit: {
    fontSize: 10,
    letterSpacing: 0,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  footer: {
    gap: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
  },
  buttonPressed: {
    opacity: 0.86,
  },
})
