import AsyncStorage from '@react-native-async-storage/async-storage'
import { isRunWalkApiEnabled } from '../config/runWalkApi'
import {
  buildEmptyWeeklyCalendar,
  createEmptyRunWalkTodayState,
  createEmptyWeeklyGoalStats,
} from './mockRunWalk'
import {
  getRunWalkMetasSemanaisProgresso,
  type RunWalkMetasSemanaisProgressoDto,
} from '../lib/api/vd/runWalk'
import { flushRunWalkActivitySyncQueue } from './runWalkActivityHistoryStorage'
import { flushWeeklyGoalTargetsSyncQueue } from './runWalkWeeklyGoalStorage'
import type { RunWalkTodayState, WeeklyCalendarDay, WeeklyGoalStats } from '../types/runWalk'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const STORAGE_KEY = '@telefarmed/run-walk-weekly-progress'
const PROGRESS_CACHE_KEY = '@telefarmed/run-walk-weekly-progress-api'

export type RunWalkWeeklyProgressRecord = {
  weekStartIso: string
  dailyExtraMinutes: Record<string, number>
  extraCompletedActivities: number
  extraActiveMinutes: number
  extraMovementDays: number
}

export type WeeklyGoalProgressState = {
  weekStartDate: string
  weeklyGoal: WeeklyGoalStats
  weeklyCalendar: WeeklyCalendarDay[]
  dailyExtraMinutes: Record<string, number>
}

type WeeklyProgressStore = Record<string, RunWalkWeeklyProgressRecord>
type CachedProgressStore = Record<string, RunWalkMetasSemanaisProgressoDto>

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

export function getWeekStartIso(date = new Date()): string {
  const today = new Date(date)
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return toLocalDateIso(monday)
}

async function readLegacyStore(): Promise<WeeklyProgressStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as WeeklyProgressStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeLegacyStore(store: WeeklyProgressStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

async function readProgressCache(): Promise<CachedProgressStore> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_CACHE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as CachedProgressStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeProgressCache(store: CachedProgressStore) {
  await AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(store))
}

export async function invalidateWeeklyGoalProgressCache(patientCpf: string): Promise<void> {
  const cache = await readProgressCache()
  if (!cache[patientCpf]) return

  delete cache[patientCpf]
  await writeProgressCache(cache)
}

function createEmptyRecord(weekStartIso: string): RunWalkWeeklyProgressRecord {
  return {
    weekStartIso,
    dailyExtraMinutes: {},
    extraCompletedActivities: 0,
    extraActiveMinutes: 0,
    extraMovementDays: 0,
  }
}

function mapProgressDto(dto: RunWalkMetasSemanaisProgressoDto): WeeklyGoalProgressState {
  return {
    weekStartDate: dto.weekStartDate,
    weeklyGoal: dto.weeklyGoal,
    weeklyCalendar: dto.weeklyCalendar,
    dailyExtraMinutes: dto.dailyExtraMinutes,
  }
}

function buildGuestWeeklyGoalProgress(
  legacyProgress: RunWalkWeeklyProgressRecord | null,
): WeeklyGoalProgressState {
  const merged = mergeWeeklyProgressIntoState(createEmptyRunWalkTodayState(), legacyProgress)
  return {
    weekStartDate: getWeekStartIso(),
    weeklyGoal: merged.weeklyGoal,
    weeklyCalendar: merged.weeklyCalendar,
    dailyExtraMinutes: legacyProgress?.dailyExtraMinutes ?? {},
  }
}

function buildOfflineWeeklyGoalProgress(): WeeklyGoalProgressState {
  return {
    weekStartDate: getWeekStartIso(),
    weeklyGoal: createEmptyWeeklyGoalStats(),
    weeklyCalendar: buildEmptyWeeklyCalendar(),
    dailyExtraMinutes: {},
  }
}

export async function loadCachedWeeklyGoalProgress(
  patientCpf: string,
): Promise<WeeklyGoalProgressState | null> {
  const cache = await readProgressCache()
  const cached = cache[patientCpf]
  if (!cached) return null

  if (cached.weekStartDate !== getWeekStartIso()) {
    return null
  }

  return mapProgressDto(cached)
}

async function cacheWeeklyGoalProgress(
  patientCpf: string,
  progress: RunWalkMetasSemanaisProgressoDto,
) {
  const cache = await readProgressCache()
  cache[patientCpf] = progress
  await writeProgressCache(cache)
}

export async function flushRunWalkWeeklySync(patientCpf: string): Promise<void> {
  if (isGuestPatient(patientCpf) || !isRunWalkApiEnabled()) return
  await flushWeeklyGoalTargetsSyncQueue(patientCpf)
  await flushRunWalkActivitySyncQueue(patientCpf)
}

