import { supabaseAdmin } from '../../db/supabase.js'
import { parseIsoToLocalDateAndTime } from '../../lib/escalaDateTime.js'
import {
  assertNoDoctorConflictsForBatch,
  buildSlotInsertRow,
  formatSavedSlots,
  validateAssignedDoctorsExist,
  validateContratoEntidade,
  validateSpecialtiesExist,
} from './conflicts.service.js'
import { EscalaError } from './errors.js'
import type { BatchSaveBody } from './schemas.js'
import type { BatchSaveResultDto } from './types.js'

function resolveProgramacaoPeriod(shifts: BatchSaveBody['shifts']): {
  dataInicio: string
  dataFim: string
} {
  let minDate = ''
  let maxDate = ''

  for (const shift of shifts) {
    const { date } = parseIsoToLocalDateAndTime(shift.startAt)
    if (!minDate || date < minDate) minDate = date
    if (!maxDate || date > maxDate) maxDate = date
  }

  if (!minDate || !maxDate) {
    throw new EscalaError('Período da programação inválido.', 'INVALID_DATA', 400)
  }

  return { dataInicio: minDate, dataFim: maxDate }
}

async function removeShiftsByIds(shiftIds: string[]): Promise<void> {
  if (shiftIds.length === 0) return
  const { error } = await supabaseAdmin.from('escala_slots').delete().in('id', shiftIds)
  if (error) throw error
}

async function removeShiftsByBatchId(batchId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select('programacao_id')
    .eq('lote_id', batchId)
    .limit(1)
    .maybeSingle()

  if (error) throw error

  const programacaoId = data?.programacao_id ? String(data.programacao_id) : null

  const { error: deleteError } = await supabaseAdmin
    .from('escala_slots')
    .delete()
    .eq('lote_id', batchId)

  if (deleteError) throw deleteError
  return programacaoId
}

export async function saveEscalaBatch(
  payload: BatchSaveBody,
  adminId: string,
): Promise<BatchSaveResultDto> {
  if (payload.shifts.length === 0) {
    throw new EscalaError('Informe ao menos um plantão.', 'INVALID_DATA', 400)
  }

  if (
    payload.prefeituraScope.mode === 'selected' &&
    payload.prefeituraScope.prefeituraIds.length === 0
  ) {
    throw new EscalaError('Selecione ao menos uma prefeitura.', 'INVALID_DATA', 400)
  }

  if (
    (payload.ubtScope.mode === 'selected' || payload.ubtScope.mode === 'all') &&
    payload.shifts.some((shift) => shift.modality !== 'tele') &&
    payload.ubtScope.mode === 'selected' &&
    payload.ubtScope.ubtIds.length === 0
  ) {
    throw new EscalaError('Selecione ao menos uma UBT para plantões presenciais ou híbridos.', 'INVALID_DATA', 400)
  }

  await validateContratoEntidade(payload.contratoEntidadeId)
  await validateSpecialtiesExist(payload.shifts.map((shift) => shift.specialtyId))

  const doctorIds = payload.shifts.flatMap((shift) => [
    ...(shift.primaryDoctorId ? [shift.primaryDoctorId] : []),
    ...(shift.backupDoctorIds ?? []),
  ])
  await validateAssignedDoctorsExist(doctorIds)

  await assertNoDoctorConflictsForBatch({
    doctorIds,
    excludeBatchId: payload.replaceBatchId ?? payload.batchId,
    shifts: payload.shifts.map((shift) => ({
      startAt: shift.startAt,
      endAt: shift.endAt,
      primaryDoctorId: shift.primaryDoctorId,
      backupDoctorIds: shift.backupDoctorIds ?? [],
      batchId: payload.batchId,
    })),
  })

  if (payload.removeShiftIds?.length) {
    await removeShiftsByIds(payload.removeShiftIds)
  }

  let programacaoId: string | null = null
  if (payload.replaceBatchId) {
    programacaoId = await removeShiftsByBatchId(payload.replaceBatchId)
  }

  const period = resolveProgramacaoPeriod(payload.shifts)
  const publishedAt = payload.status === 'publicada' ? new Date().toISOString() : null
  const primaryModality = payload.shifts[0]?.modality ?? 'tele'

  const programacaoPayload = {
    titulo: payload.titulo?.trim() || `Escala ${payload.batchId}`,
    data_inicio: period.dataInicio,
    data_fim: period.dataFim,
    modalidade: primaryModality,
    modo_programacao: 'fechada' as const,
    escopo_prefeitura: payload.prefeituraScope,
    escopo_ubt: payload.ubtScope,
    templates: [],
    status: payload.status,
    contrato_entidade_id: payload.contratoEntidadeId ?? null,
    criado_por_admin_id: adminId,
    publicado_em: publishedAt,
    cancelado_em: null,
  }

  if (programacaoId) {
    const { error: updateError } = await supabaseAdmin
      .from('escala_programacoes')
      .update({
        ...programacaoPayload,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', programacaoId)

    if (updateError) throw updateError
  } else {
    const { data: createdProgramacao, error: insertProgramacaoError } = await supabaseAdmin
      .from('escala_programacoes')
      .insert(programacaoPayload)
      .select('id')
      .single()

    if (insertProgramacaoError) throw insertProgramacaoError
    programacaoId = String(createdProgramacao.id)
  }

  const slotRows = payload.shifts.map((shift) =>
    buildSlotInsertRow({
      shift,
      programacaoId: programacaoId!,
      batchId: payload.batchId,
      status: payload.status,
      prefeituraScope: payload.prefeituraScope,
      ubtScope: payload.ubtScope,
      contratoEntidadeId: payload.contratoEntidadeId,
      publishedAt,
    }),
  )

  const { data: insertedSlots, error: insertSlotsError } = await supabaseAdmin
    .from('escala_slots')
    .insert(slotRows)
    .select('id')

  if (insertSlotsError) throw insertSlotsError

  const slotIds = (insertedSlots ?? []).map((row) => String(row.id))
  const shifts = await formatSavedSlots(slotIds)

  return {
    shifts,
    programacaoId: programacaoId!,
    batchId: payload.batchId,
  }
}
