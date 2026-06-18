import type { MentalHealthCheckInEntry, MentalHealthOnboardingPreferences } from '../types/mentalHealth'
import type {
  DailyMicroPlan,
  EngineRunInput,
  EngineRunResult,
  UserClinicalState,
} from '../types/mentalHealthEngine'
import { isInitialAnamnesisComplete } from '../utils/mentalHealthAnamnesisCore'
import { ENGINE_CONTENT_VERSION, engineContent } from './content/loadEngineContent'
import {
  buildSymptomScoresFromAnamnesis,
  computeAnamnesisCompletion,
  computeDerivedMetrics,
  computeInstrumentScores,
  enrichSymptomScoresFromCheckIn,
} from './anamnesisScoring'
import { assembleDailyPlan } from './assembleDailyPlan'
import { selectDailyActivities } from './selectDailyActivities'
import { runHypothesisEngine } from './runHypothesisEngine'
import { runRedFlagEngine, shouldBlockMicroPlan } from './runRedFlags'
import { runScoringRules } from './runScoringRules'
import { loadMentalHealthClinicalState, saveMentalHealthClinicalState } from '../data/mentalHealthClinicalStateStorage'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

function createInitialClinicalState(patientCpf: string): UserClinicalState {
  const now = new Date().toISOString()
  return {
    user_id: patientCpf,
    engine_version: ENGINE_CONTENT_VERSION,
    created_at: now,
    updated_at: now,
    anamnesis: {
      completion_ratio: 0,
      completed_module_ids: [],
      completed_at: null,
      answers_index: {},
      last_updated_at: null,
    },
    symptom_scores: {},
    derived_metrics: {},
    instrument_scores: {},
    track_scores_raw: {},
    active_hypotheses: [],
    primary_track_id: null,
    secondary_track_ids: [],
    evidence_log: [],
    active_red_flags: [],
    risk_events: [],
    plan_state: {
      last_plan_date: null,
      last_plan_generated_at: null,
      last_plan_blocked: false,
      last_block_reason: null,
      current_plan_id: null,
      adherence_7d: 0,
      completed_yesterday: false,
    },
    activity_history: [],
    profile_snapshot: {
      care_focus: [],
      spirituality_preference: null,
      tracking_frequency: null,
      captured_at: null,
    },
    data_completeness: {
      anamnesis_ratio: 0,
      valid_instruments_count: 0,
      symptoms_scored_count: 0,
      check_ins_7d_count: 0,
      sufficient_for_hypothesis: false,
      sufficient_for_plan: false,
    },
    recalc_meta: {
      last_engine_run_at: null,
      last_engine_run_trigger: null,
      rules_version: engineContent.scoringRules.version,
      content_version: ENGINE_CONTENT_VERSION,
    },
  }
}

function getLatestCheckIn(entries: MentalHealthCheckInEntry[]) {
  const today = toLocalDateIso(new Date())
  return entries.find((entry) => toLocalDateIso(new Date(entry.recordedAt)) === today) ?? entries[0] ?? null
}

function buildCheckInSummary7d(entries: MentalHealthCheckInEntry[]) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = entries.filter((entry) => new Date(entry.recordedAt).getTime() >= cutoff)
  return {
    completed_days: new Set(recent.map((entry) => toLocalDateIso(new Date(entry.recordedAt)))).size,
    mood_counts: recent.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] ?? 0) + 1
      return acc
    }, {}),
    anxiety_days: recent.filter((entry) =>
      entry.emotions.some((emotion) => ['Preocupado', 'Frustrado', 'Sobrecarregado'].includes(emotion)),
    ).length,
  }
}

function computeAdherence(history: UserClinicalState['activity_history']) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const assigned = history.filter((entry) => new Date(entry.assigned_at).getTime() >= cutoff)
  if (!assigned.length) return 0
  const completed = assigned.filter((entry) => entry.status === 'completed').length
  return completed / assigned.length
}

