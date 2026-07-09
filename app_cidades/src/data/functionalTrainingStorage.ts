import AsyncStorage from '@react-native-async-storage/async-storage'
import { isFunctionalTrainingApiEnabled } from '../config/functionalTrainingApi'
import {
  addFunctionalTrainingFavorito,
  getFunctionalTrainingEstatisticasSemanais,
  getFunctionalTrainingFavoritos,
  registerFunctionalTrainingSessao,
  removeFunctionalTrainingFavorito,
} from '../lib/api/vd/functionalTraining'
import type {
  WeeklyTrainingStats,
  WorkoutSessionRecord,
} from '../types/functionalTraining'
import {
  clearFunctionalTrainingFavoriteSyncQueue,
  enqueueFunctionalTrainingFavoriteSync,
  loadFunctionalTrainingFavoriteSyncQueue,
  removeFunctionalTrainingFavoriteSyncEntries,
} from './functionalTrainingFavoritesSyncQueue'
import {
  enqueueFunctionalTrainingSessionSync,
  loadFunctionalTrainingSessionSyncQueue,
  removeFunctionalTrainingSessionSyncEntries,
} from './functionalTrainingSessionSyncQueue'

const LEGACY_FAVORITES_KEY = '@telefarmed/functional-favorites'
const LEGACY_HISTORY_KEY = '@telefarmed/functional-history'
const FAVORITES_CACHE_KEY = '@telefarmed/functional-favorites-cache'
const HISTORY_CACHE_KEY = '@telefarmed/functional-history-cache'
const WEEKLY_STATS_CACHE_KEY = '@telefarmed/functional-weekly-stats-cache'
const MIGRATION_KEY = '@telefarmed/functional-training-migrated'

type FavoritesStore = Record<string, string[]>
type HistoryStore = Record<string, WorkoutSessionRecord[]>
type WeeklyStatsCacheStore = Record<string, WeeklyTrainingStats & { cachedAtIso: string }>
type MigrationStore = Record<string, true>

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function shouldUseFunctionalTrainingApi(patientCpf: string) {
  return isFunctionalTrainingApiEnabled() && !isGuestPatient(patientCpf)
}

function startOfWeekIso(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString()
}

async function readJsonStore<T>(key: string): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return {} as T

    const parsed = JSON.parse(raw) as T
    return parsed && typeof parsed === 'object' ? parsed : ({} as T)
  } catch {
    return {} as T
  }
}

async function writeJsonStore<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

async function readLegacyFavorites(patientCpf: string): Promise<string[]> {
  const store = await readJsonStore<FavoritesStore>(LEGACY_FAVORITES_KEY)
  const favorites = store[patientCpf]
  return Array.isArray(favorites) ? favorites : []
}

async function readLegacyHistory(patientCpf: string): Promise<WorkoutSessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_HISTORY_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as WorkoutSessionRecord[]
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item) => item.patientCpf === patientCpf)
      .sort((left, right) => right.completedAtIso.localeCompare(left.completedAtIso))
  } catch {
    return []
  }
}

async function readFavoritesCache(patientCpf: string): Promise<string[]> {
  const store = await readJsonStore<FavoritesStore>(FAVORITES_CACHE_KEY)
  const favorites = store[patientCpf]
  return Array.isArray(favorites) ? favorites : []
}

async function writeFavoritesCache(patientCpf: string, exerciseIds: string[]) {
  const store = await readJsonStore<FavoritesStore>(FAVORITES_CACHE_KEY)
  store[patientCpf] = exerciseIds
  await writeJsonStore(FAVORITES_CACHE_KEY, store)
}

async function readHistoryCache(patientCpf: string): Promise<WorkoutSessionRecord[]> {
  const store = await readJsonStore<HistoryStore>(HISTORY_CACHE_KEY)
  const history = store[patientCpf]
  if (!Array.isArray(history)) return []
  return [...history].sort((left, right) =>
    right.completedAtIso.localeCompare(left.completedAtIso),
  )
}

