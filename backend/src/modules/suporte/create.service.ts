import { supabaseAdmin } from '../../db/supabase.js'
import { uploadSuporteAnexos } from './attachments.service.js'
import { getPortalSupportTicket } from './detail.service.js'
import { SuporteError } from './errors.js'
import type { PortalActor, ParsedSuporteFile } from './types.js'
import type { z } from 'zod'
import type { createTicketBodySchema } from './schemas.js'

type CreateTicketInput = z.infer<typeof createTicketBodySchema>

async function resolvePortalContext(actor: PortalActor) {
  if (actor.variant === 'ubt') {
    const { data, error } = await supabaseAdmin
      .from('unidades_ubt')
      .select('id, nome, entidade_contratante_id, entidades_contratantes(municipio, uf)')
      .eq('id', actor.unitId!)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new SuporteError('Unidade UBT não encontrada.', 'UNIT_NOT_FOUND', 404)

    return {
      origem: 'ubt' as const,
      entidade_contratante_id: String(data.entidade_contratante_id),
      unidade_ubt_id: String(data.id),
      municipio_nome: String(
        [
          (data.entidades_contratantes as { municipio?: string; uf?: string } | null)?.municipio,
          (data.entidades_contratantes as { uf?: string } | null)?.uf,
        ]
          .filter(Boolean)
          .join(' - '),
      ),
      unidade_ubt_nome: String(data.nome),
      aberto_por_usuario_prefeitura_id: null,
      aberto_por_usuario_ubt_id: actor.userId,
      profissional_referencia_id: null,
    }
  }

  if (actor.variant === 'prefeitura') {
    const { data, error } = await supabaseAdmin
      .from('entidades_contratantes')
      .select('id, municipio, uf')
      .eq('id', actor.entidadeId!)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new SuporteError('Prefeitura não encontrada.', 'ENTITY_NOT_FOUND', 404)

    return {
      origem: 'prefeitura' as const,
      entidade_contratante_id: String(data.id),
      unidade_ubt_id: null,
      municipio_nome: [data.municipio, data.uf].filter(Boolean).join(' - '),
      unidade_ubt_nome: '',
      aberto_por_usuario_prefeitura_id: actor.userId,
      aberto_por_usuario_ubt_id: null,
      profissional_referencia_id: null,
    }
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, cidade, uf')
    .eq('id', actor.userId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new SuporteError('Profissional não encontrado.', 'PROFESSIONAL_NOT_FOUND', 404)

  return {
    origem: 'profissional' as const,
    entidade_contratante_id: null,
    unidade_ubt_id: null,
    municipio_nome: [data.cidade, data.uf].filter(Boolean).join(' - '),
    unidade_ubt_nome: '',
    aberto_por_usuario_prefeitura_id: null,
    aberto_por_usuario_ubt_id: null,
    profissional_referencia_id: actor.userId,
  }
}

export async function createPortalSupportTicket(
  actor: PortalActor,
  input: CreateTicketInput,
  files: ParsedSuporteFile[] = [],
) {
  const context = await resolvePortalContext(actor)

  const { data: ticket, error: ticketError } = await supabaseAdmin
    .from('chamados_suporte')
    .insert({
      assunto: input.subject,
      categoria: input.category,
      prioridade: input.priority ?? 'media',
      status: 'aguardando_resposta',
      origem: context.origem,
      entidade_contratante_id: context.entidade_contratante_id,
      unidade_ubt_id: context.unidade_ubt_id,
      municipio_nome: context.municipio_nome,
      unidade_ubt_nome: context.unidade_ubt_nome,
      aberto_por_nome: actor.nome,
      aberto_por_funcao: actor.funcao,
      aberto_por_usuario_prefeitura_id: context.aberto_por_usuario_prefeitura_id,
      aberto_por_usuario_ubt_id: context.aberto_por_usuario_ubt_id,
      profissional_referencia_id: context.profissional_referencia_id,
      solicitante_visualizado_em: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (ticketError) throw ticketError

  const chamadoId = String(ticket.id)

  const messageInsert: Record<string, unknown> = {
    chamado_id: chamadoId,
    autor_tipo: 'operator',
    autor_nome: actor.nome,
    corpo: input.body,
  }

  if (actor.variant === 'ubt') messageInsert.autor_usuario_ubt_id = actor.userId
  if (actor.variant === 'prefeitura') messageInsert.autor_usuario_prefeitura_id = actor.userId
  if (actor.variant === 'profissional') messageInsert.autor_profissional_id = actor.userId

  const { data: message, error: messageError } = await supabaseAdmin
    .from('mensagens_chamado_suporte')
    .insert(messageInsert)
    .select('id')
    .single()

  if (messageError) throw messageError

  if (files.length) {
    await uploadSuporteAnexos(chamadoId, String(message.id), files)
  }

  return getPortalSupportTicket(actor, chamadoId)
}
