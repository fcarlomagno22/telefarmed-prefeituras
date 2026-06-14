import { supabaseAdmin } from '../../db/supabase.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'

const POLL_INTERVAL_MS = 5_000
const HEARTBEAT_INTERVAL_MS = 20_000
const MAX_STREAM_MS = 30 * 60_000
const LOOKBACK_MS = 10_000

export type PrefeituraMonitorStreamEventDto = {
  kind: 'fila.updated' | 'consulta.updated'
  at: string
  entidadeContratanteId: string
  unidadeUbtId: string
  filaEsperaId?: string
  consultaId?: string
  status?: string
  action?: string
}

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

function filterUnitsByRegion(units: RedeUnitApi[], regionKey: string): RedeUnitApi[] {
  const active = units.filter((unit) => unit.status !== 'inativa')
  if (regionKey === 'todas') return active
  return active.filter((unit) => unit.regionKey === regionKey)
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

function mapFilaRow(row: FilaRow): PrefeituraMonitorStreamEventDto {
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

function mapConsultaRow(row: ConsultaRow): PrefeituraMonitorStreamEventDto {
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

async function pollOperationalEvents(
  entidadeId: string,
  unitIds: string[],
  sinceIso: string,
): Promise<{ events: PrefeituraMonitorStreamEventDto[]; watermark: string }> {
  if (unitIds.length === 0) {
    return { events: [], watermark: new Date().toISOString() }
  }

  const [filaResult, consultasResult] = await Promise.all([
    supabaseAdmin
      .from('fila_espera')
      .select('id, entidade_contratante_id, unidade_ubt_id, status, atualizado_em')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
      .gt('atualizado_em', sinceIso)
      .order('atualizado_em', { ascending: true })
      .limit(50),
    supabaseAdmin
      .from('consultas')
      .select('id, entidade_contratante_id, unidade_ubt_id, status, atualizado_em')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
      .gt('atualizado_em', sinceIso)
      .order('atualizado_em', { ascending: true })
      .limit(50),
  ])

  if (filaResult.error) throwUnlessMissingRelation(filaResult.error)
  if (consultasResult.error) throwUnlessMissingRelation(consultasResult.error)

  const events: PrefeituraMonitorStreamEventDto[] = [
    ...((filaResult.data ?? []) as FilaRow[]).map(mapFilaRow),
    ...((consultasResult.data ?? []) as ConsultaRow[]).map(mapConsultaRow),
  ].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  const latest = events.at(-1)?.at
  const watermark = latest ?? new Date().toISOString()

  return { events, watermark }
}

export function formatSseEvent(
  event: PrefeituraMonitorStreamEventDto | { type: string },
): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export function formatSseHeartbeat(): string {
  return ': ping\n\n'
}

export async function runPrefeituraMonitorStream(params: {
  entidadeId: string
  regionKey: string
  write: (chunk: string) => void
  signal: AbortSignal
}): Promise<void> {
  const units = await listRedeUnits(params.entidadeId)
  const unitIds = filterUnitsByRegion(units, params.regionKey).map((unit) => unit.id)

  let watermark = new Date(Date.now() - LOOKBACK_MS).toISOString()
  const startedAt = Date.now()
  let lastHeartbeat = Date.now()

  params.write(formatSseEvent({ type: 'connected' }))

  while (!params.signal.aborted && Date.now() - startedAt < MAX_STREAM_MS) {
    const { events, watermark: nextWatermark } = await pollOperationalEvents(
      params.entidadeId,
      unitIds,
      watermark,
    )
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
