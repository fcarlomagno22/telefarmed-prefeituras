import { VdRunWalkError } from './errors.js'
import type {
  RunWalkActivityMenuAction,
  RunWalkActivityType,
  RunWalkIntensity,
  TodayActivityPresetId,
} from './types.js'
import type { z } from 'zod'
import type { upsertPlanoHojeBodySchema } from './schemas.js'

/** Alinhado a RunWalkActivityStep (app_cidades/src/types/runWalk.ts). */
export type TodayActivityStepDto = {
  label: string
}

/** Alinhado a TodayActivity (app_cidades/src/types/runWalk.ts). */
export type TodayActivityDto = {
  id: string
  title: string
  type: RunWalkActivityType
  durationMinutes: number
  intensity: RunWalkIntensity
  intensityLabel: string
  goal: string
  structure: TodayActivityStepDto[]
  estimatedDistanceKm: number
  recommendedPace: string
  terrain: string
  audioGuidance: boolean
  warmup: string
  cooldown: string
  importantCautions: string[]
}

export type TodayActivityPresetLevelDto = 'simple' | 'moderate' | 'advanced'

/** Alinhado a TodayActivityPreset (app_cidades/src/types/runWalk.ts). */
export type TodayActivityPresetDto = {
  id: TodayActivityPresetId
  title: string
  subtitle: string
  level: TodayActivityPresetLevelDto
  activity: TodayActivityDto
}

/** GET /plano/hoje */
export type RunWalkPlanoHojeDto = {
  activity: TodayActivityDto | null
  presets: TodayActivityPresetDto[]
  hasTodayActivity: boolean
  selectedActivityId: string | null
  selectedPresetId: TodayActivityPresetId | null
}

export type RunWalkPlanoAcaoResultDto = RunWalkPlanoHojeDto & {
  notice: string | null
}

export type UpsertPlanoHojeInput = z.infer<typeof upsertPlanoHojeBodySchema>

export type PlanoMenuState = {
  lastAction?: RunWalkActivityMenuAction
  lastActionAt?: string
  deferredTo?: 'later' | 'tomorrow' | 'reschedule'
  reportedTired?: boolean
  reportedDiscomfort?: boolean
  freeActivity?: boolean
}

export type UpsertPlanoDiarioPayload = {
  preset_id: string | null
  activity_type: RunWalkActivityType | null
  title: string | null
  duration_minutes: number | null
  intensity: RunWalkIntensity | null
  intensity_label: string | null
  audio_guidance: boolean
  selected_activity: TodayActivityDto | null
  menu_state: PlanoMenuState
  skipped: boolean
}

const BEGINNER_RUN_WALK: TodayActivityDto = {
  id: 'today-beginner-run-walk',
  title: 'Corrida e caminhada para iniciantes',
  type: 'run-walk',
  durationMinutes: 26,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'aumentar o tempo correndo',
  structure: [
    { label: '5 minutos de caminhada' },
    { label: '6 blocos alternando corrida e caminhada' },
    { label: '4 minutos de desaceleração' },
  ],
  estimatedDistanceKm: 2.8,
  recommendedPace: 'Caminhada confortável · Corrida leve (consegue conversar)',
  terrain: 'Asfalto plano ou parque urbano',
  audioGuidance: true,
  warmup: '5 minutos de caminhada em ritmo tranquilo',
  cooldown: '4 minutos reduzindo gradualmente o ritmo até parar',
  importantCautions: [
    'Mantenha postura ereta e passos curtos na corrida',
    'Hidrate-se antes e depois da atividade',
    'Interrompa se sentir dor aguda ou falta de ar intensa',
  ],
}

const WALK_ACTIVITY: TodayActivityDto = {
  id: 'today-walk',
  title: 'Caminhada ativa',
  type: 'walk',
  durationMinutes: 30,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'melhorar sua regularidade',
  structure: [
    { label: '5 minutos caminhando devagar' },
    { label: '20 minutos em ritmo confortável' },
    { label: '5 minutos reduzindo o ritmo' },
  ],
  estimatedDistanceKm: 2.5,
  recommendedPace: 'Ritmo em que consegue conversar com tranquilidade',
  terrain: 'Calçada, parque ou trilha leve',
  audioGuidance: true,
  warmup: '5 minutos em ritmo bem leve',
  cooldown: '5 minutos reduzindo o passo até parar',
  importantCautions: [
    'Use calçado confortável com boa amortecimento',
    'Prefira superfícies planas se estiver retomando a atividade',
  ],
}

