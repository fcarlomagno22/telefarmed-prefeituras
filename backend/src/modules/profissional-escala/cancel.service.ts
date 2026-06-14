import { supabaseAdmin } from '../../db/supabase.js'
import { formatLocalTimestampAsIso } from '../../lib/escalaDateTime.js'
import { ProfissionalEscalaError } from './errors.js'
import type { ProfissionalEscalaContext } from './types.js'

export async function cancelarProfissionalEscalaInscricao(
  ctx: ProfissionalEscalaContext,
  inscricaoId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .select('id, profissional_id, status')
    .eq('id', inscricaoId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalEscalaError('Inscrição não encontrada.', 'NOT_FOUND', 404)
  }
  if (String(data.profissional_id) !== ctx.profissionalId) {
    throw new ProfissionalEscalaError('Inscrição não encontrada.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'pendente') {
    throw new ProfissionalEscalaError('Esta inscrição não pode ser cancelada.', 'CONFLICT', 409)
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('escala_inscricoes_profissional')
    .update({
      status: 'cancelada_profissional',
      respondido_em: now,
      atualizado_em: now,
    })
    .eq('id', inscricaoId)
    .eq('profissional_id', ctx.profissionalId)

  if (updateError) throw updateError
}

export async function cancelarProfissionalEscalaPlantao(
  ctx: ProfissionalEscalaContext,
  plantaoId: string,
): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      'id, profissional_id, status, slot_id, escala_slots!inner(data, hora_inicio, status)',
    )
    .eq('id', plantaoId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalEscalaError('Plantão confirmado não encontrado.', 'NOT_FOUND', 404)
  }
  if (String(data.profissional_id) !== ctx.profissionalId) {
    throw new ProfissionalEscalaError('Plantão confirmado não encontrado.', 'NOT_FOUND', 404)
  }
  if (data.status !== 'confirmado') {
    throw new ProfissionalEscalaError('Este plantão não pode ser cancelado.', 'CONFLICT', 409)
  }

  const slot = data.escala_slots as unknown as {
    data: string
    hora_inicio: string
    status: string
  }

  if (slot.status === 'cancelada' || slot.status === 'encerrada') {
    throw new ProfissionalEscalaError('Este plantão não pode ser cancelado.', 'CONFLICT', 409)
  }

  const startAt = new Date(formatLocalTimestampAsIso(`${slot.data} ${slot.hora_inicio}`))
  if (startAt.getTime() <= Date.now()) {
    throw new ProfissionalEscalaError(
      'Não é possível cancelar um plantão que já começou.',
      'CONFLICT',
      409,
    )
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .update({
      status: 'cancelado',
      cancelado_em: now,
      motivo_cancelamento: 'Cancelado pelo profissional.',
      atualizado_em: now,
    })
    .eq('id', plantaoId)
    .eq('profissional_id', ctx.profissionalId)

  if (updateError) throw updateError
}
