import { supabaseAdmin } from '../../db/supabase.js'
import { applyNestedEscalaSlotContratoOverlapFilter } from '../../lib/escalaContratoScope.js'
import {
  loadContratoSpecialtyContext,
  slotAuthorizedForCliente,
} from './contrato-specialty.service.js'
import { assertPacienteBelongsToEntity } from '../ubt-pacientes/ownership.js'
import { UbtAgendaError } from './errors.js'
import { slotVisibleToUbt } from './slot-utils.js'
import type { UbtScope } from './types.js'

export { assertPacienteBelongsToEntity }

export async function assertConsultaBelongsToUnit(
  scope: UbtScope,
  consultaId: string,
): Promise<{ id: string; status: string; paciente_id: string; data: string; hora: string }> {
  const { data, error } = await supabaseAdmin
    .from('agenda_consultas')
    .select('id, status, paciente_id, data, hora')
    .eq('id', consultaId)
    .eq('unidade_ubt_id', scope.unidadeUbtId)
    .eq('entidade_contratante_id', scope.entidadeContratanteId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new UbtAgendaError('Consulta não encontrada.', 'NOT_FOUND', 404)
  }

  return data
}

export async function assertProfissionalOnUnitSchedule(
  scope: UbtScope,
  profissionalId: string,
  data: string,
  especialidadeId: string,
): Promise<void> {
  const { contratoIds, index: contratoSpecialtyIndex } =
    await loadContratoSpecialtyContext(scope.entidadeContratanteId)
  if (contratoIds.length === 0) {
    throw new UbtAgendaError('Nenhum contrato ativo para agendamento.', 'NO_CONTRACT', 409)
  }

  let query = supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      escala_slots!inner (
        id,
        data,
        especialidade_id,
        status,
        modalidade,
        escopo_ubt,
        contrato_entidade_id,
        contrato_entidade_ids
      )
    `,
    )
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .eq('escala_slots.data', data)
    .eq('escala_slots.especialidade_id', especialidadeId)
    .eq('escala_slots.status', 'publicada')

  query = applyNestedEscalaSlotContratoOverlapFilter(query, contratoIds)

  const { data: plantoes, error } = await query

  if (error) throw error

  const visible = (plantoes ?? []).some((row) => {
    const slotRaw = row.escala_slots as unknown
    const slot = Array.isArray(slotRaw) ? slotRaw[0] : slotRaw
    if (!slot || typeof slot !== 'object') return false
    const slotObj = slot as {
      modalidade?: string
      escopo_ubt?: unknown
      contrato_entidade_id?: string | null
      contrato_entidade_ids?: string[] | null
      especialidade_id?: string
    }
    if (
      !slotAuthorizedForCliente({
        slotContratoIds: slotObj.contrato_entidade_ids,
        slotLegacyContratoId: slotObj.contrato_entidade_id,
        specialtyId: especialidadeId,
        clientContratoIds: contratoIds,
        index: contratoSpecialtyIndex,
      })
    ) {
      return false
    }
    return slotVisibleToUbt(
      slotObj.escopo_ubt,
      scope.unidadeUbtId,
      String(slotObj.modalidade ?? 'tele'),
    )
  })

  if (!visible) {
    throw new UbtAgendaError(
      'Profissional indisponível para esta data e especialidade.',
      'PROFISSIONAL_UNAVAILABLE',
      409,
    )
  }
}

export async function loadActiveContratoIds(entidadeId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id')
    .eq('entidade_contratante_id', entidadeId)
    .in('status', ['ativo', 'implantacao'])

  if (error) throw error
  return (data ?? []).map((row) => String(row.id))
}
