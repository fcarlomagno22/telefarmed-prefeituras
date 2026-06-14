import { supabaseAdmin } from '../../db/supabase.js'
import { PRIORITY_LABELS, STATUS_LABELS } from './constants.js'
import { createAnexoSignedUrls } from './attachments.service.js'
import { mapMessageRow, mapTicketDetailRow } from './formatters.js'
import { SuporteError } from './errors.js'
import { assertPortalTicketAccess } from './ownership.js'
import type { PortalActor } from './types.js'

async function loadTicketMessages(ticketId: string) {
  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .select(
      'id, autor_tipo, autor_nome, corpo, enviado_em, editado_em, excluido, snapshot_exclusao',
    )
    .eq('chamado_id', ticketId)
    .order('enviado_em', { ascending: true })

  if (messagesError) throw messagesError

  const { data: anexos, error: anexosError } = await supabaseAdmin
    .from('anexos_mensagem_chamado')
    .select('id, mensagem_id, nome_arquivo, tipo, mime_type, tamanho_bytes, storage_path')
    .eq('chamado_id', ticketId)

  if (anexosError) throw anexosError

  const signedUrls = await createAnexoSignedUrls(
    (anexos ?? []).map((item) => String(item.storage_path)),
  )

  const mappedMessages = (messages ?? []).map((row) =>
    mapMessageRow(
      {
        id: String(row.id),
        autor_tipo: row.autor_tipo as 'operator' | 'support' | 'system',
        autor_nome: String(row.autor_nome),
        corpo: String(row.corpo),
        enviado_em: String(row.enviado_em),
        editado_em: row.editado_em ? String(row.editado_em) : null,
        excluido: Boolean(row.excluido),
        snapshot_exclusao: row.snapshot_exclusao as {
          body?: string
          editedAt?: string
          attachments?: Array<{ id: string; name: string; type: 'pdf' | 'image'; url: string; size: number }>
        } | null,
      },
      (anexos ?? []).map((item) => ({
        id: String(item.id),
        mensagem_id: item.mensagem_id ? String(item.mensagem_id) : null,
        nome_arquivo: String(item.nome_arquivo),
        tipo: item.tipo as 'pdf' | 'image',
        mime_type: String(item.mime_type),
        tamanho_bytes: Number(item.tamanho_bytes),
        storage_path: String(item.storage_path),
      })),
      signedUrls,
    ),
  )

  return mappedMessages
}

export async function getAdminSupportTicket(ticketId: string) {
  const { data, error } = await supabaseAdmin
    .from('chamados_suporte')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new SuporteError('Chamado não encontrado.', 'TICKET_NOT_FOUND', 404)

  const messages = await loadTicketMessages(ticketId)
  return mapTicketDetailRow(data as Record<string, unknown>, messages)
}

export async function getPortalSupportTicket(actor: PortalActor, ticketId: string) {
  await assertPortalTicketAccess(actor, ticketId)

  const { data, error } = await supabaseAdmin
    .from('chamados_suporte')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new SuporteError('Chamado não encontrado.', 'TICKET_NOT_FOUND', 404)

  await supabaseAdmin
    .from('chamados_suporte')
    .update({ solicitante_visualizado_em: new Date().toISOString() })
    .eq('id', ticketId)

  const messages = await loadTicketMessages(ticketId)
  return mapTicketDetailRow(data as Record<string, unknown>, messages)
}

export { STATUS_LABELS, PRIORITY_LABELS }
