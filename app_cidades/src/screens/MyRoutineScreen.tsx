import { useThemedStyles } from '../hooks/useThemedStyles'
import type { ThemeColors } from '../theme/palettes'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { MyRoutineHomeContent } from '../components/myRoutine/MyRoutineHomeContent'
import { MyRoutineOnboardingDrawer } from '../components/myRoutine/MyRoutineOnboardingDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { loadMyRoutineOnboardingRecord } from '../data/myRoutineOnboardingStorage'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import {
  emptyMyRoutineOnboardingRecord,
  type MyRoutineOnboardingRecord,
} from '../types/myRoutine'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const TAB_BAR_ESTIMATED_HEIGHT = 78

export function MyRoutineScreen() {
  const { backgroundSource, colors: themeColors } = useTheme()
  const styles = useThemedStyles(createStyles)
  const insets = useSafeAreaInsets()
  const { user, isAuthenticated, navigateTo, goBack, canGoBack, logout } = useAuth()

  const [menuVisible, setMenuVisible] = useState(false)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [onboardingRecord, setOnboardingRecord] = useState<MyRoutineOnboardingRecord>(
    emptyMyRoutineOnboardingRecord(),
  )
  const [isRecordReady, setIsRecordReady] = useState(false)
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)

  const patientCpf = user?.cpf ?? 'guest'
  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  const loadRecord = useCallback(async () => {
    const record = await loadMyRoutineOnboardingRecord(patientCpf)
    setOnboardingRecord(record)
    setIsRecordReady(true)
  }, [patientCpf])

  useEffect(() => {
    void loadRecord()
  }, [loadRecord])

  useAndroidBackHandler(
    useCallback(() => {
      if (settingsVisible) {
        setSettingsVisible(false)
        return true
      }

      if (isRecordReady && !onboardingRecord.completed) {
        return false
      }

      if (canGoBack()) {
        goBack()
        return true
      }

      return false
    }, [canGoBack, goBack, isRecordReady, onboardingRecord.completed, settingsVisible]),
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
          colors={[...themeColors.screenOverlay]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Minha Rotina"
          subtitle="Organize seu dia sem pressão"
          paddingTop={headerPaddingTop}
          onBack={() => goBack()}
          onSettingsPress={
            isRecordReady && onboardingRecord.completed
              ? () => setSettingsVisible(true)
              : undefined
          }
        />

        {isRecordReady && (isAuthenticated ? onboardingRecord.completed : true) ? (
          <MyRoutineHomeContent
            bottomPadding={bottomContentPadding}
            patientCpf={patientCpf}
            record={onboardingRecord}
            refreshKey={homeRefreshKey}
            settingsVisible={settingsVisible}
            onSettingsVisibleChange={setSettingsVisible}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        <MyRoutineOnboardingDrawer
          visible={isAuthenticated && isRecordReady && !onboardingRecord.completed}
          patientCpf={patientCpf}
          onFlowComplete={(record) => {
            setOnboardingRecord(record)
            setHomeRefreshKey((key) => key + 1)
          }}
          onRequestBack={() => goBack()}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    background: {
      flex: 1,
    },
    placeholder: {
      flex: 1,
    },
  })
}
