import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useState } from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { MentalHealthHomeContent } from '../components/mentalHealth/MentalHealthHomeContent'
import { MentalHealthOnboardingDrawer } from '../components/mentalHealth/MentalHealthOnboardingDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import { loadMentalHealthOnboardingRecord } from '../data/mentalHealthOnboardingStorage'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import {
  emptyMentalHealthOnboardingRecord,
  type MentalHealthOnboardingRecord,
} from '../types/mentalHealth'
import type { UserClinicalState } from '../types/mentalHealthEngine'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78

export function MentalHealthScreen() {
  const insets = useSafeAreaInsets()
  const { user, navigateTo, goBack, canGoBack, logout } = useAuth()

  const [menuVisible, setMenuVisible] = useState(false)
  const [onboardingRecord, setOnboardingRecord] = useState<MentalHealthOnboardingRecord>(
    emptyMentalHealthOnboardingRecord(),
  )
  const [isRecordReady, setIsRecordReady] = useState(false)
  const [onboardingVisible, setOnboardingVisible] = useState(false)
  const [homeRefreshKey, setHomeRefreshKey] = useState(0)
  const [clinicalStateSeed, setClinicalStateSeed] = useState<UserClinicalState | null>(null)

  const patientCpf = user?.cpf ?? 'guest'
  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const bottomContentPadding = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  const loadRecord = useCallback(async () => {
    const record = await loadMentalHealthOnboardingRecord(patientCpf)
    setOnboardingRecord(record)
    setOnboardingVisible(!record.completed)
    setIsRecordReady(true)
  }, [patientCpf])

  useEffect(() => {
    void loadRecord()
  }, [loadRecord])

  useAndroidBackHandler(
    useCallback(() => {
      if (onboardingVisible) {
        return false
      }

      if (canGoBack()) {
        goBack()
        return true
      }

      return false
    }, [canGoBack, goBack, onboardingVisible]),
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

  function handleSetupComplete(record: MentalHealthOnboardingRecord) {
    setOnboardingRecord(record)
  }

  function handleOnboardingFlowComplete(clinicalState?: UserClinicalState | null) {
    setOnboardingVisible(false)
    if (clinicalState) {
      setClinicalStateSeed(clinicalState)
    }
    setHomeRefreshKey((current) => current + 1)
  }

  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
        <LinearGradient
          colors={['rgba(10, 10, 12, 0.55)', 'rgba(10, 10, 12, 0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        <ScreenStackHeader
          title="Saúde Mental"
          subtitle="Cuidado emocional no seu ritmo"
          paddingTop={headerPaddingTop}
          onBack={() => goBack()}
        />

        {isRecordReady && onboardingRecord.completed ? (
          <MentalHealthHomeContent
            bottomPadding={bottomContentPadding}
            patientCpf={patientCpf}
            record={onboardingRecord}
            refreshKey={homeRefreshKey}
            clinicalStateSeed={clinicalStateSeed}
          />
        ) : (
          <View style={styles.placeholder} />
        )}

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

        <MenuDrawer
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          userName={user?.name}
          selfieUri={user?.selfieUri}
          onLogoutPress={() => void logout()}
        />
      </ImageBackground>

      <MentalHealthOnboardingDrawer
        visible={isRecordReady && onboardingVisible}
        patientCpf={patientCpf}
        onSetupComplete={handleSetupComplete}
        onFlowComplete={handleOnboardingFlowComplete}
        onRequestBack={() => goBack()}
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
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
})