const LIGHT_WALK_ACTIVITY: TodayActivityDto = {
  id: 'today-light-walk',
  title: 'Caminhada leve',
  type: 'walk',
  durationMinutes: 15,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'manter o corpo em movimento',
  structure: [
    { label: '3 minutos aquecendo o passo' },
    { label: '10 minutos em ritmo tranquilo' },
    { label: '2 minutos reduzindo o ritmo' },
  ],
  estimatedDistanceKm: 1.2,
  recommendedPace: 'Ritmo bem confortável, sem pressa',
  terrain: 'Calçada plana ou parque',
  audioGuidance: true,
  warmup: '3 minutos caminhando devagar',
  cooldown: '2 minutos reduzindo até parar',
  importantCautions: ['Ideal para começar o dia ou retomar após pausa'],
}

const QUICK_ACTIVITY: TodayActivityDto = {
  id: 'today-quick-activity',
  title: 'Atividade rápida',
  type: 'walk',
  durationMinutes: 10,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'se movimentar mesmo com pouco tempo',
  structure: [
    { label: '2 minutos de aquecimento' },
    { label: '6 minutos em ritmo moderado' },
    { label: '2 minutos de desaceleração' },
  ],
  estimatedDistanceKm: 0.8,
  recommendedPace: 'Ritmo moderado e constante',
  terrain: 'Ao redor de casa ou do trabalho',
  audioGuidance: false,
  warmup: '2 minutos em ritmo leve',
  cooldown: '2 minutos caminhando devagar',
  importantCautions: ['Perfeita para dias corridos'],
}

const RECOVERY_WALK_ACTIVITY: TodayActivityDto = {
  id: 'today-recovery-walk',
  title: 'Recuperação ativa',
  type: 'walk',
  durationMinutes: 12,
  intensity: 'light',
  intensityLabel: 'Intensidade leve',
  goal: 'recuperar sem sobrecarregar',
  structure: [
    { label: '4 minutos caminhando devagar' },
    { label: '5 minutos com mobilidade leve' },
    { label: '3 minutos relaxando o passo' },
  ],
  estimatedDistanceKm: 0.9,
  recommendedPace: 'Ritmo regenerativo, respiração tranquila',
  terrain: 'Parque ou área arborizada',
  audioGuidance: true,
  warmup: '4 minutos em ritmo bem leve',
  cooldown: '3 minutos reduzindo gradualmente',
  importantCautions: ['Priorize conforto e respiração'],
}

const RUNNER_ACTIVITY: TodayActivityDto = {
  id: 'today-easy-run',
  title: 'Corrida leve',
  type: 'run',
  durationMinutes: 35,
  intensity: 'comfortable',
  intensityLabel: 'Intensidade confortável',
  goal: 'desenvolver resistência',
  structure: [
    { label: '8 minutos de aquecimento em trote leve' },
    { label: '22 minutos em ritmo confortável e constante' },
    { label: '5 minutos de desaceleração' },
  ],
  estimatedDistanceKm: 5.2,
  recommendedPace: 'Ritmo aeróbico — ainda consegue falar frases curtas',
  terrain: 'Parque, ciclovia ou rua com pouco desnível',
  audioGuidance: true,
  warmup: '8 minutos progressivos até ritmo de corrida',
  cooldown: '5 minutos trotando bem leve e caminhando ao final',
  importantCautions: [
    'Evite acelerar nos primeiros minutos',
    'Observe sinais de cansaço e ajuste o ritmo se necessário',
  ],
}

/** Presets estáticos — migrados de mockRunWalk.TODAY_ACTIVITY_PRESETS. */
export const TODAY_ACTIVITY_PRESETS: TodayActivityPresetDto[] = [
  {
    id: 'quick-activity',
    title: 'Atividade rápida',
    subtitle: '10 min · ideal para dias corridos',
    level: 'simple',
    activity: QUICK_ACTIVITY,
  },
  {
    id: 'light-walk',
    title: 'Caminhada leve',
    subtitle: '15 min · ritmo tranquilo',
    level: 'simple',
    activity: LIGHT_WALK_ACTIVITY,
  },
  {
    id: 'active-walk',
    title: 'Caminhada ativa',
    subtitle: '30 min · regularidade e resistência leve',
    level: 'moderate',
    activity: WALK_ACTIVITY,
  },
  {
    id: 'recovery-walk',
    title: 'Recuperação ativa',
    subtitle: '12 min · movimento regenerativo',
    level: 'moderate',
    activity: RECOVERY_WALK_ACTIVITY,
  },
  {
    id: 'beginner-run-walk',
    title: 'Corrida e caminhada',
    subtitle: '26 min · alternar corrida e caminhada',
    level: 'moderate',
    activity: BEGINNER_RUN_WALK,
  },
  {
    id: 'easy-run',
    title: 'Corrida leve',
    subtitle: '35 min · desenvolver resistência',
    level: 'advanced',
    activity: RUNNER_ACTIVITY,
  },
]

