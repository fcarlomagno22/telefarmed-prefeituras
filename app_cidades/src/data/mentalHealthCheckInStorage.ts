import AsyncStorage from '@react-native-async-storage/async-storage'
import type { MentalHealthCheckInEntry } from '../types/mentalHealth'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import {
  loadMentalHealthDailyRecord,
  saveMentalHealthDailyRecord,
} from './mentalHealthDailyStorage'
import { resolveCheckInCardState } from '../utils/mentalHealthCheckIn'

const CHECKINS_KEY = '@telefarmed/mental-health-check-ins'
const HISTORY_COUNT_KEY = '@telefarmed/mental-health-history-count'

type MentalHealthCheckInStore = Record<string, MentalHealthCheckInEntry[]>

function todayIso() {
  return toLocalDateIso(new Date())
}

function createEntryId() {
  return `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

async function readCheckInStore(): Promise<MentalHealthCheckInStore> {
  try {
    const raw = await AsyncStorage.getItem(CHECKINS_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as MentalHealthCheckInStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeCheckInStore(store: MentalHealthCheckInStore) {
  await AsyncStorage.setItem(CHECKINS_KEY, JSON.stringify(store))
}

async function readHistoryCounts(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_COUNT_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeHistoryCounts(counts: Record<string, number>) {
  await AsyncStorage.setItem(HISTORY_COUNT_KEY, JSON.stringify(counts))
}

export async function loadMentalHealthCheckInEntries(
  patientCpf: string,
): Promise<MentalHealthCheckInEntry[]> {
  const store = await readCheckInStore()
  const entries = store[patientCpf] ?? []
  return [...entries].sort(
    (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
  )
}

export function getTodayCheckInEntries(entries: MentalHealthCheckInEntry[]) {
  const today = todayIso()
  return entries.filter((entry) => toLocalDateIso(new Date(entry.recordedAt)) === today)
}

export async function loadMentalHealthCheckInCardData(patientCpf: string) {
  const entries = await loadMentalHealthCheckInEntries(patientCpf)
  const todayEntries = getTodayCheckInEntries(entries)
  const latestEntry = todayEntries[0] ?? null

  return resolveCheckInCardState(latestEntry, entries)
}

export async function clearTodayMentalHealthCheckIns(patientCpf: string) {
  const store = await readCheckInStore()
  const entries = store[patientCpf] ?? []
  const today = todayIso()

  store[patientCpf] = entries.filter(
    (entry) => toLocalDateIso(new Date(entry.recordedAt)) !== today,
  )
  await writeCheckInStore(store)

  const daily = await loadMentalHealthDailyRecord(patientCpf)
  await saveMentalHealthDailyRecord(patientCpf, {
    ...daily,
    checkInCompleted: false,
  })
}

export async function saveMentalHealthCheckInEntry(
  patientCpf: string,
  input: Omit<MentalHealthCheckInEntry, 'id' | 'recordedAt'> & {
    id?: string
    recordedAt?: string
  },
) {
  const store = await readCheckInStore()
  const current = store[patientCpf] ?? []

  const entry: MentalHealthCheckInEntry = {
    id: input.id ?? createEntryId(),
    recordedAt: input.recordedAt ?? new Date().toISOString(),
    mood: input.mood,
    moodReason: input.moodReason ?? null,
    emotions: input.emotions,
    emotionIntensity: input.emotionIntensity ?? null,
    mainInfluence: input.mainInfluence,
    influenceValence: input.influenceValence ?? null,
    influenceDetail: input.influenceDetail ?? null,
    reactions: input.reactions ?? [],
    reactionHelp: input.reactionHelp ?? null,
    isQuickEntry: input.isQuickEntry,
  }

  store[patientCpf] = [entry, ...current]
  await writeCheckInStore(store)

  const historyCounts = await readHistoryCounts()
  historyCounts[patientCpf] = (historyCounts[patientCpf] ?? 0) + 1
  await writeHistoryCounts(historyCounts)

  const daily = await loadMentalHealthDailyRecord(patientCpf)
  await saveMentalHealthDailyRecord(patientCpf, {
    ...daily,
    checkInCompleted: true,
  })

  return entry
}

export async function seedMockMentalHealthCheckInHistory(patientCpf: string) {
  const existing = await loadMentalHealthCheckInEntries(patientCpf)
  if (existing.length >= 3) return

  const now = Date.now()
  const mockEntries: MentalHealthCheckInEntry[] = [
    {
      id: createEntryId(),
      recordedAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      mood: 'good',
      emotions: ['Tranquilo'],
      mainInfluence: 'Família',
      isQuickEntry: false,
    },
    {
      id: createEntryId(),
      recordedAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
      mood: 'neutral',
      emotions: ['Cansado'],
      mainInfluence: 'Trabalho',
      isQuickEntry: false,
    },
  ]

  const store = await readCheckInStore()
  store[patientCpf] = [...mockEntries, ...(store[patientCpf] ?? [])]
  await writeCheckInStore(store)

  const historyCounts = await readHistoryCounts()
  historyCounts[patientCpf] = Math.max(historyCounts[patientCpf] ?? 0, 3)
  await writeHistoryCounts(historyCounts)
}