async function upsertHistoryCache(entry: WorkoutSessionRecord): Promise<WorkoutSessionRecord[]> {
  const store = await readJsonStore<HistoryStore>(HISTORY_CACHE_KEY)
  const current = Array.isArray(store[entry.patientCpf]) ? store[entry.patientCpf] : []
  const withoutDuplicate = current.filter((item) => item.id !== entry.id)
  const next = [entry, ...withoutDuplicate].sort((left, right) =>
    right.completedAtIso.localeCompare(left.completedAtIso),
  )
  store[entry.patientCpf] = next
  await writeJsonStore(HISTORY_CACHE_KEY, store)
  return next
}

async function readWeeklyStatsCache(patientCpf: string): Promise<WeeklyTrainingStats | null> {
  const store = await readJsonStore<WeeklyStatsCacheStore>(WEEKLY_STATS_CACHE_KEY)
  const cached = store[patientCpf]
  if (!cached) return null

  const weekStart = startOfWeekIso(new Date())
  if (cached.cachedAtIso < weekStart) {
    return null
  }

  return {
    sessionsCount: cached.sessionsCount,
    totalActiveMinutes: cached.totalActiveMinutes,
    uniqueExercises: cached.uniqueExercises,
  }
}

async function writeWeeklyStatsCache(patientCpf: string, stats: WeeklyTrainingStats) {
  const store = await readJsonStore<WeeklyStatsCacheStore>(WEEKLY_STATS_CACHE_KEY)
  store[patientCpf] = {
    ...stats,
    cachedAtIso: new Date().toISOString(),
  }
  await writeJsonStore(WEEKLY_STATS_CACHE_KEY, store)
}

async function hasMigratedLegacyData(patientCpf: string): Promise<boolean> {
  const store = await readJsonStore<MigrationStore>(MIGRATION_KEY)
  return store[patientCpf] === true
}

async function markLegacyDataMigrated(patientCpf: string) {
  const store = await readJsonStore<MigrationStore>(MIGRATION_KEY)
  store[patientCpf] = true
  await writeJsonStore(MIGRATION_KEY, store)
}

function mapSessionToCreateInput(session: WorkoutSessionRecord) {
  return {
    clientSessionId: session.id,
    mode: session.mode,
    durationSec: session.durationSec,
    totalActiveSec: session.totalActiveSec,
    exerciseIds: session.exerciseIds,
    completedAt: session.completedAtIso,
  }
}

export function computeWeeklyStats(history: WorkoutSessionRecord[]): WeeklyTrainingStats {
  const weekStart = startOfWeekIso(new Date())
  const weekSessions = history.filter((item) => item.completedAtIso >= weekStart)

  const uniqueExercises = new Set<string>()
  let totalActiveSec = 0

  for (const session of weekSessions) {
    totalActiveSec += session.totalActiveSec
    for (const id of session.exerciseIds) uniqueExercises.add(id)
  }

  return {
    sessionsCount: weekSessions.length,
    totalActiveMinutes: Math.round(totalActiveSec / 60),
    uniqueExercises: uniqueExercises.size,
  }
}

async function loadLocalFunctionalTrainingHistory(
  patientCpf: string,
): Promise<WorkoutSessionRecord[]> {
  const cached = await readHistoryCache(patientCpf)
  const queue = await loadFunctionalTrainingSessionSyncQueue(patientCpf)
  const pending = queue.map((entry) => entry.session)
  const byId = new Map<string, WorkoutSessionRecord>()

  for (const session of [...cached, ...pending]) {
    byId.set(session.id, session)
  }

  return [...byId.values()].sort((left, right) =>
    right.completedAtIso.localeCompare(left.completedAtIso),
  )
}

