import type { FastifyReply, FastifyRequest } from 'fastify'
import { supabaseAdmin } from '../../db/supabase.js'
import { verifyProfissionalAccessToken } from '../../lib/jwt.js'
import {
  resolveProfissionalPagePermissions,
  type PermissionAction,
  type ProfissionalPageId,
  hasAnyProfissionalPagePermission,
  hasProfissionalPagePermission,
} from '../../lib/profissionalPermissions.js'
import { ProfissionalAuthError } from './service.js'
import type { ProfissionalPagePermissions } from './types.js'

export type AuthenticatedProfissionalUser = {
  id: string
  cpf: string
  nome: string
  pagePermissions: ProfissionalPagePermissions
}

declare module 'fastify' {
  interface FastifyRequest {
    profissionalUser?: AuthenticatedProfissionalUser
  }
}

async function loadProfissionalSession(userId: string): Promise<AuthenticatedProfissionalUser> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, cpf, nome, status, permissoes_paginas')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'ativo') {
    throw new ProfissionalAuthError('Usuário inativo.', 'USER_INACTIVE', 403)
  }

  return {
    id: String(data.id),
    cpf: String(data.cpf),
    nome: String(data.nome),
    pagePermissions: resolveProfissionalPagePermissions(data.permissoes_paginas),
  }
}

export async function requireProfissionalAuth(
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
    const claims = await verifyProfissionalAccessToken(token)
    const user = await loadProfissionalSession(claims.sub)

    if (user.cpf !== claims.cpf) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    request.profissionalUser = user
  } catch (error) {
    if (error instanceof ProfissionalAuthError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code })
    }
    return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
  }
}

function isMissingRefreshSessionsTable(error: unknown): boolean {
  const pgCode =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : null

  const message =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : ''

  return (
    pgCode === 'PGRST205' ||
    message.includes('sessoes_refresh_profissional') ||
    message.includes('schema cache')
  )
}

export function mapProfissionalAuthError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof ProfissionalAuthError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code },
    }
  }

  if (isMissingRefreshSessionsTable(error)) {
    return {
      statusCode: 503,
      body: {
        error:
          'Módulo de sessão profissional indisponível: aplique a migration sessoes_refresh_profissional no Supabase.',
        code: 'SERVICE_UNAVAILABLE',
      },
    }
  }

  return {
    statusCode: 500,
    body: { error: 'Erro interno.' },
  }
}

export function requireProfissionalPagePermission(page: ProfissionalPageId, action: PermissionAction) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.profissionalUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    if (hasProfissionalPagePermission(user.pagePermissions, page, action)) {
      return
    }

    return reply.status(403).send({
      error: 'Você não tem permissão para esta ação.',
      code: 'FORBIDDEN',
    })
  }
}

export function requireAnyProfissionalPagePermission(
  pages: ProfissionalPageId[],
  action: PermissionAction,
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.profissionalUser
    if (!user) {
      return reply.status(401).send({ error: 'Não autenticado.' })
    }

    if (hasAnyProfissionalPagePermission(user.pagePermissions, pages, action)) {
      return
    }

    return reply.status(403).send({
      error: 'Você não tem permissão para esta ação.',
      code: 'FORBIDDEN',
    })
  }
}
