/** Tipos base do módulo Corrida e Caminhada — alinhados à migration vd_run_walk_core. */

export const RUN_WALK_MODALITIES = [
  'walk',
  'active-walk',
  'run',
  'run-walk',
  'treadmill',
  'free',
] as const
export type RunWalkModality = (typeof RUN_WALK_MODALITIES)[number]

export const RUN_WALK_INTENSITIES = ['light', 'comfortable', 'moderate'] as const
export type RunWalkIntensity = (typeof RUN_WALK_INTENSITIES)[number]

export const RUN_WALK_ACTIVITY_TYPES = ['walk', 'run-walk', 'run'] as const
export type RunWalkActivityType = (typeof RUN_WALK_ACTIVITY_TYPES)[number]

export const TODAY_ACTIVITY_PRESET_IDS = [
  'quick-activity',
  'light-walk',
  'active-walk',
  'recovery-walk',
  'beginner-run-walk',
  'easy-run',
] as const
export type TodayActivityPresetId = (typeof TODAY_ACTIVITY_PRESET_IDS)[number]

/** Alinhado a ActivityMenuAction (app_cidades/src/types/runWalk.ts). */
export const RUN_WALK_ACTIVITY_MENU_ACTIONS = [
  'later',
  'reschedule',
  'tomorrow',
  'swap-walk',
  'reduce-duration',
  'reduce-intensity',
  'free-activity',
  'report-tired',
  'report-discomfort',
  'skip',
  'remove-today',
] as const
export type RunWalkActivityMenuAction = (typeof RUN_WALK_ACTIVITY_MENU_ACTIONS)[number]

export const RUN_WALK_DISPOSITION_MOODS = [
  'great',
  'good',
  'tired',
  'very-tired',
  'discomfort',
] as const
export type RunWalkDispositionMood = (typeof RUN_WALK_DISPOSITION_MOODS)[number]

export const RUN_WALK_DISPOSITION_RECOMMENDATIONS = [
  'keep',
  'slower-pace',
  'reduce-time',
  'swap-walk',
  'light-walk',
  'recovery',
  'rest',
] as const
export type RunWalkDispositionRecommendation =
  (typeof RUN_WALK_DISPOSITION_RECOMMENDATIONS)[number]

export const RUNNING_ROUTE_SPOT_VOTES = ['recommend', 'not-recommend'] as const
export type RunningRouteSpotVote = (typeof RUNNING_ROUTE_SPOT_VOTES)[number]

export const RUNNING_ROUTE_SPOT_TYPES = [
  'park',
  'track',
  'waterfront',
  'trail',
  'plaza',
  'other',
] as const
export type RunningRouteSpotType = (typeof RUNNING_ROUTE_SPOT_TYPES)[number]

export const RUNNING_ROUTE_LOCATION_SOURCES = ['gps', 'address'] as const
export type RunningRouteLocationSource = (typeof RUNNING_ROUTE_LOCATION_SOURCES)[number]

/** Alinhado a runWalkActivityCheckIn.ts */
export const RUN_WALK_ACTIVITY_CHECK_IN_INTENSITIES = [
  'very-light',
  'light',
  'adequate',
  'hard',
  'very-hard',
] as const

export const RUN_WALK_ACTIVITY_CHECK_IN_WELLBEINGS = [
  'very-well',
  'well',
  'a-bit-tired',
  'very-tired',
  'unwell',
] as const

export const RUN_WALK_ACTIVITY_CHECK_IN_DISCOMFORTS = [
  'none',
  'feet',
  'ankles',
  'calves',
  'knees',
  'hips',
  'back',
  'chest',
  'other',
] as const

export type VdRunWalkPacienteScope = {
  pacienteId: string
  entidadeContratanteId: string
  cpf: string
}

export type VdRunWalkHealthDto = {
  ok: true
  module: 'vd-run-walk'
}

/** Row shape de run_walk_atividades (repository). */
export type RunWalkAtividadeRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  client_activity_id: string
  modality: RunWalkModality
  activity_name: string
  elapsed_seconds: number
  distance_km: number
  average_speed_kmh: number | null
  pace_min_per_km: number | null
  step_count: number
  heart_rate_bpm: number
  estimated_calories: number
  active_minutes: number
  completed_at: string
  trail_simplified?: unknown
  trail_point_count: number
  location_city: string | null
  location_state: string | null
  check_in: unknown | null
  check_in_skipped: boolean
  deleted_at: string | null
  criado_em: string
  atualizado_em: string
}
