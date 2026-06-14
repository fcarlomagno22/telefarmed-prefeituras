import { supabaseAdmin } from '../../db/supabase.js'
import { SuporteError } from './errors.js'
import type { PortalActor, PortalSuporteVariant } from './types.js'

type TicketScopeRow = {
  id: string
  origem: PortalSuporteVariant
  status: string
  entidade_contratante_id: string | null
  unidade_ubt_id: string | null
  aberto_por_usuario_prefeitura_id: string | null
  aberto_por_usuario_ubt_id: string | null
  profissional_referencia_id: string | null
}

export async function loadTicketScope(ticketId: string): Promise<TicketScopeRow> {
  const { data, error } = await supabaseAdmin
    .from('chamados_suporte')
    .select(
      'id, origem, status, entidade_contratante_id, unidade_ubt_id, aberto_por_usuario_prefeitura_id, aberto_por_usuario_ubt_id, profissional_referencia_id',
    )
    .eq('id', ticketId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new SuporteError('Chamado não encontrado.', 'TICKET_NOT_FOUND', 404)

  return {
    id: String(data.id),
    origem: data.origem as PortalSuporteVariant,
    status: String(data.status),
    entidade_contratante_id: data.entidade_contratante_id ? String(data.entidade_contratante_id) : null,
    unidade_ubt_id: data.unidade_ubt_id ? String(data.unidade_ubt_id) : null,
    aberto_por_usuario_prefeitura_id: data.aberto_por_usuario_prefeitura_id
      ? String(data.aberto_por_usuario_prefeitura_id)
      : null,
    aberto_por_usuario_ubt_id: data.aberto_por_usuario_ubt_id
      ? String(data.aberto_por_usuario_ubt_id)
      : null,
    profissional_referencia_id: data.profissional_referencia_id
      ? String(data.profissional_referencia_id)
      : null,
  }
}

export function portalCanViewTicket(actor: PortalActor, ticket: TicketScopeRow): boolean {
  if (actor.variant === 'ubt') {
    return (
      ticket.origem === 'ubt' &&
      ticket.entidade_contratante_id === actor.entidadeId &&
      ticket.unidade_ubt_id === actor.unitId
    )
  }

  if (actor.variant === 'prefeitura') {
    return ticket.entidade_contratante_id === actor.entidadeId
  }

  return ticket.origem === 'profissional' && ticket.profissional_referencia_id === actor.userId
}

export function portalCanMutateTicket(actor: PortalActor, ticket: TicketScopeRow): boolean {
  if (ticket.status === 'encerrado') return false

  if (actor.variant === 'ubt') {
    return (
      ticket.origem === 'ubt' &&
      ticket.entidade_contratante_id === actor.entidadeId &&
      ticket.unidade_ubt_id === actor.unitId
    )
  }

  if (actor.variant === 'prefeitura') {
    return ticket.origem === 'prefeitura' && ticket.entidade_contratante_id === actor.entidadeId
  }

  return ticket.origem === 'profissional' && ticket.profissional_referencia_id === actor.userId
}

export async function assertPortalTicketAccess(
  actor: PortalActor,
  ticketId: string,
  options?: { requireMutation?: boolean },
): Promise<TicketScopeRow> {
  const ticket = await loadTicketScope(ticketId)
  const allowed = options?.requireMutation
    ? portalCanMutateTicket(actor, ticket)
    : portalCanViewTicket(actor, ticket)

  if (!allowed) {
    throw new SuporteError('Chamado não encontrado.', 'TICKET_NOT_FOUND', 404)
  }

  return ticket
}

export function buildPortalListOrigins(actor: PortalActor): PortalSuporteVariant[] {
  if (actor.variant === 'prefeitura') {
    return ['prefeitura', 'ubt']
  }
  return [actor.variant]
}
