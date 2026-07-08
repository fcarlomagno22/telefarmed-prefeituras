import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listWeightHistory as fetchWeightHistory,
  registerWeight,
  type MetricDataPointDto,
} from '../lib/api/vd/metricas'
import { MetricDataPoint, PeriodSelection } from '../types/metrics'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'
import { mergeWeightPoint, sortWeightHistory } from '../utils/weightHistory'

const STORAGE_KEY = '@telefarmed/weight-history'

type WeightHistoryStore = Record<string, MetricDataPoint[]>

function mapDtoPoints(points: MetricDataPointDto[]): MetricDataPoint[] {
  return points.map((point) => ({
    date: point.date,
    value: point.value,
    ...(point.hour !== undefined ? { hour: point.hour } : {}),
  }))
}

async function readStore(): Promise<WeightHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      return parsed as WeightHistoryStore
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: WeightHistoryStore) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export async function loadCachedWeightHistory(patientCpf: string): Promise<MetricDataPoint[]> {
  const store = await readStore()
  const history = store[patientCpf]
  return Array.isArray(history) ? sortWeightHistory(history) : []
}

export async function cacheWeightHistory(patientCpf: string, history: MetricDataPoint[]) {
  const store = await readStore()
  store[patientCpf] = sortWeightHistory(history)
  await writeStore(store)
}

export async function loadWeightHistoryDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<MetricDataPoint[]> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadWeightHistory(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadWeightHistory(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<MetricDataPoint[]> {
  if (patientCpf === 'guest') {
    return loadCachedWeightHistory(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const points = mapDtoPoints(await fetchWeightHistory(query))
    await cacheWeightHistory(patientCpf, points)
    return points
  } catch {
    return loadCachedWeightHistory(patientCpf)
  }
}

/** Registra peso no backend e atualiza cache local. */
export async function registerWeightReading(
  patientCpf: string,
  weightKg: number,
  recordedAt?: string,
): Promise<MetricDataPoint[]> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedWeightHistory(patientCpf)
    const point: MetricDataPoint = {
      date: (recordedAt ?? new Date().toISOString()).slice(0, 10),
      value: weightKg,
    }
    const next = mergeWeightPoint(cached, point)
    await cacheWeightHistory(patientCpf, next)
    return next
  }

  try {
    const result = await registerWeight({ weightKg, recordedAt })
    const cached = await loadCachedWeightHistory(patientCpf)
    const next = mergeWeightPoint(cached, {
      date: result.point.date,
      value: result.point.value,
      ...(result.point.hour !== undefined ? { hour: result.point.hour } : {}),
    })
    await cacheWeightHistory(patientCpf, next)

    const refreshed = await loadWeightHistoryDays(patientCpf)
    return refreshed.length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedWeightHistory(patientCpf)
    const point: MetricDataPoint = {
      date: (recordedAt ?? new Date().toISOString()).slice(0, 10),
      value: weightKg,
    }
    const next = mergeWeightPoint(cached, point)
    await cacheWeightHistory(patientCpf, next)
    return next
  }
}