function buildEngineContext(input: {
  state: UserClinicalState
  checkInEntries: MentalHealthCheckInEntry[]
  onboardingPreferences: MentalHealthOnboardingPreferences
  latestCheckIn: MentalHealthCheckInEntry | null
}) {
  const checkIn7d = buildCheckInSummary7d(input.checkInEntries)
  const helpfulIds = input.state.activity_history
    .filter((entry) => entry.feedback === 'helpful')
    .map((entry) => entry.activity_id)
  const completedIds = input.state.activity_history.map((entry) => entry.activity_id)
  const notHelpfulIds = input.state.activity_history
    .filter((entry) => entry.feedback === 'not_helpful')
    .map((entry) => entry.activity_id)

  const isFirstPlan = !input.state.plan_state.last_plan_date

  return {
    symptom_scores: input.state.symptom_scores,
    derived_metrics: input.state.derived_metrics,
    instrument_scores: input.state.instrument_scores,
    track_scores_raw: input.state.track_scores_raw,
    track_tier: Object.fromEntries(
      input.state.active_hypotheses.map((hypothesis) => [hypothesis.track, hypothesis.tier]),
    ),
    evidence_tags: input.state.evidence_log.map((entry) => entry.evidence_tag),
    active_red_flags: input.state.active_red_flags,
    anamnesis_answers: input.state.anamnesis.answers_index,
    data_completeness: input.state.data_completeness,
    today_mood: input.latestCheckIn?.mood,
    today_emotions: input.latestCheckIn?.emotions ?? [],
    today_emotion_intensity: input.latestCheckIn?.emotionIntensity ?? undefined,
    today_influences: input.latestCheckIn?.mainInfluence ? [input.latestCheckIn.mainInfluence] : [],
    today_influence_valence: input.latestCheckIn?.influenceValence ?? undefined,
    today_reactions: input.latestCheckIn?.reactions ?? [],
    primary_track_id: input.state.primary_track_id,
    active_hypotheses_count: input.state.active_hypotheses.filter(
      (item) => item.tier !== 'insufficient_data',
    ).length,
    is_first_plan: isFirstPlan,
    history: {
      adherence_7d: input.state.plan_state.adherence_7d,
      helpful_activity_ids: helpfulIds,
      completed_activity_ids: completedIds,
      not_helpful_activity_ids: notHelpfulIds,
      days_since_last_completion: 0,
    },
    profile: {
      careFocus: input.onboardingPreferences.careFocus ?? [],
      spiritualityPreference: input.onboardingPreferences.spiritualityPreference,
    },
    check_in_days_in_last_7: {
      default: checkIn7d.completed_days,
      check_in_high_anxiety_today: checkIn7d.anxiety_days,
    },
  }
}

function recalculateClinicalScores(
  state: UserClinicalState,
  checkInEntries: MentalHealthCheckInEntry[],
  onboardingPreferences: MentalHealthOnboardingPreferences,
) {
  const symptomScores = buildSymptomScoresFromAnamnesis(state.anamnesis.answers_index)
  enrichSymptomScoresFromCheckIn(symptomScores, getLatestCheckIn(checkInEntries))
  const derivedMetrics = computeDerivedMetrics(symptomScores, state.anamnesis.answers_index)
  const instrumentScores = computeInstrumentScores(state.anamnesis.answers_index)
  const anamnesisCompletion = computeAnamnesisCompletion(state.anamnesis.answers_index)

  const symptomsScoredCount = Object.keys(symptomScores).length
  const validInstrumentsCount = Object.values(instrumentScores).filter((item) => item.valid).length
  const checkIns7d = buildCheckInSummary7d(checkInEntries).completed_days

  const dataCompleteness = {
    anamnesis_ratio: anamnesisCompletion.completion_ratio,
    valid_instruments_count: validInstrumentsCount,
    symptoms_scored_count: symptomsScoredCount,
    check_ins_7d_count: checkIns7d,
    sufficient_for_hypothesis:
      anamnesisCompletion.completion_ratio >=
        (engineContent.hypothesisEngine.global_settings.minimum_anamnesis_completion_ratio ?? 0.6) &&
      validInstrumentsCount >= (engineContent.hypothesisEngine.global_settings.minimum_instruments_valid ?? 3) &&
      symptomsScoredCount >= (engineContent.hypothesisEngine.global_settings.minimum_symptoms_scored ?? 10),
    sufficient_for_plan: isInitialAnamnesisComplete(state.anamnesis.answers_index),
  }

  const baseCtx = {
    symptom_scores: symptomScores,
    derived_metrics: derivedMetrics,
    instrument_scores: instrumentScores,
    anamnesis_answers: state.anamnesis.answers_index,
    data_completeness: dataCompleteness,
  }

  const scoringResult = runScoringRules(baseCtx)
  const redFlags = runRedFlagEngine(baseCtx, state.active_red_flags)
  for (const redFlagId of scoringResult.redFlagIds) {
    if (!redFlags.some((flag) => flag.red_flag_id === redFlagId)) {
      redFlags.push({
        red_flag_id: redFlagId,
        severity: 'S2',
        triggered_at: new Date().toISOString(),
        trigger_rule_id: 'scoring_rules',
        status: 'open',
        resolved_at: null,
      })
    }
  }

  const hypothesisCtx = {
    ...baseCtx,
    track_scores_raw: scoringResult.trackScores,
    evidence_tags: scoringResult.evidenceTags,
    evidence_count: scoringResult.evidenceTags.length,
  }

  const hypothesisResult = runHypothesisEngine({
    trackScores: scoringResult.trackScores,
    evidenceTags: scoringResult.evidenceTags,
    dataComplete: dataCompleteness.sufficient_for_hypothesis,
    ctx: hypothesisCtx,
  })

  return {
    symptomScores,
    derivedMetrics,
    instrumentScores,
    anamnesisCompletion,
    dataCompleteness,
    scoringResult,
    redFlags,
    hypothesisResult,
  }
}

