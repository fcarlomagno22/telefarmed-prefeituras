import AsyncStorage from '@react-native-async-storage/async-storage'
import { isRunWalkApiEnabled } from '../config/runWalkApi'
import {
  buildLocalDispositionFromCheckin,
  createEmptyDispositionState,
  getDispositionRecommendation,
  getRecommendationLabel,
} from './mockRunWalk'
import {
  getRunWalkDisposicao,
  postRunWalkDisposicaoCheckin,
  type RunWalkDisposicaoDto,
} from '../lib/api/vd/runWalk'
import type { DispositionCheckinAnswers, DispositionState } from '../types/runWalk'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const CACHE_KEY = '@telefarmed/run-walk-disposition'

export type RunWalkDispositionSnapshot = {
  disposition: DispositionState
  checkinCompletedToday: boolean
}

type CachedDispositionRecord = RunWalkDispositionSnapshot & {
  dateIso: string
}

type DispositionCacheStore = Record<string, CachedDispositionRecord>

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function mapDtoToSnapshot(dto: RunWalkDisposicaoDto): RunWalkDispositionSnapshot {
  const { checkinCompletedToday, ...disposition } = dto
  return {
    disposition,
    checkinCompletedToday,
  }
}

function getGuestDispositionSnapshot(): RunWalkDispositionSnapshot {
  return {
    disposition: createEmptyDispositionState(),
    checkinCompletedToday: false,
  }
}

function getOfflineFallbackSnapshot(): RunWalkDispositionSnapshot {
  return {
    disposition: createEmptyDispositionState(),
    checkinCompletedToday: false,
  }
}

async function readCache(): Promise<DispositionCacheStore> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as DispositionCacheStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeCache(store: DispositionCacheStore) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(store))
}

async function cacheDispositionSnapshot(
  patientCpf: string,
  snapshot: RunWalkDispositionSnapshot,
  dateIso = toLocalDateIso(new Date()),
) {
  const store = await readCache()
  store[patientCpf] = {
    ...snapshot,
    dateIso,
  }
  await writeCache(store)
}

export async function loadCachedRunWalkDisposition(
  patientCpf: string,
): Promise<RunWalkDispositionSnapshot | null> {
  const store = await readCache()
  const record = store[patientCpf]
  if (!record || record.dateIso !== toLocalDateIso(new Date())) {
    return null
  }

  return {
    disposition: record.disposition,
    checkinCompletedToday: record.checkinCompletedToday,
  }
}

/** Carrega disposição via GET com cache local; guest usa estado vazio. */
export async function loadRunWalkDisposition(
  patientCpf: string,
  options?: { forceRefresh?: boolean },
): Promise<RunWalkDispositionSnapshot> {
  if (isGuestPatient(patientCpf)) {
    return getGuestDispositionSnapshot()
  }

  if (!isRunWalkApiEnabled()) {
    const cached = await loadCachedRunWalkDisposition(patientCpf)
    return cached ?? getOfflineFallbackSnapshot()
  }

  const todayIso = toLocalDateIso(new Date())

  if (!options?.forceRefresh) {
    const cached = await loadCachedRunWalkDisposition(patientCpf)
    if (cached) return cached
  }

  try {
    const dto = await getRunWalkDisposicao()
    const snapshot = mapDtoToSnapshot(dto)
    await cacheDispositionSnapshot(patientCpf, snapshot, todayIso)
    return snapshot
  } catch {
    const cached = await loadCachedRunWalkDisposition(patientCpf)
    return cached ?? getOfflineFallbackSnapshot()
  }
}

export type SaveRunWalkDispositionCheckinResult = RunWalkDispositionSnapshot & {
  recommendationLabel: string
}

/** Persiste check-in via POST ou, sem API, calcula e grava no cache local. */
export async function saveRunWalkDispositionCheckin(
  patientCpf: string,
  answers: DispositionCheckinAnswers,
): Promise<SaveRunWalkDispositionCheckinResult> {
  if (isGuestPatient(patientCpf)) {
    throw new Error('Check-in de disposição disponível apenas para usuários autenticados.')
  }

  if (!isRunWalkApiEnabled()) {
    const recommendation = getDispositionRecommendation(answers)
    const snapshot: RunWalkDispositionSnapshot = {
      disposition: buildLocalDispositionFromCheckin(answers),
      checkinCompletedToday: true,
    }
    await cacheDispositionSnapshot(patientCpf, snapshot)

    return {
      ...snapshot,
      recommendationLabel: getRecommendationLabel(recommendation),
    }
  }

  const result = await postRunWalkDisposicaoCheckin({
    mood: answers.mood,
    sleptWell: answers.sleptWell,
    hasPain: answers.hasPain,
    lowEnergy: answers.lowEnergy,
    preferLighter: answers.preferLighter,
    preferWalkOverRun: answers.preferWalkOverRun,
  })

  const snapshot = mapDtoToSnapshot(result.disposition)
  await cacheDispositionSnapshot(patientCpf, snapshot)

  return {
    ...snapshot,
    recommendationLabel: result.checkin.recommendationLabel,
  }
}
