import { supabaseAdmin } from '../../db/supabase.js'
import type { AuditoriaScopeFilter, ListAuditoriaQuery } from '../../lib/auditoria/types.js'

export async function loadPrefeituraActorIds(entidadeId: string): Promise<string[]> {
  const [gestores, operadores] = await Promise.all([
    supabaseAdmin.from('usuarios_prefeitura').select('id').eq('entidade_contratante_id', entidadeId),
    supabaseAdmin.from('usuarios_ubt').select('id').eq('entidade_contratante_id', entidadeId),
  ])

  if (gestores.error) throw gestores.error
  if (operadores.error) throw operadores.error

  return [
    ...(gestores.data ?? []).map((row) => String(row.id)),
    ...(operadores.data ?? []).map((row) => String(row.id)),
  ]
}

export async function loadPrefeituraUbtIds(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}

export async function loadUbtActorIds(unidadeUbtId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('id')
    .eq('unidade_ubt_id', unidadeUbtId)

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}

/**
 * Resolve o filtro de escopo da auditoria:
 * - admin: sem restrição (todos os portais, todos os atores)
 * - prefeitura: portais prefeitura + ubt da entidade e UBTs vinculadas
 * - ubt: exclusivamente a unidade UBT informada
 */
export async function resolveAuditoriaScopeFilter(
  scope: AuditoriaScopeFilter['mode'],
  context: { entidadeContratanteId?: string; unidadeUbtId?: string },
): Promise<AuditoriaScopeFilter> {
  if (scope === 'admin') {
    return { mode: 'admin' }
  }

  if (scope === 'prefeitura') {
    const entidadeContratanteId = context.entidadeContratanteId
    if (!entidadeContratanteId) {
      return { mode: 'prefeitura', entidadeContratanteId, unidadeUbtIds: [], actorIds: [] }
    }

    const [actorIds, unidadeUbtIds] = await Promise.all([
      loadPrefeituraActorIds(entidadeContratanteId),
      loadPrefeituraUbtIds(entidadeContratanteId),
    ])

    return { mode: 'prefeitura', entidadeContratanteId, unidadeUbtIds, actorIds }
  }

  const unidadeUbtId = context.unidadeUbtId
  if (!unidadeUbtId) {
    return { mode: 'ubt', unidadeUbtId, actorIds: [] }
  }

  const actorIds = await loadUbtActorIds(unidadeUbtId)
  return { mode: 'ubt', unidadeUbtId, actorIds }
}

export function mergeAuditoriaQueryLimits(query: ListAuditoriaQuery) {
  const limit = query.limit ?? 100
  const offset = query.offset ?? 0
  const fetchLimit = Math.min(limit + offset, 1000)
  return { limit, offset, fetchLimit }
}
