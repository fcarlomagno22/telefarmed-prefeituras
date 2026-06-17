import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomTabBar, BottomTabId } from '../components/BottomTabBar'
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
import { RunWalkWeeklyCalendarDrawer } from '../components/runWalk/RunWalkWeeklyCalendarDrawer'
import { RunWalkWeeklyGoalCard } from '../components/runWalk/RunWalkWeeklyGoalCard'
import type { RunWalkWeeklyBarCelebrateDay } from '../components/runWalk/RunWalkWeeklyBarChart'
import { RunWalkWeeklyGoalDrawer } from '../components/runWalk/RunWalkWeeklyGoalDrawer'
import { ScreenStackHeader } from '../components/ScreenStackHeader'
import { appEnv } from '../config/env'
import {
  applyActivityMenuAction,
  findTodayActivityById,
  getMockRunWalkTodayState,
  getTodayActivityPreset,
} from '../data/mockRunWalk'
import { MODALITY_DEFAULTS } from '../data/runWalkModalityConfig'
import { clearPreparationDraft } from '../data/runWalkPreparationDraftStorage'
import {
  clearTodayActivitySelection,
  loadRunWalkDailyRecord,
  markDispositionPromptHandled,
  saveTodayActivitySelection,
} from '../data/runWalkStorage'
import {
  loadWeeklyGoalTargets,
  saveWeeklyGoalTargets,
} from '../data/runWalkWeeklyGoalStorage'
import {
  loadWeeklyProgress,
  mergeWeeklyProgressIntoState,
} from '../data/runWalkWeeklyProgressStorage'
import { consumePendingWeeklyGoalCelebration } from '../data/runWalkWeeklyCelebration'
import { useAuth } from '../contexts/AuthContext'
import { useAndroidBackHandler } from '../hooks/useAndroidBackHandler'
import { colors } from '../theme/colors'
import type {
  ActivityMenuAction,
  DispositionCheckinAnswers,
  RunWalkQuickShortcutId,
  RunWalkTab,
  TodayActivity,
  TodayActivityPresetId,
  WeeklyGoalTargets,
} from '../types/runWalk'
import type { ActivityModality } from '../types/auth'
import { getRunWalkRouteParams } from '../types/auth'
import { applyWeeklyGoalTargets, hasWeeklyGoal } from '../utils/runWalkWeeklyGoal'
import { resolveBrandImage } from '../utils/resolveBrandImage'

const backgroundSource = resolveBrandImage(appEnv.backgroundImageUrl, 'fundo_login.png')
const TAB_BAR_ESTIMATED_HEIGHT = 78
const SEGMENT_PAGES: RunWalkTab[] = ['today', 'progress']

