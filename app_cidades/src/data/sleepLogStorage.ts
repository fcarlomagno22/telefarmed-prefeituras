import AsyncStorage from '@react-native-async-storage/async-storage'
import { isSleepTimeApiEnabled } from '../config/sleepTimeApi'
import {
  listSleepLogs as fetchSleepLogsFromApi,
  registerSleepLog as registerSleepLogOnApi,
  type CreateSleepTimeRegistroInput,
  type SleepTimeRegistroDto,
} from '../lib/api/vd/sleepTime'
import type { SleepLogEntry } from '../types/sleepLog'
import {
  buildSleepAtIsoFromParts,
  extractSleepDatePartsFromIso,
} from '../utils/sleepLogFormat'
import {
  enqueueSleepLogSync,
  loadSleepLogSyncQueue,
  removeSleepLogSyncEntries,
} from './sleepLogSyncQueue'
import { parseMonthKey } from '../utils/eatWellCalendarDays'

const LEGACY_LOGS_KEY = '@telefarmed/sleep-logs'
const CACHE_KEY = '@telefarmed/sleep-logs-cache'
const MIGRATION_KEY = '@telefarmed/sleep-logs-migrated'
const FETCHED_MONTHS_KEY = '@telefarmed/sleep-logs-fetched-months'

const REMOTE_PULL_DAYS = 90
const REMOTE_PAGE_SIZE = 100
const REMOTE_MAX_PAGES = 10
const SYNC_DEBOUNCE_MS = 60_000

type SleepLogStore = Record<string, SleepLogEntry[]>
type MigrationStore = Record<string, true>
type FetchedMonthsStore = Record<string, string[]>

const lastSyncStartedAt = new Map<string, number>()
const syncInFlight = new Map<string, Promise<void>>()

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function shouldUseSleepTimeApi(patientCpf: string) {
  return isSleepTimeApiEnabled() && !isGuestPatient(patientCpf)
}

function sortSleepLogEntries(entries: SleepLogEntry[]) {
  return [...entries].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

function formatMonthKey(year: number, monthIndex: number) {
  const month = String(monthIndex + 1).padStart(2, '0')
  return `${year}-${month}`
}

function getMonthIsoBounds(monthKey: string): { startIso: string; endIso: string } {
  const { year, monthIndex } = parseMonthKey(monthKey)
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

function monthKeysBetween(start: Date, end: Date): string[] {
  const keys: string[] = []
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1)

  while (cursor <= endCursor) {
    keys.push(formatMonthKey(cursor.getFullYear(), cursor.getMonth()))
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return keys
}

async function readJsonStore<T>(key: string): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return {} as T

    const parsed = JSON.parse(raw) as T
    return parsed && typeof parsed === 'object' ? parsed : ({} as T)
  } catch {
    return {} as T
  }
}

async function writeJsonStore<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

async function readLegacyLogs(patientCpf: string): Promise<SleepLogEntry[]> {
  const store = await readJsonStore<SleepLogStore>(LEGACY_LOGS_KEY)
  const entries = store[patientCpf]
  return Array.isArray(entries) ? sortSleepLogEntries(entries) : []
}

async function writeLegacyLogs(patientCpf: string, entries: SleepLogEntry[]) {
  const store = await readJsonStore<SleepLogStore>(LEGACY_LOGS_KEY)
  store[patientCpf] = sortSleepLogEntries(entries)
  await writeJsonStore(LEGACY_LOGS_KEY, store)
}

async function readSleepLogsCache(patientCpf: string): Promise<SleepLogEntry[]> {
  const store = await readJsonStore<SleepLogStore>(CACHE_KEY)
  const entries = store[patientCpf]
  return Array.isArray(entries) ? sortSleepLogEntries(entries) : []
}

async function writeSleepLogsCache(patientCpf: string, entries: SleepLogEntry[]) {
  const store = await readJsonStore<SleepLogStore>(CACHE_KEY)
  store[patientCpf] = sortSleepLogEntries(entries)
  await writeJsonStore(CACHE_KEY, store)
}

async function readFetchedMonths(patientCpf: string): Promise<Set<string>> {
  const store = await readJsonStore<FetchedMonthsStore>(FETCHED_MONTHS_KEY)
  const months = store[patientCpf]
  return new Set(Array.isArray(months) ? months : [])
}

async function markMonthsFetched(patientCpf: string, monthKeys: string[]) {
  if (monthKeys.length === 0) return

  const store = await readJsonStore<FetchedMonthsStore>(FETCHED_MONTHS_KEY)
  const existing = new Set(store[patientCpf] ?? [])

  for (const monthKey of monthKeys) {
    existing.add(monthKey)
  }

  store[patientCpf] = [...existing]
  await writeJsonStore(FETCHED_MONTHS_KEY, store)
}

