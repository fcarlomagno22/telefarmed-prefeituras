import type {
  MentalHealthCheckInEntry,
  MentalHealthOnboardingPreferences,
} from './mentalHealth'

export type HypothesisTier =
  | 'insufficient_data'
  | 'low_signal'
  | 'moderate_signal'
  | 'high_signal'

export type HypothesisConfidence = 'low' | 'medium' | 'high'

export type HypothesisStatus =
  | 'active'
  | 'monitoring'
  | 'attenuated'
  | 'suppressed'
  | 'inactive'
  | 'insufficient_data'

export type AnamnesisAnswerRecord = {
  value: boolean | number | string | string[] | null
  answered_at: string
  source: 'anamnesis' | 'seed'
  skipped: boolean
}

export type ActiveHypothesis = {
  track: string
  score: number
  tier: HypothesisTier
  status: HypothesisStatus
  confidence: HypothesisConfidence
  evidence_summary: string[]
  evidence_tags: string[]
  evidence_count: number
  is_primary: boolean
  is_secondary: boolean
  last_updated_at: string
  engine_version: string
}

export type InstrumentScoreRecord = {
  score: number
  max_score: number
  severity: string
  valid: boolean
  answered_ratio: number
  calculated_at: string
}

export type EvidenceLogEntry = {
  evidence_tag: string
  rule_id: string
  track?: string
  points?: number
  fired_at: string
}

export type ActiveRedFlag = {
  red_flag_id: string
  severity: string
  triggered_at: string
  trigger_rule_id: string
  status: 'open' | 'acknowledged' | 'resolved' | 'false_positive'
  resolved_at: string | null
}

export type ActivityHistoryEntry = {
  activity_id: string
  plan_id: string | null
  plan_date: string
  slot: 'now' | 'daytime' | 'evening'
  status: 'assigned' | 'started' | 'completed' | 'skipped' | 'blocked'
  assigned_at: string
  completed_at: string | null
  duration_actual_sec: number | null
  feedback: 'helpful' | 'somewhat' | 'not_helpful' | 'made_worse' | null
  feedback_at: string | null
  matched_rule_id: string | null
}

export type UserClinicalState = {
  user_id: string
  engine_version: string
  created_at: string | null
  updated_at: string | null
  anamnesis: {
    completion_ratio: number
    completed_module_ids: string[]
    completed_at: string | null
    answers_index: Record<string, AnamnesisAnswerRecord>
    last_updated_at: string | null
  }
  symptom_scores: Record<string, number | boolean>
  derived_metrics: Record<string, number | boolean>
  instrument_scores: Record<string, InstrumentScoreRecord>
  track_scores_raw: Record<string, number>
  active_hypotheses: ActiveHypothesis[]
  primary_track_id: string | null
  secondary_track_ids: string[]
  evidence_log: EvidenceLogEntry[]
  active_red_flags: ActiveRedFlag[]
  risk_events: Array<Record<string, unknown>>
  plan_state: {
    last_plan_date: string | null
    last_plan_generated_at: string | null
    last_plan_blocked: boolean
    last_block_reason: 'red_flag' | 'insufficient_data' | null
    current_plan_id: string | null
    adherence_7d: number
    completed_yesterday: boolean
  }
  activity_history: ActivityHistoryEntry[]
  profile_snapshot: {
    care_focus: string[]
    spirituality_preference: string | null
    tracking_frequency: string | null
    captured_at: string | null
  }
  data_completeness: {
    anamnesis_ratio: number
    valid_instruments_count: number
    symptoms_scored_count: number
    check_ins_7d_count: number
    sufficient_for_hypothesis: boolean
    sufficient_for_plan: boolean
  }
  recalc_meta: {
    last_engine_run_at: string | null
    last_engine_run_trigger: string | null
    rules_version: string
    content_version: string
  }
}

export type DailyPlanActivity = {
  activity_id: string
  slot: 'now' | 'daytime' | 'evening'
  order: number
  title: string
  subtitle_user: string | null
  duration_min: number
  objective_user: string
  why_user_moment: string | null
  matched_rule_id: string
  pool_id: string | null
}

export type DailyMicroPlan = {
  plan_date: string
  generated_at: string
  blocked: boolean
  block_reason: 'red_flag' | 'insufficient_data' | null
  welcome: {
    template_id: string
    title: string
    body: string
  }
  activities: DailyPlanActivity[]
  completion: {
    template_id: string
    title: string
    body: string
  } | null
  internal: {
    primary_track_id: string | null
    rules_fired: string[]
    assembly_rule_id: string | null
  }
}

export type EngineRunTrigger = 'check_in' | 'anamnesis' | 'plan_request' | 'manual'

export type EngineRunInput = {
  patientCpf: string
  trigger: EngineRunTrigger
  checkInEntries: MentalHealthCheckInEntry[]
  onboardingPreferences: MentalHealthOnboardingPreferences
  generatePlan?: boolean
}

export type EngineRunResult = {
  state: UserClinicalState
  plan: DailyMicroPlan | null
}