/** Carrega progresso semanal via API; em falha usa cache local. */
export async function loadWeeklyGoalProgress(
  patientCpf: string,
  options?: { forceRefresh?: boolean },
): Promise<WeeklyGoalProgressState> {
  if (isGuestPatient(patientCpf)) {
    const legacy = await loadWeeklyProgress(patientCpf)
    return buildGuestWeeklyGoalProgress(legacy)
  }

  if (!isRunWalkApiEnabled()) {
    const cached = await loadCachedWeeklyGoalProgress(patientCpf)
    return cached ?? buildOfflineWeeklyGoalProgress()
  }

  if (!options?.forceRefresh) {
    const cached = await loadCachedWeeklyGoalProgress(patientCpf)
    if (cached) return cached
  }

  await flushRunWalkWeeklySync(patientCpf)

  try {
    const result = await getRunWalkMetasSemanaisProgresso()
    await cacheWeeklyGoalProgress(patientCpf, result)
    return mapProgressDto(result)
  } catch {
    const cached = await loadCachedWeeklyGoalProgress(patientCpf)
    if (cached) return cached

    return buildOfflineWeeklyGoalProgress()
  }
}

export async function loadWeeklyProgress(
  patientCpf: string,
): Promise<RunWalkWeeklyProgressRecord | null> {
  const store = await readLegacyStore()
  const record = store[patientCpf]
  if (!record) return null

  const currentWeekStart = getWeekStartIso()
  if (record.weekStartIso !== currentWeekStart) {
    return null
  }

  return record
}

export function mergeWeeklyProgressIntoState(
  base: RunWalkTodayState,
  progress: RunWalkWeeklyProgressRecord | null,
): RunWalkTodayState {
  if (!progress || progress.weekStartIso !== getWeekStartIso()) {
    return base
  }

  const calendar = base.weeklyCalendar.map((day) => {
    const extraMinutes = progress.dailyExtraMinutes[day.dateIso] ?? 0
    if (extraMinutes <= 0) return day

    const activeMinutes = day.activeMinutes + extraMinutes
    const hasCompletedRunWalk = day.activities.some(
      (activity) => activity.type === 'run-walk' && activity.completed,
    )

    return {
      ...day,
      activeMinutes,
      activities: hasCompletedRunWalk
        ? day.activities
        : [
            { type: 'run-walk' as const, label: 'Corrida e caminhada', completed: true },
            ...day.activities.filter((activity) => activity.type !== 'rest'),
          ],
    }
  })

  return {
    ...base,
    weeklyCalendar: calendar,
    weeklyGoal: {
      ...base.weeklyGoal,
      completedActivities:
        base.weeklyGoal.completedActivities + progress.extraCompletedActivities,
      activeMinutes: base.weeklyGoal.activeMinutes + progress.extraActiveMinutes,
      movementDays: base.weeklyGoal.movementDays + progress.extraMovementDays,
    },
  }
}

export function getMergedDayActiveMinutes(
  baseDayMinutes: number,
  progress: RunWalkWeeklyProgressRecord | null,
  dateIso: string,
): number {
  const extra = progress?.dailyExtraMinutes[dateIso] ?? 0
  return baseDayMinutes + extra
}

export async function recordRunWalkActivityCompletion(
  patientCpf: string,
  activeMinutes: number,
  baseTodayMinutes: number,
  dateIso = toLocalDateIso(new Date()),
): Promise<{
  previousTodayMinutes: number
  newTodayMinutes: number
}> {
  if (!isGuestPatient(patientCpf)) {
    const previousTodayMinutes = baseTodayMinutes
    return {
      previousTodayMinutes,
      newTodayMinutes: previousTodayMinutes + activeMinutes,
    }
  }

  const store = await readLegacyStore()
  const weekStartIso = getWeekStartIso()
  const current =
    store[patientCpf]?.weekStartIso === weekStartIso
      ? store[patientCpf]
      : createEmptyRecord(weekStartIso)

  const previousExtra = current.dailyExtraMinutes[dateIso] ?? 0
  const previousTodayMinutes = baseTodayMinutes + previousExtra
  const totalBefore = previousTodayMinutes
  const totalAfter = totalBefore + activeMinutes

  current.dailyExtraMinutes[dateIso] = previousExtra + activeMinutes
  current.extraCompletedActivities += 1
  current.extraActiveMinutes += activeMinutes

  if (totalBefore <= 0 && totalAfter > 0) {
    current.extraMovementDays += 1
  }

  store[patientCpf] = current
  await writeLegacyStore(store)

  return {
    previousTodayMinutes,
    newTodayMinutes: totalAfter,
  }
}
