import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

type BiometricPromptModalProps = {
  visible: boolean
  onEnable: () => void
  onDismiss: () => void
}

export function BiometricPromptModal({
  visible,
  onEnable,
  onDismiss,
}: BiometricPromptModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="finger-print" size={34} color={colors.primary} />
          </View>

          <Text style={styles.title}>Ativar acesso por biometria?</Text>
          <Text style={styles.subtitle}>
            Na próxima vez, você poderá entrar no app com digital ou reconhecimento facial,
            de forma rápida e segura.
          </Text>

          <Pressable
            onPress={onEnable}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryText}>Ativar biometria</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={onDismiss} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Agora não</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: colors.cardBg,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  primaryGradient: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
})
