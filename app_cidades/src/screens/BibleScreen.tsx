import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useState } from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { BibleHomeContent } from '../components/bible/BibleHomeContent'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')

export function BibleScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, goBack, canGoBack, logout } = useAuth()
  const [menuVisible, setMenuVisible] = useState(false)

  const headerPaddingTop = Math.max(insets.top, 12) + 8

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
          title="Bíblia"
          subtitle="Palavra e paz no seu dia"
          paddingTop={headerPaddingTop}
          onBack={goBack}
        />

        <BibleHomeContent onOpenMentalHealth={() => navigateTo('mental-health')} />

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
