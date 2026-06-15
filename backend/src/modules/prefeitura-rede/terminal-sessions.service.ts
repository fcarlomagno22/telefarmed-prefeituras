import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeMaintenanceIndexes } from './formatters.js'
import type { RedeUnitStatus } from './types.js'

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

export function resolveStationsOnlineFromActiveSessions(
  stationsTotal: number,
  maintenanceIndexes: number[],
  status: RedeUnitStatus,
  activeSessionCount: number,
): number {
  if (status === 'inativa') return 0

  const maintenanceCount = normalizeMaintenanceIndexes(maintenanceIndexes, stationsTotal).length
  const available = Math.max(0, stationsTotal - maintenanceCount)
  return Math.min(Math.max(0, activeSessionCount), available)
}

export async function loadActiveUbtTerminalSessionsByUnit(
  unitIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (unitIds.length === 0) return counts

  const { data: operators, error: operatorsError } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('id, unidade_ubt_id')
    .in('unidade_ubt_id', unitIds)
    .eq('status', 'ativo')

  if (operatorsError) throw operatorsError

  const operatorRows = (operators ?? []) as Array<{ id: string; unidade_ubt_id: string }>
  if (operatorRows.length === 0) return counts

  const unitByOperator = new Map<string, string>()
  for (const row of operatorRows) {
    unitByOperator.set(String(row.id), String(row.unidade_ubt_id))
  }

  const nowIso = new Date().toISOString()
  const { data: sessions, error: sessionsError } = await supabaseAdmin
    .from('sessoes_refresh_ubt')
    .select('usuario_id')
    .in('usuario_id', [...unitByOperator.keys()])
    .is('revogado_em', null)
    .gt('expira_em', nowIso)

  throwUnlessMissingRelation(sessionsError)
  if (sessionsError) throw sessionsError

  for (const row of (sessions ?? []) as Array<{ usuario_id: string }>) {
    const unitId = unitByOperator.get(String(row.usuario_id))
    if (!unitId) continue
    counts.set(unitId, (counts.get(unitId) ?? 0) + 1)
  }

  return counts
}
