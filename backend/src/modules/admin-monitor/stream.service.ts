import { supabaseAdmin } from '../../db/supabase.js'
import { loadAdminMonitorCatalog } from './catalog.service.js'
import type { AdminMonitorCatalogUnit } from './types.js'
import type { AdminMonitorStreamEventDto } from './types.js'

const POLL_INTERVAL_MS = 5_000
const HEARTBEAT_INTERVAL_MS = 20_000
const MAX_STREAM_MS = 30 * 60_000
const LOOKBACK_MS = 10_000

type FilaRow = {
  id: string
  entidade_contratante_id: string
  unidade_ubt_id: string
  status: string
  atualizado_em: string
}

type ConsultaRow = {
  id: string
  entidade_contratante_id: string
  unidade_ubt_id: string
  status: string
  atualizado_em: string
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

function throwUnlessMissingRelation(error: unknown): void {
  if (!error) return
  if (!isMissingRelationError(error)) throw error
}

function normalizeEntidadeFilter(entidadeId: string): string | null {
  const id = entidadeId.trim()
  if (!id || id === 'all') return null
  return id
}

function normalizeRegionFilter(regionKey: string): string | null {
  const key = regionKey.trim().toLowerCase()
  if (!key || key === 'all' || key === 'todos') return null
  return regionKey.trim()
}

function filterUnits(
  units: AdminMonitorCatalogUnit[],
  entidadeId: string | null,
  regionKey: string | null,
): AdminMonitorCatalogUnit[] {
  return units.filter((unit) => {
    if (entidadeId && unit.entidadeId !== entidadeId) return false
    if (regionKey && unit.regionKey !== regionKey) return false
    return true
  })
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Aborted'))
      return
    }

    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timer)
      reject(new Error('Aborted'))
    }

    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function mapFilaRow(row: FilaRow): AdminMonitorStreamEventDto {
  return {
    kind: 'fila.updated',
    at: row.atualizado_em,
    entidadeContratanteId: String(row.entidade_contratante_id),
    unidadeUbtId: String(row.unidade_ubt_id),
    filaEsperaId: String(row.id),
    status: String(row.status),
    action: 'updated',
  }
}

function mapConsultaRow(row: ConsultaRow): AdminMonitorStreamEventDto {
  return {
    kind: 'consulta.updated',
    at: row.atualizado_em,
    entidadeContratanteId: String(row.entidade_contratante_id),
    unidadeUbtId: String(row.unidade_ubt_id),
    consultaId: String(row.id),
    status: String(row.status),
    action: 'updated',
  }
}

async function resolveScopedUnitIds(params: {
  entidadeId: string
  regionKey: string
}): Promise<string[]> {
  const entidadeFilter = normalizeEntidadeFilter(params.entidadeId)
  const regionFilter = normalizeRegionFilter(params.regionKey)
  const units = await loadAdminMonitorCatalog()
  return filterUnits(units, entidadeFilter, regionFilter).map((unit) => unit.id)
}

async function pollOperationalEvents(
  unitIds: string[],
  sinceIso: string,
): Promise<{ events: AdminMonitorStreamEventDto[]; watermark: string }> {
  if (unitIds.length === 0) {
    return { events: [], watermark: new Date().toISOString() }
  }

  const [filaResult, consultasResult] = await Promise.all([
    supabaseAdmin
      .from('fila_espera')
      .select('id, entidade_contratante_id, unidade_ubt_id, status, atualizado_em')
      .in('unidade_ubt_id', unitIds)
      .gt('atualizado_em', sinceIso)
      .order('atualizado_em', { ascending: true })
      .limit(50),
    supabaseAdmin
      .from('consultas')
      .select('id, entidade_contratante_id, unidade_ubt_id, status, atualizado_em')
      .in('unidade_ubt_id', unitIds)
      .gt('atualizado_em', sinceIso)
      .order('atualizado_em', { ascending: true })
      .limit(50),
  ])

  if (filaResult.error) throwUnlessMissingRelation(filaResult.error)
  if (consultasResult.error) throwUnlessMissingRelation(consultasResult.error)

  const events: AdminMonitorStreamEventDto[] = [
    ...((filaResult.data ?? []) as FilaRow[]).map(mapFilaRow),
    ...((consultasResult.data ?? []) as ConsultaRow[]).map(mapConsultaRow),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  const latest = events.at(-1)?.at
  const watermark = latest ?? new Date().toISOString()

  return { events, watermark }
}

export function formatSseEvent(event: AdminMonitorStreamEventDto | { type: string }): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export function formatSseHeartbeat(): string {
  return ': ping\n\n'
}

export async function runAdminMonitorStream(params: {
  entidadeId: string
  regionKey: string
  write: (chunk: string) => void
  signal: AbortSignal
}): Promise<void> {
  const unitIds = await resolveScopedUnitIds(params)
  let watermark = new Date(Date.now() - LOOKBACK_MS).toISOString()
  const startedAt = Date.now()
  let lastHeartbeat = Date.now()

  params.write(
    formatSseEvent({
      type: 'connected',
    }),
  )

  while (!params.signal.aborted && Date.now() - startedAt < MAX_STREAM_MS) {
    const { events, watermark: nextWatermark } = await pollOperationalEvents(unitIds, watermark)
    watermark = nextWatermark

    for (const event of events) {
      if (params.signal.aborted) return
      params.write(formatSseEvent(event))
    }

    if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
      params.write(formatSseHeartbeat())
      lastHeartbeat = Date.now()
    }

    await sleep(POLL_INTERVAL_MS, params.signal)
  }
}
