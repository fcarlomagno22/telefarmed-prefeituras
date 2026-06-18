import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { getMockMentalHealthTodayState } from '../../data/mockMentalHealthToday'
import {
  hasMentalHealthSufficientHistory,
  loadMentalHealthDailyRecord,
} from '../../data/mentalHealthDailyStorage'
import {
  loadMentalHealthCheckInCardData,
  loadMentalHealthCheckInEntries,
  saveMentalHealthCheckInEntry,
  seedMockMentalHealthCheckInHistory,
} from '../../data/mentalHealthCheckInStorage'
import {
  loadMentalHealthClinicalState,
  mergeAnamnesisAnswersIntoClinicalState,
  mergeAnamnesisModuleAnswers,
  persistPartialAnamnesisAnswers,
  updateActivityHistoryEntry,
} from '../../data/mentalHealthClinicalStateStorage'
import {
  MENTAL_HEALTH_SEGMENT_TABS,
  type MentalHealthCheckInEntry,
  type MentalHealthCheckInSaveInput,
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
  submitActivityFeedbackAndRecalc,
} from '../../mentalHealthEngine'
import type { ActivityFeedbackKey } from '../../mentalHealthEngine/renderCopyEngine'
import type { DailyMicroPlan } from '../../types/mentalHealthEngine'
import { resolveMentalHealthJourney } from '../../utils/mentalHealthJourney'
import {
  computeExtendedAnamnesisProgress,
  computeInitialAnamnesisProgress,
  isInitialAnamnesisComplete,
  type AnamnesisDrawerMode,
} from '../../utils/mentalHealthAnamnesisCore'
import { toLocalDateIso } from '../../utils/runWalkWeeklyChart'
import { RunWalkSegmentTabs } from '../runWalk/RunWalkSegmentTabs'
import { MentalHealthAnamnesisDrawer } from './MentalHealthAnamnesisDrawer'
import { MentalHealthCheckInDrawer } from './MentalHealthCheckInDrawer'
import { MentalHealthCheckInRecordDrawer } from './MentalHealthCheckInRecordDrawer'
import { MentalHealthPlaceholderTab } from './MentalHealthPlaceholderTab'
import { MentalHealthRecentCheckInsDrawer } from './MentalHealthRecentCheckInsDrawer'
import { MentalHealthTodayTab } from './MentalHealthTodayTab'
import { MentalHealthMicroPlanDrawer } from './MentalHealthMicroPlanDrawer'

type MentalHealthHomeContentProps = {
  bottomPadding: number
  patientCpf: string
  record: MentalHealthOnboardingRecord
  refreshKey?: number
  clinicalStateSeed?: UserClinicalState | null
}

