import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listBloodPressureHistory as fetchBloodPressureHistory,
  registerBloodPressure,
  type BloodPressureHistoryEntryDto,
} from '../lib/api/vd/metricas'
import { BloodPressureHistoryEntry } from '../types/bloodPressure'
import { PeriodSelection } from '../types/metrics'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'
import {
  getLatestBloodPressureEntry,
  mergeBloodPressureReading,
  sortBloodPressureHistoryAscending,
} from '../utils/bloodPressureHistory'

const STORAGE_KEY = '@telefarmed/blood-pressure-history'

type BloodPressureHistoryStore = Record<string, BloodPressureHistoryEntry[]>

function mapDtoEntries(entries: BloodPressureHistoryEntryDto[]): BloodPressureHistoryEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    recordedAt: entry.recordedAt,
    systolic: entry.systolic,
    diastolic: entry.diastolic,
  }))
}

async function readStore(): Promise<BloodPressureHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      return parsed as BloodPressureHistoryStore
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: BloodPressureHistoryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedBloodPressureHistory(
  patientCpf: string,
): Promise<BloodPressureHistoryEntry[]> {
  const store = await readStore()
  const history = store[patientCpf]
  return Array.isArray(history) ? sortBloodPressureHistoryAscending(history) : []
}

export async function cacheBloodPressureHistory(
  patientCpf: string,
  history: BloodPressureHistoryEntry[],
) {
  const store = await readStore()
  store[patientCpf] = sortBloodPressureHistoryAscending(history)
  await writeStore(store)
}

export async function loadBloodPressureHistoryDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<BloodPressureHistoryEntry[]> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadBloodPressureHistory(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadBloodPressureHistory(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<BloodPressureHistoryEntry[]> {
  if (patientCpf === 'guest') {
    return loadCachedBloodPressureHistory(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const readings = mapDtoEntries(await fetchBloodPressureHistory(query))
    await cacheBloodPressureHistory(patientCpf, readings)
    return readings
  } catch {
    return loadCachedBloodPressureHistory(patientCpf)
  }
}

export async function loadLatestBloodPressureReading(
  patientCpf: string,
): Promise<BloodPressureHistoryEntry | null> {
  const history = await loadBloodPressureHistoryDays(patientCpf)
  return getLatestBloodPressureEntry(history)
}

/** Registra pressão no backend e atualiza cache local. */
export async function registerBloodPressureReading(
  patientCpf: string,
  systolic: number,
  diastolic: number,
  recordedAt?: string,
): Promise<BloodPressureHistoryEntry[]> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedBloodPressureHistory(patientCpf)
    const entry: BloodPressureHistoryEntry = {
      id: `guest-${Date.now()}`,
      recordedAt: recordedAt ?? new Date().toISOString(),
      systolic,
      diastolic,
    }
    const next = mergeBloodPressureReading(cached, entry)
    await cacheBloodPressureHistory(patientCpf, next)
    return next
  }

  try {
    const result = await registerBloodPressure({ systolic, diastolic, recordedAt })
    const cached = await loadCachedBloodPressureHistory(patientCpf)
    const next = mergeBloodPressureReading(cached, {
      id: result.reading.id,
      recordedAt: result.reading.recordedAt,
      systolic: result.reading.systolic,
      diastolic: result.reading.diastolic,
    })
    await cacheBloodPressureHistory(patientCpf, next)

    const refreshed = await loadBloodPressureHistoryDays(patientCpf)
    return refreshed.length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedBloodPressureHistory(patientCpf)
    const entry: BloodPressureHistoryEntry = {
      id: `offline-${Date.now()}`,
      recordedAt: recordedAt ?? new Date().toISOString(),
      systolic,
      diastolic,
    }
    const next = mergeBloodPressureReading(cached, entry)
    await cacheBloodPressureHistory(patientCpf, next)
    return next
  }
}
