import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listGlucoseHistory as fetchGlucoseHistory,
  registerGlucose,
  type GlucoseHistoryEntryDto,
} from '../lib/api/vd/metricas'
import { GlucoseHistoryEntry, GlucoseReadingContext } from '../types/glucose'
import { PeriodSelection } from '../types/metrics'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'
import { getLatestGlucoseEntry, mergeGlucoseReading, sortGlucoseHistory } from '../utils/glucoseHistory'

const STORAGE_KEY = '@telefarmed/glucose-history'

type GlucoseHistoryStore = Record<string, GlucoseHistoryEntry[]>

function mapDtoEntries(entries: GlucoseHistoryEntryDto[]): GlucoseHistoryEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    recordedAt: entry.recordedAt,
    amountMg: entry.amountMg,
    context: entry.context,
  }))
}

async function readStore(): Promise<GlucoseHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      return parsed as GlucoseHistoryStore
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: GlucoseHistoryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedGlucoseHistory(patientCpf: string): Promise<GlucoseHistoryEntry[]> {
  const store = await readStore()
  const history = store[patientCpf]
  return Array.isArray(history) ? sortGlucoseHistory(history) : []
}

export async function cacheGlucoseHistory(patientCpf: string, history: GlucoseHistoryEntry[]) {
  const store = await readStore()
  store[patientCpf] = sortGlucoseHistory(history)
  await writeStore(store)
}

export async function loadGlucoseHistoryDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<GlucoseHistoryEntry[]> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadGlucoseHistory(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadGlucoseHistory(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<GlucoseHistoryEntry[]> {
  if (patientCpf === 'guest') {
    return loadCachedGlucoseHistory(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const readings = mapDtoEntries(await fetchGlucoseHistory(query))
    await cacheGlucoseHistory(patientCpf, readings)
    return readings
  } catch {
    return loadCachedGlucoseHistory(patientCpf)
  }
}

export async function loadLatestGlucoseReading(
  patientCpf: string,
): Promise<GlucoseHistoryEntry | null> {
  const history = await loadGlucoseHistoryDays(patientCpf)
  return getLatestGlucoseEntry(history)
}

/** Registra glicemia no backend e atualiza cache local. */
export async function registerGlucoseReading(
  patientCpf: string,
  amountMg: number,
  context: GlucoseReadingContext,
  recordedAt?: string,
): Promise<GlucoseHistoryEntry[]> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedGlucoseHistory(patientCpf)
    const entry: GlucoseHistoryEntry = {
      id: `guest-${Date.now()}`,
      recordedAt: recordedAt ?? new Date().toISOString(),
      amountMg,
      context,
    }
    const next = mergeGlucoseReading(cached, entry)
    await cacheGlucoseHistory(patientCpf, next)
    return next
  }

  try {
    const result = await registerGlucose({ amountMg, context, recordedAt })
    const cached = await loadCachedGlucoseHistory(patientCpf)
    const next = mergeGlucoseReading(cached, {
      id: result.reading.id,
      recordedAt: result.reading.recordedAt,
      amountMg: result.reading.amountMg,
      context: result.reading.context,
    })
    await cacheGlucoseHistory(patientCpf, next)

    const refreshed = await loadGlucoseHistoryDays(patientCpf)
    return refreshed.length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedGlucoseHistory(patientCpf)
    const entry: GlucoseHistoryEntry = {
      id: `offline-${Date.now()}`,
      recordedAt: recordedAt ?? new Date().toISOString(),
      amountMg,
      context,
    }
    const next = mergeGlucoseReading(cached, entry)
    await cacheGlucoseHistory(patientCpf, next)
    return next
  }
}
