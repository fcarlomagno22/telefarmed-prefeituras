import type { FastifyReply, FastifyRequest } from 'fastify'
import { getCachedAuthSession } from '../../lib/cache/authSessionCache.js'
import { verifyVdPacienteAccessToken } from '../../lib/jwt.js'
import { supabaseAdmin } from '../../db/supabase.js'
import {
  assertVdSessionMatchesHost,
  resolveTenantHostHeader,
  TenantHostMismatchError,
} from '../../lib/tenant/loginHost.js'
import { VdAuthError } from './service.js'

export type AuthenticatedVdUser = {
  credencialId: string
  pacienteId: string
  cpf: string
  nome: string
  entidadeContratanteId: string
}

declare module 'fastify' {
  interface FastifyRequest {
    vdUser?: AuthenticatedVdUser
  }
}

async function loadVdSession(credencialId: string): Promise<AuthenticatedVdUser> {
  const { data, error } = await supabaseAdmin
    .from('paciente_credenciais')
    .select('id, paciente_id, cpf, status, entidade_contratante_id')
    .eq('id', credencialId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new VdAuthError('Usuário não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'ativo') {
    throw new VdAuthError('Conta inativa.', 'USER_INACTIVE', 403)
  }

  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from('pacientes')
    .select('nome, status')
    .eq('id', data.paciente_id)
    .maybeSingle()

  if (pacienteError) throw pacienteError
  if (!paciente || paciente.status !== 'ativo') {
    throw new VdAuthError('Conta inativa.', 'USER_INACTIVE', 403)
  }

  return {
    credencialId: String(data.id),
    pacienteId: String(data.paciente_id),
    cpf: String(data.cpf),
    nome: String(paciente.nome),
    entidadeContratanteId: String(data.entidade_contratante_id),
  }
}

export async function requireVdAuth(
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
    const claims = await verifyVdPacienteAccessToken(token)
    const user = await getCachedAuthSession('vd', claims.sub, () => loadVdSession(claims.sub))

    if (user.cpf !== claims.cpf) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    if (user.pacienteId !== claims.pacienteId) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    if (user.entidadeContratanteId !== claims.entidadeContratanteId) {
      return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
    }

    const tenantHost = resolveTenantHostHeader(request.headers)
    try {
      await assertVdSessionMatchesHost(user.entidadeContratanteId, tenantHost)
    } catch (error) {
      if (error instanceof TenantHostMismatchError) {
        return reply.status(403).send({ error: error.message, code: 'TENANT_HOST_MISMATCH' })
      }
      throw error
    }

    request.vdUser = user
  } catch (error) {
    if (error instanceof VdAuthError) {
      return reply.status(error.statusCode).send({ error: error.message, code: error.code })
    }
    return reply.status(401).send({ error: 'Sessão inválida ou expirada.' })
  }
}

export function mapVdAuthError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  if (error instanceof VdAuthError) {
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
