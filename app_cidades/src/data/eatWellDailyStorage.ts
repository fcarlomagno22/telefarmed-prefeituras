import AsyncStorage from '@react-native-async-storage/async-storage'
import type { EatWellDailyRecord } from '../types/eatWell'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'
import { createSeedDailyRecord } from './mockEatWellFoods'
import { buildCurrentWeekSeedRecords } from './eatWellWeekSeed'

const STORAGE_KEY = '@telefarmed/eat-well-daily'
const SEEDED_KEY = '@telefarmed/eat-well-daily-seeded'
const SEED_VERSION_KEY = '@telefarmed/eat-well-seed-version'
const CURRENT_SEED_VERSION = 4

function isDailyRecordEmpty(record: EatWellDailyRecord) {
  const hasMeals = record.meals.some((meal) => meal.entries.length > 0)
  const hasWater = record.waterLogs.length > 0
  return !hasMeals && !hasWater
}

type DailyStore = Record<string, Record<string, EatWellDailyRecord>>

function emptyRecord(dateIso: string): EatWellDailyRecord {
  return { dateIso, meals: [], waterLogs: [] }
}

async function readStore(): Promise<DailyStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DailyStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeStore(store: DailyStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

async function readSeededPatients(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEDED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

async function markSeeded(patientCpf: string) {
  const seeded = await readSeededPatients()
  seeded.add(patientCpf)
  await AsyncStorage.setItem(SEEDED_KEY, JSON.stringify([...seeded]))
}

async function refreshTodaySeedIfNeeded(patientCpf: string) {
  const storedVersion = await AsyncStorage.getItem(SEED_VERSION_KEY)
  if (storedVersion === String(CURRENT_SEED_VERSION)) return

  const todayIso = toLocalDateIso(new Date())
  const store = await readStore()
  const patientRecords = store[patientCpf] ?? {}
  patientRecords[todayIso] = createSeedDailyRecord(todayIso)
  store[patientCpf] = patientRecords
  await writeStore(store)
  await AsyncStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}

export async function ensureEatWellDailySeeded(patientCpf: string) {
  const seeded = await readSeededPatients()
  if (seeded.has(patientCpf)) {
    await refreshTodaySeedIfNeeded(patientCpf)
    return
  }

  const todayIso = toLocalDateIso(new Date())
  const store = await readStore()
  const patientRecords = store[patientCpf] ?? {}

  if (!patientRecords[todayIso]) {
    patientRecords[todayIso] = createSeedDailyRecord(todayIso)
  }

  for (const record of buildCurrentWeekSeedRecords()) {
    if (!patientRecords[record.dateIso]) {
      patientRecords[record.dateIso] = record
    }
  }

  store[patientCpf] = patientRecords
  await writeStore(store)

  await markSeeded(patientCpf)
  await AsyncStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}

export async function loadEatWellDailyRecord(
  patientCpf: string,
  dateIso: string,
): Promise<EatWellDailyRecord> {
  await ensureEatWellDailySeeded(patientCpf)
  const store = await readStore()
  const stored = store[patientCpf]?.[dateIso] ?? emptyRecord(dateIso)
  if (isDailyRecordEmpty(stored)) {
    return createSeedDailyRecord(dateIso)
  }
  return stored
}

export async function saveEatWellDailyRecord(patientCpf: string, record: EatWellDailyRecord) {
  const store = await readStore()
  const patientRecords = store[patientCpf] ?? {}
  patientRecords[record.dateIso] = record
  store[patientCpf] = patientRecords
  await writeStore(store)
}

export async function loadEatWellStreakDays(patientCpf: string, referenceDate = new Date()) {
  const store = await readStore()
  const patientRecords = store[patientCpf] ?? {}
  let streak = 0

  const cursor = new Date(referenceDate)
  cursor.setHours(0, 0, 0, 0)

  while (true) {
    const dateIso = toLocalDateIso(cursor)
    const record = patientRecords[dateIso]
    const hasData =
      record &&
      (record.meals.some((meal) => meal.entries.length > 0) || record.waterLogs.length > 0)

    if (!hasData) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export async function countWaterGoalDaysThisWeek(
  patientCpf: string,
  waterGoalMl: number,
  referenceDate = new Date(),
) {
  const store = await readStore()
  const patientRecords = store[patientCpf] ?? {}
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday

  let count = 0
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + index)
    if (date.getTime() > today.getTime()) continue

    const dateIso = toLocalDateIso(date)
    const record = patientRecords[dateIso]
    const waterMl = record?.waterLogs.reduce((sum, log) => sum + log.ml, 0) ?? 0
    if (waterMl >= waterGoalMl) count += 1
  }

  return count
}

export function buildWeekDayStrip(referenceDate = new Date()) {
  const today = new Date(referenceDate)
  today.setHours(0, 0, 0, 0)
  const weekday = today.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + mondayOffset + index)
    const dateIso = toLocalDateIso(date)
    const weekdayLabel = date
      .toLocaleDateString('pt-BR', { weekday: 'short' })
      .replace('.', '')
      .slice(0, 3)
    const dayNumber = date.getDate()

    return {
      dateIso,
      weekdayLabel,
      dayNumber,
      isToday: date.getTime() === today.getTime(),
      isFuture: date.getTime() > today.getTime(),
    }
  })
}
