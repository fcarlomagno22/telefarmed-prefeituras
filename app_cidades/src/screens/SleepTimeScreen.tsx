import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AppState,
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { MenuDrawer } from '../components/MenuDrawer'
import { RunWalkSegmentTabs, type RunWalkSegmentTabItem } from '../components/runWalk/RunWalkSegmentTabs'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { SleepTimeGeneralTab } from '../components/sleepTime/SleepTimeGeneralTab'
import { SleepTimeHistoryTab } from '../components/sleepTime/SleepTimeHistoryTab'
import { SleepTimeMonthPickerDrawer } from '../components/sleepTime/history/SleepTimeMonthPickerDrawer'
import { SleepTimeSoundMiniPlayer } from '../components/sleepTime/SleepTimeSoundMiniPlayer'
import { SleepTimeBreathingDrawer } from '../components/sleepTime/SleepTimeBreathingDrawer'
import { SleepTimeFab } from '../components/sleepTime/SleepTimeFab'
import { SleepTimeLogDrawer } from '../components/sleepTime/SleepTimeLogDrawer'
import { SleepTimeSoundPlayerDrawer } from '../components/sleepTime/SleepTimeSoundPlayerDrawer'
import { SleepTimeSoundsExplainDrawer } from '../components/sleepTime/SleepTimeSoundsExplainDrawer'
import type { SleepTimerMinutes } from '../components/sleepTime/sleepTimeSoundTypes'
import { getSleepSoundById } from '../config/sleepSounds'
import { appEnv } from '../config/env'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import type { SleepSoundId, SleepTimeTab } from '../types/sleepTime'
import {
  clearSleepSoundSession,
  getSleepSoundSessionSnapshot,
  patchSleepSoundSession,
  subscribeSleepSoundSession,
} from '../utils/sleepSoundSession'
import {
  DEFAULT_SLEEP_SOUND_VOLUME,
  getSleepSoundPlaybackEngine,
  stopSleepSoundPlayback,
} from '../utils/sleepSoundPlayer'
import {
  getSleepSoundLockScreenArtworkUrl,
  SLEEP_SOUND_LOCK_SCREEN_ALBUM,
  SLEEP_SOUND_LOCK_SCREEN_ARTIST,
} from '../utils/sleepSoundLockScreen'
import { resolveBrandImage } from '../utils/resolveBrandImage'
import {
  getCurrentMonthKey,
  getMonthKeyFromDateIso,
  pickDefaultDateIsoForMonth,
} from '../utils/eatWellCalendarDays'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78
const SEGMENT_PAGES: SleepTimeTab[] = ['general', 'history']

const SLEEP_TIME_TABS: RunWalkSegmentTabItem<SleepTimeTab>[] = [
  { id: 'general', label: 'Geral', available: true },
  { id: 'history', label: 'Histórico', available: true },
]