function mapSleepLogEntryToCreateInput(entry: SleepLogEntry): CreateSleepTimeRegistroInput {
  return {
    clientLogId: entry.id,
    bedAt: buildSleepAtIsoFromParts(entry.bedDateIso, entry.bedTimeMinutes),
    wakeAt: buildSleepAtIsoFromParts(entry.wakeDateIso, entry.wakeTimeMinutes),
    quality: entry.quality,
    wakeCount: entry.wakeCount,
    notes: entry.notes,
  }
}

function mapSleepTimeRegistroDtoToEntry(dto: SleepTimeRegistroDto): SleepLogEntry {
  const bed = extractSleepDatePartsFromIso(dto.bedAt)
  const wake = extractSleepDatePartsFromIso(dto.wakeAt)

  return {
    id: dto.clientLogId,
    bedDateIso: bed.dateIso,
    bedTimeMinutes: bed.timeMinutes,
    wakeDateIso: wake.dateIso,
    wakeTimeMinutes: wake.timeMinutes,
    durationMinutes: dto.durationMinutes,
    quality: dto.quality,
    wakeCount: dto.wakeCount,
    notes: dto.notes ?? undefined,
    createdAt: dto.createdAt,
  }
}

async function upsertSleepLogCache(patientCpf: string, entry: SleepLogEntry): Promise<SleepLogEntry[]> {
  const current = await readSleepLogsCache(patientCpf)
  const next = sortSleepLogEntries([
    entry,
    ...current.filter((item) => item.id !== entry.id),
  ])
  await writeSleepLogsCache(patientCpf, next)
  return next
}

async function hasMigratedLegacyData(patientCpf: string): Promise<boolean> {
  const store = await readJsonStore<MigrationStore>(MIGRATION_KEY)
  return store[patientCpf] === true
}

async function markLegacyDataMigrated(patientCpf: string) {
  const store = await readJsonStore<MigrationStore>(MIGRATION_KEY)
  store[patientCpf] = true
  await writeJsonStore(MIGRATION_KEY, store)
}

async function loadLocalSleepLogs(patientCpf: string): Promise<SleepLogEntry[]> {
  const cached = await readSleepLogsCache(patientCpf)
  const queue = await loadSleepLogSyncQueue(patientCpf)
  const pending = queue.map((item) => item.entry)
  const byId = new Map<string, SleepLogEntry>()

  for (const entry of [...cached, ...pending]) {
    byId.set(entry.id, entry)
  }

  return sortSleepLogEntries([...byId.values()])
}

async function mergeRemoteEntriesIntoCache(
  patientCpf: string,
  remoteEntries: SleepLogEntry[],
): Promise<SleepLogEntry[]> {
  const current = await readSleepLogsCache(patientCpf)
  const byId = new Map<string, SleepLogEntry>()

  for (const entry of current) {
    byId.set(entry.id, entry)
  }

  for (const entry of remoteEntries) {
    const existing = byId.get(entry.id)
    if (!existing || new Date(entry.createdAt).getTime() >= new Date(existing.createdAt).getTime()) {
      byId.set(entry.id, entry)
    }
  }

  const merged = sortSleepLogEntries([...byId.values()])
  await writeSleepLogsCache(patientCpf, merged)
  return merged
}

async function pullRemoteSleepLogsInRange(
  patientCpf: string,
  startIso: string,
  endIso: string,
): Promise<SleepLogEntry[]> {
  const remoteEntries: SleepLogEntry[] = []
  let page = 1
  let hasMore = true

  while (hasMore && page <= REMOTE_MAX_PAGES) {
    const result = await fetchSleepLogsFromApi({
      startIso,
      endIso,
      page,
      pageSize: REMOTE_PAGE_SIZE,
    })

    remoteEntries.push(...result.registros.map(mapSleepTimeRegistroDtoToEntry))
    hasMore = result.hasMore
    page += 1
  }

  return mergeRemoteEntriesIntoCache(patientCpf, remoteEntries)
}

async function pullRemoteSleepLogs(patientCpf: string): Promise<SleepLogEntry[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - REMOTE_PULL_DAYS)

  const entries = await pullRemoteSleepLogsInRange(
    patientCpf,
    start.toISOString(),
    end.toISOString(),
  )

  await markMonthsFetched(patientCpf, monthKeysBetween(start, end))
  return entries
}

async function flushSleepLogSyncQueue(patientCpf: string): Promise<void> {
  if (!shouldUseSleepTimeApi(patientCpf)) return

  const queue = await loadSleepLogSyncQueue(patientCpf)
  if (queue.length === 0) return

  const syncedIds: string[] = []

  for (const item of queue) {
    try {
      await registerSleepLogOnApi(mapSleepLogEntryToCreateInput(item.entry))
      await upsertSleepLogCache(patientCpf, item.entry)
      syncedIds.push(item.id)
    } catch {
      break
    }
  }

  if (syncedIds.length > 0) {
    await removeSleepLogSyncEntries(syncedIds)
  }
}

