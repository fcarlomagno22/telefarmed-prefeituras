import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'
import { getModalFooterPadding } from '../utils/modalSafeArea'
import { AppModal } from './AppModal'

type CameraPermissionSheetProps = {
  visible: boolean
  blocked?: boolean
  title?: string
  message?: string
  allowLabel?: string
  dismissLabel?: string
  onAllow: () => void
  onDismiss: () => void
}

const SHEET_OFFSET = 420

const DEFAULT_COPY = {
  title: 'Acesso à câmera',
  message:
    'Usamos a câmera frontal só nesta etapa para registrar sua identidade com segurança. Sua foto fica protegida no app.',
  allowLabel: 'Permitir câmera',
  dismissLabel: 'Agora não',
}

const BLOCKED_COPY = {
  title: 'Câmera bloqueada',
  message:
    'O acesso à câmera foi negado. Abra as configurações do dispositivo e permita o uso da câmera para continuar.',
  allowLabel: 'Abrir ajustes',
  dismissLabel: 'Voltar',
}

export function CameraPermissionSheet({
  visible,
  blocked = false,
  title,
  message,
  allowLabel,
  dismissLabel,
  onAllow,
  onDismiss,
}: CameraPermissionSheetProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const copy = blocked ? BLOCKED_COPY : DEFAULT_COPY
  const resolvedTitle = title ?? copy.title
  const resolvedMessage = message ?? copy.message
  const resolvedAllowLabel = allowLabel ?? copy.allowLabel
  const resolvedDismissLabel = dismissLabel ?? copy.dismissLabel

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      sheetTranslateY.setValue(SHEET_OFFSET)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet()
    }
  }, [visible])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_OFFSET,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsMounted(false)
      done?.()
    })
  }

  function handleDismiss() {
    if (!visible) return
    closeSheet(onDismiss)
  }

  function handleAllow() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (blocked) {
      void Linking.openSettings()
      return
    }
    onAllow()
  }

  if (!isMounted && !visible) return null

  return (
    <AppModal
      visible={isMounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleDismiss}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View style={styles.backdropTint} />
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: getModalFooterPadding(insets.bottom, 10),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name={blocked ? 'settings-outline' : 'camera-outline'} size={30} color="#fff" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>{resolvedTitle}</Text>
          <Text style={styles.subtitle}>{resolvedMessage}</Text>

          <View style={styles.bulletList}>
            <BulletRow
              icon="shield-checkmark-outline"
              text="Usada apenas para verificação de identidade"
            />
            <BulletRow icon="lock-closed-outline" text="Não compartilhamos sua foto com terceiros" />
            <BulletRow icon="eye-off-outline" text="Você pode refazer a captura antes de concluir" />
          </View>

          <Pressable
            onPress={handleAllow}
            style={({ pressed }) => [styles.allowButton, pressed && styles.buttonPressed]}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.allowButtonGradient}
            >
              <Text style={styles.allowButtonText}>{resolvedAllowLabel}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.dismissButtonText}>{resolvedDismissLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </AppModal>
  )
}

function BulletRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletIcon}>
        <Ionicons name={icon} size={16} color={colors.primaryLight} />
      </View>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: 'rgba(22, 22, 28, 0.98)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 16,
  },
  iconWrap: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 14,
    fontWeight: '500',
  },
  bulletList: {
    gap: 8,
    marginBottom: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.18)',
  },
  bulletIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.14)',
  },
  bulletText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  allowButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  allowButtonGradient: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  dismissButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dismissButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.88,
  },
})