export function RunWalkScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const { user, navigateTo, goBack, canGoBack, logout, routeParams } = useAuth()

  const [segmentTab, setSegmentTab] = useState<RunWalkTab>('today')
  const [menuVisible, setMenuVisible] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDailyStateReady, setIsDailyStateReady] = useState(false)

  const [todayState, setTodayState] = useState(getMockRunWalkTodayState)
  const [activity, setActivity] = useState<TodayActivity | null>(null)
  const [hasTodayActivity, setHasTodayActivity] = useState(false)
  const [dispositionMessage, setDispositionMessage] = useState(todayState.disposition.message)

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
  const [planNotice, setPlanNotice] = useState<string | null>(null)
  const [celebrateDay, setCelebrateDay] = useState<RunWalkWeeklyBarCelebrateDay | null>(null)
  const [segmentPagerScrollEnabled, setSegmentPagerScrollEnabled] = useState(true)

  const scrollRef = useRef<ScrollView>(null)
  const segmentPagerRef = useRef<FlatList<RunWalkTab>>(null)
  const segmentPagerIndexRef = useRef(0)
  const weeklyGoalSectionY = useRef(0)
  const celebrationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

  const scrollSegmentPagerTo = useCallback(
    (tab: RunWalkTab, animated = true) => {
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

      if (clampedIndex !== segmentPagerIndexRef.current) {
        segmentPagerIndexRef.current = clampedIndex
      }

      if (nextTab !== segmentTab) {
        if (options?.haptic) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        setSegmentTab(nextTab)
      }
    },
    [segmentTab],
  )

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
      handleSegmentPagerIndexChange(nextIndex, { haptic: true })
    },
    [handleSegmentPagerIndexChange, screenWidth],
  )

  useEffect(() => {
    const index = segmentTab === 'today' ? 0 : 1
    if (segmentPagerIndexRef.current !== index) {
      scrollSegmentPagerTo(segmentTab)
    }
  }, [scrollSegmentPagerTo, segmentTab])

  const disposition = useMemo(
    () => ({
      ...todayState.disposition,
      message: dispositionMessage,
    }),
    [dispositionMessage, todayState.disposition],
  )

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

  const loadDailyState = useCallback(async () => {
    const savedGoal = await loadWeeklyGoalTargets(patientCpf)
    setWeeklyGoalTargets(savedGoal)

    const weeklyProgress = await loadWeeklyProgress(patientCpf)
    const mergedState = mergeWeeklyProgressIntoState(getMockRunWalkTodayState(), weeklyProgress)
    setTodayState(mergedState)
    setDispositionMessage(mergedState.disposition.message)

    if (!user) {
      setIsDailyStateReady(true)
      return
    }

    const record = await loadRunWalkDailyRecord(user.cpf)

    if (record.selectedActivityId) {
      const savedActivity = findTodayActivityById(record.selectedActivityId)
      if (savedActivity) {
        setActivity(savedActivity)
        setHasTodayActivity(true)
      }
    }

    if (!record.dispositionPromptHandled) {
      setCheckinAllowSkip(true)
      setCheckinVisible(true)
    }

    setIsDailyStateReady(true)
  }, [patientCpf, user])

  useEffect(() => {
    void loadDailyState()
  }, [loadDailyState])

  useEffect(() => {
    if (getRunWalkRouteParams(routeParams).openModalityDrawer) {
      setModalityDrawerVisible(true)
    }
  }, [routeParams])

  useEffect(() => {
    const pending = consumePendingWeeklyGoalCelebration()
    if (!pending) return

    celebrationTimersRef.current.forEach(clearTimeout)
    celebrationTimersRef.current = []

    let active = true

    void (async () => {
      await loadDailyState()
      if (!active) return

      setSegmentTab('today')
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
        }, 1600),
      )
    })()

    return () => {
      active = false
      celebrationTimersRef.current.forEach(clearTimeout)
      celebrationTimersRef.current = []
    }
  }, [loadDailyState])

  const refreshData = useCallback(async () => {
    const weeklyProgress = await loadWeeklyProgress(patientCpf)
    const next = mergeWeeklyProgressIntoState(getMockRunWalkTodayState(), weeklyProgress)
    setTodayState(next)
    setDispositionMessage(next.disposition.message)
    setPlanNotice(null)
  }, [patientCpf])

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

  async function handleDispositionDismiss() {
    if (!user) return
    await markDispositionPromptHandled(user.cpf)
    setCheckinAllowSkip(false)
  }

  function handleOpenManualCheckin() {
    setCheckinAllowSkip(false)
    setCheckinVisible(true)
  }

  function handleCheckinClose() {
    setCheckinVisible(false)
    setCheckinAllowSkip(false)
  }

  async function handleActivitySelect(presetId: TodayActivityPresetId) {
    const preset = getTodayActivityPreset(presetId)
    setActivity(preset.activity)
    setHasTodayActivity(true)
    setPlanNotice(`${preset.title} definida como sua atividade de hoje.`)

    if (user) {
      await saveTodayActivitySelection(user.cpf, preset.activity.id)
    }
  }

  function handleActivityPreview(presetId: TodayActivityPresetId) {
    setPendingPresetId(presetId)
    setActivityPickerVisible(false)
    setActivityPreviewVisible(true)
  }

  function handleChangeActivityPreview() {
    setActivityPreviewVisible(false)
    setActivityPickerVisible(true)
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
    setModalityDrawerVisible(true)
  }

  function navigateToPreparation(modality?: ActivityModality) {
    void clearPreparationDraft()

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
  }

  function handleModalitySelect(modality: ActivityModality) {
    navigateToPreparation(modality)
  }

  function handleStartActivity() {
    navigateToPreparation()
  }

  function handleActivityMenuAction(action: ActivityMenuAction) {
    if (!activity) return

    if (action === 'remove-today') {
      setActivity(null)
      setHasTodayActivity(false)
      setPlanNotice('Atividade de hoje removida.')
      if (user) {
        void clearTodayActivitySelection(user.cpf)
      }
      return
    }

    const nextActivity = applyActivityMenuAction(activity, action)
    setActivity(nextActivity)

    const notices: Partial<Record<ActivityMenuAction, string>> = {
      later: 'Atividade movida para mais tarde. Seu plano foi reorganizado.',
      reschedule: 'Escolha um novo horário em breve. O plano será ajustado automaticamente.',
      tomorrow: 'Atividade remarcada para amanhã com recuperação leve hoje.',
      'free-activity': 'Atividade livre disponível nos atalhos rápidos.',
      'report-tired': 'Registramos seu cansaço e sugerimos uma sessão mais leve.',
      'report-discomfort': 'Registramos o desconforto. Considere recuperação ou descanso.',
      skip: 'Atividade de hoje adiada. Seu plano será reorganizado nos próximos dias.',
    }

    if (notices[action]) {
      setPlanNotice(notices[action]!)
    } else if (action === 'swap-walk') {
      setPlanNotice('Atividade trocada por caminhada. O plano da semana foi ajustado.')
    } else if (action === 'reduce-duration') {
      setPlanNotice('Duração reduzida mantendo a regularidade da semana.')
    } else if (action === 'reduce-intensity') {
      setPlanNotice('Intensidade reduzida para priorizar bem-estar e consistência.')
    }
  }

  async function handleCheckinComplete(
    _answers: DispositionCheckinAnswers,
    recommendationLabel: string,
  ) {
    await handleDispositionDismiss()
    setDispositionMessage(recommendationLabel)
    setPlanNotice(`Com base no seu check-in: ${recommendationLabel.toLowerCase()}.`)
  }

  async function handleSaveWeeklyGoal(targets: WeeklyGoalTargets) {
    await saveWeeklyGoalTargets(patientCpf, targets)
    setWeeklyGoalTargets(targets)
    setPlanNotice('Meta semanal atualizada.')
  }

  function handleShortcutPress(id: RunWalkQuickShortcutId) {
    if (id === 'nearby-routes') {
      navigateTo('nearby-running-routes')
      return
    }

    if (id === 'start-activity') {
      navigateToPreparation()
      return
    }
  }

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

        <ScreenStackHeader
          title="Corrida e Caminhada"
          subtitle="Hoje · Histórico"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <RunWalkSegmentTabs activeTab={segmentTab} onChange={handleSegmentTabChange} />

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
              {item === 'today' ? (
                <ScrollView
                  ref={scrollRef}
                  style={styles.body}
                  contentContainerStyle={[
                    styles.bodyContent,
                    { paddingBottom: bottomContentPadding, flexGrow: 1 },
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
                  {planNotice ? (
                    <View style={styles.notice}>
                      <Text style={styles.noticeText}>{planNotice}</Text>
                    </View>
                  ) : null}

                  <View style={styles.shortcutsSection}>
                    <View style={styles.shortcutsInner}>
                      <RunWalkQuickShortcuts
                        onShortcutPress={handleShortcutPress}
                        onChallengesPress={() => navigateTo('run-walk-challenges')}
                        onAchievementsPress={() => navigateTo('run-walk-achievements')}
                      />
                    </View>
                    <NeonSectionDivider embedded />
                  </View>

                  <View
                    onLayout={(event) => {
                      weeklyGoalSectionY.current = event.nativeEvent.layout.y
                    }}
                  >
                    <RunWalkWeeklyGoalCard
                      stats={weeklyGoalStats}
                      days={todayState.weeklyCalendar}
                      onViewWeekPress={() => setWeekCalendarVisible(true)}
                      onGoalActionPress={() => setGoalDrawerVisible(true)}
                      celebrateDay={celebrateDay}
                      animateRings={segmentTab === 'today' && isDailyStateReady}
                    />
                  </View>

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
                      onMenuPress={() => setActivityMenuVisible(true)}
                    />
                  ) : null}
                </ScrollView>
              ) : (
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
              )}
            </View>
          )}
        />

        <BottomTabBar activeTab={null} onTabPress={handleTabPress} />
      </View>

      <RunWalkModalityDrawer
        visible={modalityDrawerVisible}
        onClose={() => setModalityDrawerVisible(false)}
        onSelect={handleModalitySelect}
      />

      <RunWalkActivityPickerDrawer
        visible={activityPickerVisible}
        onClose={() => setActivityPickerVisible(false)}
        onPreview={handleActivityPreview}
      />

      <RunWalkActivityPreviewDrawer
        visible={activityPreviewVisible}
        presetId={pendingPresetId}
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
        onClose={handleCheckinClose}
        onDismiss={() => void handleDispositionDismiss()}
        onComplete={(answers, label) => void handleCheckinComplete(answers, label)}
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
  },
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
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
  notice: {
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.28)',
  },
  noticeText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
})