const PRESET_IDS = new Set(TODAY_ACTIVITY_PRESETS.map((preset) => preset.id))

export function listTodayActivityPresets(): TodayActivityPresetDto[] {
  return TODAY_ACTIVITY_PRESETS
}

export function findTodayActivityPresetById(
  presetId: string,
): TodayActivityPresetDto | null {
  return TODAY_ACTIVITY_PRESETS.find((preset) => preset.id === presetId) ?? null
}

export function findTodayActivityById(activityId: string): TodayActivityDto | null {
  for (const preset of TODAY_ACTIVITY_PRESETS) {
    if (preset.activity.id === activityId) {
      return preset.activity
    }
  }
  return null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function isStructureArray(
  value: unknown,
): value is TodayActivityStepDto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) && typeof item.label === 'string' && item.label.trim().length > 0,
    )
  )
}

/** Valida snapshot JSONB de selected_activity antes de expor ao cliente. */
export function parseSelectedActivitySnapshot(value: unknown): TodayActivityDto | null {
  if (!isRecord(value)) return null

  const {
    id,
    title,
    type,
    durationMinutes,
    intensity,
    intensityLabel,
    goal,
    structure,
    estimatedDistanceKm,
    recommendedPace,
    terrain,
    audioGuidance,
    warmup,
    cooldown,
    importantCautions,
  } = value

  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    (type !== 'walk' && type !== 'run-walk' && type !== 'run') ||
    typeof durationMinutes !== 'number' ||
    !Number.isFinite(durationMinutes) ||
    (intensity !== 'light' && intensity !== 'comfortable' && intensity !== 'moderate') ||
    typeof intensityLabel !== 'string' ||
    typeof goal !== 'string' ||
    !isStructureArray(structure) ||
    typeof estimatedDistanceKm !== 'number' ||
    !Number.isFinite(estimatedDistanceKm) ||
    typeof recommendedPace !== 'string' ||
    typeof terrain !== 'string' ||
    typeof audioGuidance !== 'boolean' ||
    typeof warmup !== 'string' ||
    typeof cooldown !== 'string' ||
    !isStringArray(importantCautions)
  ) {
    return null
  }

  return {
    id,
    title,
    type,
    durationMinutes: Math.round(durationMinutes),
    intensity,
    intensityLabel,
    goal,
    structure,
    estimatedDistanceKm,
    recommendedPace,
    terrain,
    audioGuidance,
    warmup,
    cooldown,
    importantCautions,
  }
}

export type RunWalkPlanoDiarioRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  plano_date: string
  preset_id: string | null
  activity_type: RunWalkActivityType | null
  title: string | null
  duration_minutes: number | null
  intensity: RunWalkIntensity | null
  intensity_label: string | null
  audio_guidance: boolean
  selected_activity: unknown | null
  menu_state: unknown
  skipped: boolean
}

export function resolvePresetIdFromRow(
  presetId: string | null,
): TodayActivityPresetId | null {
  if (!presetId || !PRESET_IDS.has(presetId as TodayActivityPresetId)) {
    return null
  }
  return presetId as TodayActivityPresetId
}

export function resolveTodayActivityFromPlanoRow(
  row: RunWalkPlanoDiarioRow,
): TodayActivityDto | null {
  if (row.skipped) return null

  const snapshot = parseSelectedActivitySnapshot(row.selected_activity)
  if (snapshot) return snapshot

  const preset = row.preset_id ? findTodayActivityPresetById(row.preset_id) : null
  return preset?.activity ?? null
}

export function buildEmptyPlanoHojeDto(): RunWalkPlanoHojeDto {
  return {
    activity: null,
    presets: listTodayActivityPresets(),
    hasTodayActivity: false,
    selectedActivityId: null,
    selectedPresetId: null,
  }
}

