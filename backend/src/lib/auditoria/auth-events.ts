import type { FastifyRequest } from 'fastify'
import { normalizeCpf } from '../cpf.js'
import { extractClientIp, extractUserAgent } from './context.js'
import { logAuditoriaAcessoSafe } from './write.service.js'
import type { AuditoriaPortal } from './types.js'

export function auditAuthLoginSuccess(
  portal: AuditoriaPortal,
  request: FastifyRequest,
  input: {
    atorId: string
    atorNome: string
    cpf: string
    role?: string
    entidadeContratanteId?: string
    unidadeUbtId?: string
  },
): void {
  logAuditoriaAcessoSafe({
    portal,
    acao: 'login_sucesso',
    atorId: input.atorId,
    atorNome: input.atorNome,
    cpf: input.cpf,
    ip: extractClientIp(request),
    userAgent: extractUserAgent(request),
    metadata: {
      role: input.role ?? '',
      entidadeContratanteId: input.entidadeContratanteId ?? null,
      unidadeUbtId: input.unidadeUbtId ?? null,
    },
  })
}

export function auditAuthLoginFailure(
  portal: AuditoriaPortal,
  request: FastifyRequest,
  input: {
    cpf?: string
    atorId?: string | null
    atorNome?: string
    reason?: string
  },
): void {
  logAuditoriaAcessoSafe({
    portal,
    acao: 'login_falha',
    atorId: input.atorId ?? null,
    atorNome: input.atorNome ?? 'Tentativa de login',
    cpf: input.cpf ? normalizeCpf(input.cpf) : '',
    ip: extractClientIp(request),
    userAgent: extractUserAgent(request),
    metadata: {
      reason: input.reason ?? 'invalid_credentials',
    },
  })
}

export function auditAuthRefresh(
  portal: AuditoriaPortal,
  request: FastifyRequest,
  input: {
    atorId: string
    atorNome: string
    cpf: string
    role?: string
  },
): void {
  logAuditoriaAcessoSafe({
    portal,
    acao: 'refresh',
    atorId: input.atorId,
    atorNome: input.atorNome,
    cpf: input.cpf,
    ip: extractClientIp(request),
    userAgent: extractUserAgent(request),
    metadata: { role: input.role ?? '' },
  })
}

export function auditAuthLogout(
  portal: AuditoriaPortal,
  request: FastifyRequest,
  input: {
    atorId?: string | null
    atorNome?: string
    cpf?: string
  },
): void {
  logAuditoriaAcessoSafe({
    portal,
    acao: 'logout',
    atorId: input.atorId ?? null,
    atorNome: input.atorNome ?? 'Usuário',
    cpf: input.cpf ?? '',
    ip: extractClientIp(request),
    userAgent: extractUserAgent(request),
    metadata: {},
  })
}

export function auditAuthSessionRevoked(
  portal: AuditoriaPortal,
  request: FastifyRequest,
  input: {
    atorId?: string | null
    atorNome?: string
    cpf?: string
    reason?: string
  },
): void {
  logAuditoriaAcessoSafe({
    portal,
    acao: 'sessao_revogada',
    atorId: input.atorId ?? null,
    atorNome: input.atorNome ?? 'Usuário',
    cpf: input.cpf ?? '',
    ip: extractClientIp(request),
    userAgent: extractUserAgent(request),
    metadata: { reason: input.reason ?? 'revoked' },
  })
}
