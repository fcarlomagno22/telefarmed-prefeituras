import { supabaseAdmin } from '../../db/supabase.js'
import { priorityFromApi } from '../comunicados/priority.js'
import type { PrioridadeComunicado } from '../comunicados/types.js'
import type { PacienteAppRecipient } from './recipients.service.js'

const BATCH_SIZE = 500

type FanOutPacienteAppNotificationsInput = {
  titulo: string
  corpo: string
  prioridade: PrioridadeComunicado
  remetenteNome: string
  remetenteAdminId: string
  pacientes: PacienteAppRecipient[]
  alvosSnapshot: unknown
  destinatariosResumo: string
}

export async function fanOutPacienteAppNotifications(
  input: FanOutPacienteAppNotificationsInput,
): Promise<{ comunicadoId: string; recipientCount: number }> {
  const { data: comunicado, error: comunicadoError } = await supabaseAdmin
    .from('comunicados')
    .insert({
      titulo: input.titulo.trim(),
      corpo: input.corpo.trim(),
      prioridade: input.prioridade,
      origem: 'telefarmed',
      audiencia: 'contract_manager',
      remetente_tipo: 'admin',
      remetente_admin_id: input.remetenteAdminId,
      remetente_nome: input.remetenteNome,
      alvos_snapshot: input.alvosSnapshot,
      destinatarios_resumo: input.destinatariosResumo,
      total_destinatarios: input.pacientes.length,
    })
    .select('id')
    .single()

  if (comunicadoError) throw comunicadoError
  if (!comunicado) {
    throw new Error('Não foi possível registrar o comunicado para o app do paciente.')
  }

  const comunicadoId = String(comunicado.id)

  for (let offset = 0; offset < input.pacientes.length; offset += BATCH_SIZE) {
    const batch = input.pacientes.slice(offset, offset + BATCH_SIZE).map((paciente) => ({
      paciente_id: paciente.id,
      paciente_cpf: paciente.cpf,
      comunicado_id: comunicadoId,
      titulo: input.titulo.trim(),
      corpo: input.corpo.trim(),
      prioridade: input.prioridade,
      remetente_nome: input.remetenteNome,
    }))

    const { error } = await supabaseAdmin.from('paciente_app_notificacoes').insert(batch)
    if (error) throw error
  }

  return { comunicadoId, recipientCount: input.pacientes.length }
}

export function priorityFromAdminApi(priority: 'normal' | 'important'): PrioridadeComunicado {
  return priorityFromApi(priority)
}
