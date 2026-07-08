import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listHydrationHistory as fetchHydrationHistory,
  registerHydration,
  type HydrationDayRecordDto,
} from '../lib/api/vd/metricas'
import { HydrationDayRecord } from '../types/hydration'
import { PeriodSelection } from '../types/metrics'
import { mergeHydrationDay, sortHydrationDays } from '../utils/hydrationHistory'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'

const STORAGE_KEY = '@telefarmed/hydration-history'

type HydrationHistoryStore = Record<string, HydrationDayRecord[]>

function mapDtoDays(days: HydrationDayRecordDto[]): HydrationDayRecord[] {
  return days.map((day) => ({
    id: day.id,
    date: day.date,
    totalMl: day.totalMl,
  }))
}

async function readStore(): Promise<HydrationHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      return parsed as HydrationHistoryStore
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: HydrationHistoryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedHydrationHistory(
  patientCpf: string,
): Promise<HydrationDayRecord[]> {
  const store = await readStore()
  const history = store[patientCpf]
  return Array.isArray(history) ? sortHydrationDays(history) : []
}

export async function cacheHydrationHistory(patientCpf: string, history: HydrationDayRecord[]) {
  const store = await readStore()
  store[patientCpf] = sortHydrationDays(history)
  await writeStore(store)
}

export async function loadHydrationHistoryDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<HydrationDayRecord[]> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadHydrationHistory(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadHydrationHistory(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<HydrationDayRecord[]> {
  if (patientCpf === 'guest') {
    return loadCachedHydrationHistory(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const days = mapDtoDays(await fetchHydrationHistory(query))
    await cacheHydrationHistory(patientCpf, days)
    return days
  } catch {
    return loadCachedHydrationHistory(patientCpf)
  }
}

/** Registra hidratação no backend e atualiza cache local. */
export async function registerHydrationReading(
  patientCpf: string,
  amountMl: number,
  recordedAt?: string,
): Promise<HydrationDayRecord[]> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedHydrationHistory(patientCpf)
    const dateKey = (recordedAt ?? new Date().toISOString()).slice(0, 10)
    const existing = cached.find((record) => record.date === dateKey)
    const day: HydrationDayRecord = {
      id: existing?.id ?? `guest-${dateKey}-${Date.now()}`,
      date: dateKey,
      totalMl: (existing?.totalMl ?? 0) + amountMl,
    }
    const next = mergeHydrationDay(cached, day)
    await cacheHydrationHistory(patientCpf, next)
    return next
  }

  try {
    const result = await registerHydration({ amountMl, recordedAt })
    const cached = await loadCachedHydrationHistory(patientCpf)
    const next = mergeHydrationDay(cached, {
      id: result.day.id,
      date: result.day.date,
      totalMl: result.day.totalMl,
    })
    await cacheHydrationHistory(patientCpf, next)

    const refreshed = await loadHydrationHistoryDays(patientCpf)
    return refreshed.length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedHydrationHistory(patientCpf)
    const dateKey = (recordedAt ?? new Date().toISOString()).slice(0, 10)
    const existing = cached.find((record) => record.date === dateKey)
    const day: HydrationDayRecord = {
      id: existing?.id ?? `offline-${dateKey}-${Date.now()}`,
      date: dateKey,
      totalMl: (existing?.totalMl ?? 0) + amountMl,
    }
    const next = mergeHydrationDay(cached, day)
    await cacheHydrationHistory(patientCpf, next)
    return next
  }
}
