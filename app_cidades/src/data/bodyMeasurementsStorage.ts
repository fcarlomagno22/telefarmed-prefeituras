import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listBodyMeasurements as fetchBodyMeasurements,
  registerBodyMeasurement,
  type MetricDataPointDto,
} from '../lib/api/vd/metricas'
import { BodyMeasurementHistory, StorableBodyMeasurementId } from '../types/bodyMeasurements'
import { PeriodSelection } from '../types/metrics'
import {
  buildOfflineBodyMeasurementPoint,
  mapBodyMeasurementsDto,
  mergeBodyMeasurementPoint,
} from '../utils/bodyMeasurementHistory'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'

const STORAGE_KEY = '@telefarmed/body-measurements'

type BodyMeasurementHistoryStore = Record<string, BodyMeasurementHistory>

async function readStore(): Promise<BodyMeasurementHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      return parsed as BodyMeasurementHistoryStore
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: BodyMeasurementHistoryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedBodyMeasurementHistory(
  patientCpf: string,
): Promise<BodyMeasurementHistory> {
  const store = await readStore()
  const history = store[patientCpf]
  return history && typeof history === 'object' ? history : {}
}

export async function cacheBodyMeasurementHistory(
  patientCpf: string,
  history: BodyMeasurementHistory,
) {
  const store = await readStore()
  store[patientCpf] = history
  await writeStore(store)
}

export async function loadBodyMeasurementHistoryDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<BodyMeasurementHistory> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadBodyMeasurementHistory(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadBodyMeasurementHistory(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<BodyMeasurementHistory> {
  if (patientCpf === 'guest') {
    return loadCachedBodyMeasurementHistory(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const result = await fetchBodyMeasurements(query)
    const history = mapBodyMeasurementsDto(result.measurements)
    await cacheBodyMeasurementHistory(patientCpf, history)
    return history
  } catch {
    return loadCachedBodyMeasurementHistory(patientCpf)
  }
}

/** Registra medida corporal no backend e atualiza cache local. */
export async function registerBodyMeasurementReading(
  patientCpf: string,
  measurementId: StorableBodyMeasurementId,
  valueCm: number,
  recordedAt?: string,
): Promise<BodyMeasurementHistory> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedBodyMeasurementHistory(patientCpf)
    const point = buildOfflineBodyMeasurementPoint(measurementId, valueCm, recordedAt)
    const next = mergeBodyMeasurementPoint(cached, measurementId, point)
    await cacheBodyMeasurementHistory(patientCpf, next)
    return next
  }

  try {
    const result = await registerBodyMeasurement({
      measurementId,
      valueCm,
      recordedAt,
    })
    const cached = await loadCachedBodyMeasurementHistory(patientCpf)
    const point: MetricDataPointDto = {
      date: result.point.date,
      value: result.point.value,
      ...(result.point.hour !== undefined ? { hour: result.point.hour } : {}),
    }
    const next = mergeBodyMeasurementPoint(
      cached,
      measurementId,
      {
        date: point.date,
        value: point.value,
        ...(point.hour !== undefined ? { hour: point.hour } : {}),
      },
    )
    await cacheBodyMeasurementHistory(patientCpf, next)

    const refreshed = await loadBodyMeasurementHistoryDays(patientCpf)
    return Object.keys(refreshed).length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedBodyMeasurementHistory(patientCpf)
    const point = buildOfflineBodyMeasurementPoint(measurementId, valueCm, recordedAt)
    const next = mergeBodyMeasurementPoint(cached, measurementId, point)
    await cacheBodyMeasurementHistory(patientCpf, next)
    return next
  }
}
