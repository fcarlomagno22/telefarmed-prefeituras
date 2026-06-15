import AsyncStorage from '@react-native-async-storage/async-storage'
import type {
  WeeklyTrainingStats,
  WorkoutSessionRecord,
} from '../types/functionalTraining'

const FAVORITES_KEY = '@telefarmed/functional-favorites'
const HISTORY_KEY = '@telefarmed/functional-history'

export async function loadFavoriteExerciseIds(patientCpf: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as Record<string, string[]>
    return Array.isArray(parsed[patientCpf]) ? parsed[patientCpf] : []
  } catch {
    return []
  }
}

export async function toggleFavoriteExerciseId(
  patientCpf: string,
  exerciseId: string,
): Promise<string[]> {
  const current = await loadFavoriteExerciseIds(patientCpf)
  const next = current.includes(exerciseId)
    ? current.filter((id) => id !== exerciseId)
    : [...current, exerciseId]

  const raw = await AsyncStorage.getItem(FAVORITES_KEY)
  let all: Record<string, string[]> = {}

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string[]>
      if (parsed && typeof parsed === 'object') all = parsed
    } catch {
      all = {}
    }
  }

  all[patientCpf] = next
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(all))
  return next
}

export async function loadWorkoutHistory(patientCpf: string): Promise<WorkoutSessionRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as WorkoutSessionRecord[]
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item) => item.patientCpf === patientCpf)
      .sort((a, b) => b.completedAtIso.localeCompare(a.completedAtIso))
  } catch {
    return []
  }
}

export async function saveWorkoutSession(entry: WorkoutSessionRecord) {
  const raw = await AsyncStorage.getItem(HISTORY_KEY)
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
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(all))
}

function startOfWeekIso(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString()
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
