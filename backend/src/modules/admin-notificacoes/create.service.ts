import { supabaseAdmin } from '../../db/supabase.js'
import { createComunicadoWithDestinatarios } from '../comunicados/create.service.js'
import { priorityFromApi } from '../comunicados/priority.js'
import { buildAdminRecipientSummary, mapAdminComunicadoRow } from '../comunicados/formatters.js'
import {
  resolveAdminBroadcastTarget,
  type AdminBroadcastTargetInput,
} from '../comunicados/recipients.service.js'
import type { AdminBroadcastDto, AdminBroadcastTargetSnapshot, DestinatarioInsert } from '../comunicados/types.js'
import { AdminNotificacoesError } from './errors.js'
import type { CreateAdminBroadcastBody } from './schemas.js'

function primaryAudiencia(targets: AdminBroadcastTargetSnapshot[]) {
  const medico = targets.find((item) => item.channel === 'medico')
  if (medico?.audienceScope) return medico.audienceScope

  const ubt = targets.find((item) => item.channel === 'ubt')
  if (ubt) return 'ubt_all' as const

  return 'contract_manager' as const
}

export async function createAdminBroadcast(
  admin: { id: string; nome: string },
  body: CreateAdminBroadcastBody,
): Promise<AdminBroadcastDto> {
  const snapshots: AdminBroadcastTargetSnapshot[] = []
  const destinatarios: DestinatarioInsert[] = []

  for (const target of body.targets as AdminBroadcastTargetInput[]) {
    const resolved = await resolveAdminBroadcastTarget(target)
    if (resolved.snapshot.count === 0) continue
    snapshots.push(resolved.snapshot)
    destinatarios.push(...resolved.destinatarios)
  }

  if (destinatarios.length === 0) {
    throw new AdminNotificacoesError(
      'Nenhum destinatário ativo encontrado para os alvos selecionados.',
      'NO_RECIPIENTS',
      400,
    )
  }

  const recipientSummary = buildAdminRecipientSummary(snapshots)

  const { id } = await createComunicadoWithDestinatarios(
    {
      titulo: body.title,
      corpo: body.body,
      prioridade: priorityFromApi(body.priority),
      origem: 'telefarmed',
      audiencia: primaryAudiencia(snapshots),
      remetenteTipo: 'admin',
      remetenteAdminId: admin.id,
      remetenteNome: admin.nome,
      alvosSnapshot: snapshots,
      destinatariosResumo: recipientSummary,
    },
    destinatarios,
  )

  const { data, error } = await supabaseAdmin
    .from('comunicados')
    .select(
      'id, titulo, corpo, prioridade, remetente_nome, alvos_snapshot, destinatarios_resumo, total_destinatarios, enviado_em',
    )
    .eq('id', id)
    .single()

  if (error) throw error
  if (!data) {
    throw new AdminNotificacoesError('Comunicado criado mas não encontrado.', 'NOT_FOUND', 500)
  }

  return mapAdminComunicadoRow({
    id: String(data.id),
    titulo: String(data.titulo),
    corpo: String(data.corpo),
    prioridade: data.prioridade as import('../comunicados/types.js').PrioridadeComunicado,
    remetente_nome: String(data.remetente_nome),
    alvos_snapshot: data.alvos_snapshot,
    destinatarios_resumo: String(data.destinatarios_resumo),
    total_destinatarios: Number(data.total_destinatarios),
    enviado_em: String(data.enviado_em),
  })
}
