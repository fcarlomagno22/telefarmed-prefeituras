import { supabaseAdmin } from '../../db/supabase.js'
import { EscalaError } from './errors.js'
import type { ListInscricoesQuery } from './schemas.js'
import type { EscalaInscricaoDto } from './types.js'

export async function listEscalaInscricoes(
  params: ListInscricoesQuery = {},
): Promise<EscalaInscricaoDto[]> {
  let query = supabaseAdmin
    .from('escala_inscricoes_profissional')
    .select(
      'id, slot_id, profissional_id, status, inscrito_em, respondido_em, motivo_rejeicao, usuarios_profissionais!inner(nome)',
    )
    .order('inscrito_em', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.slotId) query = query.eq('slot_id', params.slotId)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => {
    const profissional = row.usuarios_profissionais as unknown as { nome: string }
    return {
      id: String(row.id),
      slotId: String(row.slot_id),
      profissionalId: String(row.profissional_id),
      profissionalNome: String(profissional?.nome ?? 'Profissional'),
      status: String(row.status),
      inscritoEm: String(row.inscrito_em),
      respondidoEm: row.respondido_em ? String(row.respondido_em) : null,
      motivoRejeicao: row.motivo_rejeicao ? String(row.motivo_rejeicao) : null,
    }
  })
}

async function loadInscricaoForAction(inscricaoId: string) {
  const { data, error } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .select('id, slot_id, profissional_id, status')
    .eq('id', inscricaoId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new EscalaError('Inscrição não encontrada.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'pendente') {
    throw new EscalaError('Inscrição já foi respondida.', 'CONFLICT', 409)
  }

  return data
}

async function loadSlotVacancy(slotId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('vw_admin_escala_slots_listagem')
    .select('vagas_disponiveis, modo_atribuicao, status')
    .eq('id', slotId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new EscalaError('Plantão não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'publicada') {
    throw new EscalaError('Plantão não está publicado.', 'CONFLICT', 409)
  }
  if (data.modo_atribuicao !== 'open') {
    throw new EscalaError('Plantão não aceita inscrições.', 'CONFLICT', 409)
  }

  return Number(data.vagas_disponiveis ?? 0)
}

export async function acceptEscalaInscricao(inscricaoId: string, adminId: string): Promise<void> {
  const inscricao = await loadInscricaoForAction(inscricaoId)
  const vagasDisponiveis = await loadSlotVacancy(String(inscricao.slot_id))

  if (vagasDisponiveis <= 0) {
    throw new EscalaError('Não há vagas disponíveis neste plantão.', 'NO_VACANCY', 409)
  }

  const now = new Date().toISOString()

  const { error: plantaoError } = await supabaseAdmin.from('escala_plantoes_confirmados').insert({
    slot_id: inscricao.slot_id,
    profissional_id: inscricao.profissional_id,
    inscricao_id: inscricao.id,
    status: 'confirmado',
    confirmado_em: now,
    confirmado_por_admin_id: adminId,
  })

  if (plantaoError) throw plantaoError

  const { error: inscricaoError } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .update({
      status: 'aceita',
      respondido_em: now,
      respondido_por_admin_id: adminId,
      atualizado_em: now,
    })
    .eq('id', inscricaoId)

  if (inscricaoError) throw inscricaoError
}

export async function rejectEscalaInscricao(
  inscricaoId: string,
  motivoRejeicao: string,
  adminId: string,
): Promise<void> {
  await loadInscricaoForAction(inscricaoId)
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .update({
      status: 'rejeitada',
      motivo_rejeicao: motivoRejeicao,
      respondido_em: now,
      respondido_por_admin_id: adminId,
      atualizado_em: now,
    })
    .eq('id', inscricaoId)

  if (error) throw error
}
