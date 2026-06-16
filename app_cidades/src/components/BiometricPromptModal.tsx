import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from './AppModal'
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
    <AppModal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <LinearGradient
          colors={[
            'rgba(255, 133, 51, 0.38)',
            'rgba(255, 107, 0, 0.16)',
            'rgba(255, 255, 255, 0.06)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.cardInner}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}

            <LinearGradient
              colors={['rgba(28, 28, 36, 0.72)', 'rgba(14, 14, 20, 0.78)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.cardContent}>
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
        </LinearGradient>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  cardBorder: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 1,
    shadowColor: '#ff6b00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  cardInner: {
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
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
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.22)',
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
