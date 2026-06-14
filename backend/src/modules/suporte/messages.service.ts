import { supabaseAdmin } from '../../db/supabase.js'
import { formatSuporteDateTime } from './formatters.js'
import { getAdminSupportTicket, getPortalSupportTicket } from './detail.service.js'
import { SuporteError } from './errors.js'
import { assertPortalTicketAccess } from './ownership.js'
import type { AdminActor, PortalActor } from './types.js'

type MessageRow = {
  id: string
  autor_tipo: string
  autor_admin_id: string | null
  autor_usuario_ubt_id: string | null
  autor_usuario_prefeitura_id: string | null
  autor_profissional_id: string | null
  corpo: string
  editado_em: string | null
  excluido: boolean
  snapshot_exclusao: Record<string, unknown> | null
}

async function loadMessage(ticketId: string, messageId: string): Promise<MessageRow> {
  const { data, error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .select(
      'id, autor_tipo, autor_admin_id, autor_usuario_ubt_id, autor_usuario_prefeitura_id, autor_profissional_id, corpo, editado_em, excluido, snapshot_exclusao',
    )
    .eq('chamado_id', ticketId)
    .eq('id', messageId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new SuporteError('Mensagem não encontrada.', 'MESSAGE_NOT_FOUND', 404)

  return {
    id: String(data.id),
    autor_tipo: String(data.autor_tipo),
    autor_admin_id: data.autor_admin_id ? String(data.autor_admin_id) : null,
    autor_usuario_ubt_id: data.autor_usuario_ubt_id ? String(data.autor_usuario_ubt_id) : null,
    autor_usuario_prefeitura_id: data.autor_usuario_prefeitura_id
      ? String(data.autor_usuario_prefeitura_id)
      : null,
    autor_profissional_id: data.autor_profissional_id ? String(data.autor_profissional_id) : null,
    corpo: String(data.corpo),
    editado_em: data.editado_em ? String(data.editado_em) : null,
    excluido: Boolean(data.excluido),
    snapshot_exclusao: (data.snapshot_exclusao as Record<string, unknown> | null) ?? null,
  }
}

function assertAdminCanManageMessage(message: MessageRow, adminId: string) {
  if (message.autor_tipo !== 'support' || message.autor_admin_id !== adminId) {
    throw new SuporteError('Mensagem não encontrada.', 'MESSAGE_NOT_FOUND', 404)
  }
  if (message.excluido) {
    throw new SuporteError('Mensagem já removida.', 'MESSAGE_DELETED', 409)
  }
}

function assertPortalCanManageMessage(message: MessageRow, actor: PortalActor) {
  if (message.autor_tipo !== 'operator' || message.excluido) {
    throw new SuporteError('Mensagem não encontrada.', 'MESSAGE_NOT_FOUND', 404)
  }

  const owned =
    (actor.variant === 'ubt' && message.autor_usuario_ubt_id === actor.userId) ||
    (actor.variant === 'prefeitura' && message.autor_usuario_prefeitura_id === actor.userId) ||
    (actor.variant === 'profissional' && message.autor_profissional_id === actor.userId)

  if (!owned) {
    throw new SuporteError('Mensagem não encontrada.', 'MESSAGE_NOT_FOUND', 404)
  }
}

export async function updateAdminSupportMessage(
  admin: AdminActor,
  ticketId: string,
  messageId: string,
  body: string,
) {
  const message = await loadMessage(ticketId, messageId)
  assertAdminCanManageMessage(message, admin.id)

  const { error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .update({ corpo: body, editado_em: new Date().toISOString() })
    .eq('id', messageId)

  if (error) throw error
  return getAdminSupportTicket(ticketId)
}

export async function deleteAdminSupportMessage(admin: AdminActor, ticketId: string, messageId: string) {
  const message = await loadMessage(ticketId, messageId)
  assertAdminCanManageMessage(message, admin.id)

  const { error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .update({
      excluido: true,
      corpo: '[mensagem removida]',
      snapshot_exclusao: {
        body: message.corpo,
        editedAt: message.editado_em ? formatSuporteDateTime(message.editado_em) : undefined,
      },
    })
    .eq('id', messageId)

  if (error) throw error
  return getAdminSupportTicket(ticketId)
}

export async function updatePortalSupportMessage(
  actor: PortalActor,
  ticketId: string,
  messageId: string,
  body: string,
) {
  await assertPortalTicketAccess(actor, ticketId, { requireMutation: true })
  const message = await loadMessage(ticketId, messageId)
  assertPortalCanManageMessage(message, actor)

  const { error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .update({ corpo: body, editado_em: new Date().toISOString() })
    .eq('id', messageId)

  if (error) throw error
  return getPortalSupportTicket(actor, ticketId)
}

export async function deletePortalSupportMessage(
  actor: PortalActor,
  ticketId: string,
  messageId: string,
) {
  await assertPortalTicketAccess(actor, ticketId, { requireMutation: true })
  const message = await loadMessage(ticketId, messageId)
  assertPortalCanManageMessage(message, actor)

  const { error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .update({
      excluido: true,
      corpo: 'Mensagem removida pelo operador.',
      snapshot_exclusao: {
        body: message.corpo,
        editedAt: message.editado_em ? formatSuporteDateTime(message.editado_em) : undefined,
      },
    })
    .eq('id', messageId)

  if (error) throw error
  return getPortalSupportTicket(actor, ticketId)
}
