import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FlatList,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  unstable_batchedUpdates,
  useWindowDimensions,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buildMentalHealthTodayState } from '../../data/mentalHealthTodayState'
import {
  hasMentalHealthSufficientHistory,
  loadMentalHealthDailyRecord,
  saveMentalHealthDailyRecord,
  type MentalHealthDailyRecord,
} from '../../data/mentalHealthDailyStorage'
import { loadMentalHealthOnboardingRecord } from '../../data/mentalHealthOnboardingStorage'
import {
  loadMentalHealthCheckInCardData,
  loadMentalHealthCheckInEntries,
  saveMentalHealthCheckInEntry,
} from '../../data/mentalHealthCheckInStorage'
import {
  ensureActivityHistoryEntry,
  loadMentalHealthClinicalState,
  mergeAnamnesisAnswersIntoClinicalState,
  mergeAnamnesisModuleAnswers,
  persistPartialAnamnesisAnswers,
  recoverFromCrisisForReanamnesis,
  updateActivityHistoryEntry,
} from '../../data/mentalHealthClinicalStateStorage'
import {
  loadMentalHealthActivityFavorites,
  toggleMentalHealthActivityFavorite,
} from '../../data/mentalHealthActivityFavoritesStorage'
import {
  MENTAL_HEALTH_SEGMENT_TABS,
  type MentalHealthCheckInEntry,
  type MentalHealthCheckInSaveInput,
  isCrisisCheckInMood,
  type MentalHealthMoodLevelId,
  type MentalHealthOnboardingRecord,
  type MentalHealthTab,
  type MentalHealthTodayState,
} from '../../types/mentalHealth'
import type { AnamnesisAnswerRecord, UserClinicalState } from '../../types/mentalHealthEngine'
import {
  generateDailyMicroPlan,
  rebuildTodayPlanFromState,
  recalculateClinicalEngine,
  regenerateTodayMicroPlan,
  submitActivityFeedbackAndRecalc,
} from '../../mentalHealthEngine'
import type { ActivityFeedbackKey } from '../../mentalHealthEngine/renderCopyEngine'
import type { DailyMicroPlan } from '../../types/mentalHealthEngine'
import {
  resolveCrisisRecoveryMode,
  resolveCrisisPresentationFromFlagIds,
  resolveCrisisPresentationFromState,
  shouldBlockPlanConsideringCheckIn,
  shouldSurfaceCrisisConsideringCheckIn,
  type CrisisPresentation,
} from '../../utils/mentalHealthCrisis'
import { resolveMentalHealthJourney } from '../../utils/mentalHealthJourney'
import {
  computeExtendedAnamnesisProgress,
  computeInitialAnamnesisProgress,
  isInitialAnamnesisComplete,
  type AnamnesisDrawerMode,
} from '../../utils/mentalHealthAnamnesisCore'
import {
  getActiveRedFlagIds,
  getNotHelpfulActivityIds,
  isCatalogActivityBlocked,
} from '../../utils/mentalHealthActivityCatalog'
import { toLocalDateIso } from '../../utils/runWalkWeeklyChart'
import { hasChristianSpiritualContent } from '../../utils/mentalHealthSpiritual'
import { useAndroidBackHandler } from '../../hooks/useAndroidBackHandler'
import { useAuth } from '../../contexts/AuthContext'
import { useGuestAuth } from '../../contexts/GuestAuthContext'
import { RunWalkSegmentTabs } from '../runWalk/RunWalkSegmentTabs'
import { SpiritualModuleFab } from '../spiritual/SpiritualModuleFab'
import { MentalHealthAnamnesisDrawer } from './MentalHealthAnamnesisDrawer'
import { MentalHealthCheckInDrawer } from './MentalHealthCheckInDrawer'
import { MentalHealthCheckInRecordDrawer } from './MentalHealthCheckInRecordDrawer'
import { MentalHealthRecentCheckInsDrawer } from './MentalHealthRecentCheckInsDrawer'
import { MentalHealthTodayTab } from './MentalHealthTodayTab'
import { MentalHealthCrisisDrawer } from './MentalHealthCrisisDrawer'
import { MentalHealthCrisisRecoveryDrawer } from './MentalHealthCrisisRecoveryDrawer'
import { MentalHealthEmergencyContactsDrawer } from './MentalHealthEmergencyContactsDrawer'
import { MentalHealthActivityDetailDrawer } from './MentalHealthActivityDetailDrawer'
import { MentalHealthActivitySession } from './MentalHealthActivitySession'
import { MentalHealthCareTab } from './MentalHealthCareTab'
import { MentalHealthHowItWorksDrawer } from './MentalHealthHowItWorksDrawer'
import { MentalHealthJournalDrawer } from './MentalHealthJournalDrawer'
import { MentalHealthMyCareTab } from './MentalHealthMyCareTab'
import { MentalHealthPreferencesDrawer } from './MentalHealthPreferencesDrawer'
import { MentalHealthPrivacyPolicyDrawer } from './MentalHealthPrivacyPolicyDrawer'
import { MentalHealthMessageExplainDrawer } from './MentalHealthMessageExplainDrawer'
import { MentalHealthMicroPlanDrawer } from './MentalHealthMicroPlanDrawer'
import { MentalHealthSettingsDrawer } from './MentalHealthSettingsDrawer'
import { summarizePreferences } from '../../utils/mentalHealthMyCare'

