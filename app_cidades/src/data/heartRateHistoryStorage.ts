import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listHeartRateHistory as fetchHeartRateHistory,
  registerHeartRate,
} from '../lib/api/vd/metricas'
import { HeartRateContext, HeartRateReading } from '../types/heartRate'
import {
  buildOfflineHeartRateReading,
  heartRateReadingToRegisterInput,
  mapHeartRateHistoryEntryDto,
  mapHeartRateHistoryEntryDtos,
  mergeHeartRateReading,
} from '../utils/heartRateHistory'
import { sortHeartRateReadings } from '../utils/heartRate'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'
import { PeriodSelection } from '../types/metrics'
import { createMockHeartRateHistory } from './mockHeartRateHistory'

const STORAGE_KEY = '@telefarmed/heart-rate-history'

type HeartRateHistoryStore = Record<string, HeartRateReading[]>

function serializeReading(reading: HeartRateReading) {
  return {
    ...reading,
    recordedAt: reading.recordedAt.toISOString(),
  }
}

function deserializeReading(
  stored: Omit<HeartRateReading, 'recordedAt'> & { recordedAt: string },
): HeartRateReading {
  return {
    ...stored,
    recordedAt: new Date(stored.recordedAt),
  }
}

async function readStore(): Promise<HeartRateHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      const store = parsed as Record<string, unknown>
      const normalized: HeartRateHistoryStore = {}

      for (const [cpf, value] of Object.entries(store)) {
        if (!Array.isArray(value)) continue
        normalized[cpf] = value.map((entry) =>
          deserializeReading(
            entry as Omit<HeartRateReading, 'recordedAt'> & { recordedAt: string },
          ),
        )
      }

      return normalized
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: HeartRateHistoryStore) {
  const payload: Record<string, ReturnType<typeof serializeReading>[]> = {}

  for (const [cpf, readings] of Object.entries(store)) {
    payload[cpf] = sortHeartRateReadings(readings).map(serializeReading)
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export async function loadCachedHeartRateHistory(
  patientCpf: string,
): Promise<HeartRateReading[]> {
  const store = await readStore()
  const history = store[patientCpf]
  return Array.isArray(history) ? sortHeartRateReadings(history) : []
}

export async function cacheHeartRateHistory(
  patientCpf: string,
  history: HeartRateReading[],
) {
  const store = await readStore()
  store[patientCpf] = sortHeartRateReadings(history)
  await writeStore(store)
}

export async function loadHeartRateHistoryDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<HeartRateReading[]> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadHeartRateHistory(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadHeartRateHistory(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<HeartRateReading[]> {
  if (patientCpf === 'guest') {
    return loadCachedHeartRateHistory(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const result = await fetchHeartRateHistory(query)
    const readings = mapHeartRateHistoryEntryDtos(result.readings)
    await cacheHeartRateHistory(patientCpf, readings)
    return readings
  } catch {
    return loadCachedHeartRateHistory(patientCpf)
  }
}

type RegisterHeartRateInput = {
  bpm: number
  recordedAt?: string
  source?: 'manual' | 'integracao'
  context?: HeartRateContext
  sourceLabel?: string
}

async function persistHeartRateReading(
  patientCpf: string,
  input: RegisterHeartRateInput,
): Promise<HeartRateReading[]> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedHeartRateHistory(patientCpf)
    const reading = buildOfflineHeartRateReading(input)
    const next = mergeHeartRateReading(cached, reading)
    await cacheHeartRateHistory(patientCpf, next)
    return next
  }

  try {
    const result = await registerHeartRate(input)
    const cached = await loadCachedHeartRateHistory(patientCpf)
    const reading = mapHeartRateHistoryEntryDto(result.reading)
    const next = mergeHeartRateReading(cached, reading)
    await cacheHeartRateHistory(patientCpf, next)

    const refreshed = await loadHeartRateHistoryDays(patientCpf)
    return refreshed.length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedHeartRateHistory(patientCpf)
    const reading = buildOfflineHeartRateReading(input)
    const next = mergeHeartRateReading(cached, reading)
    await cacheHeartRateHistory(patientCpf, next)
    return next
  }
}

/** Registra leitura no backend e atualiza cache local. */
export async function registerHeartRateReading(
  patientCpf: string,
  reading: HeartRateReading,
): Promise<HeartRateReading[]> {
  return persistHeartRateReading(patientCpf, heartRateReadingToRegisterInput(reading))
}

/** Registra leitura de integração mock via API até existir SDK real. */
export async function seedIntegrationHeartRateReadings(
  patientCpf: string,
): Promise<HeartRateReading[]> {
  const cached = await loadCachedHeartRateHistory(patientCpf)
  if (cached.some((reading) => reading.source !== 'Manual')) {
    return loadHeartRateHistoryDays(patientCpf)
  }

  const mockReadings = createMockHeartRateHistory().filter(
    (reading) => reading.source !== 'Manual',
  )

  let next = cached
  for (const reading of mockReadings) {
    next = await persistHeartRateReading(patientCpf, {
      bpm: reading.bpm,
      recordedAt: reading.recordedAt.toISOString(),
      source: 'integracao',
      context: reading.context === 'manual' ? 'resting' : reading.context,
      sourceLabel: reading.source,
    })
  }

  const refreshed = await loadHeartRateHistoryDays(patientCpf)
  return refreshed.length > 0 ? refreshed : next
}
