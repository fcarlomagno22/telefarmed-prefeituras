import { supabaseAdmin } from '../../db/supabase.js'
import { createComunicadoWithDestinatarios } from '../comunicados/create.service.js'
import { priorityFromApi } from '../comunicados/priority.js'
import { buildAdminRecipientSummary, mapAdminComunicadoRow } from '../comunicados/formatters.js'
import {
  resolveAdminBroadcastTarget,
  type AdminBroadcastTargetInput,
} from '../comunicados/recipients.service.js'
import type { AdminBroadcastDto, AdminBroadcastTargetSnapshot, DestinatarioInsert } from '../comunicados/types.js'
import {
  fanOutPacienteAppNotifications,
  priorityFromAdminApi,
} from '../paciente-app-notificacoes/fanout.service.js'
import {
  resolvePacienteAppTarget,
  type PacienteAppTargetInput,
} from '../paciente-app-notificacoes/recipients.service.js'
import { AdminNotificacoesError } from './errors.js'
import type { CreateAdminBroadcastBody } from './schemas.js'

function isPacienteAppTarget(
  target: CreateAdminBroadcastBody['targets'][number],
): target is PacienteAppTargetInput {
  return target.channel === 'paciente_app'
}

function primaryAudiencia(targets: AdminBroadcastTargetSnapshot[]) {
  const medico = targets.find((item) => item.channel === 'medico')
  if (medico?.audienceScope) return medico.audienceScope

  const ubt = targets.find((item) => item.channel === 'ubt')
  if (ubt) return 'ubt_all' as const

  return 'contract_manager' as const
}

async function loadComunicadoDto(comunicadoId: string): Promise<AdminBroadcastDto> {
  const { data, error } = await supabaseAdmin
    .from('comunicados')
    .select(
      'id, titulo, corpo, prioridade, remetente_nome, alvos_snapshot, destinatarios_resumo, total_destinatarios, enviado_em',
    )
    .eq('id', comunicadoId)
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

export async function createAdminBroadcast(
  admin: { id: string; nome: string },
  body: CreateAdminBroadcastBody,
): Promise<AdminBroadcastDto> {
  const snapshots: AdminBroadcastTargetSnapshot[] = []
  const destinatarios: DestinatarioInsert[] = []

  const portalTargets = body.targets.filter((target) => !isPacienteAppTarget(target))
  const appTargets = body.targets.filter(isPacienteAppTarget)

  for (const target of portalTargets as AdminBroadcastTargetInput[]) {
    const resolved = await resolveAdminBroadcastTarget(target)
    if (resolved.snapshot.count === 0) continue
    snapshots.push(resolved.snapshot)
    destinatarios.push(...resolved.destinatarios)
  }

  let appComunicadoId: string | null = null
  let appRecipientCount = 0

  for (const target of appTargets) {
    const pacientes = await resolvePacienteAppTarget(target)
    const snapshot: AdminBroadcastTargetSnapshot = {
      channel: 'paciente_app',
      mode: target.mode,
      recipientIds: target.entidadeIds ?? [],
      recipientLabels:
        target.mode === 'all'
          ? ['Todos os pacientes ativos do app']
          : [`${target.entidadeIds?.length ?? 0} município(s) selecionado(s)`],
      count: pacientes.length,
    }
    snapshots.push(snapshot)
    appRecipientCount += pacientes.length

    const fanOut = await fanOutPacienteAppNotifications({
      titulo: body.title,
      corpo: body.body,
      prioridade: priorityFromAdminApi(body.priority),
      remetenteNome: admin.nome,
      remetenteAdminId: admin.id,
      pacientes,
      alvosSnapshot: [snapshot],
      destinatariosResumo: `${pacientes.length} paciente(s) do app`,
    })

    appComunicadoId = fanOut.comunicadoId
  }

  if (destinatarios.length === 0 && appRecipientCount === 0) {
    throw new AdminNotificacoesError(
      'Nenhum destinatário ativo encontrado para os alvos selecionados.',
      'NO_RECIPIENTS',
      400,
    )
  }

  if (destinatarios.length === 0 && appComunicadoId) {
    return loadComunicadoDto(appComunicadoId)
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

  return loadComunicadoDto(id)
}
