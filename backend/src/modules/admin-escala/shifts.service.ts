import { supabaseAdmin } from '../../db/supabase.js'
import { EscalaError } from './errors.js'
import { escapeIlikeTerm, formatSlotRow, groupCapturesBySlot } from './formatters.js'
import {
  collectLinkedProfissionaisBySlot,
  notifyLinkedProfessionalsPlantaoRemoved,
} from './shifts-notify.service.js'
import type { ListShiftsQuery } from './schemas.js'
import type { AdminEscalaShiftDto, ClaimCaptureRow, SlotListagemRow } from './types.js'

async function loadClaimCaptures(slotIds: string[]): Promise<Map<string, ClaimCaptureRow[]>> {
  if (slotIds.length === 0) return new Map()

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('slot_id, profissional_id, confirmado_em, usuarios_profissionais!inner(nome)')
    .in('slot_id', slotIds)
    .in('status', ['confirmado', 'realizado'])
    .order('confirmado_em', { ascending: true })

  if (error) throw error

  const rows: ClaimCaptureRow[] = (data ?? []).map((row) => {
    const profissional = row.usuarios_profissionais as unknown as { nome: string }
    return {
      slot_id: String(row.slot_id),
      profissional_id: String(row.profissional_id),
      profissional_nome: String(profissional?.nome ?? 'Profissional'),
      confirmado_em: String(row.confirmado_em),
    }
  })

  return groupCapturesBySlot(rows)
}

async function loadSlotsByIds(ids: string[]): Promise<SlotListagemRow[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('vw_admin_escala_slots_listagem')
    .select('*')
    .in('id', ids)
    .order('data', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) throw error
  return (data ?? []) as SlotListagemRow[]
}

export async function listEscalaShifts(params: ListShiftsQuery = {}): Promise<AdminEscalaShiftDto[]> {
  let query = supabaseAdmin
    .from('vw_admin_escala_slots_listagem')
    .select('*')
    .order('data', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (params.status) {
    query = query.in('status', params.status === 'publicada' ? ['publicada', 'encerrada'] : [params.status])
  }
  if (params.modalidade) query = query.eq('modalidade', params.modalidade)
  if (params.assignmentMode) query = query.eq('modo_atribuicao', params.assignmentMode)
  if (params.dataInicio) query = query.gte('data', params.dataInicio)
  if (params.dataFim) query = query.lte('data', params.dataFim)
  if (params.especialidadeId) query = query.eq('especialidade_id', params.especialidadeId)
  if (params.batchId) query = query.eq('lote_id', params.batchId)

  const search = params.search?.trim()
  if (search) {
    const term = `%${escapeIlikeTerm(search)}%`
    query = query.or(
      [
        `especialidade_nome.ilike.${term}`,
        `unidade_nome.ilike.${term}`,
        `cidade.ilike.${term}`,
        `profissional_titular_nome.ilike.${term}`,
        `programacao_titulo.ilike.${term}`,
      ].join(','),
    )
  }

  const { data, error } = await query
  if (error) throw error

  const rows = (data ?? []) as SlotListagemRow[]
  const capturesBySlot = await loadClaimCaptures(rows.map((row) => row.id))

  return rows.map((row) => formatSlotRow(row, capturesBySlot.get(row.id) ?? []))
}

export async function deleteEscalaShifts(
  shiftIds: string[],
  admin: { id: string; nome: string },
): Promise<{ notifiedCount: number }> {
  const uniqueIds = [...new Set(shiftIds)]
  const rows = await loadSlotsByIds(uniqueIds)

  if (rows.length !== uniqueIds.length) {
    throw new EscalaError('Um ou mais plantões não foram encontrados.', 'NOT_FOUND', 404)
  }

  const linkedBySlot = await collectLinkedProfissionaisBySlot(uniqueIds, rows)
  const notifiedCount = await notifyLinkedProfessionalsPlantaoRemoved(rows, linkedBySlot, admin)

  const { error: sessoesError } = await supabaseAdmin
    .from('profissional_plantao_sessoes')
    .delete()
    .in('slot_id', uniqueIds)

  if (sessoesError) throw sessoesError

  const { error } = await supabaseAdmin.from('escala_slots').delete().in('id', uniqueIds)
  if (error) throw error

  return { notifiedCount }
}

export async function cancelEscalaPlantao(
  slotId: string,
  motivoCancelamento: string,
  adminId: string,
): Promise<void> {
  const rows = await loadSlotsByIds([slotId])
  const slot = rows[0]
  if (!slot) {
    throw new EscalaError('Plantão não encontrado.', 'NOT_FOUND', 404)
  }
  if (slot.status === 'cancelada') {
    throw new EscalaError('Plantão já está cancelado.', 'CONFLICT', 409)
  }

  const now = new Date().toISOString()
  const { error: slotError } = await supabaseAdmin
    .from('escala_slots')
    .update({
      status: 'cancelada',
      cancelado_em: now,
      notas: motivoCancelamento,
      atualizado_em: now,
    })
    .eq('id', slotId)

  if (slotError) throw slotError

  await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .update({
      status: 'cancelado',
      cancelado_em: now,
      motivo_cancelamento: motivoCancelamento,
      atualizado_em: now,
    })
    .eq('slot_id', slotId)
    .in('status', ['confirmado'])

  await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .update({
      status: 'cancelada_admin',
      respondido_em: now,
      respondido_por_admin_id: adminId,
      atualizado_em: now,
    })
    .eq('slot_id', slotId)
    .eq('status', 'pendente')
}

export { loadSlotsByIds }
