import { supabaseAdmin } from '../../db/supabase.js'
import { uploadSuporteAnexos } from './attachments.service.js'
import { getAdminSupportTicket, getPortalSupportTicket } from './detail.service.js'
import { SuporteError } from './errors.js'
import { assertPortalTicketAccess } from './ownership.js'
import type { AdminActor, ParsedSuporteFile, PortalActor } from './types.js'

async function insertReplyMessage(
  ticketId: string,
  authorType: 'operator' | 'support',
  authorName: string,
  body: string,
  authorIds: Record<string, string | null>,
) {
  const { data, error } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .insert({
      chamado_id: ticketId,
      autor_tipo: authorType,
      autor_nome: authorName,
      corpo: body,
      ...authorIds,
    })
    .select('id')
    .single()

  if (error) throw error
  return String(data.id)
}

export async function sendAdminSupportReply(
  admin: AdminActor,
  ticketId: string,
  body: string,
  files: ParsedSuporteFile[] = [],
) {
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('chamados_suporte')
    .select('id, status')
    .eq('id', ticketId)
    .maybeSingle()

  if (ticketError) throw ticketError
  if (!ticket) throw new SuporteError('Chamado não encontrado.', 'TICKET_NOT_FOUND', 404)
  if (ticket.status === 'encerrado') {
    throw new SuporteError('Chamado encerrado.', 'TICKET_CLOSED', 409)
  }

  const messageId = await insertReplyMessage(ticketId, 'support', admin.nome || 'Suporte Telefarmed', body, {
    autor_admin_id: admin.id,
    autor_usuario_prefeitura_id: null,
    autor_usuario_ubt_id: null,
    autor_profissional_id: null,
  })

  if (files.length) {
    await uploadSuporteAnexos(ticketId, messageId, files)
  }

  const { error: updateError } = await supabaseAdmin
    .from('chamados_suporte')
    .update({ status: 'respondido' })
    .eq('id', ticketId)

  if (updateError) throw updateError

  return getAdminSupportTicket(ticketId)
}

export async function sendPortalSupportReply(
  actor: PortalActor,
  ticketId: string,
  body: string,
  files: ParsedSuporteFile[] = [],
) {
  await assertPortalTicketAccess(actor, ticketId, { requireMutation: true })

  const authorIds =
    actor.variant === 'ubt'
      ? {
          autor_admin_id: null,
          autor_usuario_ubt_id: actor.userId,
          autor_usuario_prefeitura_id: null,
          autor_profissional_id: null,
        }
      : actor.variant === 'prefeitura'
        ? {
            autor_admin_id: null,
            autor_usuario_ubt_id: null,
            autor_usuario_prefeitura_id: actor.userId,
            autor_profissional_id: null,
          }
        : {
            autor_admin_id: null,
            autor_usuario_ubt_id: null,
            autor_usuario_prefeitura_id: null,
            autor_profissional_id: actor.userId,
          }

  const messageId = await insertReplyMessage(ticketId, 'operator', actor.nome, body, authorIds)

  if (files.length) {
    await uploadSuporteAnexos(ticketId, messageId, files)
  }

  const { error: updateError } = await supabaseAdmin
    .from('chamados_suporte')
    .update({
      status: 'aguardando_resposta',
      solicitante_visualizado_em: new Date().toISOString(),
    })
    .eq('id', ticketId)

  if (updateError) throw updateError

  return getPortalSupportTicket(actor, ticketId)
}
