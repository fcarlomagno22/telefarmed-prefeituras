import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from './AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import profilePersonsAnimation from '../../assets/profile_persons.json'
import { getGuestFeatureContent, GuestFeatureKey } from '../config/guestFeatures'
import { colors } from '../theme/colors'
import { PrimaryButton } from './PrimaryButton'
import { ShiningCtaHint } from './ShiningCtaHint'
import { WaveTitle } from './WaveTitle'
import { getModalFooterPadding } from '../utils/modalSafeArea'
import { useWebViewportHeight } from '../hooks/useWebViewportHeight'

type FeatureAuthDrawerProps = {
  visible: boolean
  featureKey: GuestFeatureKey | null
  onClose: () => void
  onLoginPress: () => void
  onRegisterPress: () => void
}

const SHEET_OFFSET_FALLBACK = 420
const IS_WEB = Platform.OS === 'web'
const useNativeDriver = !IS_WEB

export function FeatureAuthDrawer({
  visible,
  featureKey,
  onClose,
  onLoginPress,
  onRegisterPress,
}: FeatureAuthDrawerProps) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const webViewportHeight = useWebViewportHeight()
  const sheetOffset = IS_WEB ? webViewportHeight || screenHeight : SHEET_OFFSET_FALLBACK
  const [isMounted, setIsMounted] = useState(false)
  const sheetTranslateY = useRef(new Animated.Value(sheetOffset)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const content = featureKey ? getGuestFeatureContent(featureKey) : null

  useEffect(() => {
    sheetTranslateY.setValue(sheetOffset)
  }, [sheetOffset, sheetTranslateY])

  useEffect(() => {
    if (visible && featureKey) {
      setIsMounted(true)
      sheetTranslateY.setValue(sheetOffset)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible, featureKey, sheetOffset])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: sheetOffset,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver,
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
      <View style={[styles.root, IS_WEB && styles.rootWeb]}>
        <Animated.View style={[styles.backdrop, IS_WEB && styles.backdropWeb, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            IS_WEB && styles.sheetWeb,
            {
              paddingBottom: getModalFooterPadding(insets.bottom),
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          {IS_WEB ? (
            <View style={styles.sheetWebTint} pointerEvents="none" />
          ) : (
            <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFillObject} />
          )}

          <LinearGradient
            colors={[colors.backgroundElevated, '#f0f0f2']}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={styles.handle} />

          <View style={styles.lottieWrap}>
            <LottieView source={profilePersonsAnimation} autoPlay loop style={styles.lottie} />
          </View>

          <WaveTitle text={content.title} active={visible} />

          <Text style={styles.description}>{content.description}</Text>

          <ShiningCtaHint
            text="Entre ou cadastre-se para usar esta funcionalidade."
            active={visible}
          />

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
  rootWeb: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  backdropWeb: {
    backgroundColor: 'rgba(10, 10, 12, 0.42)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetWeb: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  sheetWebTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 247, 0.92)',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
