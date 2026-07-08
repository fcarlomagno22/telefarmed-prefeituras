import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  listActivityHistory as fetchActivityHistory,
  registerWalk,
  syncActivityDaysBatch,
  type AtividadeDayRecordDto,
} from '../lib/api/vd/metricas'
import { ManualWalkEntry, StepsDayRecord } from '../types/steps'
import { PeriodSelection } from '../types/metrics'
import {
  buildManualWalkPayload,
  hasIntegrationStepsRecords,
  mapAtividadeDayRecordDto,
  mapAtividadeDayRecordDtos,
  mergeAtividadeDayRecord,
  mockStepsDayToBatchDay,
} from '../utils/stepsHistory'
import {
  buildDefaultWeightHistoryRange,
  DEFAULT_WEIGHT_HISTORY_DAYS,
  periodSelectionToIsoRange,
} from '../utils/weightHistoryQuery'
import { createMockStepsHistory } from './mockStepsHistory'

const STORAGE_KEY = '@telefarmed/steps-history'

type StepsHistoryStore = Record<string, StepsDayRecord[]>

function serializeRecord(record: StepsDayRecord) {
  return {
    ...record,
    date: record.date.toISOString(),
  }
}

function deserializeRecord(
  stored: Omit<StepsDayRecord, 'date'> & { date: string },
): StepsDayRecord {
  return {
    ...stored,
    date: new Date(stored.date),
  }
}

async function readStore(): Promise<StepsHistoryStore> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return {}
    }

    if (parsed && typeof parsed === 'object') {
      const store = parsed as Record<string, unknown>
      const normalized: StepsHistoryStore = {}

      for (const [cpf, value] of Object.entries(store)) {
        if (!Array.isArray(value)) continue
        normalized[cpf] = value.map((entry) =>
          deserializeRecord(entry as Omit<StepsDayRecord, 'date'> & { date: string }),
        )
      }

      return normalized
    }

    return {}
  } catch {
    return {}
  }
}