export async function runClinicalEngine(input: EngineRunInput): Promise<EngineRunResult> {
  const existing = await loadMentalHealthClinicalState(input.patientCpf)
  const state = existing ?? createInitialClinicalState(input.patientCpf)
  const latestCheckIn = getLatestCheckIn(input.checkInEntries)

  state.profile_snapshot = {
    care_focus: input.onboardingPreferences.careFocus ?? [],
    spirituality_preference: input.onboardingPreferences.spiritualityPreference,
    tracking_frequency: input.onboardingPreferences.trackingFrequency,
    captured_at: new Date().toISOString(),
  }
  state.plan_state.adherence_7d = computeAdherence(state.activity_history)

  const recalculated = recalculateClinicalScores(state, input.checkInEntries, input.onboardingPreferences)

  state.anamnesis.completion_ratio = recalculated.anamnesisCompletion.completion_ratio
  state.anamnesis.completed_module_ids = recalculated.anamnesisCompletion.completed_module_ids
  state.symptom_scores = recalculated.symptomScores
  state.derived_metrics = recalculated.derivedMetrics
  state.instrument_scores = recalculated.instrumentScores
  state.track_scores_raw = recalculated.scoringResult.trackScores
  state.evidence_log = [
    ...state.evidence_log.slice(-180),
    ...recalculated.scoringResult.evidenceLog,
  ]
  state.active_red_flags = recalculated.redFlags
  state.active_hypotheses = recalculated.hypothesisResult.hypotheses
  state.primary_track_id = recalculated.hypothesisResult.primaryTrackId
  state.secondary_track_ids = recalculated.hypothesisResult.secondaryTrackIds
  state.data_completeness = recalculated.dataCompleteness
  state.recalc_meta = {
    last_engine_run_at: new Date().toISOString(),
    last_engine_run_trigger: input.trigger,
    rules_version: engineContent.scoringRules.version,
    content_version: ENGINE_CONTENT_VERSION,
  }
  state.updated_at = new Date().toISOString()
  if (!state.created_at) state.created_at = state.updated_at

  let plan: DailyMicroPlan | null = null

  if (input.generatePlan) {
    const ctx = buildEngineContext({
      state,
      checkInEntries: input.checkInEntries,
      onboardingPreferences: input.onboardingPreferences,
      latestCheckIn,
    })

    const selection = selectDailyActivities(ctx, state.active_red_flags)
    const blocked = selection.blocked || shouldBlockMicroPlan(state.active_red_flags)
    const blockReason = blocked
      ? shouldBlockMicroPlan(state.active_red_flags)
        ? 'red_flag'
        : 'insufficient_data'
      : null

    plan = assembleDailyPlan({
      planDate: toLocalDateIso(new Date()),
      ctx,
      selected: selection.activities,
      blocked,
      blockReason,
      rulesFired: selection.rulesFired,
      primaryTrackId: state.primary_track_id,
    })

    const planId = `plan-${Date.now()}`
    state.plan_state.last_plan_date = plan.plan_date
    state.plan_state.last_plan_generated_at = plan.generated_at
    state.plan_state.last_plan_blocked = plan.blocked
    state.plan_state.last_block_reason = plan.block_reason
    state.plan_state.current_plan_id = planId

    if (!plan.blocked) {
      for (const activity of plan.activities) {
        state.activity_history.push({
          activity_id: activity.activity_id,
          plan_id: planId,
          plan_date: plan.plan_date,
          slot: activity.slot,
          status: 'assigned',
          assigned_at: plan.generated_at,
          completed_at: null,
          duration_actual_sec: null,
          feedback: null,
          feedback_at: null,
          matched_rule_id: activity.matched_rule_id,
        })
      }
    }
  }

  await saveMentalHealthClinicalState(input.patientCpf, state)

  return { state, plan }
}