export function buildPlanoHojeDto(row: RunWalkPlanoDiarioRow | null): RunWalkPlanoHojeDto {
  const presets = listTodayActivityPresets()

  if (!row || row.skipped) {
    return {
      activity: null,
      presets,
      hasTodayActivity: false,
      selectedActivityId: null,
      selectedPresetId: resolvePresetIdFromRow(row?.preset_id ?? null),
    }
  }

  const activity = resolveTodayActivityFromPlanoRow(row)

  return {
    activity,
    presets,
    hasTodayActivity: activity !== null,
    selectedActivityId: activity?.id ?? null,
    selectedPresetId: resolvePresetIdFromRow(row.preset_id),
  }
}

function parseMenuState(value: unknown): PlanoMenuState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value as PlanoMenuState
}

export function mapActivityToPlanoRowFields(
  activity: TodayActivityDto,
): Pick<
  UpsertPlanoDiarioPayload,
  | 'activity_type'
  | 'title'
  | 'duration_minutes'
  | 'intensity'
  | 'intensity_label'
  | 'audio_guidance'
  | 'selected_activity'
> {
  return {
    activity_type: activity.type,
    title: activity.title,
    duration_minutes: activity.durationMinutes,
    intensity: activity.intensity,
    intensity_label: activity.intensityLabel,
    audio_guidance: activity.audioGuidance,
    selected_activity: activity,
  }
}

export function mergeActivityCustomization(
  base: TodayActivityDto,
  patch: Partial<TodayActivityDto>,
): TodayActivityDto {
  return {
    ...base,
    ...patch,
    structure: patch.structure ?? base.structure,
    importantCautions: patch.importantCautions ?? base.importantCautions,
  }
}

function getWalkActivityTemplate(): TodayActivityDto {
  const preset = findTodayActivityPresetById('active-walk')
  if (!preset) {
    throw new Error('Preset active-walk indisponível.')
  }
  return preset.activity
}

/** Mesma lógica de applyActivityMenuAction em mockRunWalk.ts. */
export function applyActivityMenuActionToActivity(
  activity: TodayActivityDto,
  action: RunWalkActivityMenuAction,
): TodayActivityDto {
  switch (action) {
    case 'swap-walk':
      return { ...getWalkActivityTemplate(), id: activity.id }
    case 'reduce-duration':
      return {
        ...activity,
        durationMinutes: Math.max(15, activity.durationMinutes - 10),
        structure: activity.structure.map((step, index) =>
          index === 1
            ? {
                label: step.label.replace(
                  /\d+/,
                  String(Math.max(5, activity.durationMinutes - 15)),
                ),
              }
            : step,
        ),
      }
    case 'reduce-intensity':
      return {
        ...activity,
        intensity: 'light',
        intensityLabel: 'Intensidade leve',
        recommendedPace: 'Ritmo bem confortável — priorize regularidade',
      }
    case 'tomorrow':
    case 'later':
    case 'reschedule':
    case 'free-activity':
    case 'report-tired':
    case 'report-discomfort':
    case 'skip':
    case 'remove-today':
    default:
      return activity
  }
}

const PLAN_ACTION_NOTICES: Partial<Record<RunWalkActivityMenuAction, string>> = {
  later: 'Atividade movida para mais tarde. Seu plano foi reorganizado.',
  reschedule: 'Escolha um novo horário em breve. O plano será ajustado automaticamente.',
  tomorrow: 'Atividade remarcada para amanhã com recuperação leve hoje.',
  'free-activity': 'Atividade livre disponível nos atalhos rápidos.',
  'report-tired': 'Registramos seu cansaço e sugerimos uma sessão mais leve.',
  'report-discomfort': 'Registramos o desconforto. Considere recuperação ou descanso.',
  skip: 'Atividade de hoje adiada. Seu plano será reorganizado nos próximos dias.',
  'swap-walk': 'Atividade trocada por caminhada. O plano da semana foi ajustado.',
  'reduce-duration': 'Duração reduzida mantendo a regularidade da semana.',
  'reduce-intensity': 'Intensidade reduzida para priorizar bem-estar e consistência.',
  'remove-today': 'Atividade de hoje removida.',
}

export function resolvePlanoActionNotice(action: RunWalkActivityMenuAction): string | null {
  return PLAN_ACTION_NOTICES[action] ?? null
}

