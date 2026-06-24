import AsyncStorage from '@react-native-async-storage/async-storage'
import type { MyRoutineWeeklyReview } from '../types/myRoutine'

const STORAGE_KEY = '@telefarmed/my-routine-weekly-reviews'

type MyRoutineWeeklyReviewStore = Record<string, MyRoutineWeeklyReview[]>

async function readStore(): Promise<MyRoutineWeeklyReviewStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MyRoutineWeeklyReviewStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: MyRoutineWeeklyReviewStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadMyRoutineWeeklyReviews(
  patientCpf: string,
): Promise<MyRoutineWeeklyReview[]> {
  const store = await readStore()
  const entries = store[patientCpf]
  if (!Array.isArray(entries)) return []

  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function loadMyRoutineWeeklyReviewForWeek(
  patientCpf: string,
  weekStartIso: string,
): Promise<MyRoutineWeeklyReview | null> {
  const entries = await loadMyRoutineWeeklyReviews(patientCpf)
  return entries.find((entry) => entry.weekStartIso === weekStartIso) ?? null
}

export async function saveMyRoutineWeeklyReview(
  patientCpf: string,
  review: MyRoutineWeeklyReview,
) {
  const store = await readStore()
  const current = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  const withoutWeek = current.filter((item) => item.weekStartIso !== review.weekStartIso)
  store[patientCpf] = [review, ...withoutWeek]
  await writeStore(store)
}

export async function markMyRoutineWeeklyReviewApplied(
  patientCpf: string,
  reviewId: string,
) {
  const store = await readStore()
  const current = Array.isArray(store[patientCpf]) ? store[patientCpf] : []
  store[patientCpf] = current.map((item) =>
    item.id === reviewId ? { ...item, appliedAt: new Date().toISOString() } : item,
  )
  await writeStore(store)
}
