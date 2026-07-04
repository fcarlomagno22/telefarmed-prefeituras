import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { PwaInstallMode } from '../../utils/pwaInstall.types'
import { colors } from '../../theme/colors'
import { PrimaryButton } from '../PrimaryButton'

type PwaInstallDrawerProps = {
  visible: boolean
  installMode: PwaInstallMode
  isInstalling: boolean
  canNativeInstall: boolean
  onInstall: () => void
  onDismiss: () => void
}

const appIconSource = require('../../../assets/icon.png')

const IOS_STEPS = [
  'Toque em Compartilhar (ícone abaixo da barra de endereço).',
  'Escolha "Adicionar à Tela de Início".',
  'Toque em Adicionar — o app abrirá em tela cheia.',
]

export function PwaInstallDrawer({
  visible,
  installMode,
  isInstalling,
  canNativeInstall,
  onInstall,
  onDismiss,
}: PwaInstallDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const backdropOpacity = useRef(new Animated.Value(0)).current
  const sheetTranslateY = useRef(new Animated.Value(-40)).current
  const sheetOpacity = useRef(new Animated.Value(0)).current

  const isIos = installMode === 'manual-ios'

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      sheetTranslateY.setValue(-40)
      sheetOpacity.setValue(0)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!isMounted) return

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: -40,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsMounted(false)
    })
  }, [backdropOpacity, isMounted, sheetOpacity, sheetTranslateY, visible])

  if (!isMounted) return null

  const primaryLabel = isInstalling ? 'Instalando…' : isIos ? 'Entendi' : 'Instalar'

  return (
    <Modal visible={isMounted} transparent animationType="none" statusBarTranslucent>
    <View style={styles.host} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Fechar" />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 16),
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <LinearGradient
          colors={['#14141c', '#0e0e14', colors.background]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.sheetGradient}
        >
          <Pressable
            onPress={onDismiss}
            hitSlop={12}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.iconWrap}>
              <Image
                source={appIconSource}
                style={styles.appIcon}
                resizeMode="cover"
                accessibilityLabel="Telefarmed"
              />
            </View>

            <Text style={styles.title}>Instalar o Telefarmed?</Text>
            <Text style={styles.subtitle}>
              {isIos
                ? 'Coloque o app na tela inicial e use em tela cheia, sem a barra do navegador.'
                : 'Toque em Instalar para adicionar o app na tela inicial — rápido e em tela cheia.'}
            </Text>

            {!isIos ? (
              <View style={styles.benefitsCard}>
                <View style={styles.benefitRow}>
                  <Ionicons name="expand-outline" size={20} color={colors.primaryLight} />
                  <Text style={styles.benefitText}>Tela cheia, sem barra de endereço</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Ionicons name="flash-outline" size={20} color={colors.primaryLight} />
                  <Text style={styles.benefitText}>Acesso direto pela tela inicial</Text>
                </View>
              </View>
            ) : (
              <View style={styles.stepsCard}>
                <Text style={styles.stepsTitle}>Como instalar no iPhone</Text>
                {IOS_STEPS.map((step, index) => (
                  <View key={step} style={styles.stepRow}>
                    <View style={styles.stepBullet}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton
              label={primaryLabel}
              onPress={onInstall}
              loading={isInstalling}
              disabled={isInstalling}
            />
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            >
              <Text style={styles.secondaryButtonText}>Agora não</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 100000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetGradient: {
    flex: 1,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    gap: 14,
  },
  iconWrap: {
    alignSelf: 'center',
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 22,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  benefitsCard: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.22)',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  stepsCard: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(14, 14, 20, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepsTitle: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.28)',
    marginTop: 1,
  },
  stepNumber: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  actions: {
    gap: 10,
    paddingTop: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
})