export async function flushFunctionalTrainingFavoriteSyncQueue(
  patientCpf: string,
): Promise<void> {
  if (!shouldUseFunctionalTrainingApi(patientCpf)) return

  const queue = await loadFunctionalTrainingFavoriteSyncQueue(patientCpf)
  if (queue.length === 0) return

  const syncedIds: string[] = []
  let latestExerciseIds: string[] | null = null

  for (const entry of queue) {
    try {
      const result =
        entry.type === 'add'
          ? await addFunctionalTrainingFavorito(entry.exerciseId)
          : await removeFunctionalTrainingFavorito(entry.exerciseId)
      latestExerciseIds = result.exerciseIds
      syncedIds.push(entry.id)
    } catch {
      break
    }
  }

  if (syncedIds.length > 0) {
    await removeFunctionalTrainingFavoriteSyncEntries(syncedIds)
  }

  if (latestExerciseIds) {
    await writeFavoritesCache(patientCpf, latestExerciseIds)
  }
}

export async function flushFunctionalTrainingSessionSyncQueue(
  patientCpf: string,
): Promise<void> {
  if (!shouldUseFunctionalTrainingApi(patientCpf)) return

  const queue = await loadFunctionalTrainingSessionSyncQueue(patientCpf)
  if (queue.length === 0) return

  const syncedIds: string[] = []

  for (const entry of queue) {
    try {
      await registerFunctionalTrainingSessao(mapSessionToCreateInput(entry.session))
      await upsertHistoryCache(entry.session)
      syncedIds.push(entry.id)
    } catch {
      break
    }
  }

  if (syncedIds.length > 0) {
    await removeFunctionalTrainingSessionSyncEntries(syncedIds)
  }
}

async function migrateLegacyFunctionalTrainingData(patientCpf: string): Promise<void> {
  if (!shouldUseFunctionalTrainingApi(patientCpf)) return
  if (await hasMigratedLegacyData(patientCpf)) return

  const legacyFavorites = await readLegacyFavorites(patientCpf)
  const legacyHistory = await readLegacyHistory(patientCpf)

  if (legacyFavorites.length > 0) {
    await writeFavoritesCache(patientCpf, legacyFavorites)
    for (const exerciseId of legacyFavorites) {
      try {
        await addFunctionalTrainingFavorito(exerciseId)
      } catch {
        await enqueueFunctionalTrainingFavoriteSync(patientCpf, 'add', exerciseId)
      }
    }
  }

  for (const session of legacyHistory) {
    await upsertHistoryCache(session)
    try {
      await registerFunctionalTrainingSessao(mapSessionToCreateInput(session))
    } catch {
      await enqueueFunctionalTrainingSessionSync(patientCpf, session)
    }
  }

  await markLegacyDataMigrated(patientCpf)
}

export async function loadFavoriteExerciseIds(patientCpf: string): Promise<string[]> {
  if (!shouldUseFunctionalTrainingApi(patientCpf)) {
    const legacy = await readLegacyFavorites(patientCpf)
    if (legacy.length > 0) return legacy
    return readFavoritesCache(patientCpf)
  }

  await migrateLegacyFunctionalTrainingData(patientCpf)
  await flushFunctionalTrainingFavoriteSyncQueue(patientCpf)

  try {
    const result = await getFunctionalTrainingFavoritos()
    await writeFavoritesCache(patientCpf, result.exerciseIds)
    await clearFunctionalTrainingFavoriteSyncQueue(patientCpf)
    return result.exerciseIds
  } catch {
    const cached = await readFavoritesCache(patientCpf)
    if (cached.length > 0) return cached

    return readLegacyFavorites(patientCpf)
  }
}

