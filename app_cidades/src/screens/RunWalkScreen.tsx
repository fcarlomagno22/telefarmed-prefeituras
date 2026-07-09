import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
import { ActionToast } from '../components/ActionToast'
import { MenuDrawer } from '../components/MenuDrawer'
import { NeonSectionDivider } from '../components/NeonSectionDivider'
import { RunWalkActivityDetailDrawer } from '../components/runWalk/RunWalkActivityDetailDrawer'
import { RunWalkActivityMenuDrawer } from '../components/runWalk/RunWalkActivityMenuDrawer'
import { RunWalkActivityPickerDrawer } from '../components/runWalk/RunWalkActivityPickerDrawer'
import { RunWalkActivityPreviewDrawer } from '../components/runWalk/RunWalkActivityPreviewDrawer'
import { RunWalkModalityDrawer } from '../components/runWalk/RunWalkModalityDrawer'
import { RunWalkDispositionCard } from '../components/runWalk/RunWalkDispositionCard'
import { RunWalkDispositionCheckinDrawer } from '../components/runWalk/RunWalkDispositionCheckinDrawer'
import { RunWalkDispositionExplainDrawer } from '../components/runWalk/RunWalkDispositionExplainDrawer'
import { RunWalkHistoryTab } from '../components/runWalk/history/RunWalkHistoryTab'
import { RunWalkQuickShortcuts } from '../components/runWalk/RunWalkQuickShortcuts'
import { RunWalkSegmentTabs } from '../components/runWalk/RunWalkSegmentTabs'
import { RunWalkTodayActivityCard } from '../components/runWalk/RunWalkTodayActivityCard'
import {
  RunWalkDispositionCardSkeleton,
  RunWalkWeeklyGoalCardSkeleton,
} from '../components/runWalk/RunWalkTodayTabSkeleton'
import { RunWalkWeeklyCalendarDrawer } from '../components/runWalk/RunWalkWeeklyCalendarDrawer'
import { RunWalkWeeklyGoalCard } from '../components/runWalk/RunWalkWeeklyGoalCard'
import type { RunWalkWeeklyBarCelebrateDay } from '../components/runWalk/RunWalkWeeklyBarChart'
import { RunWalkWeeklyGoalDrawer } from '../components/runWalk/RunWalkWeeklyGoalDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { createEmptyRunWalkTodayState } from '../data/mockRunWalk'
import { MODALITY_DEFAULTS } from '../data/runWalkModalityConfig'
import { clearPreparationDraft } from '../data/runWalkPreparationDraftStorage'
import {
  loadRunWalkDisposition,
  type SaveRunWalkDispositionCheckinResult,
} from '../data/runWalkDispositionStorage'
import {
  applyRunWalkPlanoMenuAction,
  findTodayActivityPreset,
  loadRunWalkPlano,
  selectRunWalkPlanoPreset,
  type RunWalkPlanoSnapshot,
} from '../data/runWalkPlanoStorage'
import {
  loadWeeklyGoalTargets,
  saveWeeklyGoalTargets,
} from '../data/runWalkWeeklyGoalStorage'
import { loadWeeklyGoalProgress } from '../data/runWalkWeeklyProgressStorage'
import { useAppNetwork } from '../hooks/useAppNetwork'
import { consumePendingWeeklyGoalCelebration, peekPendingWeeklyGoalCelebration } from '../data/runWalkWeeklyCelebration'
import { useAuth } from '../contexts/AuthContext'
import { useGuestAuth } from '../contexts/GuestAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import type {
  ActivityMenuAction,
  DispositionCheckinAnswers,
  RunWalkQuickShortcutId,
  RunWalkTab,
  TodayActivity,
  TodayActivityPreset,
  TodayActivityPresetId,
  WeeklyGoalTargets,
} from '../types/runWalk'
import type { ActivityModality } from '../types/auth'
import { getRunWalkRouteParams } from '../types/auth'
import { applyWeeklyGoalTargets, hasWeeklyGoal } from '../utils/runWalkWeeklyGoal'

const TAB_BAR_ESTIMATED_HEIGHT = 78
const SEGMENT_PAGES: RunWalkTab[] = ['today', 'progress']