async function writeStore(store: StepsHistoryStore) {
  const payload: Record<string, ReturnType<typeof serializeRecord>[]> = {}

  for (const [cpf, records] of Object.entries(store)) {
    payload[cpf] = [...records]
      .sort((left, right) => right.date.getTime() - left.date.getTime())
      .map(serializeRecord)
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export async function loadCachedStepsDayRecords(patientCpf: string): Promise<StepsDayRecord[]> {
  const store = await readStore()
  const records = store[patientCpf]
  return Array.isArray(records)
    ? [...records].sort((left, right) => right.date.getTime() - left.date.getTime())
    : []
}

export async function cacheStepsDayRecords(patientCpf: string, records: StepsDayRecord[]) {
  const store = await readStore()
  store[patientCpf] = [...records].sort(
    (left, right) => right.date.getTime() - left.date.getTime(),
  )
  await writeStore(store)
}

export async function loadStepsDayRecordsDays(
  patientCpf: string,
  days = DEFAULT_WEIGHT_HISTORY_DAYS,
): Promise<StepsDayRecord[]> {
  const range = buildDefaultWeightHistoryRange(days)
  return loadStepsDayRecords(patientCpf, range)
}

/** Carrega histórico do backend; em falha usa cache local por CPF. */
export async function loadStepsDayRecords(
  patientCpf: string,
  range?: { start: string; end: string } | PeriodSelection,
): Promise<StepsDayRecord[]> {
  if (patientCpf === 'guest') {
    return loadCachedStepsDayRecords(patientCpf)
  }

  const query =
    range && 'preset' in range
      ? periodSelectionToIsoRange(range)
      : (range ?? buildDefaultWeightHistoryRange())

  try {
    const result = await fetchActivityHistory(query)
    const records = mapAtividadeDayRecordDtos(result.days)
    await cacheStepsDayRecords(patientCpf, records)
    return records
  } catch {
    return loadCachedStepsDayRecords(patientCpf)
  }
}

function mapDayDto(day: AtividadeDayRecordDto): StepsDayRecord {
  return mapAtividadeDayRecordDto(day)
}

async function persistWalk(
  patientCpf: string,
  payload: { steps: number; durationMinutes?: number; recordedAt?: string },
): Promise<StepsDayRecord[]> {
  if (patientCpf === 'guest') {
    const cached = await loadCachedStepsDayRecords(patientCpf)
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const existing = cached.find(
      (record) => record.date.toDateString() === today.toDateString(),
    )
    const day: StepsDayRecord = existing
      ? {
          ...existing,
          steps: existing.steps + payload.steps,
          source: 'Manual',
        }
      : {
          id: `guest-${Date.now()}`,
          date: today,
          steps: payload.steps,
          source: 'Manual',
        }
    const next = mergeAtividadeDayRecord(cached, day)
    await cacheStepsDayRecords(patientCpf, next)
    return next
  }

  try {
    const result = await registerWalk(payload)
    const cached = await loadCachedStepsDayRecords(patientCpf)
    const day = mapDayDto(result.day)
    const next = mergeAtividadeDayRecord(cached, day)
    await cacheStepsDayRecords(patientCpf, next)

    const refreshed = await loadStepsDayRecordsDays(patientCpf)
    return refreshed.length > 0 ? refreshed : next
  } catch {
    const cached = await loadCachedStepsDayRecords(patientCpf)
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const existing = cached.find(
      (record) => record.date.toDateString() === today.toDateString(),
    )
    const day: StepsDayRecord = existing
      ? {
          ...existing,
          steps: existing.steps + payload.steps,
          source: 'Manual',
        }
      : {
          id: `offline-${Date.now()}`,
          date: today,
          steps: payload.steps,
          source: 'Manual',
        }
    const next = mergeAtividadeDayRecord(cached, day)
    await cacheStepsDayRecords(patientCpf, next)
    return next
  }
}

/** Registra caminhada manual no backend e atualiza cache local. */
export async function registerManualWalk(
  patientCpf: string,
  entry: ManualWalkEntry,
): Promise<StepsDayRecord[]> {
  return persistWalk(patientCpf, buildManualWalkPayload(entry))
}

/** Sincroniza dias de integração mock via POST em lote. */
export async function seedIntegrationStepsDayRecords(
  patientCpf: string,
): Promise<StepsDayRecord[]> {
  const cached = await loadCachedStepsDayRecords(patientCpf)
  if (hasIntegrationStepsRecords(cached)) {
    return loadStepsDayRecordsDays(patientCpf)
  }

  const mockDays = createMockStepsHistory()
    .filter((record) => record.source !== 'Manual')
    .map(mockStepsDayToBatchDay)

  if (patientCpf === 'guest') {
    const next = mapAtividadeDayRecordDtos(
      mockDays.map((day, index) => ({
        id: `guest-activity-${index}`,
        date: day.date,
        steps: day.steps,
        distanceKm: day.distanceKm ?? day.steps * 0.000762,
        source: 'integracao',
        sourceLabel: day.sourceLabel,
      })),
    )
    await cacheStepsDayRecords(patientCpf, next)
    return next
  }

  try {
    await syncActivityDaysBatch({ days: mockDays })
  } catch {
    const offline = mapAtividadeDayRecordDtos(
      mockDays.map((day, index) => ({
        id: `offline-activity-${index}`,
        date: day.date,
        steps: day.steps,
        distanceKm: day.distanceKm ?? day.steps * 0.000762,
        source: 'integracao',
        sourceLabel: day.sourceLabel,
      })),
    )
    const next = [...offline, ...cached.filter((record) => record.source === 'Manual')]
    await cacheStepsDayRecords(patientCpf, next)
    return next
  }

  const refreshed = await loadStepsDayRecordsDays(patientCpf)
  return refreshed.length > 0 ? refreshed : cached
}
