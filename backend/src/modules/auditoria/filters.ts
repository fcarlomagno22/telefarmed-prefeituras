import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import type { AuditoriaScopeFilter } from '../../lib/auditoria/types.js'

/** UUID impossível — força resultado vazio quando o escopo não tem atores. */
export const EMPTY_SCOPE_ACTOR_ID = '00000000-0000-0000-0000-000000000000'

type FilterableQuery = PostgrestFilterBuilder<any, any, any, any, any>

function joinOr(parts: string[]): string {
  return parts.filter(Boolean).join(',')
}

function applyActorFilter(
  query: FilterableQuery,
  actorIds: string[] | undefined,
  atorIdOverride?: string,
): FilterableQuery {
  if (atorIdOverride) {
    return query.eq('ator_id', atorIdOverride)
  }
  if (!actorIds?.length) {
    return query.eq('ator_id', EMPTY_SCOPE_ACTOR_ID)
  }
  return query.in('ator_id', actorIds)
}

/**
 * Escopo de acessos (login/logout):
 * - admin: tudo
 * - prefeitura: portais prefeitura + ubt, atores da rede municipal
 * - ubt: portal ubt, atores exclusivos da unidade
 */
export function applyAccessScopeFilter(
  query: FilterableQuery,
  scope: AuditoriaScopeFilter,
  atorIdOverride?: string,
): FilterableQuery {
  if (scope.mode === 'admin') {
    if (atorIdOverride) return query.eq('ator_id', atorIdOverride)
    return query
  }

  if (scope.mode === 'prefeitura') {
    let scoped = query.in('portal', ['prefeitura', 'ubt'])
    return applyActorFilter(scoped, scope.actorIds, atorIdOverride)
  }

  let scoped = query.eq('portal', 'ubt')
  return applyActorFilter(scoped, scope.actorIds, atorIdOverride)
}

/**
 * Escopo de eventos (ações/navegação/API):
 * - admin: tudo
 * - prefeitura: portais prefeitura + ubt da entidade e UBTs vinculadas
 * - ubt: portal ubt, exclusivamente da unidade
 */
export function applyEventScopeFilter(
  query: FilterableQuery,
  scope: AuditoriaScopeFilter,
  atorIdOverride?: string,
): FilterableQuery {
  if (scope.mode === 'admin') {
    if (atorIdOverride) return query.eq('ator_id', atorIdOverride)
    return query
  }

  if (scope.mode === 'prefeitura') {
    const entidadeId = scope.entidadeContratanteId
    const ubtIds = scope.unidadeUbtIds ?? []
    const actorIds = scope.actorIds ?? []

    let scoped = query.in('portal', ['prefeitura', 'ubt'])

    if (atorIdOverride) {
      return scoped.eq('ator_id', atorIdOverride)
    }

    if (!entidadeId && !ubtIds.length && !actorIds.length) {
      return scoped.eq('ator_id', EMPTY_SCOPE_ACTOR_ID)
    }

    const orParts: string[] = []
    if (entidadeId) {
      orParts.push(`entidade_contratante_id.eq.${entidadeId}`)
    }
    if (ubtIds.length) {
      orParts.push(`unidade_ubt_id.in.(${ubtIds.join(',')})`)
    }
    if (actorIds.length) {
      orParts.push(`ator_id.in.(${actorIds.join(',')})`)
    }

    return scoped.or(joinOr(orParts))
  }

  const unidadeUbtId = scope.unidadeUbtId
  const actorIds = scope.actorIds ?? []

  let scoped = query.eq('portal', 'ubt')

  if (atorIdOverride) {
    return scoped.eq('ator_id', atorIdOverride)
  }

  if (!unidadeUbtId && !actorIds.length) {
    return scoped.eq('ator_id', EMPTY_SCOPE_ACTOR_ID)
  }

  const orParts: string[] = []
  if (unidadeUbtId) {
    orParts.push(`unidade_ubt_id.eq.${unidadeUbtId}`)
  }
  if (actorIds.length) {
    orParts.push(`ator_id.in.(${actorIds.join(',')})`)
  }

  return scoped.or(joinOr(orParts))
}
