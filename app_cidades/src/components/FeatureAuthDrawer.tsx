import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppModal } from './AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import robotAnimation from '../../assets/robot.json'
import { getGuestFeatureContent, GuestFeatureKey } from '../config/guestFeatures'
import { colors } from '../theme/colors'
import { PrimaryButton } from './PrimaryButton'
import { WaveTitle } from './WaveTitle'

type FeatureAuthDrawerProps = {
  visible: boolean
  featureKey: GuestFeatureKey | null
  onClose: () => void
  onLoginPress: () => void
  onRegisterPress: () => void
}

const SHEET_OFFSET = 420

export function FeatureAuthDrawer({
  visible,
  featureKey,
  onClose,
  onLoginPress,
  onRegisterPress,
}: FeatureAuthDrawerProps) {
  const insets = useSafeAreaInsets()
  const [isMounted, setIsMounted] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(SHEET_OFFSET)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const content = featureKey ? getGuestFeatureContent(featureKey) : null

  useEffect(() => {
    if (visible && featureKey) {
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
      closeSheet(onClose)
    }
  }, [visible, featureKey])

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
    closeSheet(onClose)
  }

  function handleLogin() {
    closeSheet(() => {
      onClose()
      onLoginPress()
    })
  }

  function handleRegister() {
    closeSheet(() => {
      onClose()
      onRegisterPress()
    })
  }

  if (!isMounted || !content) return null

  return (
    <AppModal visible transparent animationType="none" onRequestClose={handleDismiss}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFillObject} />

          <LinearGradient
            colors={['rgba(28, 28, 36, 0.98)', 'rgba(14, 14, 20, 0.99)']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.handle} />

          <View style={styles.lottieWrap}>
            <LottieView source={robotAnimation} autoPlay loop style={styles.lottie} />
          </View>

          <WaveTitle text={content.title} active={visible} />

          <Text style={styles.description}>{content.description}</Text>

          <Text style={styles.ctaHint}>
            Entre ou cadastre-se para usar esta funcionalidade.
          </Text>

          <PrimaryButton label="Entrar" onPress={handleLogin} />

          <Pressable onPress={handleRegister} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Cadastre-se</Text>
          </Pressable>
        </Animated.View>
      </View>
    </AppModal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginBottom: 8,
  },
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  lottie: {
    width: 132,
    height: 132,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaHint: {
    color: colors.primaryLight,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
  },
  secondaryButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
})