const MENTAL_HEALTH_SEGMENT_PAGES: MentalHealthTab[] = MENTAL_HEALTH_SEGMENT_TABS.map(
  (tab) => tab.id,
)

const TAB_BAR_ESTIMATED_HEIGHT = 78

type MentalHealthHomeContentProps = {
  bottomPadding: number
  patientCpf: string
  record: MentalHealthOnboardingRecord
  refreshKey?: number
  clinicalStateSeed?: UserClinicalState | null
  onSafetyFlowActiveChange?: (active: boolean) => void
  onboardingInProgress?: boolean
  settingsVisible?: boolean
  onSettingsVisibleChange?: (visible: boolean) => void
}

export function MentalHealthHomeContent({
  bottomPadding,
  patientCpf,
  record: onboardingRecordProp,
  refreshKey = 0,
  clinicalStateSeed = null,
  onSafetyFlowActiveChange,
  onboardingInProgress = false,
  settingsVisible = false,
  onSettingsVisibleChange,
}: MentalHealthHomeContentProps) {
  const { width: screenWidth } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { navigateTo } = useAuth()
  const { requireAuth } = useGuestAuth()
  const guardAction = (action: () => void) => {
    requireAuth('vida:mental-health', action)
  }
  const [segmentTab, setSegmentTab] = useState<MentalHealthTab>('today')
  const segmentPagerRef = useRef<FlatList<MentalHealthTab>>(null)
  const segmentPagerProgrammaticScrollRef = useRef(false)
  const [onboardingRecord, setOnboardingRecord] =
    useState<MentalHealthOnboardingRecord>(onboardingRecordProp)
  const [journalDaily, setJournalDaily] = useState<MentalHealthDailyRecord | null>(null)
  const [todayState, setTodayState] = useState<MentalHealthTodayState | null>(null)
  const [recentEntries, setRecentEntries] = useState<MentalHealthCheckInEntry[]>([])
  const [clinicalState, setClinicalState] = useState<UserClinicalState | null>(null)
  const [anamnesisDrawerMode, setAnamnesisDrawerMode] = useState<AnamnesisDrawerMode>('initial')

  const [checkInDrawerVisible, setCheckInDrawerVisible] = useState(false)
  const [initialDrawerMood, setInitialDrawerMood] = useState<MentalHealthMoodLevelId | null>(null)
  const [initialDrawerStep, setInitialDrawerStep] = useState<1 | 2 | 3 | 4>(1)
  const [checkInRecordEntry, setCheckInRecordEntry] = useState<MentalHealthCheckInEntry | null>(
    null,
  )
  const [messageExplainDrawerVisible, setMessageExplainDrawerVisible] = useState(false)
  const [preferencesDrawerVisible, setPreferencesDrawerVisible] = useState(false)
  const [journalDrawerVisible, setJournalDrawerVisible] = useState(false)
  const [myCareHowItWorksVisible, setMyCareHowItWorksVisible] = useState(false)
  const [myCarePolicyVisible, setMyCarePolicyVisible] = useState(false)
  const [recentDrawerVisible, setRecentDrawerVisible] = useState(false)
  const [anamnesisDrawerVisible, setAnamnesisDrawerVisible] = useState(false)
  const [anamnesisSessionKey, setAnamnesisSessionKey] = useState(0)
  const [microPlanDrawerVisible, setMicroPlanDrawerVisible] = useState(false)
  const [microPlanLoading, setMicroPlanLoading] = useState(false)
  const [microPlan, setMicroPlan] = useState<DailyMicroPlan | null>(null)
  const [microPlanError, setMicroPlanError] = useState<string | null>(null)
  const [crisisDrawerVisible, setCrisisDrawerVisible] = useState(false)
  const [crisisRecoveryDrawerVisible, setCrisisRecoveryDrawerVisible] = useState(false)
  const [crisisPresentation, setCrisisPresentation] = useState<CrisisPresentation | null>(null)
  const [emergencyContactsDrawerVisible, setEmergencyContactsDrawerVisible] = useState(false)
  const [activitySession, setActivitySession] = useState<{
    activityId: string
    planDate: string
  } | null>(null)
  const [careDetailActivityId, setCareDetailActivityId] = useState<string | null>(null)
  const [favoriteActivityIds, setFavoriteActivityIds] = useState<string[]>([])
  const anamnesisRecalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAutoOpenedCheckInRef = useRef(false)
  const hasAutoOpenedAnamnesisRef = useRef(false)

  const loadTodayState = useCallback(async () => {
    const [daily, hasHistory, checkInCard, entries, loadedState] = await Promise.all([
      loadMentalHealthDailyRecord(patientCpf),
      hasMentalHealthSufficientHistory(patientCpf),
      loadMentalHealthCheckInCardData(patientCpf),
      loadMentalHealthCheckInEntries(patientCpf),
      loadMentalHealthClinicalState(patientCpf),
    ])

    let state = loadedState

    setRecentEntries(entries)
    setClinicalState(state)

    const today = toLocalDateIso(new Date())
    const hasCheckInToday = checkInCard.state !== 'pending'
    const latestMood = checkInCard.latestEntry?.mood ?? null
    const crisisBlocks = shouldBlockPlanConsideringCheckIn(
      state?.active_red_flags ?? [],
      latestMood,
      hasCheckInToday,
    )
    let planForToday: DailyMicroPlan | null = null

    if (
      state &&
      !crisisBlocks &&
      state.plan_state.last_plan_date === today &&
      !state.plan_state.last_plan_blocked
    ) {
      planForToday = rebuildTodayPlanFromState(state, today)
    }

    const initialAnamnesisComplete = isInitialAnamnesisComplete(state?.anamnesis.answers_index ?? {})

    if (
      !planForToday &&
      hasCheckInToday &&
      !crisisBlocks &&
      initialAnamnesisComplete
    ) {
      try {
        const planResult = await generateDailyMicroPlan(patientCpf, { forceRegenerate: true })
        state = planResult.state
        setClinicalState(state)
        if (planResult.plan && !planResult.plan.blocked) {
          planForToday = planResult.plan
        }
      } catch {
        // Mantém null; a aba Cuidar pode tentar novamente.
      }
    }

    setMicroPlan(planForToday)

    const nextTodayState = buildMentalHealthTodayState({
      checkInCard,
      hasSufficientHistory: hasHistory,
      journalEntryToday: daily.journalEntryToday,
      recentEntries: entries,
      clinicalState: state,
      plan: planForToday,
      planDate: today,
    })

    const answersIndex = state?.anamnesis.answers_index ?? {}
    const initialAnamnesisCompleteForUi = isInitialAnamnesisComplete(answersIndex)

    const shouldAutoOpenAnamnesis =
      !onboardingInProgress &&
      !crisisBlocks &&
      !hasAutoOpenedAnamnesisRef.current &&
      onboardingRecord.completed &&
      !initialAnamnesisCompleteForUi

    const shouldAutoOpenCheckIn =
      !crisisBlocks &&
      !hasAutoOpenedCheckInRef.current &&
      initialAnamnesisCompleteForUi &&
      checkInCard.state === 'pending'

    setTodayState(nextTodayState)

    if (shouldAutoOpenAnamnesis) {
      hasAutoOpenedAnamnesisRef.current = true
      setAnamnesisDrawerMode('initial')
      setAnamnesisDrawerVisible(true)
    } else if (shouldAutoOpenCheckIn) {
      hasAutoOpenedCheckInRef.current = true
      setInitialDrawerMood(null)
      setInitialDrawerStep(1)
      setCheckInDrawerVisible(true)
    }
  }, [onboardingInProgress, onboardingRecord.completed, patientCpf])

  useEffect(() => {
    if (!clinicalStateSeed) return
    setClinicalState(clinicalStateSeed)
    if (isInitialAnamnesisComplete(clinicalStateSeed.anamnesis.answers_index ?? {})) {
      hasAutoOpenedAnamnesisRef.current = true
    }
  }, [clinicalStateSeed])

  useEffect(() => {
    if (segmentTab !== 'today' && segmentTab !== 'care') return
    void loadTodayState()
  }, [loadTodayState, refreshKey, segmentTab])

  useEffect(() => {
    setOnboardingRecord(onboardingRecordProp)
  }, [onboardingRecordProp])

  useEffect(() => {
    if (segmentTab !== 'my-care') return

    void Promise.all([
      loadMentalHealthCheckInEntries(patientCpf),
      loadMentalHealthClinicalState(patientCpf),
      loadMentalHealthOnboardingRecord(patientCpf),
      loadMentalHealthDailyRecord(patientCpf),
    ]).then(([entries, state, onboarding, daily]) => {
      setRecentEntries(entries)
      setClinicalState(state)
      setOnboardingRecord(onboarding)
      setJournalDaily(daily)
    })
  }, [patientCpf, refreshKey, segmentTab])

  useEffect(() => {
    if (segmentTab !== 'care') return
    void loadMentalHealthActivityFavorites(patientCpf).then(setFavoriteActivityIds)
  }, [patientCpf, refreshKey, segmentTab])

  const latestEntry = todayState?.checkInCard.latestEntry ?? null
  const hasCheckInToday = todayState?.checkInCard.state !== 'pending'
  const todayIso = toLocalDateIso(new Date())
  const activeRedFlags = clinicalState?.active_red_flags ?? []
  const crisisBlocksPlan = shouldBlockPlanConsideringCheckIn(
    activeRedFlags,
    latestEntry?.mood ?? null,
    hasCheckInToday,
  )
  const crisisRecoveryMode = resolveCrisisRecoveryMode(activeRedFlags)

  const todayPlanActivities =
    clinicalState?.activity_history.filter((entry) => entry.plan_date === todayIso) ?? []
  const hasTodayPlan =
    !crisisBlocksPlan &&
    clinicalState?.plan_state.last_plan_date === todayIso &&
    !clinicalState.plan_state.last_plan_blocked &&
    todayPlanActivities.length > 0

  const answersIndex = clinicalState?.anamnesis.answers_index ?? {}
  const initialProgress = computeInitialAnamnesisProgress(answersIndex)
  const extendedProgress = computeExtendedAnamnesisProgress(answersIndex)
  const preferencesSummary = summarizePreferences(onboardingRecord.preferences)

  const journey = todayState
    ? resolveMentalHealthJourney({
        initialAnamnesisComplete: isInitialAnamnesisComplete(answersIndex),
        initialAnamnesisPercent: initialProgress.percent,
        extendedAnamnesisPercent: extendedProgress.percent,
        extendedAnamnesisComplete: extendedProgress.isComplete,
        checkInCard: todayState.checkInCard,
        hasTodayPlan,
        planActivitiesTotal: todayPlanActivities.length,
        planActivitiesCompleted: todayPlanActivities.filter(
          (entry) => entry.status === 'completed' || entry.feedback != null,
        ).length,
        crisisBlocksPlan,
      })
    : null

  useEffect(() => {
    hasAutoOpenedCheckInRef.current = false
    hasAutoOpenedAnamnesisRef.current = false
  }, [patientCpf])

  useAndroidBackHandler(
    useCallback(() => {
      if (emergencyContactsDrawerVisible) return false
      if (activitySession) return false
      if (crisisDrawerVisible) return true
      return false
    }, [activitySession, crisisDrawerVisible, emergencyContactsDrawerVisible]),
    crisisDrawerVisible && !emergencyContactsDrawerVisible && !activitySession,
  )

  useEffect(() => {
    onSafetyFlowActiveChange?.(crisisDrawerVisible || activitySession != null)
  }, [activitySession, crisisDrawerVisible, onSafetyFlowActiveChange])

  const openCrisisSupport = useCallback(
    async (options?: {
      redFlagIds?: string[]
      state?: UserClinicalState | null
    }) => {
      const state = options?.state ?? clinicalState
      const presentation = options?.redFlagIds?.length
        ? resolveCrisisPresentationFromFlagIds(options.redFlagIds)
        : resolveCrisisPresentationFromState(state?.active_red_flags ?? []) ??
          resolveCrisisPresentationFromFlagIds([])

      setCrisisPresentation(presentation)
      setCrisisDrawerVisible(true)
      setMicroPlanDrawerVisible(false)
      setCheckInDrawerVisible(false)
    },
    [clinicalState],
  )

  function openEmergencyContactsDrawer() {
    Keyboard.dismiss()
    setEmergencyContactsDrawerVisible(true)
  }

  function closeEmergencyContactsDrawer() {
    Keyboard.dismiss()
    setEmergencyContactsDrawerVisible(false)
  }

  async function maybeOpenCrisisFromClinicalState(
    state: UserClinicalState | null,
    options?: {
      checkInMood?: MentalHealthMoodLevelId | null
      hasCheckInToday?: boolean
    },
  ) {
    if (
      !state ||
      !(
        shouldSurfaceCrisisConsideringCheckIn(
          state.active_red_flags,
          options?.checkInMood ?? null,
          options?.hasCheckInToday === true,
        ) ||
        (options?.hasCheckInToday === true && isCrisisCheckInMood(options?.checkInMood ?? null))
      )
    ) {
      return
    }

    await openCrisisSupport({ state })
  }

  async function regenerateMicroPlanAfterClinicalUpdate(clinicalStateOverride?: UserClinicalState | null) {
    const stateForGate = clinicalStateOverride ?? clinicalState
    if (!isInitialAnamnesisComplete(stateForGate?.anamnesis.answers_index ?? {})) {
      await loadTodayState()
      return
    }

    setMicroPlanLoading(true)
    setMicroPlanError(null)

    try {
      const result = await regenerateTodayMicroPlan(patientCpf)
      if (!result) {
        setMicroPlan(null)
        await loadTodayState()
        return
      }

      setClinicalState(result.state)

      if (
        shouldSurfaceCrisisConsideringCheckIn(
          result.state.active_red_flags,
          latestEntry?.mood ?? null,
          hasCheckInToday,
        ) &&
        (shouldBlockPlanConsideringCheckIn(
          result.state.active_red_flags,
          latestEntry?.mood ?? null,
          hasCheckInToday,
        ) ||
          result.plan?.blocked)
      ) {
        setMicroPlan(null)
        await openCrisisSupport({ state: result.state })
        return
      }

      setMicroPlan(result.plan)
      if (!result.plan) {
        setMicroPlanError(
          'Não foi possível atualizar seus cuidados de hoje. Tente montar o plano novamente.',
        )
      }
    } catch {
      setMicroPlanError('Não foi possível atualizar seus cuidados de hoje. Tente novamente.')
    } finally {
      setMicroPlanLoading(false)
      await loadTodayState()
    }
  }

  async function handleSaveCheckIn(input: MentalHealthCheckInSaveInput) {
    await saveMentalHealthCheckInEntry(patientCpf, input)
    const result = await recalculateClinicalEngine(patientCpf, 'check_in')
    setClinicalState(result.state)
    setCheckInDrawerVisible(false)

    await maybeOpenCrisisFromClinicalState(result.state, {
      checkInMood: input.mood,
      hasCheckInToday: true,
    })

    const crisisAfterCheckIn =
      shouldSurfaceCrisisConsideringCheckIn(result.state.active_red_flags, input.mood, true) ||
      isCrisisCheckInMood(input.mood)

    if (crisisAfterCheckIn) {
      await loadTodayState()
      return
    }

    const answers = result.state.anamnesis.answers_index ?? {}
    if (!isInitialAnamnesisComplete(answers)) {
      await loadTodayState()
      return
    }

    setMicroPlanLoading(true)
    setMicroPlanError(null)

    try {
      const planResult = await generateDailyMicroPlan(patientCpf, { forceRegenerate: true })
      setClinicalState(planResult.state)

      if (
        shouldSurfaceCrisisConsideringCheckIn(
          planResult.state.active_red_flags,
          input.mood,
          true,
        ) &&
        (shouldBlockPlanConsideringCheckIn(
          planResult.state.active_red_flags,
          input.mood,
          true,
        ) ||
          planResult.plan?.blocked)
      ) {
        setMicroPlan(null)
        await openCrisisSupport({ state: planResult.state })
        return
      }

      setMicroPlan(planResult.plan && !planResult.plan.blocked ? planResult.plan : null)
      if (!planResult.plan || planResult.plan.blocked || planResult.plan.activities.length === 0) {
        setMicroPlanError(
          'Não foi possível montar seu plano agora. Você pode tentar novamente em instantes.',
        )
      }
    } catch {
      setMicroPlanError('Não foi possível montar seu plano agora. Tente novamente em instantes.')
    } finally {
      setMicroPlanLoading(false)
    }

    await loadTodayState()
  }

  function openCheckInDrawer(options?: {
    mood?: MentalHealthMoodLevelId | null
    step?: 1 | 2 | 3 | 4
  }) {
    guardAction(() => {
      setInitialDrawerMood(options?.mood ?? null)
      setInitialDrawerStep(options?.step ?? 1)
      setCheckInDrawerVisible(true)
    })
  }

  function handleCareCreateDailyPlan() {
    guardAction(() => {
      if (crisisBlocksPlan) {
        void openCrisisSupport()
        return
      }

      const answers = clinicalState?.anamnesis.answers_index ?? {}
      if (!isInitialAnamnesisComplete(answers)) {
        openAnamnesisDrawer('initial')
        return
      }

      if (!hasCheckInToday) {
        openCheckInDrawer()
      }
    })
  }

  function handleMoodSelect(mood: MentalHealthMoodLevelId) {
    guardAction(() => {
      openCheckInDrawer({ mood, step: 1 })
    })
  }

  function openAnamnesisDrawer(mode: AnamnesisDrawerMode = 'initial') {
    guardAction(() => {
      setAnamnesisDrawerMode(mode)
      setAnamnesisDrawerVisible(true)
    })
  }

  function handleFeelingBetter() {
    setCrisisRecoveryDrawerVisible(true)
  }

  async function handleConfirmCrisisRecovery() {
    const recoveredState = await recoverFromCrisisForReanamnesis(patientCpf)
    if (!recoveredState) return

    hasAutoOpenedAnamnesisRef.current = true

    unstable_batchedUpdates(() => {
      setClinicalState(recoveredState)
      setMicroPlan(null)
      setMicroPlanError(null)
      setAnamnesisDrawerMode('initial')
      setAnamnesisSessionKey((key) => key + 1)
      setAnamnesisDrawerVisible(true)
      setCrisisRecoveryDrawerVisible(false)
      setCrisisDrawerVisible(false)
    })

    void recalculateClinicalEngine(patientCpf, 'manual').then((result) => {
      setClinicalState(result.state)
      void loadTodayState()
    })
  }

  useEffect(() => {
    return () => {
      if (anamnesisRecalcTimerRef.current) {
        clearTimeout(anamnesisRecalcTimerRef.current)
      }
    }
  }, [])

  async function handlePersistAnamnesisAnswers(answers: Record<string, AnamnesisAnswerRecord>) {
    const state = await persistPartialAnamnesisAnswers(patientCpf, answers)
    setClinicalState(state)

    if (anamnesisRecalcTimerRef.current) {
      clearTimeout(anamnesisRecalcTimerRef.current)
    }

    anamnesisRecalcTimerRef.current = setTimeout(() => {
      void recalculateClinicalEngine(patientCpf, 'anamnesis').then((result) => {
        setClinicalState(result.state)
      })
    }, 500)
  }

  async function handleAnamnesisModuleComplete(
    _moduleId: string,
    moduleAnswers: Record<string, AnamnesisAnswerRecord>,
    completionRatio: number,
    completedModuleIds: string[],
  ) {
    const state = await mergeAnamnesisModuleAnswers(
      patientCpf,
      moduleAnswers,
      completionRatio,
      completedModuleIds,
    )
    setClinicalState(state)

    const result = await recalculateClinicalEngine(patientCpf, 'anamnesis')
    setClinicalState(result.state)
    await regenerateMicroPlanAfterClinicalUpdate(result.state)
  }

  async function handleAnamnesisComplete(
    allAnswers: Record<string, AnamnesisAnswerRecord>,
    completionRatio: number,
    completedModuleIds: string[],
  ) {
    hasAutoOpenedAnamnesisRef.current = true
    setAnamnesisDrawerVisible(false)

    const state = await mergeAnamnesisAnswersIntoClinicalState(
      patientCpf,
      allAnswers,
      completionRatio,
      completedModuleIds,
    )
    setClinicalState(state)
    const result = await recalculateClinicalEngine(patientCpf, 'anamnesis')
    setClinicalState(result.state)
    await maybeOpenCrisisFromClinicalState(result.state)
    await regenerateMicroPlanAfterClinicalUpdate(result.state)
  }

  async function handleOpenTodayPlan() {
    guardAction(() => {
      void (async () => {
        if (crisisBlocksPlan) {
          await openCrisisSupport()
          return
        }

        setMicroPlanDrawerVisible(true)
        if (microPlan) return

        const state = clinicalState ?? (await loadMentalHealthClinicalState(patientCpf))
        const today = toLocalDateIso(new Date())
        const rebuilt = state ? rebuildTodayPlanFromState(state, today) : null
        if (rebuilt) {
          setMicroPlan(rebuilt)
          return
        }

        await handleCreateMicroPlan()
      })()
    })
  }

  async function handleCreateMicroPlan() {
    guardAction(() => {
      void (async () => {
        const state = clinicalState ?? (await loadMentalHealthClinicalState(patientCpf))
        if (crisisBlocksPlan) {
          await openCrisisSupport({ state })
          return
        }

        if (!isInitialAnamnesisComplete(state?.anamnesis.answers_index ?? {})) {
          openAnamnesisDrawer('initial')
          return
        }

        setMicroPlanDrawerVisible(true)
        setMicroPlanLoading(true)
        setMicroPlanError(null)
        setMicroPlan(null)

        try {
          const result = await generateDailyMicroPlan(patientCpf)
          setClinicalState(result.state)
          if (
            shouldSurfaceCrisisConsideringCheckIn(
              result.state.active_red_flags,
              latestEntry?.mood ?? null,
              hasCheckInToday,
            ) &&
            (shouldBlockPlanConsideringCheckIn(
              result.state.active_red_flags,
              latestEntry?.mood ?? null,
              hasCheckInToday,
            ) ||
              result.plan?.blocked)
          ) {
            setMicroPlanDrawerVisible(false)
            await openCrisisSupport({ state: result.state })
            return
          }
          setMicroPlan(result.plan)
          await loadTodayState()
          if (!result.plan) {
            setMicroPlanError(
              'Complete as 11 perguntas iniciais para montarmos um plano personalizado.',
            )
          }
        } catch {
          setMicroPlanError('Não foi possível montar seu plano agora. Tente novamente em instantes.')
        } finally {
          setMicroPlanLoading(false)
        }
      })()
    })
  }

  async function handleActivityStart(activityId: string, planDate: string) {
    const state = await updateActivityHistoryEntry(patientCpf, activityId, planDate, {
      status: 'started',
    })
    if (state) {
      setClinicalState(state)
    }
  }

  function handleOpenActivitySession(activityId: string, planDate: string) {
    guardAction(() => {
      setCareDetailActivityId(null)
      setActivitySession({ activityId, planDate })
    })
  }

  async function handleStartCareActivity(activityId: string) {
    guardAction(() => {
      void (async () => {
        if (crisisBlocksPlan) {
          await openCrisisSupport()
          return
        }

        const notHelpfulIds = getNotHelpfulActivityIds(clinicalState?.activity_history ?? [])
        const redFlagIds = getActiveRedFlagIds(clinicalState?.active_red_flags ?? [])
        if (isCatalogActivityBlocked(activityId, redFlagIds, notHelpfulIds)) {
          return
        }

        const state = await ensureActivityHistoryEntry(patientCpf, activityId, todayIso)
        if (state) {
          setClinicalState(state)
        }
        handleOpenActivitySession(activityId, todayIso)
      })()
    })
  }

  async function handleToggleActivityFavorite(activityId: string) {
    const next = await toggleMentalHealthActivityFavorite(patientCpf, activityId)
    setFavoriteActivityIds(next)
  }

  function handleCloseActivitySession() {
    setActivitySession(null)
    void loadTodayState()
  }

  async function handleActivityComplete(activityId: string, planDate: string) {
    const state = await updateActivityHistoryEntry(patientCpf, activityId, planDate, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    if (state) {
      setClinicalState(state)
      await loadTodayState()
    }
  }

  async function handleActivityFeedback(
    activityId: string,
    planDate: string,
    feedback: ActivityFeedbackKey,
  ) {
    const state = await submitActivityFeedbackAndRecalc(
      patientCpf,
      activityId,
      planDate,
      feedback,
    )
    if (state) {
      setClinicalState(state)
      await loadTodayState()
    }
  }

  function openCheckInRecord(entry: MentalHealthCheckInEntry | null) {
    guardAction(() => {
      if (!entry) return
      setCheckInRecordEntry(entry)
    })
  }

  async function handleSaveJournal(note: string) {
    guardAction(() => {
      void (async () => {
        const daily = journalDaily ?? (await loadMentalHealthDailyRecord(patientCpf))
        const nextDaily: MentalHealthDailyRecord = {
          ...daily,
          journalEntryToday: true,
          journalNote: note,
        }
        await saveMentalHealthDailyRecord(patientCpf, nextDaily)
        setJournalDaily(nextDaily)
        await loadTodayState()
      })()
    })
  }

  const showSegmentChrome =
    !checkInDrawerVisible && !crisisDrawerVisible && !activitySession

  const showBibleFab =
    showSegmentChrome && hasChristianSpiritualContent(onboardingRecord.preferences)

  const spiritualFabBottom = TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 8) + 12

  const scrollSegmentPagerTo = useCallback(
    (tab: MentalHealthTab, animated = true) => {
      const index = MENTAL_HEALTH_SEGMENT_PAGES.indexOf(tab)
      if (index < 0) return

      segmentPagerProgrammaticScrollRef.current = animated
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
    (tab: MentalHealthTab) => {
      setSegmentTab(tab)
      scrollSegmentPagerTo(tab)
    },
    [scrollSegmentPagerTo],
  )

  const handleSegmentPagerIndexChange = useCallback(
    (nextIndex: number, options?: { haptic?: boolean }) => {
      const clampedIndex = Math.min(
        Math.max(nextIndex, 0),
        MENTAL_HEALTH_SEGMENT_PAGES.length - 1,
      )
      const nextTab = MENTAL_HEALTH_SEGMENT_PAGES[clampedIndex] ?? 'today'

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

  const renderSegmentPage = useCallback(
    (tab: MentalHealthTab) => {
      if (tab === 'today') {
        if (!todayState || !journey || checkInDrawerVisible || crisisDrawerVisible) {
          return <View style={styles.segmentPageFill} />
        }

        return (
          <MentalHealthTodayTab
            bottomPadding={bottomPadding}
            todayState={todayState}
            journey={journey}
            crisisBlocksPlan={crisisBlocksPlan}
            microPlanLoading={microPlanLoading}
            microPlanError={microPlanError}
            onStartInitialAnamnesis={() => openAnamnesisDrawer('initial')}
            onStartExtendedAnamnesis={() => openAnamnesisDrawer('extended')}
            onQuickMoodSelect={handleMoodSelect}
            onViewRecentRecords={() => guardAction(() => setRecentDrawerVisible(true))}
            onViewTodayRecord={() => openCheckInRecord(latestEntry)}
            onExplainMessage={() => setMessageExplainDrawerVisible(true)}
            onOpenHowItWorks={() => setMyCareHowItWorksVisible(true)}
            onCreateMicroPlan={() => void handleCreateMicroPlan()}
            onOpenTodayPlan={() => void handleOpenTodayPlan()}
            onOpenCrisisSupport={() => void openCrisisSupport()}
            onFeelingBetter={crisisBlocksPlan ? handleFeelingBetter : undefined}
          />
        )
      }

      if (tab === 'care') {
        return (
          <MentalHealthCareTab
            bottomPadding={bottomPadding}
            planDate={todayIso}
            microPlan={microPlan}
            microPlanLoading={microPlanLoading}
            hasCheckInToday={hasCheckInToday}
            todayCheckIn={hasCheckInToday ? latestEntry : null}
            activityHistory={clinicalState?.activity_history ?? []}
            crisisBlocksPlan={crisisBlocksPlan}
            onCreateDailyPlan={handleCareCreateDailyPlan}
            onOpenActivityDetail={setCareDetailActivityId}
            onStartActivity={(activityId) => void handleStartCareActivity(activityId)}
            onOpenCrisisSupport={() => void openCrisisSupport()}
            onFeelingBetter={crisisBlocksPlan ? handleFeelingBetter : undefined}
          />
        )
      }

      return (
        <MentalHealthMyCareTab
          bottomPadding={bottomPadding}
          clinicalState={clinicalState}
          checkInEntries={recentEntries}
          journalHasEntryToday={journalDaily?.journalEntryToday ?? false}
          journalNote={journalDaily?.journalNote}
          onViewAllCheckIns={() => guardAction(() => setRecentDrawerVisible(true))}
          onSelectCheckIn={openCheckInRecord}
          onOpenJournal={() => guardAction(() => setJournalDrawerVisible(true))}
        />
      )
    },
    [
      bottomPadding,
      checkInDrawerVisible,
      clinicalState,
      crisisBlocksPlan,
      crisisRecoveryMode,
      crisisDrawerVisible,
      extendedProgress.isComplete,
      extendedProgress.percent,
      favoriteActivityIds,
      handleCareCreateDailyPlan,
      hasCheckInToday,
      initialProgress.percent,
      journalDaily?.journalEntryToday,
      journalDaily?.journalNote,
      journey,
      latestEntry,
      microPlan,
      microPlanError,
      microPlanLoading,
      onboardingRecord,
      recentEntries,
      todayIso,
      todayState,
    ],
  )

  return (
    <View style={styles.root}>
      {showSegmentChrome ? (
        <RunWalkSegmentTabs
          activeTab={segmentTab}
          onChange={handleSegmentTabChange}
          tabs={MENTAL_HEALTH_SEGMENT_TABS}
        />
      ) : null}

      <FlatList
        ref={segmentPagerRef}
        data={MENTAL_HEALTH_SEGMENT_PAGES}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        scrollEnabled={showSegmentChrome}
        nestedScrollEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleSegmentPagerScroll}
        onMomentumScrollEnd={handleSegmentPagerScrollEnd}
        onScrollEndDrag={handleSegmentPagerScrollEnd}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        style={styles.segmentPager}
        renderItem={({ item }) => (
          <View style={[styles.segmentPage, { width: screenWidth }]}>{renderSegmentPage(item)}</View>
        )}
      />

      <MentalHealthCheckInDrawer
        visible={checkInDrawerVisible}
        initialMood={initialDrawerMood}
        initialStep={initialDrawerStep}
        onClose={() => setCheckInDrawerVisible(false)}
        onSave={(input) => handleSaveCheckIn(input)}
      />

      <MentalHealthAnamnesisDrawer
        key={anamnesisSessionKey}
        visible={anamnesisDrawerVisible}
        mode={anamnesisDrawerMode}
        initialAnswers={clinicalState?.anamnesis.answers_index ?? {}}
        onClose={() => setAnamnesisDrawerVisible(false)}
        onModuleComplete={handleAnamnesisModuleComplete}
        onComplete={handleAnamnesisComplete}
        onPersistAnswers={handlePersistAnamnesisAnswers}
      />

      <MentalHealthCheckInRecordDrawer
        visible={checkInRecordEntry != null}
        entry={checkInRecordEntry}
        onClose={() => setCheckInRecordEntry(null)}
      />

      <MentalHealthMessageExplainDrawer
        visible={messageExplainDrawerVisible}
        hasRecommendedActivity={hasTodayPlan}
        onClose={() => setMessageExplainDrawerVisible(false)}
        onViewRecommendedActivity={() => {
          setMessageExplainDrawerVisible(false)
          void handleOpenTodayPlan()
        }}
      />

      <MentalHealthRecentCheckInsDrawer
        visible={recentDrawerVisible}
        entries={recentEntries}
        onClose={() => setRecentDrawerVisible(false)}
        onSelectEntry={(entry) => {
          setRecentDrawerVisible(false)
          openCheckInRecord(entry)
        }}
      />

      <MentalHealthPreferencesDrawer
        visible={preferencesDrawerVisible}
        patientCpf={patientCpf}
        initialRecord={onboardingRecord}
        onClose={() => setPreferencesDrawerVisible(false)}
        onSaved={(record, state) => {
          setOnboardingRecord(record)
          if (state) setClinicalState(state)
          void regenerateMicroPlanAfterClinicalUpdate(state)
        }}
      />

      <MentalHealthJournalDrawer
        visible={journalDrawerVisible}
        prompt="O que mais ocupou seus pensamentos hoje?"
        initialNote={journalDaily?.journalNote}
        onClose={() => setJournalDrawerVisible(false)}
        onSave={handleSaveJournal}
      />

      <MentalHealthHowItWorksDrawer
        visible={myCareHowItWorksVisible}
        onClose={() => setMyCareHowItWorksVisible(false)}
      />

      <MentalHealthPrivacyPolicyDrawer
        visible={myCarePolicyVisible}
        onClose={() => setMyCarePolicyVisible(false)}
      />

      <MentalHealthSettingsDrawer
        visible={settingsVisible}
        onClose={() => onSettingsVisibleChange?.(false)}
        preferences={preferencesSummary}
        initialAnamnesisPercent={initialProgress.percent}
        extendedAnamnesisPercent={extendedProgress.percent}
        extendedAnamnesisComplete={extendedProgress.isComplete}
        onEditPreferences={() => setPreferencesDrawerVisible(true)}
        onContinueExtendedAnamnesis={() => openAnamnesisDrawer('extended')}
        onOpenHowItWorks={() => setMyCareHowItWorksVisible(true)}
        onOpenPrivacyPolicy={() => setMyCarePolicyVisible(true)}
        onOpenCrisisSupport={() => void openCrisisSupport()}
      />

      <MentalHealthMicroPlanDrawer
        visible={microPlanDrawerVisible}
        loading={microPlanLoading}
        plan={microPlan}
        errorMessage={microPlanError}
        activityHistory={clinicalState?.activity_history ?? []}
        onClose={() => setMicroPlanDrawerVisible(false)}
        onActivityStart={handleOpenActivitySession}
        onActivityFeedback={handleActivityFeedback}
        onOpenCrisisSupport={() => void openCrisisSupport()}
      />

      <MentalHealthActivityDetailDrawer
        visible={careDetailActivityId != null}
        activityId={careDetailActivityId}
        isFavorite={
          careDetailActivityId != null && favoriteActivityIds.includes(careDetailActivityId)
        }
        blockedByCrisis={crisisBlocksPlan}
        onClose={() => setCareDetailActivityId(null)}
        onToggleFavorite={() => {
          if (!careDetailActivityId) return
          void handleToggleActivityFavorite(careDetailActivityId)
        }}
        onStart={() => {
          if (!careDetailActivityId) return
          void handleStartCareActivity(careDetailActivityId)
        }}
        onOpenCrisisSupport={() => {
          setCareDetailActivityId(null)
          void openCrisisSupport()
        }}
      />

      <MentalHealthActivitySession
        visible={activitySession != null}
        activityId={activitySession?.activityId ?? ''}
        planDate={activitySession?.planDate ?? todayIso}
        onClose={handleCloseActivitySession}
        onNotFeelingWell={() => void openCrisisSupport()}
        onStarted={handleActivityStart}
        onCompleted={handleActivityComplete}
        onFeedback={handleActivityFeedback}
      />

      <MentalHealthCrisisDrawer
        visible={crisisDrawerVisible}
        presentation={crisisPresentation}
        onClose={() => setCrisisDrawerVisible(false)}
        onAcknowledge={() => setCrisisDrawerVisible(false)}
        onOpenEmergencyContacts={openEmergencyContactsDrawer}
      />

      <MentalHealthCrisisRecoveryDrawer
        visible={crisisRecoveryDrawerVisible}
        mode={crisisRecoveryMode}
        onClose={() => setCrisisRecoveryDrawerVisible(false)}
        onConfirm={() => void handleConfirmCrisisRecovery()}
        onOpenCrisisSupport={() => {
          setCrisisRecoveryDrawerVisible(false)
          void openCrisisSupport()
        }}
      />

      <MentalHealthEmergencyContactsDrawer
        visible={emergencyContactsDrawerVisible}
        onClose={closeEmergencyContactsDrawer}
      />

      {showBibleFab ? (
        <SpiritualModuleFab
          bottom={spiritualFabBottom}
          variant="bible"
          onPress={() => navigateTo('bible')}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  segmentPager: {
    flex: 1,
  },
  segmentPage: {
    flex: 1,
  },
  segmentPageFill: {
    flex: 1,
  },
})
