import type { z } from 'zod'
import { sanitizeSleepLogNotes } from './notes.js'
import type {
  createSleepTimeRegistroBodySchema,
  listSleepTimeRegistrosQuerySchema,
} from './schemas.js'
import type {
  AppSleepLogEntry,
  SleepTimeRegistroRow,
  SleepQualityScore,
  VdSleepTimePacienteScope,
} from './types.js'

export type CreateSleepTimeRegistroInput = z.infer<typeof createSleepTimeRegistroBodySchema>
export type ListSleepTimeRegistrosQuery = z.infer<typeof listSleepTimeRegistrosQuerySchema>

const APP_TIMEZONE = 'America/Sao_Paulo'

export type SleepTimeRegistroDto = {
  id: string
  clientLogId: string
  bedAt: string
  wakeAt: string
  durationMinutes: number
  quality: SleepQualityScore
  wakeCount: number
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type SleepTimeRegistroListResultDto = {
  registros: SleepTimeRegistroDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type InsertRegistroRow = {
  paciente_id: string
  entidade_contratante_id: string
  client_log_id: string
  bed_at: string
  wake_at: string
  duration_minutes: number
  quality: SleepQualityScore
  wake_count: number
  notes: string | null
}

export function computeDurationMinutes(bedAt: string, wakeAt: string): number {
  const bedMs = Date.parse(bedAt)
  const wakeMs = Date.parse(wakeAt)
  return Math.max(1, Math.round((wakeMs - bedMs) / 60_000))
}

function getDateKeyInAppTz(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new Error('Data inválida.')
  }

  return `${year}-${month}-${day}`
}

function getTimeMinutesInAppTz(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')
  return hour * 60 + minute
}

/**
 * Converte partes locais do app (dateIso + minutos desde meia-noite) para ISO.
 * Usa America/Sao_Paulo (offset -03:00), alinhado ao fuso padrão do app no Brasil.
 */
export function buildSleepAtIsoFromParts(dateIso: string, timeMinutes: number): string {
  const hours = Math.floor(timeMinutes / 60)
  const minutes = timeMinutes % 60
  const paddedHours = String(hours).padStart(2, '0')
  const paddedMinutes = String(minutes).padStart(2, '0')
  return `${dateIso}T${paddedHours}:${paddedMinutes}:00.000-03:00`
}

/** Extrai dateIso + timeMinutes no fuso do app a partir de um instante ISO. */
export function extractSleepDatePartsFromIso(iso: string): {
  dateIso: string
  timeMinutes: number
} {
  const date = new Date(iso)
  return {
    dateIso: getDateKeyInAppTz(date),
    timeMinutes: getTimeMinutesInAppTz(date),
  }
}

/**
 * Mapeia `SleepLogEntry` do app para body de POST /registros.
 * `entry.id` → `clientLogId`; `durationMinutes` do app é ignorado (recalculado no servidor).
 */
export function mapAppSleepLogEntryToCreateInput(entry: AppSleepLogEntry): CreateSleepTimeRegistroInput {
  return {
    clientLogId: entry.id,
    bedAt: buildSleepAtIsoFromParts(entry.bedDateIso, entry.bedTimeMinutes),
    wakeAt: buildSleepAtIsoFromParts(entry.wakeDateIso, entry.wakeTimeMinutes),
    quality: entry.quality,
    wakeCount: entry.wakeCount,
    notes: entry.notes,
  }
}

/**
 * Mapeia DTO da API para formato local `SleepLogEntry` do app.
 * `clientLogId` → `id`; `id` (UUID servidor) fica apenas no cache de sync do app.
 */
export function mapRegistroDtoToAppSleepLogEntry(
  dto: SleepTimeRegistroDto,
  options: { serverId?: string } = {},
): AppSleepLogEntry & { serverId?: string } {
  const bedParts = extractSleepDatePartsFromIso(dto.bedAt)
  const wakeParts = extractSleepDatePartsFromIso(dto.wakeAt)

  return {
    id: dto.clientLogId,
    bedDateIso: bedParts.dateIso,
    bedTimeMinutes: bedParts.timeMinutes,
    wakeDateIso: wakeParts.dateIso,
    wakeTimeMinutes: wakeParts.timeMinutes,
    durationMinutes: dto.durationMinutes,
    quality: dto.quality,
    wakeCount: dto.wakeCount,
    notes: dto.notes ?? undefined,
    createdAt: dto.createdAt,
    ...(dto.id ? { serverId: options.serverId ?? dto.id } : {}),
  }
}

export function mapRegistroRow(row: SleepTimeRegistroRow): SleepTimeRegistroDto {
  return {
    id: row.id,
    clientLogId: row.client_log_id,
    bedAt: row.bed_at,
    wakeAt: row.wake_at,
    durationMinutes: row.duration_minutes,
    quality: row.quality,
    wakeCount: row.wake_count,
    notes: row.notes,
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }
}

export function mapCreateInputToInsertRow(
  scope: VdSleepTimePacienteScope,
  input: CreateSleepTimeRegistroInput,
): InsertRegistroRow {
  const notes = sanitizeSleepLogNotes(input.notes)
  return {
    paciente_id: scope.pacienteId,
    entidade_contratante_id: scope.entidadeContratanteId,
    client_log_id: input.clientLogId.trim(),
    bed_at: input.bedAt,
    wake_at: input.wakeAt,
    duration_minutes: computeDurationMinutes(input.bedAt, input.wakeAt),
    quality: input.quality,
    wake_count: input.wakeCount,
    notes,
  }
}

export function buildRegistroListResult(
  rows: SleepTimeRegistroRow[],
  totalCount: number,
  page: number,
  pageSize: number,
): SleepTimeRegistroListResultDto {
  return {
    registros: rows.map(mapRegistroRow),
    totalCount,
    hasMore: page * pageSize < totalCount,
    page,
    pageSize,
  }
}

export function resolveRegistroListBounds(query: ListSleepTimeRegistrosQuery): {
  startIso: string | null
  endIso: string | null
} {
  return {
    startIso: query.startIso ?? null,
    endIso: query.endIso ?? null,
  }
}
