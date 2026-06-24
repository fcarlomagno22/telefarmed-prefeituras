import { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ImageBackground, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BiometricPromptModal } from '../components/BiometricPromptModal'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { GuestWelcomeCard } from '../components/GuestWelcomeCard'
import { HealthSummaryCard } from '../components/HealthSummaryCard'
import { HomeHeader } from '../components/HomeHeader'
import { HomeQuickActions, HomeQuickActionId } from '../components/HomeQuickActions'
import { MenuDrawer } from '../components/MenuDrawer'
import { PromoCarousel } from '../components/PromoCarousel'
import { VidaSaudavelActions, VidaSaudavelActionId } from '../components/VidaSaudavelActions'
import { appEnv } from '../config/env'
import { getPromoBanners } from '../config/promoBanners'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { useSimulatedPageSkeleton } from '../hooks/useSimulatedPageSkeleton'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(
  appEnv.backgroundImageUrl,
  'fundo_login.png',
)

const promoBanners = getPromoBanners()
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function HomeScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<BottomTabId>('home')
  const [menuVisible, setMenuVisible] = useState(false)
  const {
    user,
    isAuthenticated,
    navigateTo,
    logout,
    shouldAskBiometric,
    enableBiometric,
    dismissBiometricPrompt,
    isBootstrapping,
  } = useAuth()

  const showSkeleton = useSimulatedPageSkeleton(isBootstrapping)

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 24

  function handleQuickAction(actionId: HomeQuickActionId) {
    if (actionId === 'schedule') {
      navigateTo('schedule-appointment')
      return
    }

    if (actionId === 'my-appointments') {
      navigateTo('my-appointments')
      return
    }

    if (actionId === 'post-consultation') {
      navigateTo('post-consultation')
      return
    }

    if (actionId === 'prescriptions') {
      navigateTo('my-documents')
      return
    }

    if (actionId === 'nearby-units') {
      navigateTo('nearby-units')
    }
  }

  function handleVidaAction(actionId: VidaSaudavelActionId) {
    if (actionId === 'my-metrics') {
      navigateTo('my-metrics')
      return
    }

    if (actionId === 'functional-training') {
      navigateTo('functional-training')
      return
    }

    if (actionId === 'run-walk') {
      navigateTo('run-walk')
      return
    }

    if (actionId === 'eat-well') {
      navigateTo('eat-well')
      return
    }

    if (actionId === 'sleep-time') {
      navigateTo('sleep-time')
      return
    }

    if (actionId === 'mental-health') {
      navigateTo('mental-health')
      return
    }

    if (actionId === 'active-mind') {
      navigateTo('active-mind')
      return
    }

    if (actionId === 'my-routine') {
      navigateTo('my-routine')
    }
  }

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      setActiveTab('menu')
      return
    }

    if (tab === 'agendar') {
      setMenuVisible(false)
      navigateTo('schedule-appointment')
      return
    }

    if (tab === 'my-metrics') {
      setMenuVisible(false)
      navigateTo('my-metrics')
      return
    }

    if (tab === 'pos-consulta') {
      setMenuVisible(false)
      navigateTo('post-consultation')
      return
    }

    setMenuVisible(false)
    setActiveTab(tab)
  }

  function closeMenu() {
    setMenuVisible(false)
    if (activeTab === 'menu') {
      setActiveTab('home')
    }
  }

  function handleLogout() {
    closeMenu()
    void logout()
  }

  useAndroidBackHandler(() => {
    if (shouldAskBiometric) {
      void dismissBiometricPrompt()
      return true
    }

    if (menuVisible) {
      closeMenu()
      return true
    }

    return false
  })

  return (
    <>
      <View style={styles.root}>
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          resizeMode="cover"
          imageStyle={styles.backgroundImage}
        />

        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'transparent', 'rgba(10, 10, 12, 0.75)']}
          locations={[0, 0.35, 1]}
          style={styles.screenOverlay}
          pointerEvents="none"
        />

        <HomeHeader
          isAuthenticated={isAuthenticated}
          userName={user?.name}
          selfieUri={user?.selfieUri}
          onAuthPress={() => navigateTo('login')}
          skeleton={showSkeleton}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {isAuthenticated ? (
            <HealthSummaryCard
              skeleton={showSkeleton}
              onPressMetrics={() => navigateTo('my-metrics')}
            />
          ) : (
            <GuestWelcomeCard skeleton={showSkeleton} />
          )}
          <HomeQuickActions onActionPress={handleQuickAction} skeleton={showSkeleton} />
          <PromoCarousel banners={promoBanners} skeleton={showSkeleton} />
          <Text style={styles.sectionTitle}>Saúde, Bem-estar e Qualidade de Vida</Text>
          <VidaSaudavelActions onActionPress={handleVidaAction} skeleton={showSkeleton} />
        </ScrollView>

        <BottomTabBar
          activeTab={menuVisible ? 'menu' : activeTab}
          onTabPress={handleTabPress}
        />
      </View>

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={closeMenu}
        onLogoutPress={handleLogout}
      />

      <BiometricPromptModal
        visible={shouldAskBiometric}
        onEnable={() => void enableBiometric()}
        onDismiss={() => void dismissBiometricPrompt()}
      />
    </>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  screenOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    flexGrow: 1,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
})