export function SleepTimeScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, goBack, canGoBack, logout } = useAuth()

  const initialSession = getSleepSoundSessionSnapshot()
  const engine = getSleepSoundPlaybackEngine()

  const [segmentTab, setSegmentTab] = useState<SleepTimeTab>('general')
  const [menuVisible, setMenuVisible] = useState(false)
  const [sessionSoundId, setSessionSoundId] = useState<SleepSoundId | null>(() => {
    if (initialSession.soundId) return initialSession.soundId
    return engine.isActive() ? initialSession.soundId : null
  })
  const [drawerSoundId, setDrawerSoundId] = useState<SleepSoundId | null>(null)
  const [volume, setVolume] = useState(initialSession.volume || DEFAULT_SLEEP_SOUND_VOLUME)
  const [timerMinutes, setTimerMinutes] = useState<SleepTimerMinutes>(initialSession.timerMinutes)
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(() => engine.isPausedState())
  const [soundsExplainVisible, setSoundsExplainVisible] = useState(false)
  const [breathingVisible, setBreathingVisible] = useState(false)
  const [logDrawerVisible, setLogDrawerVisible] = useState(false)
  const [sleepLogRefreshKey, setSleepLogRefreshKey] = useState(0)
  const [selectedDateIso, setSelectedDateIso] = useState(() => toLocalDateIso(new Date()))
  const [calendarMonthKey, setCalendarMonthKey] = useState(() => getCurrentMonthKey())
  const [monthPickerVisible, setMonthPickerVisible] = useState(false)
  const [segmentPagerScrollEnabled, setSegmentPagerScrollEnabled] = useState(true)

  const segmentPagerRef = useRef<FlatList<SleepTimeTab>>(null)
  const segmentPagerIndexRef = useRef(0)

  const showMiniPlayer =
    (sessionSoundId != null || engine.isActive()) && drawerSoundId == null
  const resolvedSessionSoundId =
    sessionSoundId ?? (engine.isActive() ? getSleepSoundSessionSnapshot().soundId : null)
  const sessionSound = resolvedSessionSoundId ? getSleepSoundById(resolvedSessionSoundId) : null
  const headerPaddingTop = Math.max(insets.top, 12) + 8
  const patientCpf = user?.cpf ?? 'guest'

  const fabBottomOffset = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12
  const bottomContentPadding = fabBottomOffset + 88

  const handleStopPlayback = useCallback(() => {
    stopSleepSoundPlayback()
    clearSleepSoundSession()
    setSessionSoundId(null)
    setDrawerSoundId(null)
    setIsPaused(false)
    setTimerMinutes(null)
    setTimerRemainingSeconds(null)
  }, [])

  useEffect(() => {
    return subscribeSleepSoundSession((next) => {
      setSessionSoundId(next.soundId)
      setVolume(next.volume)
      setTimerMinutes(next.timerMinutes)
    })
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !getSleepSoundPlaybackEngine().isActive()) return

      const snapshot = getSleepSoundSessionSnapshot()
      if (snapshot.soundId) {
        setSessionSoundId(snapshot.soundId)
      }
      setIsPaused(getSleepSoundPlaybackEngine().isPausedState())
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    return () => {
      stopSleepSoundPlayback()
    }
  }, [])

  useEffect(() => {
    if (!sessionSoundId) {
      stopSleepSoundPlayback()
      return
    }

    const sound = getSleepSoundById(sessionSoundId)
    if (!sound) return

    patchSleepSoundSession({ soundId: sessionSoundId })

    const playbackEngine = getSleepSoundPlaybackEngine()
    playbackEngine.onSleepTimerFinished(handleStopPlayback)
    playbackEngine.onRemotePlaybackStateChange((playing) => {
      setIsPaused(!playing)
    })

    let cancelled = false

    void playbackEngine.start(sound.source, volume, {
      title: sound.title,
      artist: SLEEP_SOUND_LOCK_SCREEN_ARTIST,
      albumTitle: SLEEP_SOUND_LOCK_SCREEN_ALBUM,
    })

    void getSleepSoundLockScreenArtworkUrl().then((artworkUrl) => {
      if (cancelled) return
      playbackEngine.updateLockScreenArtwork(artworkUrl)
    })

    return () => {
      cancelled = true
    }
  }, [sessionSoundId, handleStopPlayback])

  useEffect(() => {
    if (!sessionSoundId) return
    patchSleepSoundSession({ volume })
    getSleepSoundPlaybackEngine().setVolume(volume)
  }, [sessionSoundId, volume])

  useEffect(() => {
    if (!sessionSoundId) return
    patchSleepSoundSession({ timerMinutes })
    getSleepSoundPlaybackEngine().setSleepTimer(timerMinutes, setTimerRemainingSeconds)
  }, [sessionSoundId, timerMinutes])

  const scrollSegmentPagerTo = useCallback(
    (tab: SleepTimeTab, animated = true) => {
      const index = SEGMENT_PAGES.indexOf(tab)
      if (index < 0) return

      segmentPagerIndexRef.current = index
      segmentPagerRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated,
      })
    },
    [screenWidth],
  )

  const handleSegmentTabChange = useCallback(
    (tab: SleepTimeTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback((nextIndex: number) => {
    const clampedIndex = Math.min(Math.max(nextIndex, 0), SEGMENT_PAGES.length - 1)
    const nextTab = SEGMENT_PAGES[clampedIndex] ?? 'general'

    if (clampedIndex !== segmentPagerIndexRef.current) {
      segmentPagerIndexRef.current = clampedIndex
      void Haptics.selectionAsync()
    }

    setSegmentTab(nextTab)
  }, [])

  const handleSegmentPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex)
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  const handleSegmentPagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex)
    },
    [handleSegmentPagerIndexChange],
  )

  function handleBack() {
    if (canGoBack()) {
      goBack()
      return
    }
    navigateTo('home')
  }

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

  function handleSoundPress(soundId: SleepSoundId) {
    if (sessionSoundId !== soundId) {
      setVolume(DEFAULT_SLEEP_SOUND_VOLUME)
      setTimerMinutes(null)
      setTimerRemainingSeconds(null)
      setIsPaused(false)
      patchSleepSoundSession({
        soundId,
        volume: DEFAULT_SLEEP_SOUND_VOLUME,
        timerMinutes: null,
      })
    } else {
      patchSleepSoundSession({ soundId })
    }

    setSessionSoundId(soundId)
    setDrawerSoundId(soundId)
  }

  function handleDismissDrawer() {
    setDrawerSoundId(null)
  }

  function handleOpenDrawerFromMiniPlayer() {
    const soundId = resolvedSessionSoundId
    if (!soundId) return
    setDrawerSoundId(soundId)
  }

  function handleTogglePause() {
    const engine = getSleepSoundPlaybackEngine()
    if (engine.isPausedState()) {
      engine.resume()
      setIsPaused(false)
      return
    }

    engine.pause()
    setIsPaused(true)
  }

  function handleDecreaseVolume() {
    setVolume(getSleepSoundPlaybackEngine().decreaseVolume())
  }

  function handleIncreaseVolume() {
    setVolume(getSleepSoundPlaybackEngine().increaseVolume())
  }

  function handleBreathingPress() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setBreathingVisible(true)
  }

  function handleStoriesPress() {
    navigateTo('sleep-stories')
  }

  function handleSleepLogRegistered() {
    setSleepLogRefreshKey((current) => current + 1)
  }

  function handleHistorySelectDate(dateIso: string) {
    setSelectedDateIso(dateIso)
    setCalendarMonthKey(getMonthKeyFromDateIso(dateIso))
  }

  function handleApplyCalendarMonth(nextMonthKey: string) {
    setMonthPickerVisible(false)
    setCalendarMonthKey(nextMonthKey)
    setSelectedDateIso(pickDefaultDateIsoForMonth(nextMonthKey))
  }

  useAndroidBackHandler(() => {
    if (logDrawerVisible) {
      setLogDrawerVisible(false)
      return true
    }
    if (drawerSoundId) {
      handleDismissDrawer()
      return true
    }
    if (sessionSoundId) {
      handleStopPlayback()
      return true
    }
    if (breathingVisible) {
      setBreathingVisible(false)
      return true
    }
    if (soundsExplainVisible) {
      setSoundsExplainVisible(false)
      return true
    }
    if (monthPickerVisible) {
      setMonthPickerVisible(false)
      return true
    }
    if (menuVisible) {
      setMenuVisible(false)
      return true
    }
    handleBack()
    return true
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

        {showMiniPlayer && sessionSound ? (
          <SleepTimeSoundMiniPlayer
            title={sessionSound.title}
            accentColor={sessionSound.palette.iconGradient[1]}
            isPaused={isPaused}
            volume={volume}
            paddingTop={headerPaddingTop}
            onBack={handleBack}
            onTogglePause={handleTogglePause}
            onDecreaseVolume={handleDecreaseVolume}
            onIncreaseVolume={handleIncreaseVolume}
            onStop={handleStopPlayback}
            onPress={handleOpenDrawerFromMiniPlayer}
          />
        ) : (
          <ScreenStackHeader
            title="Hora de Dormir"
            subtitle="Geral · Histórico"
            paddingTop={headerPaddingTop}
            onBack={handleBack}
          />
        )}

        <RunWalkSegmentTabs activeTab={segmentTab} onChange={handleSegmentTabChange} tabs={SLEEP_TIME_TABS} />

        <FlatList
          ref={segmentPagerRef}
          data={SEGMENT_PAGES}
          keyExtractor={(item) => item}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEnabled={segmentPagerScrollEnabled}
          scrollEventThrottle={16}
          onScroll={handleSegmentPagerScroll}
          onMomentumScrollEnd={handleSegmentPagerScrollEnd}
          getItemLayout={(_, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          style={styles.segmentPager}
          renderItem={({ item }) => (
            <View style={[styles.segmentPage, { width: screenWidth, height: '100%' }]}>
              {item === 'general' ? (
                <SleepTimeGeneralTab
                  bottomPadding={bottomContentPadding}
                  activeSoundId={resolvedSessionSoundId}
                  onSoundPress={handleSoundPress}
                  onSoundsInfoPress={() => setSoundsExplainVisible(true)}
                  onBreathingPress={handleBreathingPress}
                  onStoriesPress={handleStoriesPress}
                />
              ) : (
                <SleepTimeHistoryTab
                  bottomPadding={bottomContentPadding}
                  patientCpf={patientCpf}
                  refreshKey={sleepLogRefreshKey}
                  isActive={segmentTab === 'history'}
                  calendarMonthKey={calendarMonthKey}
                  selectedDateIso={selectedDateIso}
                  onSelectDate={handleHistorySelectDate}
                  onOpenMonthPicker={() => setMonthPickerVisible(true)}
                  onHorizontalScrollActive={(active) => setSegmentPagerScrollEnabled(!active)}
                />
              )}
            </View>
          )}
        />

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

        <SleepTimeFab bottom={fabBottomOffset} onPress={() => setLogDrawerVisible(true)} />
      </View>

      <SleepTimeLogDrawer
        visible={logDrawerVisible}
        patientCpf={patientCpf}
        onClose={() => setLogDrawerVisible(false)}
        onRegistered={handleSleepLogRegistered}
      />

      <SleepTimeBreathingDrawer
        visible={breathingVisible}
        onClose={() => setBreathingVisible(false)}
      />

      <SleepTimeSoundsExplainDrawer
        visible={soundsExplainVisible}
        onClose={() => setSoundsExplainVisible(false)}
      />

      <SleepTimeSoundPlayerDrawer
        visible={drawerSoundId != null}
        soundId={drawerSoundId}
        volume={volume}
        timerMinutes={timerMinutes}
        timerRemainingSeconds={timerRemainingSeconds}
        onVolumeDecrease={handleDecreaseVolume}
        onVolumeIncrease={handleIncreaseVolume}
        onTimerSelect={setTimerMinutes}
        onDismiss={handleDismissDrawer}
        onStop={handleStopPlayback}
      />

      <SleepTimeMonthPickerDrawer
        visible={monthPickerVisible}
        monthKey={calendarMonthKey}
        onClose={() => setMonthPickerVisible(false)}
        onApply={handleApplyCalendarMonth}
      />

      <MenuDrawer
        visible={menuVisible}
        userName={user?.name}
        selfieUri={user?.selfieUri}
        onClose={() => setMenuVisible(false)}
        onLogoutPress={() => void logout()}
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
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
  },
})
