import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { AppModal } from './AppModal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { appEnv } from '../config/env'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import { getModalFooterPadding } from '../utils/modalSafeArea'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { MenuBugReportDrawer } from './menu/MenuBugReportDrawer'
import { MenuLegalDrawer } from './menu/MenuLegalDrawer'
import { MenuNotificationsDrawer } from './menu/MenuNotificationsDrawer'
import { MenuProfileDrawer } from './menu/MenuProfileDrawer'
import { MenuSupportDrawer } from './menu/MenuSupportDrawer'

const logoSource = resolveBrandImage(appEnv.logoUrl, 'logo.png')

type MenuSubDrawerId =
  | 'profile'
  | 'notifications'
  | 'support'
  | 'bug-report'
  | 'privacy'
  | 'terms'

type MenuDrawerProps = {
  visible: boolean
  userName?: string
  userEmail?: string
  userPhone?: string
  userCpf?: string
  selfieUri?: string | null
  onClose: () => void
  onProfilePress?: () => void
  onLogoutPress: () => void
}

type MenuItemConfig = {
  id: MenuSubDrawerId
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
}

const MENU_ITEMS: MenuItemConfig[] = [
  {
    id: 'notifications',
    title: 'Notificações',
    subtitle: 'Avisos da plataforma',
    icon: 'notifications-outline',
  },
  {
    id: 'support',
    title: 'Falar com suporte',
    subtitle: 'Abra um pedido de ajuda',
    icon: 'headset-outline',
  },
  {
    id: 'bug-report',
    title: 'Bug ou sugestão',
    subtitle: 'Nos ajude a melhorar o app',
    icon: 'chatbox-ellipses-outline',
  },
  {
    id: 'privacy',
    title: 'Privacidade e dados',
    subtitle: 'Como tratamos suas informações',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'terms',
    title: 'Termos de uso',
    subtitle: 'Regras de utilização do app',
    icon: 'document-text-outline',
  },
]

export function MenuDrawer({
  visible,
  userName,
  userEmail,
  userPhone,
  userCpf,
  selfieUri,
  onClose,
  onProfilePress,
  onLogoutPress,
}: MenuDrawerProps) {
  const insets = useSafeAreaInsets()
  const { height: screenHeight } = useWindowDimensions()
  const { user } = useAuth()
  const { requireAuth } = useGuestAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [activeSubDrawer, setActiveSubDrawer] = useState<MenuSubDrawerId | null>(null)

  const sheetTranslateY = useRef(new Animated.Value(screenHeight)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const resolvedName = userName ?? user?.name
  const resolvedEmail = userEmail ?? user?.email
  const resolvedPhone = userPhone ?? user?.phone
  const resolvedCpf = userCpf ?? user?.cpf
  const resolvedSelfie = selfieUri ?? user?.selfieUri

  const firstName = resolvedName?.trim().split(/\s+/)[0]
  const hasSelfie = Boolean(resolvedSelfie?.trim())

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
      setActiveSubDrawer(null)
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
    if (activeSubDrawer) {
      closeSubDrawer()
      return
    }

    if (!visible) return
    closeSheet(onClose)
  }

  function openSubDrawer(id: MenuSubDrawerId) {
    if (id === 'profile') {
      requireAuth('tab:menu', () => {
        if (onProfilePress) {
          closeSheet(() => {
            onClose()
            onProfilePress()
          })
          return
        }

        setActiveSubDrawer(id)
      })
      return
    }

    if (id === 'notifications') {
      requireAuth('tab:menu', () => setActiveSubDrawer(id))
      return
    }

    setActiveSubDrawer(id)
  }

  function handleLogoutPress() {
    onLogoutPress()
    handleDismiss()
  }

  function closeSubDrawer() {
    setActiveSubDrawer(null)
  }

  if (!isMounted && !activeSubDrawer) return null

  return (
    <>
      {isMounted ? (
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
                colors={['#050508', '#0a0a0e', '#0e0e14', '#08080a']}
                locations={[0, 0.28, 0.62, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              <LinearGradient
                colors={['rgba(0, 0, 0, 0.42)', 'rgba(0, 0, 0, 0.16)', 'transparent']}
                locations={[0, 0.38, 0.72]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />

              <View style={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
                <View style={styles.headerRow}>
                  <View style={styles.headerTextCol}>
                    <Text style={styles.menuLabel}>Menu</Text>
                    <Text style={styles.menuHint}>Configurações e suporte</Text>
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

                <ScrollView
                  style={styles.itemsScroll}
                  contentContainerStyle={styles.itemsScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.itemsSection}>
                    <Pressable
                      onPress={() => openSubDrawer('profile')}
                      style={({ pressed }) => [styles.menuLine, pressed && styles.menuLinePressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Meu perfil"
                    >
                      <View style={styles.profileAvatarWrap}>
                        {hasSelfie ? (
                          <Image
                            source={{ uri: resolvedSelfie! }}
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
                          {firstName ? `Olá, ${firstName}` : 'Dados da sua conta'}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                    </Pressable>

                    <View style={styles.menuDivider} />

                    {MENU_ITEMS.map((item, index) => (
                      <View key={item.id}>
                        <Pressable
                          onPress={() => openSubDrawer(item.id)}
                          style={({ pressed }) => [styles.menuLine, pressed && styles.menuLinePressed]}
                          accessibilityRole="button"
                          accessibilityLabel={item.title}
                        >
                          <View style={styles.menuIconWrap}>
                            <Ionicons name={item.icon} size={20} color={colors.primaryLight} />
                          </View>

                          <View style={styles.menuLineTextCol}>
                            <Text style={styles.menuLineTitle}>{item.title}</Text>
                            <Text style={styles.menuLineSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          </View>

                          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
                        </Pressable>

                        {index < MENU_ITEMS.length - 1 ? <View style={styles.menuDivider} /> : null}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View
                style={[
                  styles.footer,
                  { paddingBottom: getModalFooterPadding(insets.bottom, 8) },
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
      ) : null}

      <MenuProfileDrawer
        visible={activeSubDrawer === 'profile'}
        onClose={closeSubDrawer}
        userName={resolvedName}
        userEmail={resolvedEmail}
        userPhone={resolvedPhone}
        userCpf={resolvedCpf}
        selfieUri={resolvedSelfie}
      />
      <MenuNotificationsDrawer
        visible={activeSubDrawer === 'notifications'}
        onClose={closeSubDrawer}
      />
      <MenuSupportDrawer
        visible={activeSubDrawer === 'support'}
        onClose={closeSubDrawer}
        userName={resolvedName}
        userEmail={resolvedEmail}
        userPhone={resolvedPhone}
      />
      <MenuBugReportDrawer
        visible={activeSubDrawer === 'bug-report'}
        onClose={closeSubDrawer}
        userName={resolvedName}
        userEmail={resolvedEmail}
      />
      <MenuLegalDrawer
        visible={activeSubDrawer === 'privacy'}
        variant="privacy"
        onClose={closeSubDrawer}
      />
      <MenuLegalDrawer
        visible={activeSubDrawer === 'terms'}
        variant="terms"
        onClose={closeSubDrawer}
      />
    </>
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
    marginBottom: 24,
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
  itemsScroll: {
    flex: 1,
  },
  itemsScrollContent: {
    paddingBottom: 12,
  },
  itemsSection: {
    marginHorizontal: -20,
  },
  menuLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
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
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
