import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { AppModal } from './AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { appEnv } from '../config/env'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const logoSource = resolveBrandImage(appEnv.logoUrl, 'logo.png')

type MenuDrawerProps = {
  visible: boolean
  userName?: string
  selfieUri?: string | null
  onClose: () => void
  onProfilePress?: () => void
  onLogoutPress: () => void
}

export function MenuDrawer({
  visible,
  userName,
  selfieUri,
  onClose,
  onProfilePress,
  onLogoutPress,
}: MenuDrawerProps) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const [isMounted, setIsMounted] = useState(false)

  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const firstName = userName?.trim().split(/\s+/)[0]
  const hasSelfie = Boolean(selfieUri?.trim())

  useEffect(() => {
    sheetTranslateY.setValue(screenHeight)
  }, [screenHeight, sheetTranslateY])

  useEffect(() => {
    if (visible) {
      setIsMounted(true)
      sheetTranslateY.setValue(screenHeight)
      backdropOpacity.setValue(0)

      Animated.parallel([
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (isMounted) {
      closeSheet(onClose)
    }
  }, [visible, screenHeight])

  function closeSheet(done?: () => void) {
    Animated.parallel([
      Animated.timing(sheetTranslateY, {
        toValue: screenHeight,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 260,
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

  function handleProfilePress() {
    closeSheet(() => {
      onClose()
      onProfilePress?.()
    })
  }

  function handleLogoutPress() {
    onLogoutPress()
    handleDismiss()
  }

  if (!isMounted) return null

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
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={['#221a24', '#16121c', '#0e0e14', '#08080a']}
            locations={[0, 0.32, 0.68, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={['rgba(255, 107, 0, 0.14)', 'rgba(255, 107, 0, 0.04)', 'transparent']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.85 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextCol}>
                <Text style={styles.menuLabel}>Menu</Text>
                <Text style={styles.menuHint}>Acesso rápido à sua conta</Text>
              </View>

              <Pressable
                onPress={handleDismiss}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Fechar menu"
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={styles.itemsSection}>
              <Pressable
                onPress={handleProfilePress}
                style={({ pressed }) => [styles.menuLine, pressed && styles.menuLinePressed]}
                accessibilityRole="button"
                accessibilityLabel="Meu perfil"
              >
                <View style={styles.profileAvatarWrap}>
                  {hasSelfie ? (
                    <Image
                      source={{ uri: selfieUri! }}
                      style={styles.profileAvatarImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.profileAvatarFallback}>
                      <Ionicons name="person-outline" size={20} color={colors.primaryLight} />
                    </View>
                  )}
                </View>

                <View style={styles.menuLineTextCol}>
                  <Text style={styles.menuLineTitle}>Meu perfil</Text>
                  <Text style={styles.menuLineSubtitle} numberOfLines={1}>
                    {firstName ? `Olá, ${firstName}` : 'Dados e preferências'}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>

              <View style={styles.menuDivider} />
            </View>

            <View style={styles.spacer} />
          </View>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <View style={styles.footerDivider} />

            <Pressable
              onPress={handleLogoutPress}
              style={({ pressed }) => [styles.logoutLine, pressed && styles.menuLinePressed]}
              accessibilityRole="button"
              accessibilityLabel="Sair"
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Sair</Text>
            </Pressable>

            <View style={styles.logoWrap}>
              <Image source={logoSource} style={styles.logo} contentFit="contain" />
            </View>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  headerTextCol: {
    gap: 4,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  menuHint: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  itemsSection: {
    marginHorizontal: -20,
  },
  menuLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuLinePressed: {
    opacity: 0.72,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 133, 51, 0.3)',
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLineTextCol: {
    flex: 1,
    gap: 3,
  },
  menuLineTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  menuLineSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'stretch',
    gap: 20,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: -20,
  },
  logoutLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  logoutText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  logoWrap: {
    width: 168,
    height: 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.92,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
})