export function MentalHealthHomeContent({
  bottomPadding,
  patientCpf,
  record: _record,
  refreshKey = 0,
  clinicalStateSeed = null,
}: MentalHealthHomeContentProps) {
  const [segmentTab, setSegmentTab] = useState<MentalHealthTab>('today')
  const [todayState, setTodayState] = useState<MentalHealthTodayState | null>(null)
  const [recentEntries, setRecentEntries] = useState<MentalHealthCheckInEntry[]>([])
  const [clinicalState, setClinicalState] = useState<UserClinicalState | null>(null)
  const [anamnesisDrawerMode, setAnamnesisDrawerMode] = useState<AnamnesisDrawerMode>('initial')

  const [checkInDrawerVisible, setCheckInDrawerVisible] = useState(false)
  const [initialDrawerMood, setInitialDrawerMood] = useState<MentalHealthMoodLevelId | null>(null)
  const [initialDrawerStep, setInitialDrawerStep] = useState<1 | 2 | 3 | 4>(1)
  const [recordDrawerVisible, setRecordDrawerVisible] = useState(false)
  const [recentDrawerVisible, setRecentDrawerVisible] = useState(false)
  const [anamnesisDrawerVisible, setAnamnesisDrawerVisible] = useState(false)
  const [microPlanDrawerVisible, setMicroPlanDrawerVisible] = useState(false)
  const [microPlanLoading, setMicroPlanLoading] = useState(false)
  const [microPlan, setMicroPlan] = useState<DailyMicroPlan | null>(null)
  const [microPlanError, setMicroPlanError] = useState<string | null>(null)
  const anamnesisRecalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadTodayState = useCallback(async () => {
    await seedMockMentalHealthCheckInHistory(patientCpf)

    const [daily, hasHistory, checkInCard, entries, state] = await Promise.all([
      loadMentalHealthDailyRecord(patientCpf),
      hasMentalHealthSufficientHistory(patientCpf),
      loadMentalHealthCheckInCardData(patientCpf),
      loadMentalHealthCheckInEntries(patientCpf),
      loadMentalHealthClinicalState(patientCpf),
    ])

    setRecentEntries(entries)
    setClinicalState(state)

    const today = toLocalDateIso(new Date())
    if (state && state.plan_state.last_plan_date === today && !state.plan_state.last_plan_blocked) {
      setMicroPlan(rebuildTodayPlanFromState(state, today))
    }

    setTodayState(
      getMockMentalHealthTodayState({
        checkInCard,
        hasSufficientHistory: hasHistory,
        journalEntryToday: daily.journalEntryToday,
      }),
    )
  }, [patientCpf])

  useEffect(() => {
    if (!clinicalStateSeed) return
    setClinicalState(clinicalStateSeed)
  }, [clinicalStateSeed])

  useEffect(() => {
    if (segmentTab !== 'today') return
    void loadTodayState()
  }, [loadTodayState, refreshKey, segmentTab])

  const latestEntry = todayState?.checkInCard.latestEntry ?? null
  const todayIso = toLocalDateIso(new Date())

  const todayPlanActivities =
    clinicalState?.activity_history.filter((entry) => entry.plan_date === todayIso) ?? []
  const hasTodayPlan =
    clinicalState?.plan_state.last_plan_date === todayIso &&
    !clinicalState.plan_state.last_plan_blocked &&
    todayPlanActivities.length > 0

  const answersIndex = clinicalState?.anamnesis.answers_index ?? {}
  const initialProgress = computeInitialAnamnesisProgress(answersIndex)
  const extendedProgress = computeExtendedAnamnesisProgress(answersIndex)

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
      })
    : null

  function openCheckInDrawer(options?: {
    mood?: MentalHealthMoodLevelId | null
    step?: 1 | 2 | 3 | 4
  }) {
    setInitialDrawerMood(options?.mood ?? null)
    setInitialDrawerStep(options?.step ?? 1)
    setCheckInDrawerVisible(true)
  }

  async function handleSaveCheckIn(input: MentalHealthCheckInSaveInput) {
    await saveMentalHealthCheckInEntry(patientCpf, input)
    const result = await recalculateClinicalEngine(patientCpf, 'check_in')
    setClinicalState(result.state)
    await loadTodayState()
  }

  function handleMoodSelect(mood: MentalHealthMoodLevelId) {
    openCheckInDrawer({ mood, step: 1 })
  }

  function openAnamnesisDrawer(mode: AnamnesisDrawerMode = 'initial') {
    setAnamnesisDrawerMode(mode)
    setAnamnesisDrawerVisible(true)
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
    await loadTodayState()
  }

  async function handleAnamnesisComplete(
    allAnswers: Record<string, AnamnesisAnswerRecord>,
    completionRatio: number,
    completedModuleIds: string[],
  ) {
    const state = await mergeAnamnesisAnswersIntoClinicalState(
      patientCpf,
      allAnswers,
      completionRatio,
      completedModuleIds,
    )
    setClinicalState(state)
    const result = await recalculateClinicalEngine(patientCpf, 'anamnesis')
    setClinicalState(result.state)
    await loadTodayState()
    setAnamnesisDrawerVisible(false)
  }

  async function handleOpenTodayPlan() {
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
  }

  async function handleCreateMicroPlan() {
    const state = clinicalState ?? (await loadMentalHealthClinicalState(patientCpf))
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

  return (
    <View style={styles.root}>
      <RunWalkSegmentTabs
        activeTab={segmentTab}
        onChange={setSegmentTab}
        tabs={MENTAL_HEALTH_SEGMENT_TABS}
      />

      {segmentTab === 'today' && todayState && journey ? (
        <MentalHealthTodayTab
          bottomPadding={bottomPadding}
          todayState={todayState}
          journey={journey}
          onStartExtendedAnamnesis={() => openAnamnesisDrawer('extended')}
          onQuickMoodSelect={handleMoodSelect}
          onAnswerQuickQuestions={() =>
            openCheckInDrawer({ mood: latestEntry?.mood ?? null, step: 2 })
          }
          onViewRecentRecords={() => setRecentDrawerVisible(true)}
          onCreateMicroPlan={() => void handleCreateMicroPlan()}
          onOpenTodayPlan={() => void handleOpenTodayPlan()}
          onTalkPress={() => {}}
        />
      ) : null}

      {segmentTab === 'care' ? (
        <MentalHealthPlaceholderTab
          title="Cuidar"
          description="Atividades guiadas, exercícios e conteúdos para o seu momento estarão disponíveis aqui."
          bottomPadding={bottomPadding}
        />
      ) : null}

      {segmentTab === 'my-care' ? (
        <MentalHealthPlaceholderTab
          title="Meu cuidado"
          description="Seu histórico, plano personalizado e preferências de acompanhamento ficarão nesta aba."
          bottomPadding={bottomPadding}
        />
      ) : null}

      <MentalHealthCheckInDrawer
        visible={checkInDrawerVisible}
        initialMood={initialDrawerMood}
        initialStep={initialDrawerStep}
        onClose={() => setCheckInDrawerVisible(false)}
        onSave={(input) => handleSaveCheckIn(input)}
      />

      <MentalHealthAnamnesisDrawer
        visible={anamnesisDrawerVisible}
        mode={anamnesisDrawerMode}
        initialAnswers={clinicalState?.anamnesis.answers_index ?? {}}
        onClose={() => setAnamnesisDrawerVisible(false)}
        onModuleComplete={handleAnamnesisModuleComplete}
        onComplete={handleAnamnesisComplete}
        onPersistAnswers={handlePersistAnamnesisAnswers}
      />

      <MentalHealthCheckInRecordDrawer
        visible={recordDrawerVisible}
        entry={latestEntry}
        onClose={() => setRecordDrawerVisible(false)}
      />

      <MentalHealthRecentCheckInsDrawer
        visible={recentDrawerVisible}
        entries={recentEntries}
        onClose={() => setRecentDrawerVisible(false)}
      />

      <MentalHealthMicroPlanDrawer
        visible={microPlanDrawerVisible}
        loading={microPlanLoading}
        plan={microPlan}
        errorMessage={microPlanError}
        activityHistory={clinicalState?.activity_history ?? []}
        onClose={() => setMicroPlanDrawerVisible(false)}
        onActivityComplete={handleActivityComplete}
        onActivityFeedback={handleActivityFeedback}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})