export async function recalculateClinicalEngine(
  patientCpf: string,
  trigger: EngineRunInput['trigger'],
) {
  const { loadMentalHealthCheckInEntries } = await import('../data/mentalHealthCheckInStorage')
  const { loadMentalHealthOnboardingRecord } = await import('../data/mentalHealthOnboardingStorage')

  const [checkInEntries, onboarding] = await Promise.all([
    loadMentalHealthCheckInEntries(patientCpf),
    loadMentalHealthOnboardingRecord(patientCpf),
  ])

  return runClinicalEngine({
    patientCpf,
    trigger,
    checkInEntries,
    onboardingPreferences: onboarding.preferences,
    generatePlan: false,
  })
}

export async function submitActivityFeedbackAndRecalc(
  patientCpf: string,
  activityId: string,
  planDate: string,
  feedback: NonNullable<UserClinicalState['activity_history'][number]['feedback']>,
) {
  const { submitActivityFeedback } = await import('../data/mentalHealthClinicalStateStorage')
  const state = await submitActivityFeedback(patientCpf, activityId, planDate, feedback)
  if (!state) return null

  state.plan_state.adherence_7d = computeAdherence(state.activity_history)
  await saveMentalHealthClinicalState(patientCpf, state)
  return state
}

export function rebuildTodayPlanFromState(
  state: UserClinicalState,
  planDate: string,
): DailyMicroPlan | null {
  if (state.plan_state.last_plan_date !== planDate || state.plan_state.last_plan_blocked) {
    return null
  }

  const assigned = state.activity_history.filter((entry) => entry.plan_date === planDate)
  if (!assigned.length) return null

  const catalog = engineContent.activityCatalog.activities
  const activities = assigned.map((entry, index) => {
    const definition = catalog.find((activity) => activity.id === entry.activity_id)
    return {
      activity_id: entry.activity_id,
      slot: entry.slot,
      order: index + 1,
      title: definition?.title ?? entry.activity_id,
      subtitle_user: definition?.subtitle_user ?? null,
      duration_min: definition?.duration_min ?? 5,
      objective_user: definition?.objective_user ?? 'Cuidado leve para hoje',
      why_user_moment: null,
      matched_rule_id: entry.matched_rule_id ?? 'rebuilt',
      pool_id: 'rebuilt',
    }
  })

  return {
    plan_date: planDate,
    generated_at: state.plan_state.last_plan_generated_at ?? new Date().toISOString(),
    blocked: false,
    block_reason: null,
    welcome: {
      template_id: 'welcome_rebuilt',
      title: 'Seu plano de hoje',
      body: 'Retome os cuidados no seu ritmo.',
    },
    activities,
    completion: {
      template_id: 'completion_rebuilt',
      title: 'Um passo de cada vez',
      body: 'Cada pequeno cuidado conta.',
    },
    internal: {
      primary_track_id: state.primary_track_id,
      rules_fired: [],
      assembly_rule_id: 'rebuild_from_state',
    },
  }
}

export async function generateDailyMicroPlan(patientCpf: string): Promise<EngineRunResult> {
  const { loadMentalHealthCheckInEntries } = await import('../data/mentalHealthCheckInStorage')
  const { loadMentalHealthOnboardingRecord } = await import('../data/mentalHealthOnboardingStorage')

  const [checkInEntries, onboarding, clinicalState] = await Promise.all([
    loadMentalHealthCheckInEntries(patientCpf),
    loadMentalHealthOnboardingRecord(patientCpf),
    loadMentalHealthClinicalState(patientCpf),
  ])

  const answers = clinicalState?.anamnesis.answers_index ?? {}
  if (!isInitialAnamnesisComplete(answers)) {
    return {
      state: clinicalState ?? createInitialClinicalState(patientCpf),
      plan: null,
    }
  }

  const today = toLocalDateIso(new Date())
  const existingPlan = clinicalState ? rebuildTodayPlanFromState(clinicalState, today) : null
  if (existingPlan) {
    return { state: clinicalState!, plan: existingPlan }
  }

  return runClinicalEngine({
    patientCpf,
    trigger: 'plan_request',
    checkInEntries,
    onboardingPreferences: onboarding.preferences,
    generatePlan: true,
  })
}
