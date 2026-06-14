import { supabaseAdmin } from '../../db/supabase.js'
import { getAdminSupportTicket } from './detail.service.js'
import { SuporteError } from './errors.js'
import type { AdminActor } from './types.js'

export async function closeAdminSupportTicket(admin: AdminActor, ticketId: string) {
  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('chamados_suporte')
    .select('id, status')
    .eq('id', ticketId)
    .maybeSingle()

  if (ticketError) throw ticketError
  if (!ticket) throw new SuporteError('Chamado não encontrado.', 'TICKET_NOT_FOUND', 404)
  if (ticket.status === 'encerrado') {
    throw new SuporteError('Chamado já encerrado.', 'TICKET_CLOSED', 409)
  }

  const now = new Date().toISOString()

  const { error: updateError } = await supabaseAdmin
    .from('chamados_suporte')
    .update({
      status: 'encerrado',
      encerrado_em: now,
      encerrado_por_admin_id: admin.id,
    })
    .eq('id', ticketId)

  if (updateError) throw updateError

  await supabaseAdmin.from('mensagens_chamado_suporte').insert({
    chamado_id: ticketId,
    autor_tipo: 'system',
    autor_nome: 'Sistema',
    corpo: `Chamado encerrado por ${admin.nome || 'equipe Telefarmed'}.`,
    autor_admin_id: admin.id,
  })

  return getAdminSupportTicket(ticketId)
}
