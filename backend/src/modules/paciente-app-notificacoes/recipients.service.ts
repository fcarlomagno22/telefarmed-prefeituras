import { supabaseAdmin } from '../../db/supabase.js'
import { ComunicadosError } from '../comunicados/errors.js'

export type PacienteAppTargetInput = {
  channel: 'paciente_app'
  mode: 'all' | 'selected'
  entidadeIds?: string[]
}

export type PacienteAppRecipient = {
  id: string
  cpf: string
  nome: string
}

export async function resolvePacienteAppTarget(
  target: PacienteAppTargetInput,
): Promise<PacienteAppRecipient[]> {
  let query = supabaseAdmin.from('pacientes').select('id, cpf, nome').eq('status', 'ativo')

  if (target.mode === 'selected') {
    const entidadeIds = target.entidadeIds?.filter(Boolean) ?? []
    if (entidadeIds.length === 0) {
      throw new ComunicadosError(
        'Selecione ao menos um município para notificar pacientes do app.',
        'NO_RECIPIENTS',
        400,
      )
    }
    query = query.in('entidade_contratante_id', entidadeIds)
  }

  const { data, error } = await query
  if (error) throw error

  const pacientes = (data ?? []).map((row) => ({
    id: String(row.id),
    cpf: String(row.cpf),
    nome: String(row.nome),
  }))

  if (pacientes.length === 0) {
    throw new ComunicadosError(
      'Nenhum paciente ativo encontrado para o app.',
      'NO_RECIPIENTS',
      400,
    )
  }

  return pacientes
}
