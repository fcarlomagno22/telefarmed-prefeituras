import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RunWalkTodayState } from '../types/runWalk'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const STORAGE_KEY = '@telefarmed/run-walk-weekly-progress'

export type RunWalkWeeklyProgressRecord = {
  weekStartIso: string
  dailyExtraMinutes: Record<string, number>
  extraCompletedActivities: number
  extraActiveMinutes: number
  extraMovementDays: number
}

type WeeklyProgressStore = Record<string, RunWalkWeeklyProgressRecord>

export function getWeekStartIso(date = new Date()): string {
  const today = new Date(date)
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return toLocalDateIso(monday)
}

async function readStore(): Promise<WeeklyProgressStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as WeeklyProgressStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: WeeklyProgressStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
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

export async function loadWeeklyProgress(
  patientCpf: string,
): Promise<RunWalkWeeklyProgressRecord | null> {
  const store = await readStore()
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
  const store = await readStore()
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
  await writeStore(store)

  return {
    previousTodayMinutes,
    newTodayMinutes: totalAfter,
  }
}
