import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
import { RunWalkQuickShortcuts } from '../components/runWalk/RunWalkQuickShortcuts'
import { RunWalkSegmentTabs } from '../components/runWalk/RunWalkSegmentTabs'
import { RunWalkTodayActivityCard } from '../components/runWalk/RunWalkTodayActivityCard'
import { RunWalkWeeklyCalendarDrawer } from '../components/runWalk/RunWalkWeeklyCalendarDrawer'
import { RunWalkWeeklyGoalCard } from '../components/runWalk/RunWalkWeeklyGoalCard'
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

export function RunWalkScreen() {
  const insets = useSafeAreaInsets()
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

  const bottomContentPadding =
    TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 16

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

  const refreshData = useCallback(() => {
    const next = getMockRunWalkTodayState()
    setTodayState(next)
    setDispositionMessage(next.disposition.message)
    setPlanNotice(null)
  }, [])

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
    refreshData()
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

  function handleModalitySelect(modality: ActivityModality) {
    const defaults = MODALITY_DEFAULTS[modality]
    navigateTo('run-walk-preparation', {
      modality,
      activityName: defaults.activityName,
      intensity: defaults.intensity,
      durationMinutes: defaults.durationMinutes,
    })
  }

  function handleStartActivity() {
    openModalityDrawer()
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
      openModalityDrawer()
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
          subtitle="Hoje · Progresso"
          paddingTop={Math.max(insets.top, 12) + 8}
          onBack={handleBack}
        />

        <ScrollView
          style={styles.body}
          contentContainerStyle={[
            styles.bodyContent,
            { paddingBottom: bottomContentPadding },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={colors.primaryLight}
            />
          }
        >
          <RunWalkSegmentTabs activeTab={segmentTab} onChange={setSegmentTab} />

          {segmentTab === 'today' ? (
            <>
              {planNotice ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>{planNotice}</Text>
                </View>
              ) : null}

              <RunWalkQuickShortcuts onShortcutPress={handleShortcutPress} />

              <NeonSectionDivider />

              <RunWalkWeeklyGoalCard
                stats={weeklyGoalStats}
                days={todayState.weeklyCalendar}
                onViewWeekPress={() => setWeekCalendarVisible(true)}
                onGoalActionPress={() => setGoalDrawerVisible(true)}
              />

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
            </>
          ) : (
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonTitle}>Em breve</Text>
              <Text style={styles.comingSoonText}>
                Esta seção será desenvolvida na próxima etapa.
              </Text>
            </View>
          )}
        </ScrollView>

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
  bodyContent: {
    gap: 14,
    paddingTop: 4,
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
  comingSoon: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  comingSoonTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  comingSoonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
})