export function RunWalkScreen() {
  const { backgroundSource, colors: themeColors } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, goBack, canGoBack, logout, routeParams } = useAuth()
  const { requireAuth } = useGuestAuth()
  const { isConnected, isReady: isNetworkReady } = useAppNetwork()
  const wasOfflineRef = useRef(false)

  const [segmentTab, setSegmentTab] = useState<RunWalkTab>('today')
  const [menuVisible, setMenuVisible] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDailyStateReady, setIsDailyStateReady] = useState(false)

  const [todayState, setTodayState] = useState(createEmptyRunWalkTodayState)
  const [activity, setActivity] = useState<TodayActivity | null>(null)
  const [activityPresets, setActivityPresets] = useState<TodayActivityPreset[]>([])
  const [hasTodayActivity, setHasTodayActivity] = useState(false)

  const [detailVisible, setDetailVisible] = useState(false)
  const [activityMenuVisible, setActivityMenuVisible] = useState(false)
  const [activityPickerVisible, setActivityPickerVisible] = useState(false)
  const [activityPreviewVisible, setActivityPreviewVisible] = useState(false)
  const [pendingPresetId, setPendingPresetId] = useState<TodayActivityPresetId | null>(null)
  const [explainVisible, setExplainVisible] = useState(false)
  const [checkinVisible, setCheckinVisible] = useState(false)
  const [checkinAllowSkip, setCheckinAllowSkip] = useState(false)
  const [weekCalendarVisible, setWeekCalendarVisible] = useState(false)
  const [goalDrawerVisible, setGoalDrawerVisible] = useState(false)
  const [modalityDrawerVisible, setModalityDrawerVisible] = useState(false)
  const [weeklyGoalTargets, setWeeklyGoalTargets] = useState<WeeklyGoalTargets | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [weeklyGoalAnimateRings, setWeeklyGoalAnimateRings] = useState(false)
  const [weeklyGoalAnimateChart, setWeeklyGoalAnimateChart] = useState(false)
  const [celebrateDay, setCelebrateDay] = useState<RunWalkWeeklyBarCelebrateDay | null>(() => {
    const pending = peekPendingWeeklyGoalCelebration()
    if (!pending) return null

    return {
      dateIso: pending.dateIso,
      fromMinutes: pending.fromMinutes,
      toMinutes: pending.toMinutes,
    }
  })
  const [segmentPagerScrollEnabled, setSegmentPagerScrollEnabled] = useState(true)

  const scrollRef = useRef<ScrollView>(null)
  const segmentPagerRef = useRef<FlatList<RunWalkTab>>(null)
  const segmentPagerIndexRef = useRef(0)
  const segmentPagerProgrammaticScrollRef = useRef(false)
  const weeklyGoalSectionY = useRef(0)
  const celebrationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  const scrollSegmentPagerTo = useCallback(
    (tab: RunWalkTab, animated = true) => {
      const index = SEGMENT_PAGES.indexOf(tab)
      if (index < 0) return

      segmentPagerProgrammaticScrollRef.current = animated
      segmentPagerIndexRef.current = index

      if (Platform.OS === 'web') {
        if (!animated) {
          segmentPagerProgrammaticScrollRef.current = false
        }
        return
      }

      segmentPagerRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated,
      })

      if (!animated) {
        segmentPagerProgrammaticScrollRef.current = false
      }
    },
    [screenWidth],
  )

  const handleSegmentTabChange = useCallback(
    (tab: RunWalkTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(Math.max(nextIndex, 0), SEGMENT_PAGES.length - 1)
      const nextTab = SEGMENT_PAGES[clampedIndex] ?? 'today'

      segmentPagerIndexRef.current = clampedIndex

      setSegmentTab((current) => {
        if (current === nextTab) return current
        if (options?.haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        return nextTab
      })
    },
    [],
  )

  const handleSegmentPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (segmentPagerProgrammaticScrollRef.current) return

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex)
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  const handleSegmentPagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const wasProgrammatic = segmentPagerProgrammaticScrollRef.current
      segmentPagerProgrammaticScrollRef.current = false

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth)
      handleSegmentPagerIndexChange(nextIndex, { haptic: !wasProgrammatic })
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  useEffect(() => {
    if (Platform.OS === 'web') return

    segmentPagerRef.current?.scrollToOffset({
      offset: segmentPagerIndexRef.current * screenWidth,
      animated: false,
    })
  }, [screenWidth])

  const disposition = todayState.disposition

  const weeklyGoalStats = useMemo(
    () => applyWeeklyGoalTargets(todayState.weeklyGoal, weeklyGoalTargets),
    [todayState.weeklyGoal, weeklyGoalTargets],
  )

  const weeklyGoalDrawerTargets = useMemo((): WeeklyGoalTargets | null => {
    if (weeklyGoalTargets) return weeklyGoalTargets
    if (!hasWeeklyGoal(weeklyGoalStats)) return null

    return {
      targetActivities: weeklyGoalStats.targetActivities,
      targetActiveMinutes: weeklyGoalStats.targetActiveMinutes,
      targetMovementDays: weeklyGoalStats.targetMovementDays,
    }
  }, [weeklyGoalStats, weeklyGoalTargets])

  const patientCpf = user?.cpf ?? 'guest'

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
  }, [])

  const applyPlanoSnapshot = useCallback((snapshot: RunWalkPlanoSnapshot) => {
    setActivity(snapshot.activity)
    setHasTodayActivity(snapshot.hasTodayActivity)
    setActivityPresets(snapshot.presets)
  }, [])

  const loadDailyState = useCallback(async () => {
    setIsDailyStateReady(false)

    try {
      const [savedGoal, weeklyProgress, dispositionSnapshot, planoSnapshot] = await Promise.all([
        loadWeeklyGoalTargets(patientCpf),
        loadWeeklyGoalProgress(patientCpf),
        loadRunWalkDisposition(patientCpf),
        loadRunWalkPlano(patientCpf),
      ])
      setWeeklyGoalTargets(savedGoal)

      setTodayState({
        ...createEmptyRunWalkTodayState(),
        disposition: dispositionSnapshot.disposition,
        weeklyGoal: weeklyProgress.weeklyGoal,
        weeklyCalendar: weeklyProgress.weeklyCalendar,
      })
      applyPlanoSnapshot(planoSnapshot)

      if (!user) return

      if (!dispositionSnapshot.checkinCompletedToday) {
        setCheckinAllowSkip(true)
        setCheckinVisible(true)
      }
    } finally {
      setIsDailyStateReady(true)
    }
  }, [applyPlanoSnapshot, patientCpf, user])

  const refreshData = useCallback(async () => {
    const [savedGoal, weeklyProgress, dispositionSnapshot, planoSnapshot] = await Promise.all([
      loadWeeklyGoalTargets(patientCpf),
      loadWeeklyGoalProgress(patientCpf, { forceRefresh: true }),
      loadRunWalkDisposition(patientCpf, { forceRefresh: true }),
      loadRunWalkPlano(patientCpf, { forceRefresh: true }),
    ])
    setWeeklyGoalTargets(savedGoal)

    setTodayState((prev) => ({
      ...createEmptyRunWalkTodayState(),
      disposition: dispositionSnapshot.disposition,
      weeklyGoal: weeklyProgress.weeklyGoal,
      weeklyCalendar: weeklyProgress.weeklyCalendar,
    }))
    applyPlanoSnapshot(planoSnapshot)
  }, [applyPlanoSnapshot, patientCpf])

  useEffect(() => {
    void loadDailyState()
  }, [loadDailyState])

  useEffect(() => {
    if (!isDailyStateReady || segmentTab !== 'today' || celebrateDay) {
      setWeeklyGoalAnimateRings(false)
      setWeeklyGoalAnimateChart(false)
      return
    }

    setWeeklyGoalAnimateRings(false)
    setWeeklyGoalAnimateChart(false)

    let cancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) {
          setWeeklyGoalAnimateRings(true)
          setWeeklyGoalAnimateChart(true)
        }
      })
    })

    return () => {
      cancelled = true
    }
  }, [celebrateDay, isDailyStateReady, segmentTab])

  useEffect(() => {
    if (getRunWalkRouteParams(routeParams).openModalityDrawer) {
      openModalityDrawer()
    }
  }, [routeParams])

  useEffect(() => {
    const pending = consumePendingWeeklyGoalCelebration()
    if (!pending) return

    celebrationTimersRef.current.forEach(clearTimeout)
    celebrationTimersRef.current = []

    let active = true

    void (async () => {
      await refreshData()
      if (!active) return

      setSegmentTab('today')
      scrollSegmentPagerTo('today')
      setCelebrateDay({
        dateIso: pending.dateIso,
        fromMinutes: pending.fromMinutes,
        toMinutes: pending.toMinutes,
      })

      celebrationTimersRef.current.push(
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(weeklyGoalSectionY.current - 24, 0),
            animated: true,
          })
        }, 320),
      )

      celebrationTimersRef.current.push(
        setTimeout(() => {
          setCelebrateDay(null)
        }, 1700),
      )
    })()

    return () => {
      active = false
      celebrationTimersRef.current.forEach(clearTimeout)
      celebrationTimersRef.current = []
    }
  }, [refreshData, scrollSegmentPagerTo])

  useEffect(() => {
    if (!isNetworkReady) return

    if (!isConnected) {
      wasOfflineRef.current = true
      return
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false
      void refreshData()
    }
  }, [isConnected, isNetworkReady, refreshData])

  function handleBack() {
    if (canGoBack()) goBack()
    else navigateTo('home')
  }

  useAndroidBackHandler(() => {
    if (modalityDrawerVisible) {
      setModalityDrawerVisible(false)
      return true
    }
    if (goalDrawerVisible) {
      setGoalDrawerVisible(false)
      return true
    }
    if (weekCalendarVisible) {
      setWeekCalendarVisible(false)
      return true
    }
    if (activityPreviewVisible) {
      handleChangeActivityPreview()
      return true
    }
    if (activityPickerVisible) {
      setActivityPickerVisible(false)
      return true
    }
    if (checkinVisible) {
      if (checkinAllowSkip) {
        void handleDispositionDismiss()
      }
      handleCheckinClose()
      return true
    }
    if (explainVisible) {
      setExplainVisible(false)
      return true
    }
    if (activityMenuVisible) {
      setActivityMenuVisible(false)
      return true
    }
    if (detailVisible) {
      setDetailVisible(false)
      return true
    }
    if (menuVisible) {
      setMenuVisible(false)
      return true
    }
    handleBack()
    return true
  })

  function handleTabPress(tab: BottomTabId) {
    if (tab === 'menu') {
      setMenuVisible(true)
      return
    }

    setMenuVisible(false)

    if (tab === 'home') {
      navigateTo('home')
      return
    }

    if (tab === 'agendar') {
      navigateTo('schedule-appointment')
      return
    }

    if (tab === 'my-metrics') {
      navigateTo('my-metrics')
      return
    }

    if (tab === 'pos-consulta') {
      navigateTo('post-consultation')
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    await refreshData()
    setIsRefreshing(false)
  }

  function handleDispositionDismiss() {
    setCheckinAllowSkip(false)
  }

  function handleOpenManualCheckin() {
    requireAuth('vida:run-walk', () => {
      setCheckinAllowSkip(false)
      setCheckinVisible(true)
    })
  }

  function handleCheckinClose() {
    setCheckinVisible(false)
    setCheckinAllowSkip(false)
  }

  async function handleActivitySelect(presetId: TodayActivityPresetId) {
    requireAuth('vida:run-walk', () => {
      void (async () => {
        const snapshot = await selectRunWalkPlanoPreset(patientCpf, presetId)
        const preset = findTodayActivityPreset(snapshot.presets, presetId)
        applyPlanoSnapshot(snapshot)
        showToast(
          preset
            ? `${preset.title} definida como sua atividade de hoje.`
            : 'Atividade de hoje definida.',
        )
      })()
    })
  }

  function handleActivityPreview(presetId: TodayActivityPresetId) {
    setPendingPresetId(presetId)
    setActivityPickerVisible(false)
    setActivityPreviewVisible(true)
  }

  function handleChangeActivityPreview() {
    requireAuth('vida:run-walk', () => {
      setActivityPreviewVisible(false)
      setActivityPickerVisible(true)
    })
  }

  async function handleAcceptActivityPreview(presetId: TodayActivityPresetId) {
    await handleActivitySelect(presetId)
    setActivityPreviewVisible(false)
    setPendingPresetId(null)
  }

  function handleCloseActivityPreview() {
    setActivityPreviewVisible(false)
    setPendingPresetId(null)
  }

  function openModalityDrawer() {
    requireAuth('vida:run-walk', () => {
      setModalityDrawerVisible(true)
    })
  }

  function navigateToPreparation(modality?: ActivityModality) {
    requireAuth('vida:run-walk', () => {
      void clearPreparationDraft(user?.cpf)

      if (activity && !modality) {
        navigateTo('run-walk-preparation', {
          modality: activity.type,
          activityName: activity.title,
          intensity: activity.intensityLabel,
          durationMinutes: activity.durationMinutes,
        })
        return
      }

      const selectedModality = modality ?? 'walk'
      const defaults = MODALITY_DEFAULTS[selectedModality]
      navigateTo('run-walk-preparation', {
        modality: selectedModality,
        activityName: defaults.activityName,
        intensity: defaults.intensity,
        durationMinutes: defaults.durationMinutes,
      })
    })
  }

  function handleModalitySelect(modality: ActivityModality) {
    navigateToPreparation(modality)
  }

  function handleStartActivity() {
    navigateToPreparation()
  }

  function handleActivityMenuAction(action: ActivityMenuAction) {
    requireAuth('vida:run-walk', () => {
      void (async () => {
        const result = await applyRunWalkPlanoMenuAction(patientCpf, action)
        applyPlanoSnapshot(result)
        if (result.notice) {
          showToast(result.notice)
        }
      })()
    })
  }

  function handleCheckinComplete(
    _answers: DispositionCheckinAnswers,
    _recommendationLabel: string,
    result?: SaveRunWalkDispositionCheckinResult,
  ) {
    if (result) {
      setTodayState((prev) => ({
        ...prev,
        disposition: result.disposition,
      }))
    }
    setCheckinAllowSkip(false)
  }

  async function handleSaveWeeklyGoal(targets: WeeklyGoalTargets) {
    requireAuth('vida:run-walk', () => {
      void (async () => {
        await saveWeeklyGoalTargets(patientCpf, targets)
        setWeeklyGoalTargets(targets)
        setTodayState((prev) => ({
          ...prev,
          weeklyGoal: applyWeeklyGoalTargets(prev.weeklyGoal, targets),
        }))
        showToast('Meta semanal atualizada.')
      })()
    })
  }

  function handleShortcutPress(id: RunWalkQuickShortcutId) {
    if (id === 'nearby-routes') {
      requireAuth('vida:run-walk', () => navigateTo('nearby-running-routes'))
      return
    }

    if (id === 'start-activity') {
      navigateToPreparation()
    }
  }

  const renderRunWalkSegmentPage = useCallback(
    (tab: RunWalkTab) => {
      if (tab === 'today') {
        return (
          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={[
              styles.bodyContent,
              { paddingBottom: bottomContentPadding },
              Platform.OS !== 'web' && { flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => void handleRefresh()}
                tintColor={colors.primaryLight}
              />
            }
          >
            <View style={styles.shortcutsSection}>
              <View style={styles.shortcutsInner}>
                <RunWalkQuickShortcuts onShortcutPress={handleShortcutPress} />
              </View>
              <NeonSectionDivider embedded />
            </View>

            <View
              onLayout={(event) => {
                weeklyGoalSectionY.current = event.nativeEvent.layout.y
              }}
            >
              {!isDailyStateReady ? (
                <RunWalkWeeklyGoalCardSkeleton />
              ) : (
                <RunWalkWeeklyGoalCard
                  stats={weeklyGoalStats}
                  days={todayState.weeklyCalendar}
                  onViewWeekPress={() => setWeekCalendarVisible(true)}
                  onGoalActionPress={() =>
                    requireAuth('vida:run-walk', () => setGoalDrawerVisible(true))
                  }
                  celebrateDay={celebrateDay}
                  animateRings={weeklyGoalAnimateRings}
                  animateChart={weeklyGoalAnimateChart}
                />
              )}
            </View>

            {!isDailyStateReady ? (
              <RunWalkDispositionCardSkeleton />
            ) : (
              <>
                <RunWalkDispositionCard
                  disposition={disposition}
                  onExplainPress={() => setExplainVisible(true)}
                  onCheckinPress={handleOpenManualCheckin}
                />

                {hasTodayActivity && activity ? (
                  <RunWalkTodayActivityCard
                    activity={activity}
                    onStartPress={handleStartActivity}
                    onDetailsPress={() => setDetailVisible(true)}
                    onMenuPress={() =>
                      requireAuth('vida:run-walk', () => setActivityMenuVisible(true))
                    }
                  />
                ) : null}
              </>
            )}
          </ScrollView>
        )
      }

      return (
        <RunWalkHistoryTab
          patientCpf={patientCpf}
          patientName={user?.name}
          profilePhotoUri={user?.selfieUri}
          weeklyGoalStats={weeklyGoalStats}
          bottomPadding={bottomContentPadding}
          isActive={segmentTab === 'progress'}
          onStartActivity={handleStartActivity}
          onSegmentPagerLockChange={(active) => setSegmentPagerScrollEnabled(!active)}
        />
      )
    },
    [
      activity,
      bottomContentPadding,
      celebrateDay,
      disposition,
      handleOpenManualCheckin,
      handleRefresh,
      handleShortcutPress,
      handleStartActivity,
      hasTodayActivity,
      isDailyStateReady,
      isRefreshing,
      patientCpf,
      requireAuth,
      segmentTab,
      todayState.weeklyCalendar,
      user?.name,
      user?.selfieUri,
      weeklyGoalAnimateChart,
      weeklyGoalAnimateRings,
      weeklyGoalStats,
    ],
  )

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
          colors={[...themeColors.screenOverlay]}
          locations={[0, 0.35, 1]}
          style={styles.screenOverlay}
          pointerEvents="none"
        />

        <ScreenStackHeader
          title="Corrida e Caminhada"
          subtitle="Hoje · Histórico"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <RunWalkSegmentTabs activeTab={segmentTab} onChange={handleSegmentTabChange} />

        {Platform.OS === 'web' ? (
          <View style={styles.segmentPagerWeb}>
            <View style={[styles.segmentPage, { width: screenWidth }]}>
              {renderRunWalkSegmentPage(segmentTab)}
            </View>
          </View>
        ) : (
          <FlatList
            ref={segmentPagerRef}
            data={SEGMENT_PAGES}
            keyExtractor={(item) => item}
            horizontal
            pagingEnabled
            scrollEnabled={segmentPagerScrollEnabled}
            nestedScrollEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
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
                {renderRunWalkSegmentPage(item)}
              </View>
            )}
          />
        )}

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />

        <ActionToast
          message={toastMessage}
          onHidden={() => setToastMessage(null)}
          bottomOffset={TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12}
        />
      </View>

      <RunWalkModalityDrawer
        visible={modalityDrawerVisible}
        patientCpf={user?.cpf}
        onClose={() => setModalityDrawerVisible(false)}
        onSelect={handleModalitySelect}
      />

      <RunWalkActivityPickerDrawer
        visible={activityPickerVisible}
        presets={activityPresets}
        onClose={() => setActivityPickerVisible(false)}
        onPreview={handleActivityPreview}
      />

      <RunWalkActivityPreviewDrawer
        visible={activityPreviewVisible}
        presetId={pendingPresetId}
        presets={activityPresets}
        onClose={handleCloseActivityPreview}
        onAccept={(presetId) => void handleAcceptActivityPreview(presetId)}
        onChange={handleChangeActivityPreview}
      />

      <RunWalkActivityDetailDrawer
        visible={detailVisible}
        activity={activity}
        onClose={() => setDetailVisible(false)}
      />

      <RunWalkActivityMenuDrawer
        visible={activityMenuVisible}
        onClose={() => setActivityMenuVisible(false)}
        onAction={handleActivityMenuAction}
      />

      <RunWalkDispositionExplainDrawer
        visible={explainVisible}
        disposition={disposition}
        onClose={() => setExplainVisible(false)}
      />

      <RunWalkDispositionCheckinDrawer
        visible={checkinVisible}
        allowSkip={checkinAllowSkip}
        patientCpf={patientCpf}
        onClose={handleCheckinClose}
        onDismiss={handleDispositionDismiss}
        onComplete={(answers, label, result) => handleCheckinComplete(answers, label, result)}
      />

      <RunWalkWeeklyCalendarDrawer
        visible={weekCalendarVisible}
        days={todayState.weeklyCalendar}
        onClose={() => setWeekCalendarVisible(false)}
      />

      <RunWalkWeeklyGoalDrawer
        visible={goalDrawerVisible}
        initialTargets={weeklyGoalDrawerTargets}
        currentProgress={{
          completedActivities: weeklyGoalStats.completedActivities,
          activeMinutes: weeklyGoalStats.activeMinutes,
          movementDays: weeklyGoalStats.movementDays,
        }}
        onClose={() => setGoalDrawerVisible(false)}
        onSave={(targets) => void handleSaveWeeklyGoal(targets)}
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
  body: {
    flex: 1,
    minHeight: 0,
    ...Platform.select({
      web: {
        overflowY: 'auto',
        overflowX: 'hidden',
      },
      default: {},
    }),
  },
  segmentPager: {
    flex: 1,
    minHeight: 0,
  },
  segmentPagerWeb: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        overflowX: 'auto',
        overflowY: 'hidden',
      },
      default: {},
    }),
  },
  segmentPage: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    flexGrow: 1,
    gap: 14,
  },
  shortcutsSection: {
    flexGrow: 1,
    minHeight: 118,
  },
  shortcutsInner: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 7,
  },
})
