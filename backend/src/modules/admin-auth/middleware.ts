import type { FastifyReply, FastifyRequest } from 'fastify'
import {
  type AdminPageId,
  type PermissionAction,
  fullAdminPagePermissions,
  hasAdminPagePermission,
  sanitizeAdminPagePermissions,
} from '../../lib/adminPermissions.js'
import { getCachedAuthSession } from '../../lib/cache/authSessionCache.js'
import { verifyAccessToken } from '../../lib/jwt.js'
import { supabaseAdmin } from '../../db/supabase.js'
import { AuthError } from './service.js'

export type AdminPagePermissions = Record<AdminPageId, PermissionAction[]>

export type AuthenticatedAdmin = {
  id: string
  cpf: string
  nome: string
  accessLevel: string
  isMaster: boolean
  pagePermissions: AdminPagePermissions
}

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AuthenticatedAdmin
  }
}

async function loadAdminSession(userId: string): Promise<AuthenticatedAdmin> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_admin')
    .select('id, cpf, nome, nivel_acesso, eh_master, status, permissoes_paginas')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new AuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'ativo') {
    throw new AuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  return {
    id: String(data.id),
    cpf: String(data.cpf),
    nome: String(data.nome),
    accessLevel: String(data.nivel_acesso),
    isMaster: Boolean(data.eh_master),
    pagePermissions: data.eh_master
      ? fullAdminPagePermissions()
      : sanitizeAdminPagePermissions(data.permissoes_paginas),
  }
}

export async function requireAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  return requireAdminAuthWithToken(request, reply)
}

export async function requireAdminAuthWithToken(
  request: FastifyRequest,
  reply: FastifyReply,
  options?: { allowQueryToken?: boolean },
): Promise<void> {
  const header = request.headers.authorization
  let token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''

  if (!token && options?.allowQueryToken) {
    const query = request.query as { accessToken?: string }
    token = typeof query.accessToken === 'string' ? query.accessToken.trim() : ''
  }

  if (!token) {
    return reply.status(401).send({ error: 'Não autenticado.' })
  }

  try {
    const claims = await verifyAccessToken(token)
    const admin = await getCachedAuthSession('admin', claims.sub, () =>
      loadAdminSession(claims.sub),
    )

    if (admin.cpf !== claims.cpf) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    request.admin = admin
  } catch (error) {
    if (error instanceof AuthError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code })
    }
    return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
  }
}

export function mapAuthError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof AuthError) {
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

export function requireAdminPagePermission(page: AdminPageId, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const admin = request.admin
    if (!admin) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    if (hasAdminPagePermission(admin.pagePermissions, page, action, { isMaster: admin.isMaster })) {
      return
    }

    return reply.status(403).send({
      error: 'Você não tem permissão para esta ação.',
      code: 'FORBIDDEN',
    })
  }
}

export function requireAdminAdministrator() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const admin = request.admin
    if (!admin) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    if (admin.isMaster || admin.accessLevel === 'administrador') {
      return
    }

    return reply.status(403).send({
      error: 'Apenas administradores podem acessar prontuários médicos.',
      code: 'FORBIDDEN',
    })
  }
}
