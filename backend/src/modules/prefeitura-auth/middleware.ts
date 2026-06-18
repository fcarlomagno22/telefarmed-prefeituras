import type { FastifyReply, FastifyRequest } from 'fastify'
import { verifyPrefeituraAccessToken } from '../../lib/jwt.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  hasPrefeituraPagePermission,
  resolvePrefeituraPagePermissions,
  type PermissionAction,
  type PrefeituraPageId,
} from '../../lib/prefeituraPermissions.js'
import {
  assertGestaoSessionMatchesHost,
  resolveTenantHostHeader,
  TenantHostMismatchError,
} from '../../lib/tenant/loginHost.js'
import { PrefeituraAuthError } from './service.js'
import type { PrefeituraPagePermissions } from './types.js'

export type AuthenticatedPrefeituraUser = {
  id: string
  cpf: string
  nome: string
  accessLevel: string
  entidadeContratanteId: string
  pagePermissions: PrefeituraPagePermissions
}

declare module 'fastify' {
  interface FastifyRequest {
    prefeituraUser?: AuthenticatedPrefeituraUser
  }
}

async function loadPrefeituraSession(userId: string): Promise<AuthenticatedPrefeituraUser> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_prefeitura')
    .select('id, cpf, nome, nivel_acesso, status, entidade_contratante_id, permissoes_paginas')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PrefeituraAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'ativo') {
    throw new PrefeituraAuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  const accessLevel = String(data.nivel_acesso)

  return {
    id: String(data.id),
    cpf: String(data.cpf),
    nome: String(data.nome),
    accessLevel,
    entidadeContratanteId: String(data.entidade_contratante_id),
    pagePermissions: resolvePrefeituraPagePermissions(accessLevel, data.permissoes_paginas),
  }
}

export async function requirePrefeituraAuth(
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
    const claims = await verifyPrefeituraAccessToken(token)
    const user = await loadPrefeituraSession(claims.sub)

    if (user.cpf !== claims.cpf) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    if (user.entidadeContratanteId !== claims.entidadeContratanteId) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    const tenantHost = resolveTenantHostHeader(request.headers)
    try {
      await assertGestaoSessionMatchesHost(user.entidadeContratanteId, tenantHost)
    } catch (error) {
      if (error instanceof TenantHostMismatchError) {
        return reply.status(403).send({ error: error.message, code: 'TENANT_HOST_MISMATCH' })
      }
      throw error
    }

    request.prefeituraUser = user
  } catch (error) {
    if (error instanceof PrefeituraAuthError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code })
    }
    return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
  }
}

export function mapPrefeituraAuthError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof PrefeituraAuthError) {
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

export function requirePrefeituraPagePermission(page: PrefeituraPageId, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.prefeituraUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    if (
      hasPrefeituraPagePermission(user.pagePermissions, page, action, {
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
