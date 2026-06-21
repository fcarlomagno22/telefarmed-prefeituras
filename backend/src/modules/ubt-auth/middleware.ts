import type { FastifyReply, FastifyRequest } from 'fastify'
import { supabaseAdmin } from '../../db/supabase.js'
import { getCachedAuthSession } from '../../lib/cache/authSessionCache.js'
import { verifyUbtAccessToken } from '../../lib/jwt.js'
import {
  hasUbtPagePermission,
  resolveUbtPagePermissions,
  type PermissionAction,
  type UbtPageId,
} from '../../lib/ubtPermissions.js'
import {
  assertUbtSessionMatchesHost,
  resolveTenantHostHeader,
  TenantHostMismatchError,
} from '../../lib/tenant/loginHost.js'
import { UbtAuthError } from './service.js'
import type { UbtSystemPermissions } from './types.js'

export type AuthenticatedUbtUser = {
  id: string
  cpf: string
  nome: string
  accessLevel: string
  entidadeContratanteId: string
  unidadeUbtId: string
  systemPermissions: UbtSystemPermissions
}

declare module 'fastify' {
  interface FastifyRequest {
    ubtUser?: AuthenticatedUbtUser
  }
}

async function loadUbtSession(userId: string): Promise<AuthenticatedUbtUser> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_ubt')
    .select('id, cpf, nome, nivel_acesso, status, entidade_contratante_id, unidade_ubt_id, permissoes_sistema')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'ativo') {
    throw new UbtAuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  const accessLevel = String(data.nivel_acesso)

  return {
    id: String(data.id),
    cpf: String(data.cpf),
    nome: String(data.nome),
    accessLevel,
    entidadeContratanteId: String(data.entidade_contratante_id),
    unidadeUbtId: String(data.unidade_ubt_id),
    systemPermissions: resolveUbtPagePermissions(accessLevel, data.permissoes_sistema),
  }
}

export async function requireUbtAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Não autenticado.' })
  }

  const token = header.slice('Bearer '.length).trim()
  if (!token) {
    return reply.status(401).send({ error: 'Não autenticado.' })
  }

  try {
    const claims = await verifyUbtAccessToken(token)
    const user = await getCachedAuthSession('ubt', claims.sub, () => loadUbtSession(claims.sub))

    if (user.cpf !== claims.cpf) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    if (user.entidadeContratanteId !== claims.entidadeContratanteId) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    if (user.unidadeUbtId !== claims.unidadeUbtId) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    const tenantHost = resolveTenantHostHeader(request.headers)
    try {
      await assertUbtSessionMatchesHost(user.unidadeUbtId, tenantHost)
    } catch (error) {
      if (error instanceof TenantHostMismatchError) {
        return reply.status(403).send({ error: error.message, code: 'TENANT_HOST_MISMATCH' })
      }
      throw error
    }

    request.ubtUser = user
  } catch (error) {
    if (error instanceof UbtAuthError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code })
    }
    return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
  }
}

export function mapUbtAuthError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof UbtAuthError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}

export function requireUbtPagePermission(page: UbtPageId, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    if (
      hasUbtPagePermission(user.systemPermissions, page, action, {
        accessLevel: user.accessLevel,
      })
    ) {
      return
    }

    return reply.status(403).send({
      error: 'Você não tem permissão para esta ação.',
      code: 'FORBIDDEN',
    })
  }
}

export function requireAnyUbtPagePermission(pages: UbtPageId[], action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.ubtUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    const allowed = pages.some((page) =>
      hasUbtPagePermission(user.systemPermissions, page, action, {
        accessLevel: user.accessLevel,
      }),
    )

    if (allowed) return

    return reply.status(403).send({
      error: 'Você não tem permissão para esta ação.',
      code: 'FORBIDDEN',
    })
  }
}
