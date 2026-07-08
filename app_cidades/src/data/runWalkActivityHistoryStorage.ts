import AsyncStorage from '@react-native-async-storage/async-storage'
import { isRunWalkApiEnabled } from '../config/runWalkApi'
import {
  listAllRunWalkAtividades,
  patchRunWalkAtividadeCheckin,
  registerRunWalkAtividade,
} from '../lib/api/vd/runWalk'
import type { RunWalkActivitySummary } from './runWalkActivitySummaryStorage'
import {
  mapAtividadeDtoToSummary,
  mapSummaryToCreateInput,
  mergeSummaryWithDto,
} from '../utils/runWalkAtividadeMappers'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import {
  enqueueRunWalkActivitySync,
  loadRunWalkActivitySyncQueue,
  removeRunWalkActivitySyncEntries,
} from './runWalkActivitySyncQueue'
import { invalidateWeeklyGoalProgressCache } from './runWalkWeeklyProgressStorage'

const STORAGE_KEY = '@telefarmed/run-walk-activity-history'

type HistoryStore = Record<string, RunWalkActivitySummary[]>

function sortActivities(entries: RunWalkActivitySummary[]) {
  return [...entries].sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  )
}

function activityIdentity(activity: RunWalkActivitySummary) {
  return activity.serverId ?? activity.id
}

function mergeActivityLists(
  primary: RunWalkActivitySummary[],
  secondary: RunWalkActivitySummary[],
): RunWalkActivitySummary[] {
  const byIdentity = new Map<string, RunWalkActivitySummary>()

  for (const activity of secondary) {
    byIdentity.set(activityIdentity(activity), activity)
  }

  for (const activity of primary) {
    const key = activityIdentity(activity)
    const existing = byIdentity.get(key)
    if (!existing) {
      byIdentity.set(key, activity)
      continue
    }

    byIdentity.set(key, {
      ...existing,
      ...activity,
      trail: activity.trail.length > 0 ? activity.trail : existing.trail,
      serverId: activity.serverId ?? existing.serverId,
      checkIn: activity.checkIn ?? existing.checkIn,
      checkInSkipped: activity.checkInSkipped ?? existing.checkInSkipped,
      locationCity: activity.locationCity ?? existing.locationCity,
      locationState: activity.locationState ?? existing.locationState,
    })
  }

  return sortActivities([...byIdentity.values()])
}

async function readStore(): Promise<HistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as HistoryStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: HistoryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedRunWalkActivityHistory(
  patientCpf: string,
): Promise<RunWalkActivitySummary[]> {
  const store = await readStore()
  return sortActivities(store[patientCpf] ?? [])
}

async function cacheRunWalkActivityHistory(
  patientCpf: string,
  activities: RunWalkActivitySummary[],
) {
  const store = await readStore()
  store[patientCpf] = sortActivities(activities)
  await writeStore(store)
}

async function upsertCachedActivity(
  patientCpf: string,
  activity: RunWalkActivitySummary,
): Promise<RunWalkActivitySummary[]> {
  const current = await loadCachedRunWalkActivityHistory(patientCpf)
  const withoutDuplicate = current.filter(
    (entry) =>
      entry.id !== activity.id &&
      entry.serverId !== activity.serverId &&
      activityIdentity(entry) !== activityIdentity(activity),
  )
  const next = sortActivities([activity, ...withoutDuplicate])
  await cacheRunWalkActivityHistory(patientCpf, next)
  return next
}

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function shouldUseRunWalkApi(patientCpf: string) {
  return isRunWalkApiEnabled() && !isGuestPatient(patientCpf)
}

export async function loadLocalRunWalkActivityHistory(
  patientCpf: string,
): Promise<RunWalkActivitySummary[]> {
  const cached = stripLegacyMockActivities(await loadCachedRunWalkActivityHistory(patientCpf))
  const queue = await loadRunWalkActivitySyncQueue(patientCpf)
  const pending = queue.map((entry) => entry.activity)
  return mergeActivityLists(cached, pending)
}

function stripLegacyMockActivities(activities: RunWalkActivitySummary[]) {
  return activities.filter((activity) => !activity.id.startsWith('mock-history-'))
}

