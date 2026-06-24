import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { colors } from '../../theme/colors'
import { EMOTIONAL_SCREENING_DISCLAIMER } from '../../types/emotionalScreening'
import { PrimaryButton } from '../PrimaryButton'
import { RunWalkSheetDrawer } from '../runWalk/RunWalkSheetDrawer'

type EmotionalScreeningCrisisDrawerProps = {
  visible: boolean
  message?: string
  onClose: () => void
}

function dialPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return
  void Linking.openURL(`tel:${digits}`)
}

export function EmotionalScreeningCrisisDrawer({
  visible,
  message,
  onClose,
}: EmotionalScreeningCrisisDrawerProps) {
  useAndroidBackHandler(() => {
    if (!visible) return false
    onClose()
    return true
  })

  return (
    <RunWalkSheetDrawer
      visible={visible}
      title="Precisa de apoio agora"
      subtitle="Você não está sozinho(a)"
      onClose={onClose}
      footer={
        <PrimaryButton label="Entendi, vou buscar apoio" onPress={onClose} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.message}>
          {message ??
            'Suas respostas indicam que você pode precisar de apoio imediato. Conversar com alguém preparado pode fazer diferença agora.'}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={() => dialPhone('188')}
          style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]}
        >
          <LinearGradient colors={['#f472b6', '#db2777']} style={styles.routeIcon}>
            <Ionicons name="call-outline" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.routeText}>
            <Text style={styles.routeLabel}>CVV — 188</Text>
            <Text style={styles.routeDescription}>Apoio emocional gratuito, 24 horas</Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => dialPhone('192')}
          style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]}
        >
          <LinearGradient colors={['#f87171', '#dc2626']} style={styles.routeIcon}>
            <Ionicons name="medkit-outline" size={20} color="#fff" />
          </LinearGradient>
          <View style={styles.routeText}>
            <Text style={styles.routeLabel}>SAMU — 192</Text>
            <Text style={styles.routeDescription}>Emergência médica</Text>
          </View>
        </Pressable>

        <Text style={styles.disclaimer}>{EMOTIONAL_SCREENING_DISCLAIMER}</Text>
      </View>
    </RunWalkSheetDrawer>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingBottom: 8,
  },
  message: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pressed: {
    opacity: 0.85,
  },
  routeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    flex: 1,
    gap: 2,
  },
  routeLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  routeDescription: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  disclaimer: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 4,
  },
})