async function migrateLegacySleepLogs(patientCpf: string): Promise<void> {
  if (!shouldUseSleepTimeApi(patientCpf)) return
  if (await hasMigratedLegacyData(patientCpf)) return

  const legacyEntries = await readLegacyLogs(patientCpf)

  for (const entry of legacyEntries) {
    await upsertSleepLogCache(patientCpf, entry)
    try {
      await registerSleepLogOnApi(mapSleepLogEntryToCreateInput(entry))
      await removeSleepLogSyncEntries([`sync-${entry.id}`])
    } catch {
      await enqueueSleepLogSync(patientCpf, entry)
    }
  }

  await markLegacyDataMigrated(patientCpf)
}

export async function syncSleepLogs(
  patientCpf: string,
  options: { force?: boolean } = {},
): Promise<void> {
  if (!shouldUseSleepTimeApi(patientCpf)) return

  const now = Date.now()
  const lastStartedAt = lastSyncStartedAt.get(patientCpf) ?? 0
  if (!options.force && now - lastStartedAt < SYNC_DEBOUNCE_MS) {
    const inFlight = syncInFlight.get(patientCpf)
    if (inFlight) await inFlight
    return
  }

  const run = (async () => {
    lastSyncStartedAt.set(patientCpf, Date.now())

    await migrateLegacySleepLogs(patientCpf)
    await flushSleepLogSyncQueue(patientCpf)

    try {
      await pullRemoteSleepLogs(patientCpf)
    } catch {
      // Mantém cache local se o pull falhar (offline).
    }
  })()

  syncInFlight.set(patientCpf, run)

  try {
    await run
  } finally {
    syncInFlight.delete(patientCpf)
  }
}

/** Carrega registros de um mês antigo sob demanda (fora da janela inicial de 90 dias). */
export async function ensureSleepLogsLoadedForMonth(
  patientCpf: string,
  monthKey: string,
): Promise<void> {
  if (!shouldUseSleepTimeApi(patientCpf)) return

  const fetchedMonths = await readFetchedMonths(patientCpf)
  if (fetchedMonths.has(monthKey)) return

  const { startIso, endIso } = getMonthIsoBounds(monthKey)

  try {
    await pullRemoteSleepLogsInRange(patientCpf, startIso, endIso)
    await markMonthsFetched(patientCpf, [monthKey])
  } catch {
    // Offline — mantém apenas o cache local já disponível.
  }
}

export async function loadSleepLogs(patientCpf: string): Promise<SleepLogEntry[]> {
  if (!shouldUseSleepTimeApi(patientCpf)) {
    const legacy = await readLegacyLogs(patientCpf)
    const cached = await readSleepLogsCache(patientCpf)
    if (legacy.length > 0 && cached.length === 0) {
      await writeSleepLogsCache(patientCpf, legacy)
    }

    return loadLocalSleepLogs(patientCpf)
  }

  return loadLocalSleepLogs(patientCpf)
}

export async function loadSleepLogData(patientCpf: string): Promise<SleepLogEntry[]> {
  return loadSleepLogs(patientCpf)
}

export async function saveSleepLog(patientCpf: string, entry: SleepLogEntry) {
  await upsertSleepLogCache(patientCpf, entry)

  if (!shouldUseSleepTimeApi(patientCpf)) {
    const legacy = await readLegacyLogs(patientCpf)
    const nextLegacy = sortSleepLogEntries([
      entry,
      ...legacy.filter((item) => item.id !== entry.id),
    ])
    await writeLegacyLogs(patientCpf, nextLegacy)
    return
  }

  try {
    await registerSleepLogOnApi(mapSleepLogEntryToCreateInput(entry))
    await removeSleepLogSyncEntries([`sync-${entry.id}`])
  } catch {
    await enqueueSleepLogSync(patientCpf, entry)
  }
}

export async function bootstrapSleepLogsSync(patientCpf: string): Promise<void> {
  if (!shouldUseSleepTimeApi(patientCpf)) return

  try {
    await syncSleepLogs(patientCpf)
  } catch {
    // Offline ou erro transitório — cache e fila local permanecem válidos.
  }
}

/** Dispara sync de sono sem bloquear a UI (login, bootstrap, mount de tela). */
export function startSleepLogsBackgroundSync(patientCpf: string): void {
  if (!shouldUseSleepTimeApi(patientCpf)) return
  void syncSleepLogs(patientCpf)
}
