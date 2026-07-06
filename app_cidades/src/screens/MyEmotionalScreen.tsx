import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useState } from 'react'
import { ImageBackground, Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { EmotionalScreeningHomeContent } from '../components/emotionalScreening/EmotionalScreeningHomeContent'
import { MenuDrawer } from '../components/MenuDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'

const TAB_BAR_ESTIMATED_HEIGHT = 78

export function MyEmotionalScreen() {
  const { backgroundSource, colors: themeColors } = useTheme()
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
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      />

      <LinearGradient
        colors={[themeColors.screenOverlay[0], 'transparent']}
        style={styles.screenOverlay}
        pointerEvents="none"
      />

      <View style={styles.pageColumn}>
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
      </View>

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onLogoutPress={() => void logout()}
      />
    </View>
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
  pageColumn: {
    flex: 1,
    minHeight: 0,
    ...Platform.select({
      web: {
        height: '100%',
        overflow: 'hidden',
      },
      default: {},
    }),
  },
})
