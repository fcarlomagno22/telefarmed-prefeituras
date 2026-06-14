import { supabaseAdmin } from '../../db/supabase.js'
import { normalizeCpf } from '../cpf.js'
import { sanitizeAuditoriaPayload } from './rules.js'
import type {
  AuditActorContext,
  AuditoriaAcessoAcao,
  AuditoriaEventoAcao,
  AuditoriaPortal,
} from './types.js'

function logAuditoriaError(context: string, error: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[auditoria] ${context}`, error)
  }
}

export async function logAuditoriaAcesso(input: {
  portal: AuditoriaPortal
  acao: AuditoriaAcessoAcao
  atorId?: string | null
  atorNome?: string
  cpf?: string
  ip?: string | null
  userAgent?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('auditoria_acessos').insert({
      portal: input.portal,
      acao: input.acao,
      ator_id: input.atorId ?? null,
      ator_nome_snapshot: input.atorNome?.trim() || 'Usuário',
      cpf_snapshot: input.cpf ? normalizeCpf(input.cpf) : '',
      ip: input.ip ?? null,
      user_agent: input.userAgent?.slice(0, 512) ?? '',
      metadata: sanitizeAuditoriaPayload(input.metadata ?? {}),
    })
    if (error) logAuditoriaError('logAuditoriaAcesso', error)
  } catch (error) {
    logAuditoriaError('logAuditoriaAcesso', error)
  }
}

export function logAuditoriaAcessoSafe(input: Parameters<typeof logAuditoriaAcesso>[0]): void {
  void logAuditoriaAcesso(input)
}

export async function logAuditoriaEvento(input: {
  portal: AuditoriaPortal
  acao: AuditoriaEventoAcao
  pagina: string
  descricao?: string
  recursoTipo?: string
  recursoId?: string
  actor: AuditActorContext
  ip?: string | null
  payload?: Record<string, unknown>
}): Promise<void> {
  try {
    const payload = sanitizeAuditoriaPayload({
      ...(input.payload ?? {}),
      actorName: input.actor.atorNome,
      actorRole: input.actor.actorRole ?? input.actor.atorTipo,
      prefeituraName: input.actor.prefeituraName ?? null,
      ubtName: input.actor.ubtName ?? null,
    })

    const { error } = await supabaseAdmin.from('auditoria_eventos').insert({
      portal: input.portal,
      acao: input.acao,
      pagina: input.pagina.slice(0, 240),
      descricao: (input.descricao ?? '').slice(0, 500),
      recurso_tipo: (input.recursoTipo ?? '').slice(0, 120),
      recurso_id: (input.recursoId ?? '').slice(0, 120),
      ator_id: input.actor.atorId,
      ator_tipo: input.actor.atorTipo.slice(0, 80),
      entidade_contratante_id: input.actor.entidadeContratanteId ?? null,
      unidade_ubt_id: input.actor.unidadeUbtId ?? null,
      profissional_id: input.actor.profissionalId ?? null,
      ip: input.ip ?? null,
      payload,
    })
    if (error) logAuditoriaError('logAuditoriaEvento', error)
  } catch (error) {
    logAuditoriaError('logAuditoriaEvento', error)
  }
}

export function logAuditoriaEventoSafe(input: Parameters<typeof logAuditoriaEvento>[0]): void {
  void logAuditoriaEvento(input)
}
