import { supabaseAdmin } from '../../db/supabase.js'

export type UnitMetrics = {
  operatorsOnline: number
  stationsActive: number
  consultationsCompleted: number
  consultationsInProgress: number
  cancellationsToday: number
  avgConsultationMinutes: number
  queueNow: number
  consultationsToday: number
}

const EMPTY_METRICS: UnitMetrics = {
  operatorsOnline: 0,
  stationsActive: 0,
  consultationsCompleted: 0,
  consultationsInProgress: 0,
  cancellationsToday: 0,
  avgConsultationMinutes: 0,
  queueNow: 0,
  consultationsToday: 0,
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

function startOfTodaySaoPauloIso(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}T00:00:00-03:00`
}

export async function fetchUnitsMetrics(
  entidadeId: string,
  unitIds: string[],
  stationsOnlineByUnit: Map<string, number>,
): Promise<Map<string, UnitMetrics>> {
  const metrics = new Map<string, UnitMetrics>()
  for (const unitId of unitIds) {
    metrics.set(unitId, {
      ...EMPTY_METRICS,
      stationsActive: stationsOnlineByUnit.get(unitId) ?? 0,
    })
  }

  if (unitIds.length === 0) return metrics

  const todayStart = startOfTodaySaoPauloIso()

  const [consultasResult, filaResult, operadoresResult] = await Promise.all([
    supabaseAdmin
      .from('consultas')
      .select('unidade_ubt_id, status, duracao_minutos')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
      .gte('criado_em', todayStart),
    supabaseAdmin
      .from('fila_espera')
      .select('unidade_ubt_id')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
      .in('status', ['aguardando', 'chamado']),
    supabaseAdmin
      .from('usuarios_ubt')
      .select('unidade_ubt_id, ultimo_login_em, status')
      .eq('entidade_contratante_id', entidadeId)
      .in('unidade_ubt_id', unitIds)
      .eq('status', 'ativo'),
  ])

  throwUnlessMissingRelation(consultasResult.error)
  throwUnlessMissingRelation(filaResult.error)
  if (operadoresResult.error) throw operadoresResult.error

  const loginThreshold = Date.now() - 8 * 60 * 60 * 1000

  for (const row of consultasResult.data ?? []) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    current.consultationsToday += 1
    const status = String(row.status)

    if (status === 'concluida') {
      current.consultationsCompleted += 1
      if (typeof row.duracao_minutos === 'number' && row.duracao_minutos > 0) {
        const completed = current.consultationsCompleted
        current.avgConsultationMinutes = Math.round(
          (current.avgConsultationMinutes * (completed - 1) + row.duracao_minutos) / completed,
        )
      }
    } else if (status === 'em_andamento' || status === 'aguardando_medico') {
      current.consultationsInProgress += 1
    } else if (status === 'cancelada') {
      current.cancellationsToday += 1
    }
  }

  for (const row of filaResult.data ?? []) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (current) current.queueNow += 1
  }

  const operatorsByUnit = new Map<string, number>()
  for (const row of operadoresResult.data ?? []) {
    const unitId = String(row.unidade_ubt_id)
    const lastLogin = row.ultimo_login_em ? Date.parse(String(row.ultimo_login_em)) : 0
    if (lastLogin >= loginThreshold) {
      operatorsByUnit.set(unitId, (operatorsByUnit.get(unitId) ?? 0) + 1)
    }
  }

  for (const [unitId, count] of operatorsByUnit) {
    const current = metrics.get(unitId)
    if (current) current.operatorsOnline = count
  }

  return metrics
}

export async function fetchUnitMetrics(
  entidadeId: string,
  unitId: string,
  stationsOnline: number,
): Promise<UnitMetrics> {
  const map = await fetchUnitsMetrics(entidadeId, [unitId], new Map([[unitId, stationsOnline]]))
  return map.get(unitId) ?? { ...EMPTY_METRICS, stationsActive: stationsOnline }
}
