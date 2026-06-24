import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useState } from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { EmotionalScreeningHomeContent } from '../components/emotionalScreening/EmotionalScreeningHomeContent'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function MyEmotionalScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, goBack, canGoBack, logout } = useAuth()
  const { requireAuth } = useGuestAuth()
  const [menuVisible, setMenuVisible] = useState(false)
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  const patientCpf = user?.cpf ?? 'guest'
  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  useAndroidBackHandler(
    useCallback(() => {
      if (canGoBack()) {
        goBack()
        return true
      }
      return false
    }, [canGoBack, goBack]),
  )

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    setMenuVisible(false)

    if (tab === 'home') navigateTo('home')
    else if (tab === 'my-metrics') navigateTo('my-metrics')
    else if (tab === 'agendar') navigateTo('schedule-appointment')
    else if (tab === 'pos-consulta') navigateTo('post-consultation')
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Meu emocional"
          subtitle="Bem-estar emocional"
          paddingTop={headerPaddingTop}
          onBack={goBack}
        />

        <EmotionalScreeningHomeContent
          bottomPadding={bottomContentPadding}
          patientCpf={patientCpf}
          refreshKey={historyRefreshKey}
          onRefresh={() => setHistoryRefreshKey((current) => current + 1)}
          requireAuth={(action) => requireAuth('vida:my-emotional', action)}
        />

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

        <MenuDrawer
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          userName={user?.name}
          selfieUri={user?.selfieUri}
          onLogoutPress={() => void logout()}
        />
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
  },
})
