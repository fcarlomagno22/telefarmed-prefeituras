import { supabaseAdmin } from '../../db/supabase.js'
import { appPublicUrls } from '../../config/appUrls.js'
import { formatLocalTimestampAsIso } from '../../lib/escalaDateTime.js'
import { isEscalaSlotHorarioEncerrado } from '../../lib/escalaSlotLifecycle.js'
import { normalizeCpf } from '../../lib/cpf.js'
import { loadProfissionalEscalaContext } from '../profissional-escala/context.service.js'
import { assertNoScheduleConflict } from '../profissional-escala/disponiveis.service.js'
import { PublicPlantaoAceiteError } from './errors.js'
import { resolveConviteByToken } from './convite.service.js'
import type { CandidatarReservaPlantaoAceiteResultDto } from './types.js'

const MAX_RESERVE_QUEUE_SIZE = 10

function parseReserveQueue(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).filter(Boolean)
}

async function findProfissionalByCpf(cpf: string): Promise<{
  id: string
  nome: string
  status: string
} | null> {
  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id, nome, status')
    .eq('cpf', cpf)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    id: String(data.id),
    nome: String(data.nome),
    status: String(data.status),
  }
}

async function loadSlotForReserve(slotId: string) {
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select('id, data, hora_inicio, hora_fim, status, modo_atribuicao, vagas, fila_reserva, profissional_titular_id')
    .eq('id', slotId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new PublicPlantaoAceiteError(
      'Este link de aceite não foi encontrado ou já expirou.',
      'NOT_FOUND',
      404,
    )
  }

  return data
}

async function countConfirmedTitulares(slotId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id', { count: 'exact', head: true })
    .eq('slot_id', slotId)
    .in('status', ['confirmado', 'realizado'])

  if (error) throw error
  return count ?? 0
}

export async function candidatarReservaPlantaoAceitePublico(input: {
  token: string
  cpf: string
}): Promise<CandidatarReservaPlantaoAceiteResultDto> {
  const convite = await resolveConviteByToken(input.token)
  const cpf = normalizeCpf(input.cpf)

  if (cpf.length !== 11) {
    throw new PublicPlantaoAceiteError('Informe um CPF válido.', 'CPF_INVALID', 400)
  }

  const profissional = await findProfissionalByCpf(cpf)
  if (!profissional || profissional.status !== 'ativo') {
    throw new PublicPlantaoAceiteError(
      'CPF não encontrado ou não elegível para este plantão.',
      'CPF_INVALID',
      403,
    )
  }

  const slot = await loadSlotForReserve(convite.slot_id)
  const slotId = String(slot.id)

  if (String(slot.status) !== 'publicada' || String(slot.modo_atribuicao) !== 'open') {
    throw new PublicPlantaoAceiteError(
      'Este plantão não está mais disponível para candidatura.',
      'UNAVAILABLE',
      410,
    )
  }

  if (isEscalaSlotHorarioEncerrado(String(slot.data), String(slot.hora_fim))) {
    throw new PublicPlantaoAceiteError(
      'O prazo para se candidatar a este plantão já encerrou.',
      'EXPIRED',
      410,
    )
  }

  const vagas = Number(slot.vagas ?? 0)
  const confirmedCount = await countConfirmedTitulares(slotId)

  if (confirmedCount < vagas) {
    throw new PublicPlantaoAceiteError(
      'Ainda há vaga neste plantão. Use a opção de pegar o plantão.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  if (slot.profissional_titular_id === profissional.id) {
    throw new PublicPlantaoAceiteError(
      'Você já é o médico titular deste plantão.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  const { data: existingClaim, error: claimError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id')
    .eq('slot_id', slotId)
    .eq('profissional_id', profissional.id)
    .in('status', ['confirmado', 'realizado'])
    .maybeSingle()

  if (claimError) throw claimError
  if (existingClaim) {
    throw new PublicPlantaoAceiteError(
      'Você já pegou este plantão como titular.',
      'SLOT_UNAVAILABLE',
      409,
    )
  }

  const reserveQueue = parseReserveQueue(slot.fila_reserva)
  const existingPosition = reserveQueue.indexOf(profissional.id)
  if (existingPosition >= 0) {
    throw new PublicPlantaoAceiteError(
      `Você já está na fila de reserva (${existingPosition + 1}º lugar).`,
      'RESERVE_ALREADY_APPLIED',
      409,
    )
  }

  if (reserveQueue.length >= MAX_RESERVE_QUEUE_SIZE) {
    throw new PublicPlantaoAceiteError(
      'A fila de reserva deste plantão já está completa.',
      'RESERVE_QUEUE_FULL',
      409,
    )
  }

  const ctx = await loadProfissionalEscalaContext(profissional.id)
  const startAt = formatLocalTimestampAsIso(`${slot.data} ${slot.hora_inicio}`)
  const endAt = formatLocalTimestampAsIso(`${slot.data} ${slot.hora_fim}`)
  await assertNoScheduleConflict(ctx.profissionalId, startAt, endAt, slotId)

  const nextQueue = [...reserveQueue, profissional.id]
  const { error: updateError } = await supabaseAdmin
    .from('escala_slots')
    .update({
      fila_reserva: nextQueue,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', slotId)

  if (updateError) throw updateError

  return {
    profissionalNome: profissional.nome,
    reservePosition: nextQueue.length,
    agendaUrl: appPublicUrls.profissionalAgendaUrl(),
  }
}