export async function flushRunWalkActivitySyncQueue(patientCpf: string): Promise<void> {
  if (!shouldUseRunWalkApi(patientCpf)) return

  const queue = await loadRunWalkActivitySyncQueue(patientCpf)
  if (queue.length === 0) return

  const syncedIds: string[] = []

  for (const entry of queue) {
    try {
      if (entry.activity.serverId) {
        if (entry.activity.checkInSkipped) {
          await patchRunWalkAtividadeCheckin(entry.activity.serverId, { checkInSkipped: true })
        } else if (entry.activity.checkIn) {
          await patchRunWalkAtividadeCheckin(entry.activity.serverId, {
            checkIn: entry.activity.checkIn,
          })
        }
        await upsertCachedActivity(patientCpf, entry.activity)
        syncedIds.push(entry.id)
        continue
      }

      const result = await registerRunWalkAtividade(mapSummaryToCreateInput(entry.activity))
      const merged = mergeSummaryWithDto(entry.activity, result.activity)
      await upsertCachedActivity(patientCpf, merged)
      syncedIds.push(entry.id)
      await invalidateWeeklyGoalProgressCache(patientCpf)
    } catch {
      break
    }
  }

  if (syncedIds.length > 0) {
    await removeRunWalkActivitySyncEntries(syncedIds)
  }
}

/** Carrega histórico do backend com cache local; em falha usa cache + fila pendente. */
export async function loadRunWalkActivityHistory(
  patientCpf: string,
): Promise<RunWalkActivitySummary[]> {
  if (!shouldUseRunWalkApi(patientCpf)) {
    return loadLocalRunWalkActivityHistory(patientCpf)
  }

  await flushRunWalkActivitySyncQueue(patientCpf)

  try {
    const remote = await listAllRunWalkAtividades({ period: 'all', sort: 'recent' })
    const mapped = stripLegacyMockActivities(
      remote.map((dto) => mapAtividadeDtoToSummary(dto, patientCpf)),
    )
    const queue = await loadRunWalkActivitySyncQueue(patientCpf)
    const pending = queue.map((entry) => entry.activity)
    const merged = mergeActivityLists(mapped, pending)
    await cacheRunWalkActivityHistory(patientCpf, merged)
    return merged
  } catch {
    return loadLocalRunWalkActivityHistory(patientCpf)
  }
}

/** Persiste atividade no backend com fallback offline (cache + fila de retry). */
export async function persistRunWalkHistoryActivity(
  patientCpf: string,
  activity: RunWalkActivitySummary,
): Promise<RunWalkActivitySummary[]> {
  const normalized: RunWalkActivitySummary = {
    ...activity,
    patientCpf,
  }

  let next = await upsertCachedActivity(patientCpf, normalized)

  if (!shouldUseRunWalkApi(patientCpf)) {
    return next
  }

  if (normalized.serverId) {
    try {
      if (normalized.checkInSkipped) {
        await patchRunWalkAtividadeCheckin(normalized.serverId, { checkInSkipped: true })
      } else if (normalized.checkIn) {
        await patchRunWalkAtividadeCheckin(normalized.serverId, {
          checkIn: normalized.checkIn,
        })
      }
    } catch {
      await enqueueRunWalkActivitySync(patientCpf, normalized)
      return next
    }

    await removeRunWalkActivitySyncEntries([`sync-${normalized.id}`])
    return next
  }

  try {
    const result = await registerRunWalkAtividade(mapSummaryToCreateInput(normalized))
    const merged = mergeSummaryWithDto(normalized, result.activity)
    next = await upsertCachedActivity(patientCpf, merged)
    await removeRunWalkActivitySyncEntries([`sync-${normalized.id}`])
    await invalidateWeeklyGoalProgressCache(patientCpf)
    return next
  } catch {
    await enqueueRunWalkActivitySync(patientCpf, normalized)
    return next
  }
}

export async function saveRunWalkHistoryActivity(
  patientCpf: string,
  activity: RunWalkActivitySummary,
) {
  await persistRunWalkHistoryActivity(patientCpf, activity)
}

export async function deleteRunWalkHistoryActivity(patientCpf: string, activityId: string) {
  const store = await readStore()
  const current = store[patientCpf] ?? []
  store[patientCpf] = current.filter(
    (entry) => entry.id !== activityId && entry.serverId !== activityId,
  )
  await writeStore(store)
}

export function getActivityDateIso(activity: RunWalkActivitySummary) {
  return toLocalDateIso(new Date(activity.completedAt))
}
