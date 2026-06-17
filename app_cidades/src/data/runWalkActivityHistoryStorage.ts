import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ActivityModality } from '../types/auth'
import type { RunWalkActivitySummary } from './runWalkActivitySummaryStorage'
import {
  calculateAveragePaceMinPerKm,
  calculateAverageSpeedKmh,
  estimateCaloriesBurned,
  type ActivityTrailPoint,
} from '../utils/runWalkActivityStats'
import { toLocalDateIso } from '../utils/runWalkWeeklyChart'

const STORAGE_KEY = '@telefarmed/run-walk-activity-history'

type HistoryStore = Record<string, RunWalkActivitySummary[]>

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

export async function loadRunWalkActivityHistory(
  patientCpf: string,
): Promise<RunWalkActivitySummary[]> {
  const store = await readStore()
  const entries = store[patientCpf] ?? []
  return [...entries].sort(
    (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime(),
  )
}

export async function saveRunWalkHistoryActivity(
  patientCpf: string,
  activity: RunWalkActivitySummary,
) {
  const store = await readStore()
  const current = store[patientCpf] ?? []
  const withoutDuplicate = current.filter((entry) => entry.id !== activity.id)
  store[patientCpf] = [activity, ...withoutDuplicate]
  await writeStore(store)
}

export async function deleteRunWalkHistoryActivity(patientCpf: string, activityId: string) {
  const store = await readStore()
  const current = store[patientCpf] ?? []
  store[patientCpf] = current.filter((entry) => entry.id !== activityId)
  await writeStore(store)
}

function generateMockTrail(seed: number, distanceKm: number): ActivityTrailPoint[] {
  const baseLat = -23.5505 + (seed % 7) * 0.0012
  const baseLng = -46.6333 + (seed % 5) * 0.001
  const pointCount = Math.max(8, Math.round(12 + distanceKm * 6))
  const startedAt = Date.now() - pointCount * 45_000

  return Array.from({ length: pointCount }, (_, index) => ({
    latitude: baseLat + Math.sin(index * 0.45 + seed) * 0.0018 * Math.max(distanceKm, 0.4),
    longitude: baseLng + Math.cos(index * 0.38 + seed) * 0.0016 * Math.max(distanceKm, 0.4),
    recordedAt: startedAt + index * 45_000,
  }))
}

const MOCK_CITIES = [
  { city: 'São Paulo', state: 'SP' },
  { city: 'Campinas', state: 'SP' },
  { city: 'Santos', state: 'SP' },
  { city: 'Guarulhos', state: 'SP' },
  { city: 'Osasco', state: 'SP' },
] as const

function buildMockActivity(
  patientCpf: string,
  daysAgo: number,
  modality: ActivityModality,
  activityName: string,
  elapsedSeconds: number,
  distanceKm: number,
  seed: number,
): RunWalkActivitySummary {
  const completedAt = new Date()
  completedAt.setDate(completedAt.getDate() - daysAgo)
  completedAt.setHours(7 + (seed % 4) * 2, (seed * 11) % 60, 0, 0)

  const activeMinutes = Math.max(1, Math.round(elapsedSeconds / 60))
  const mockPlace = MOCK_CITIES[seed % MOCK_CITIES.length]

  return {
    id: `mock-history-${seed}-${daysAgo}`,
    patientCpf,
    modality,
    activityName,
    elapsedSeconds,
    distanceKm,
    averageSpeedKmh: calculateAverageSpeedKmh(distanceKm, elapsedSeconds),
    paceMinPerKm: calculateAveragePaceMinPerKm(distanceKm, elapsedSeconds),
    stepCount: Math.round(distanceKm * 1350),
    heartRateBpm: 108 + (seed % 28),
    estimatedCalories: estimateCaloriesBurned(modality, elapsedSeconds),
    activeMinutes,
    completedAt: completedAt.toISOString(),
    trail: generateMockTrail(seed, distanceKm),
    locationCity: mockPlace.city,
    locationState: mockPlace.state,
  }
}

const MOCK_HISTORY_BLUEPRINT: Array<{
  daysAgo: number
  modality: ActivityModality
  activityName: string
  elapsedSeconds: number
  distanceKm: number
}> = [
  { daysAgo: 0, modality: 'walk', activityName: 'Caminhada tranquila', elapsedSeconds: 28 * 60, distanceKm: 2.4 },
  { daysAgo: 1, modality: 'run-walk', activityName: 'Corrida e caminhada', elapsedSeconds: 32 * 60, distanceKm: 3.8 },
  { daysAgo: 2, modality: 'run', activityName: 'Corrida contínua', elapsedSeconds: 24 * 60, distanceKm: 3.2 },
  { daysAgo: 4, modality: 'active-walk', activityName: 'Caminhada ativa', elapsedSeconds: 35 * 60, distanceKm: 3.5 },
  { daysAgo: 5, modality: 'walk', activityName: 'Caminhada leve', elapsedSeconds: 22 * 60, distanceKm: 1.9 },
  { daysAgo: 7, modality: 'run-walk', activityName: 'Corrida e caminhada', elapsedSeconds: 30 * 60, distanceKm: 3.4 },
  { daysAgo: 9, modality: 'run', activityName: 'Corrida moderada', elapsedSeconds: 26 * 60, distanceKm: 3.6 },
  { daysAgo: 11, modality: 'walk', activityName: 'Caminhada tranquila', elapsedSeconds: 25 * 60, distanceKm: 2.1 },
  { daysAgo: 14, modality: 'run-walk', activityName: 'Intervalado leve', elapsedSeconds: 34 * 60, distanceKm: 4.1 },
  { daysAgo: 16, modality: 'active-walk', activityName: 'Caminhada ativa', elapsedSeconds: 38 * 60, distanceKm: 4.2 },
  { daysAgo: 19, modality: 'run', activityName: 'Corrida contínua', elapsedSeconds: 29 * 60, distanceKm: 4.4 },
  { daysAgo: 22, modality: 'walk', activityName: 'Caminhada leve', elapsedSeconds: 20 * 60, distanceKm: 1.7 },
  { daysAgo: 25, modality: 'run-walk', activityName: 'Corrida e caminhada', elapsedSeconds: 31 * 60, distanceKm: 3.7 },
  { daysAgo: 28, modality: 'run', activityName: 'Corrida moderada', elapsedSeconds: 27 * 60, distanceKm: 3.9 },
  { daysAgo: 33, modality: 'walk', activityName: 'Caminhada tranquila', elapsedSeconds: 26 * 60, distanceKm: 2.3 },
  { daysAgo: 38, modality: 'run-walk', activityName: 'Intervalado leve', elapsedSeconds: 33 * 60, distanceKm: 3.9 },
  { daysAgo: 45, modality: 'run', activityName: 'Corrida contínua', elapsedSeconds: 25 * 60, distanceKm: 3.5 },
  { daysAgo: 52, modality: 'active-walk', activityName: 'Caminhada ativa', elapsedSeconds: 36 * 60, distanceKm: 4.0 },
  { daysAgo: 61, modality: 'walk', activityName: 'Caminhada leve', elapsedSeconds: 21 * 60, distanceKm: 1.8 },
  { daysAgo: 74, modality: 'run-walk', activityName: 'Corrida e caminhada', elapsedSeconds: 30 * 60, distanceKm: 3.6 },
]

export async function ensureRunWalkHistorySeeded(patientCpf: string) {
  const existing = await loadRunWalkActivityHistory(patientCpf)

  if (existing.length === 0) {
    const seeded = MOCK_HISTORY_BLUEPRINT.map((item, index) =>
      buildMockActivity(
        patientCpf,
        item.daysAgo,
        item.modality,
        item.activityName,
        item.elapsedSeconds,
        item.distanceKm,
        index + 1,
      ),
    )

    const store = await readStore()
    store[patientCpf] = seeded
    await writeStore(store)
    return
  }

  const needsLocationPatch = existing.some(
    (entry) => !entry.locationCity?.trim() && !entry.locationState?.trim(),
  )
  if (!needsLocationPatch) return

  const patched = existing.map((entry, index) => {
    if (entry.locationCity?.trim() || entry.locationState?.trim()) return entry
    const mockPlace = MOCK_CITIES[index % MOCK_CITIES.length]
    return {
      ...entry,
      locationCity: mockPlace.city,
      locationState: mockPlace.state,
    }
  })

  const store = await readStore()
  store[patientCpf] = patched
  await writeStore(store)
}

export async function ensureTodayRunWalkActivity(patientCpf: string) {
  await ensureRunWalkHistorySeeded(patientCpf)

  const todayIso = toLocalDateIso(new Date())
  const existing = await loadRunWalkActivityHistory(patientCpf)
  const hasToday = existing.some((activity) => getActivityDateIso(activity) === todayIso)
  if (hasToday) return

  const todayActivity = buildMockActivity(
    patientCpf,
    0,
    'active-walk',
    'Caminhada ativa',
    36 * 60,
    3.2,
    42,
  )
  await saveRunWalkHistoryActivity(patientCpf, todayActivity)
}

export function getActivityDateIso(activity: RunWalkActivitySummary) {
  return toLocalDateIso(new Date(activity.completedAt))
}