export function buildUpsertPlanoFromPutInput(
  existing: RunWalkPlanoDiarioRow | null,
  input: UpsertPlanoHojeInput,
): UpsertPlanoDiarioPayload {
  const existingMenuState = parseMenuState(existing?.menu_state)

  if (input.presetId) {
    const preset = findTodayActivityPresetById(input.presetId)
    if (!preset) {
      throw new VdRunWalkError('Preset de atividade não encontrado.', 'NOT_FOUND', 404)
    }

    const activity = input.activity
      ? mergeActivityCustomization(preset.activity, input.activity as Partial<TodayActivityDto>)
      : { ...preset.activity }

    return {
      preset_id: input.presetId,
      skipped: false,
      menu_state: existingMenuState,
      ...mapActivityToPlanoRowFields(activity),
    }
  }

  const currentActivity = existing ? resolveTodayActivityFromPlanoRow(existing) : null
  if (!currentActivity || !input.activity) {
    throw new VdRunWalkError(
      'Selecione um preset antes de customizar a atividade.',
      'INVALID_DATA',
    )
  }

  const activity = mergeActivityCustomization(
    currentActivity,
    input.activity as Partial<TodayActivityDto>,
  )

  return {
    preset_id: existing?.preset_id ?? null,
    skipped: false,
    menu_state: existingMenuState,
    ...mapActivityToPlanoRowFields(activity),
  }
}

export function buildUpsertPlanoFromMenuAction(
  existing: RunWalkPlanoDiarioRow,
  action: RunWalkActivityMenuAction,
  actionAtIso: string,
): UpsertPlanoDiarioPayload {
  const menuState = parseMenuState(existing.menu_state)
  const currentActivity = resolveTodayActivityFromPlanoRow(existing)

  if ((action === 'remove-today' || action === 'skip') && !currentActivity && !existing.preset_id) {
    return {
      preset_id: null,
      activity_type: null,
      title: null,
      duration_minutes: null,
      intensity: null,
      intensity_label: null,
      audio_guidance: false,
      selected_activity: null,
      menu_state: {
        ...menuState,
        lastAction: action,
        lastActionAt: actionAtIso,
      },
      skipped: action === 'skip',
    }
  }

  if (!currentActivity) {
    throw new VdRunWalkError('Nenhuma atividade de hoje para aplicar a ação.', 'NOT_FOUND', 404)
  }

  const nextMenuState: PlanoMenuState = {
    ...menuState,
    lastAction: action,
    lastActionAt: actionAtIso,
  }

  if (action === 'later') nextMenuState.deferredTo = 'later'
  if (action === 'tomorrow') nextMenuState.deferredTo = 'tomorrow'
  if (action === 'reschedule') nextMenuState.deferredTo = 'reschedule'
  if (action === 'free-activity') nextMenuState.freeActivity = true
  if (action === 'report-tired') nextMenuState.reportedTired = true
  if (action === 'report-discomfort') nextMenuState.reportedDiscomfort = true

  if (action === 'remove-today') {
    return {
      preset_id: null,
      activity_type: null,
      title: null,
      duration_minutes: null,
      intensity: null,
      intensity_label: null,
      audio_guidance: false,
      selected_activity: null,
      menu_state: nextMenuState,
      skipped: false,
    }
  }

  if (action === 'skip') {
    return {
      preset_id: existing.preset_id,
      activity_type: existing.activity_type,
      title: existing.title,
      duration_minutes: existing.duration_minutes,
      intensity: existing.intensity,
      intensity_label: existing.intensity_label,
      audio_guidance: existing.audio_guidance,
      selected_activity: parseSelectedActivitySnapshot(existing.selected_activity),
      menu_state: nextMenuState,
      skipped: true,
    }
  }

  const nextActivity = applyActivityMenuActionToActivity(currentActivity, action)

  return {
    preset_id: existing.preset_id,
    skipped: false,
    menu_state: nextMenuState,
    ...mapActivityToPlanoRowFields(nextActivity),
  }
}

export function mapPlanoRowFromUpsertPayload(
  scope: { paciente_id: string; entidade_contratante_id: string },
  planoDate: string,
  payload: UpsertPlanoDiarioPayload,
  existingId?: string,
): RunWalkPlanoDiarioRow {
  return {
    id: existingId ?? '00000000-0000-0000-0000-000000000000',
    paciente_id: scope.paciente_id,
    entidade_contratante_id: scope.entidade_contratante_id,
    plano_date: planoDate,
    preset_id: payload.preset_id,
    activity_type: payload.activity_type,
    title: payload.title,
    duration_minutes: payload.duration_minutes,
    intensity: payload.intensity,
    intensity_label: payload.intensity_label,
    audio_guidance: payload.audio_guidance,
    selected_activity: payload.selected_activity,
    menu_state: payload.menu_state,
    skipped: payload.skipped,
  }
}