export async function toggleFavoriteExerciseId(
  patientCpf: string,
  exerciseId: string,
): Promise<string[]> {
  const current = await loadFavoriteExerciseIds(patientCpf)
  const isFavorite = current.includes(exerciseId)
  const next = isFavorite
    ? current.filter((id) => id !== exerciseId)
    : [...current, exerciseId]

  await writeFavoritesCache(patientCpf, next)

  if (!shouldUseFunctionalTrainingApi(patientCpf)) {
    const legacyStore = await readJsonStore<FavoritesStore>(LEGACY_FAVORITES_KEY)
    legacyStore[patientCpf] = next
    await writeJsonStore(LEGACY_FAVORITES_KEY, legacyStore)
    return next
  }

  try {
    const result = isFavorite
      ? await removeFunctionalTrainingFavorito(exerciseId)
      : await addFunctionalTrainingFavorito(exerciseId)
    await writeFavoritesCache(patientCpf, result.exerciseIds)
    return result.exerciseIds
  } catch {
    await enqueueFunctionalTrainingFavoriteSync(
      patientCpf,
      isFavorite ? 'remove' : 'add',
      exerciseId,
    )
    return next
  }
}

export async function loadWorkoutHistory(patientCpf: string): Promise<WorkoutSessionRecord[]> {
  if (!shouldUseFunctionalTrainingApi(patientCpf)) {
    const legacy = await readLegacyHistory(patientCpf)
    if (legacy.length > 0) return legacy
    return loadLocalFunctionalTrainingHistory(patientCpf)
  }

  await migrateLegacyFunctionalTrainingData(patientCpf)
  await flushFunctionalTrainingSessionSyncQueue(patientCpf)

  try {
    return loadLocalFunctionalTrainingHistory(patientCpf)
  } catch {
    return loadLocalFunctionalTrainingHistory(patientCpf)
  }
}

export async function loadWeeklyTrainingStats(patientCpf: string): Promise<WeeklyTrainingStats> {
  if (!shouldUseFunctionalTrainingApi(patientCpf)) {
    const history = await loadWorkoutHistory(patientCpf)
    return computeWeeklyStats(history)
  }

  await migrateLegacyFunctionalTrainingData(patientCpf)
  await flushFunctionalTrainingSessionSyncQueue(patientCpf)

  try {
    const stats = await getFunctionalTrainingEstatisticasSemanais({
      weekStartIso: startOfWeekIso(new Date()),
    })
    await writeWeeklyStatsCache(patientCpf, stats)
    return stats
  } catch {
    const cached = await readWeeklyStatsCache(patientCpf)
    if (cached) return cached

    const history = await loadLocalFunctionalTrainingHistory(patientCpf)
    return computeWeeklyStats(history)
  }
}

export async function saveWorkoutSession(entry: WorkoutSessionRecord) {
  await upsertHistoryCache(entry)

  if (!shouldUseFunctionalTrainingApi(entry.patientCpf)) {
    const raw = await AsyncStorage.getItem(LEGACY_HISTORY_KEY)
    let all: WorkoutSessionRecord[] = []

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as WorkoutSessionRecord[]
        if (Array.isArray(parsed)) all = parsed
      } catch {
        all = []
      }
    }

    all.push(entry)
    await AsyncStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(all))
    return
  }

  try {
    await registerFunctionalTrainingSessao(mapSessionToCreateInput(entry))
    await removeFunctionalTrainingSessionSyncEntries([`sync-${entry.id}`])

    const statsStore = await readJsonStore<WeeklyStatsCacheStore>(WEEKLY_STATS_CACHE_KEY)
    delete statsStore[entry.patientCpf]
    await writeJsonStore(WEEKLY_STATS_CACHE_KEY, statsStore)
  } catch {
    await enqueueFunctionalTrainingSessionSync(entry.patientCpf, entry)
  }
}

export async function loadFunctionalTrainingData(patientCpf: string): Promise<{
  favoriteIds: string[]
  weeklyStats: WeeklyTrainingStats
}> {
  const [favoriteIds, weeklyStats] = await Promise.all([
    loadFavoriteExerciseIds(patientCpf),
    loadWeeklyTrainingStats(patientCpf),
  ])

  return { favoriteIds, weeklyStats }
}
