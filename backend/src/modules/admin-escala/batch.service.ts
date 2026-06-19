import { supabaseAdmin } from '../../db/supabase.js'
import { parseIsoToLocalDateAndTime } from '../../lib/escalaDateTime.js'
import {
  assertNoDoctorConflictsForBatch,
  buildSlotInsertRow,
  buildSlotUpdateRow,
  formatSavedSlots,
  validateAssignedDoctorsExist,
  validateContratoEntidades,
  validateSpecialtiesExist,
} from './conflicts.service.js'
import { revokeConvitesForSlotIds } from '../public-plantao-aceite/convite.service.js'
import { revokeDigestsForSlotIds } from '../public-plantao-aceite/digest.service.js'
import { enqueuePublishedOpenPlantaoNotifications } from '../public-plantao-aceite/notify.service.js'
import { assertSlotsMutableForAdmin } from './execution.service.js'
import { EscalaError } from './errors.js'
import type { BatchSaveBody } from './schemas.js'
import type { BatchSaveResultDto } from './types.js'

function resolveContratoEntidadeIds(payload: BatchSaveBody): string[] {
  if (payload.contratoEntidadeIds?.length) {
    return [...new Set(payload.contratoEntidadeIds.map(String).filter(Boolean))]
  }

  const fromScope = payload.prefeituraScope.contratosPorPrefeitura
    ? Object.values(payload.prefeituraScope.contratosPorPrefeitura).filter(Boolean)
    : []

  if (fromScope.length > 0) {
    return [...new Set(fromScope.map(String))]
  }

  if (payload.contratoEntidadeId) {
    return [payload.contratoEntidadeId]
  }

  return []
}

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
  await revokeConvitesForSlotIds(shiftIds)
  await revokeDigestsForSlotIds(shiftIds)
  const { error } = await supabaseAdmin.from('escala_slots').delete().in('id', shiftIds)
  if (error) throw error
}

async function removeShiftsByBatchId(batchId: string): Promise<string | null> {
  const { data: slotRows, error: slotRowsError } = await supabaseAdmin
    .from('escala_slots')
    .select('id, programacao_id')
    .eq('lote_id', batchId)

  if (slotRowsError) throw slotRowsError

  const slotIds = (slotRows ?? []).map((row) => String(row.id))
  if (slotIds.length > 0) {
    await revokeConvitesForSlotIds(slotIds)
    await revokeDigestsForSlotIds(slotIds)
  }

  const programacaoId = slotRows?.[0]?.programacao_id
    ? String(slotRows[0].programacao_id)
    : null

  const { error: deleteError } = await supabaseAdmin
    .from('escala_slots')
    .delete()
    .eq('lote_id', batchId)

  if (deleteError) throw deleteError
  return programacaoId
}

async function getProgramacaoIdByBatchId(batchId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select('programacao_id')
    .eq('lote_id', batchId)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.programacao_id ? String(data.programacao_id) : null
}

async function loadExistingSlotIdsByBatchId(batchId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select('id')
    .eq('lote_id', batchId)

  if (error) throw error
  return new Set((data ?? []).map((row) => String(row.id)))
}

type SlotWriteContext = {
  programacaoId: string
  batchId: string
  status: BatchSaveBody['status']
  prefeituraScope: BatchSaveBody['prefeituraScope']
  ubtScope: BatchSaveBody['ubtScope']
  contratoEntidadeId?: string
  contratoEntidadeIds?: string[]
  publishedAt: string | null
}

async function persistBatchSlots(
  payload: BatchSaveBody,
  context: SlotWriteContext,
): Promise<string[]> {
  const existingIds = payload.replaceBatchId
    ? await loadExistingSlotIdsByBatchId(payload.replaceBatchId)
    : new Set<string>()

  const hasPersistedIds = payload.shifts.some((shift) => shift.id && existingIds.has(shift.id))

  if (payload.replaceBatchId && !hasPersistedIds) {
    await removeShiftsByBatchId(payload.replaceBatchId)
    existingIds.clear()
  }

  const savedIds: string[] = []
  const inserts: Record<string, unknown>[] = []

  for (const shift of payload.shifts) {
    const rowInput = {
      shift,
      programacaoId: context.programacaoId,
      batchId: context.batchId,
      status: context.status,
      prefeituraScope: context.prefeituraScope,
      ubtScope: context.ubtScope,
      contratoEntidadeId: context.contratoEntidadeIds?.[0] ?? context.contratoEntidadeId,
      contratoEntidadeIds: context.contratoEntidadeIds,
      publishedAt: context.publishedAt,
    }

    if (shift.id && existingIds.has(shift.id)) {
      const { error } = await supabaseAdmin
        .from('escala_slots')
        .update(buildSlotUpdateRow(rowInput))
        .eq('id', shift.id)

      if (error) throw error
      savedIds.push(shift.id)
      continue
    }

    inserts.push(buildSlotInsertRow(rowInput))
  }

  if (payload.replaceBatchId && hasPersistedIds) {
    const keepIds = new Set(payload.shifts.map((shift) => shift.id).filter(Boolean) as string[])
    const toDelete = [...existingIds].filter((id) => !keepIds.has(id))
    if (toDelete.length > 0) {
      await removeShiftsByIds(toDelete)
    }
  }

  if (inserts.length > 0) {
    const { data: insertedSlots, error: insertSlotsError } = await supabaseAdmin
      .from('escala_slots')
      .insert(inserts)
      .select('id')

    if (insertSlotsError) throw insertSlotsError
    savedIds.push(...(insertedSlots ?? []).map((row) => String(row.id)))
  }

  return savedIds
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

  const contratoEntidadeIds = resolveContratoEntidadeIds(payload)
  const specialtyIds = payload.shifts.map((shift) => shift.specialtyId)

  await validateContratoEntidades(contratoEntidadeIds, specialtyIds)
  await validateSpecialtiesExist(payload.shifts.map((shift) => shift.specialtyId))

  const doctorIds = payload.shifts.flatMap((shift) => [
    ...(shift.primaryDoctorId ? [shift.primaryDoctorId] : []),
    ...(shift.backupDoctorIds ?? []),
  ])
  await validateAssignedDoctorsExist(doctorIds)

  const mutableCheckIds = [
    ...(payload.removeShiftIds ?? []),
    ...payload.shifts.map((shift) => shift.id).filter((id): id is string => Boolean(id)),
  ]
  if (payload.replaceBatchId) {
    const existingIds = await loadExistingSlotIdsByBatchId(payload.replaceBatchId)
    const keepIds = new Set(payload.shifts.map((shift) => shift.id).filter(Boolean) as string[])
    mutableCheckIds.push(...[...existingIds].filter((id) => !keepIds.has(id)))
  }
  await assertSlotsMutableForAdmin(mutableCheckIds)

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
    programacaoId = await getProgramacaoIdByBatchId(payload.replaceBatchId)
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
    contrato_entidade_id: contratoEntidadeIds[0] ?? null,
    contrato_entidade_ids: contratoEntidadeIds,
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

  const slotIds = await persistBatchSlots(payload, {
    programacaoId: programacaoId!,
    batchId: payload.batchId,
    status: payload.status,
    prefeituraScope: payload.prefeituraScope,
    ubtScope: payload.ubtScope,
    contratoEntidadeId: contratoEntidadeIds[0],
    contratoEntidadeIds,
    publishedAt,
  })

  const shifts = await formatSavedSlots(slotIds)

  if (payload.status === 'publicada') {
    enqueuePublishedOpenPlantaoNotifications(slotIds)
  }

  return {
    shifts,
    programacaoId: programacaoId!,
    batchId: payload.batchId,
  }
}
