import AsyncStorage from '@react-native-async-storage/async-storage'
import { isRunWalkApiEnabled } from '../config/runWalkApi'
import { TODAY_ACTIVITY_PRESETS } from './mockRunWalk'
import {
  getRunWalkPlanoHoje,
  postRunWalkPlanoHojeAcao,
  putRunWalkPlanoHoje,
  type RunWalkPlanoAcaoResultDto,
  type RunWalkPlanoHojeDto,
  type RunWalkPlanoMenuAction,
} from '../lib/api/vd/runWalk'
import type { TodayActivity, TodayActivityPreset, TodayActivityPresetId } from '../types/runWalk'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const CACHE_KEY = '@telefarmed/run-walk-plano-hoje'

type CachedPlanoRecord = RunWalkPlanoHojeDto & {
  dateIso: string
}

type PlanoCacheStore = Record<string, CachedPlanoRecord>

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function mapActivity(dto: RunWalkPlanoHojeDto['activity']): TodayActivity | null {
  if (!dto) return null
  return dto
}

function mapPresets(dtos: RunWalkPlanoHojeDto['presets']): TodayActivityPreset[] {
  return dtos.map((preset) => ({
    id: preset.id,
    title: preset.title,
    subtitle: preset.subtitle,
    level: preset.level,
    activity: preset.activity,
  }))
}

export type RunWalkPlanoSnapshot = {
  activity: TodayActivity | null
  presets: TodayActivityPreset[]
  hasTodayActivity: boolean
  selectedActivityId: string | null
  selectedPresetId: TodayActivityPresetId | null
}

function mapDtoToSnapshot(dto: RunWalkPlanoHojeDto): RunWalkPlanoSnapshot {
  return {
    activity: mapActivity(dto.activity),
    presets: mapPresets(dto.presets),
    hasTodayActivity: dto.hasTodayActivity,
    selectedActivityId: dto.selectedActivityId,
    selectedPresetId: dto.selectedPresetId,
  }
}

function getGuestPlanoSnapshot(): RunWalkPlanoSnapshot {
  return {
    activity: null,
    presets: TODAY_ACTIVITY_PRESETS,
    hasTodayActivity: false,
    selectedActivityId: null,
    selectedPresetId: null,
  }
}

async function readCache(): Promise<PlanoCacheStore> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as PlanoCacheStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeCache(store: PlanoCacheStore) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(store))
}

async function cachePlanoSnapshot(patientCpf: string, snapshot: RunWalkPlanoSnapshot) {
  const store = await readCache()
  store[patientCpf] = {
    activity: snapshot.activity,
    presets: snapshot.presets,
    hasTodayActivity: snapshot.hasTodayActivity,
    selectedActivityId: snapshot.selectedActivityId,
    selectedPresetId: snapshot.selectedPresetId,
    dateIso: toLocalDateIso(new Date()),
  }
  await writeCache(store)
}

export async function loadCachedRunWalkPlano(
  patientCpf: string,
): Promise<RunWalkPlanoSnapshot | null> {
  const store = await readCache()
  const record = store[patientCpf]
  if (!record || record.dateIso !== toLocalDateIso(new Date())) {
    return null
  }

  return mapDtoToSnapshot(record)
}

/** Carrega plano do dia via GET com cache local; offline/guest usam presets estáticos. */
export async function loadRunWalkPlano(
  patientCpf: string,
  options?: { forceRefresh?: boolean },
): Promise<RunWalkPlanoSnapshot> {
  if (isGuestPatient(patientCpf) || !isRunWalkApiEnabled()) {
    if (!options?.forceRefresh) {
      const cached = await loadCachedRunWalkPlano(patientCpf)
      if (cached) return cached
    }
    return getGuestPlanoSnapshot()
  }

  if (!options?.forceRefresh) {
    const cached = await loadCachedRunWalkPlano(patientCpf)
    if (cached) return cached
  }

  try {
    const dto = await getRunWalkPlanoHoje()
    const snapshot = mapDtoToSnapshot(dto)
    await cachePlanoSnapshot(patientCpf, snapshot)
    return snapshot
  } catch {
    const cached = await loadCachedRunWalkPlano(patientCpf)
    return cached ?? getGuestPlanoSnapshot()
  }
}

export function findTodayActivityPreset(
  presets: TodayActivityPreset[],
  presetId: TodayActivityPresetId,
): TodayActivityPreset | null {
  return presets.find((preset) => preset.id === presetId) ?? null
}

/** Seleciona preset do dia via PUT. */
export async function selectRunWalkPlanoPreset(
  patientCpf: string,
  presetId: TodayActivityPresetId,
): Promise<RunWalkPlanoSnapshot> {
  if (isGuestPatient(patientCpf) || !isRunWalkApiEnabled()) {
    const preset = findTodayActivityPreset(TODAY_ACTIVITY_PRESETS, presetId)
    if (!preset) {
      throw new Error('Preset de atividade não encontrado.')
    }

    const snapshot: RunWalkPlanoSnapshot = {
      activity: preset.activity,
      presets: TODAY_ACTIVITY_PRESETS,
      hasTodayActivity: true,
      selectedActivityId: preset.activity.id,
      selectedPresetId: presetId,
    }
    await cachePlanoSnapshot(patientCpf, snapshot)
    return snapshot
  }

  const dto = await putRunWalkPlanoHoje({ presetId })
  const snapshot = mapDtoToSnapshot(dto)
  await cachePlanoSnapshot(patientCpf, snapshot)
  return snapshot
}

export type ApplyRunWalkPlanoMenuActionResult = RunWalkPlanoSnapshot & {
  notice: string | null
}

/** Aplica ação do menu via POST /plano/hoje/acoes. */
export async function applyRunWalkPlanoMenuAction(
  patientCpf: string,
  action: RunWalkPlanoMenuAction,
): Promise<ApplyRunWalkPlanoMenuActionResult> {
  if (isGuestPatient(patientCpf)) {
    throw new Error('Ações do plano disponíveis apenas para usuários autenticados.')
  }

  if (!isRunWalkApiEnabled()) {
    throw new Error('Ações do plano indisponíveis sem a API de corrida/caminhada.')
  }

  const dto: RunWalkPlanoAcaoResultDto = await postRunWalkPlanoHojeAcao({ action })
  const snapshot = mapDtoToSnapshot(dto)
  await cachePlanoSnapshot(patientCpf, snapshot)

  return {
    ...snapshot,
    notice: dto.notice,
  }
}
