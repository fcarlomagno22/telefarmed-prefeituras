import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AnamnesisAnswerRecord, UserClinicalState } from '../types/mentalHealthEngine'
import { ENGINE_CONTENT_VERSION } from '../mentalHealthEngine/content/loadEngineContent'
import { computeAnamnesisCompletion } from '../mentalHealthEngine/anamnesisScoring'

const STORAGE_KEY = '@telefarmed/mental-health-clinical-state-v1'

type ClinicalStateStore = Record<string, UserClinicalState>

async function readStore(): Promise<ClinicalStateStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ClinicalStateStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: ClinicalStateStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadMentalHealthClinicalState(
  patientCpf: string,
): Promise<UserClinicalState | null> {
  const store = await readStore()
  const state = store[patientCpf]
  return state ?? null
}

export async function saveMentalHealthClinicalState(
  patientCpf: string,
  state: UserClinicalState,
) {
  const store = await readStore()
  store[patientCpf] = {
    ...state,
    user_id: patientCpf,
    engine_version: ENGINE_CONTENT_VERSION,
    updated_at: new Date().toISOString(),
  }
  await writeStore(store)
}

export async function mergeAnamnesisAnswersIntoClinicalState(
  patientCpf: string,
  answersIndex: UserClinicalState['anamnesis']['answers_index'],
  completionRatio: number,
  completedModuleIds: string[],
) {
  const existing = (await loadMentalHealthClinicalState(patientCpf)) ?? null
  const now = new Date().toISOString()

  const next: UserClinicalState = existing ?? {
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
      rules_version: '1.0.0',
      content_version: ENGINE_CONTENT_VERSION,
    },
  }

  next.anamnesis = {
    ...next.anamnesis,
    answers_index: answersIndex,
    completion_ratio: completionRatio,
    completed_module_ids: completedModuleIds,
    last_updated_at: now,
    completed_at: completionRatio >= 1 ? now : next.anamnesis.completed_at,
  }
  next.updated_at = now

  await saveMentalHealthClinicalState(patientCpf, next)
  return next
}

export async function mergeAnamnesisModuleAnswers(
  patientCpf: string,
  moduleAnswers: Record<string, AnamnesisAnswerRecord>,
  completionRatio: number,
  completedModuleIds: string[],
) {
  const existing = await loadMentalHealthClinicalState(patientCpf)
  const mergedAnswers = {
    ...(existing?.anamnesis.answers_index ?? {}),
    ...moduleAnswers,
  }

  return mergeAnamnesisAnswersIntoClinicalState(
    patientCpf,
    mergedAnswers,
    completionRatio,
    completedModuleIds,
  )
}

/** Mescla respostas parciais no storage local (incremental, para teste sem backend). */
export async function persistPartialAnamnesisAnswers(
  patientCpf: string,
  partialAnswers: Record<string, AnamnesisAnswerRecord>,
) {
  const existing = await loadMentalHealthClinicalState(patientCpf)
  const mergedAnswers = {
    ...(existing?.anamnesis.answers_index ?? {}),
    ...partialAnswers,
  }
  const completion = computeAnamnesisCompletion(mergedAnswers)

  return mergeAnamnesisAnswersIntoClinicalState(
    patientCpf,
    mergedAnswers,
    completion.completion_ratio,
    completion.completed_module_ids,
  )
}

export async function updateActivityHistoryEntry(
  patientCpf: string,
  activityId: string,
  planDate: string,
  patch: Partial<UserClinicalState['activity_history'][number]>,
) {
  const state = await loadMentalHealthClinicalState(patientCpf)
  if (!state) return null

  const index = state.activity_history.findIndex(
    (entry) => entry.activity_id === activityId && entry.plan_date === planDate,
  )
  if (index < 0) return null

  state.activity_history[index] = {
    ...state.activity_history[index],
    ...patch,
  }
  state.updated_at = new Date().toISOString()

  await saveMentalHealthClinicalState(patientCpf, state)
  return state
}

export async function submitActivityFeedback(
  patientCpf: string,
  activityId: string,
  planDate: string,
  feedback: NonNullable<UserClinicalState['activity_history'][number]['feedback']>,
) {
  const now = new Date().toISOString()
  return updateActivityHistoryEntry(patientCpf, activityId, planDate, {
    status: 'completed',
    completed_at: now,
    feedback,
    feedback_at: now,
  })
}
