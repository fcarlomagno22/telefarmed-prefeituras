import type { FastifyRequest } from 'fastify'
import { normalizeClientIp } from './rules.js'
import type { AuditActorContext, AuditoriaPortal } from './types.js'

function resolvePortalFromPath(url: string): AuditoriaPortal | null {
  if (url.startsWith('/api/v1/admin/')) return 'admin'
  if (url.startsWith('/api/v1/prefeitura/')) return 'prefeitura'
  if (url.startsWith('/api/v1/ubt/')) return 'ubt'
  if (url.startsWith('/api/v1/profissional/')) return 'profissional'
  if (url.startsWith('/api/v1/atendimento/')) return 'atendimento'
  return null
}

export function extractClientIp(request: FastifyRequest): string | null {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return normalizeClientIp(forwarded)
  }
  return normalizeClientIp(request.ip)
}

export function extractUserAgent(request: FastifyRequest): string {
  const value = request.headers['user-agent']
  return typeof value === 'string' ? value.slice(0, 512) : ''
}

export function resolveActorFromRequest(request: FastifyRequest): AuditActorContext | null {
  if (request.admin) {
    return {
      portal: 'admin',
      atorId: request.admin.id,
      atorNome: request.admin.nome,
      atorTipo: 'admin',
      cpf: request.admin.cpf,
      actorRole: request.admin.accessLevel,
    }
  }

  if (request.prefeituraUser) {
    return {
      portal: 'prefeitura',
      atorId: request.prefeituraUser.id,
      atorNome: request.prefeituraUser.nome,
      atorTipo: 'prefeitura',
      cpf: request.prefeituraUser.cpf,
      entidadeContratanteId: request.prefeituraUser.entidadeContratanteId,
      actorRole: request.prefeituraUser.accessLevel,
    }
  }

  if (request.ubtUser) {
    return {
      portal: 'ubt',
      atorId: request.ubtUser.id,
      atorNome: request.ubtUser.nome,
      atorTipo: 'ubt',
      cpf: request.ubtUser.cpf,
      entidadeContratanteId: request.ubtUser.entidadeContratanteId,
      unidadeUbtId: request.ubtUser.unidadeUbtId,
      actorRole: request.ubtUser.accessLevel,
    }
  }

  if (request.profissionalUser) {
    return {
      portal: 'profissional',
      atorId: request.profissionalUser.id,
      atorNome: request.profissionalUser.nome,
      atorTipo: 'profissional',
      cpf: request.profissionalUser.cpf,
      profissionalId: request.profissionalUser.id,
      actorRole: 'profissional',
    }
  }

  const portal = resolvePortalFromPath(request.url)
  if (!portal) return null

  return {
    portal,
    atorId: null,
    atorNome: 'Anônimo',
    atorTipo: 'anonimo',
  }
}

export function resolveModuleFromPath(path: string): string {
  const cleaned = path.replace(/^\/api\/v1\//, '')
  const [segment] = cleaned.split('/')
  return segment || 'api'
}

export function mapHttpMethodToEventAction(method: string): 'visualizar' | 'inserir' | 'editar' | 'excluir' {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'inserir'
    case 'PUT':
    case 'PATCH':
      return 'editar'
    case 'DELETE':
      return 'excluir'
    default:
      return 'visualizar'
  }
}

export function mapHttpMethodToActionTone(
  method: string,
): 'create' | 'view' | 'update' | 'delete' | 'auth' {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create'
    case 'PUT':
    case 'PATCH':
      return 'update'
    case 'DELETE':
      return 'delete'
    default:
      return 'view'
  }
}

export function shouldSkipAuditoriaPath(url: string, method: string): boolean {
  if (method === 'OPTIONS') return true
  if (url === '/health') return true
  if (url.includes('/auditoria')) return true
  if (url.includes('/auth/refresh')) return true
  return false
}

export function isSensitiveApiPath(url: string): boolean {
  return (
    url.includes('/credenciais') ||
    (url.includes('/pacientes') && url.includes('/desbloquear')) ||
    (url.includes('/contrato') && url.includes('/desbloquear')) ||
    url.includes('/pin') ||
    url.includes('/senha') ||
    url.includes('/atendimento/') && url.includes('/mensagens/upload') ||
    url.includes('/prescricoes/emitir') ||
    url.includes('/solicitacoes-exame/emitir') ||
    url.includes('/atestados/emitir') ||
    url.includes('/documentos/') && url.includes('/download') ||
    url.includes('/atendimento/') && url.endsWith('/avaliacao')
  )
}

export function isPublicAtendimentoMutation(url: string, method: string): boolean {
  if (!url.startsWith('/api/v1/atendimento/')) return false
  const verb = method.toUpperCase()
  return verb === 'POST' || verb === 'PATCH' || verb === 'DELETE'
}
