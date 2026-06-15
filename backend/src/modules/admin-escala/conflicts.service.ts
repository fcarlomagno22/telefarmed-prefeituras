import { supabaseAdmin } from '../../db/supabase.js'
import { resolveSlotClockBoundsFromIso } from '../../lib/escalaDateTime.js'
import { EscalaError } from './errors.js'
import {
  assertValidRepasseRule,
  resolveValorCentavosFromRepasseRule,
  serializeRepasseRule,
  type EscalaRepasseRule,
} from './repasseRule.js'
import { formatSlotRow } from './formatters.js'
import { loadSlotsByIds } from './shifts.service.js'
import type { ConflictsBody } from './schemas.js'
import type { SlotListagemRow } from './types.js'

type Interval = {
  startMs: number
  endMs: number
  doctorId: string
  shiftRef: string
}

function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.startMs < b.endMs && a.endMs > b.startMs
}

function collectDoctorIntervals(
  row: Pick<
    SlotListagemRow,
    'id' | 'lote_id' | 'inicio_em' | 'fim_em' | 'profissional_titular_id' | 'fila_reserva' | 'status'
  >,
): Interval[] {
  if (row.status === 'cancelada') return []

  const startMs = new Date(row.inicio_em).getTime()
  const endMs = new Date(row.fim_em).getTime()
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return []

  const intervals: Interval[] = []
  if (row.profissional_titular_id) {
    intervals.push({
      startMs,
      endMs,
      doctorId: row.profissional_titular_id,
      shiftRef: row.id,
    })
  }

  const backupIds = Array.isArray(row.fila_reserva) ? row.fila_reserva.map(String) : []
  for (const doctorId of backupIds) {
    intervals.push({ startMs, endMs, doctorId, shiftRef: row.id })
  }

  return intervals
}

export async function checkEscalaConflicts(
  params: ConflictsBody,
): Promise<{ conflicts: string[]; hasConflict: boolean }> {
  const doctorFilter = new Set(params.doctorIds)
  const proposed: Interval[] = []

  for (const shift of params.shifts) {
    if (shift.status === 'cancelada') continue
    const startMs = new Date(shift.startAt).getTime()
    const endMs = new Date(shift.endAt).getTime()
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) continue

    const doctors = [
      ...(shift.primaryDoctorId ? [shift.primaryDoctorId] : []),
      ...shift.backupDoctorIds,
    ].filter((doctorId) => doctorFilter.size === 0 || doctorFilter.has(doctorId))

    for (const doctorId of doctors) {
      proposed.push({
        startMs,
        endMs,
        doctorId,
        shiftRef: shift.id ?? shift.batchId ?? 'novo',
      })
    }
  }

  let query = supabaseAdmin
    .from('vw_admin_escala_slots_listagem')
    .select('id, lote_id, inicio_em, fim_em, profissional_titular_id, fila_reserva, status')
    .neq('status', 'cancelada')

  if (params.excludeBatchId) {
    query = query.neq('lote_id', params.excludeBatchId)
  }

  const { data, error } = await query
  if (error) throw error

  const existing: Interval[] = (data ?? []).flatMap((row) =>
    collectDoctorIntervals(row as SlotListagemRow),
  )

  const conflicts: string[] = []

  for (const candidate of proposed) {
    for (const other of proposed) {
      if (candidate === other) continue
      if (candidate.doctorId !== other.doctorId) continue
      if (!intervalsOverlap(candidate, other)) continue
      conflicts.push(
        `Conflito de agenda para o profissional ${candidate.doctorId} entre plantões propostos.`,
      )
    }

    for (const booked of existing) {
      if (candidate.doctorId !== booked.doctorId) continue
      if (!intervalsOverlap(candidate, booked)) continue
      conflicts.push(
        `Conflito de agenda para o profissional ${candidate.doctorId} com plantão ${booked.shiftRef}.`,
      )
    }
  }

  const unique = [...new Set(conflicts)]
  return { conflicts: unique, hasConflict: unique.length > 0 }
}

export async function assertNoDoctorConflictsForBatch(
  params: ConflictsBody,
): Promise<void> {
  const result = await checkEscalaConflicts(params)
  if (result.hasConflict) {
    throw new EscalaError(result.conflicts[0] ?? 'Conflito de agenda detectado.', 'DOCTOR_CONFLICT', 409)
  }
}

export async function validateAssignedDoctorsExist(doctorIds: string[]): Promise<void> {
  const unique = [...new Set(doctorIds.filter(Boolean))]
  if (unique.length === 0) return

  const { data, error } = await supabaseAdmin
    .from('usuarios_profissionais')
    .select('id')
    .in('id', unique)
    .eq('status', 'ativo')

  if (error) throw error
  if ((data ?? []).length !== unique.length) {
    throw new EscalaError('Um ou mais profissionais informados não estão ativos.', 'INVALID_DATA', 400)
  }
}

export async function validateSpecialtiesExist(specialtyIds: string[]): Promise<void> {
  const unique = [...new Set(specialtyIds.filter(Boolean))]
  if (unique.length === 0) return

  const { data, error } = await supabaseAdmin
    .from('config_especialidades')
    .select('id')
    .in('id', unique)
    .eq('ativo', true)

  if (error) throw error
  if ((data ?? []).length !== unique.length) {
    throw new EscalaError('Especialidade inválida ou inativa.', 'INVALID_DATA', 400)
  }
}

export async function validateContratoEntidade(contratoId: string | undefined): Promise<void> {
  if (!contratoId) return

  const { data, error } = await supabaseAdmin
    .from('contratos_entidade')
    .select('id, status')
    .eq('id', contratoId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new EscalaError('Contrato operacional não encontrado.', 'NOT_FOUND', 404)
  }
  if (!['ativo', 'implantacao'].includes(String(data.status))) {
    throw new EscalaError('Contrato operacional não está ativo.', 'INVALID_DATA', 400)
  }
}

type SlotPayloadInput = ConflictsBody['shifts'][number] & {
  specialtyId: string
  modality: 'tele' | 'hibrido' | 'presencial_ubt'
  assignmentMode: 'assigned' | 'open'
  amountCents: number
  repasseRule: EscalaRepasseRule
  unitName?: string
  city?: string
  cityUf?: string
  fullAddress?: string | null
  notes?: string
  vacancies?: number
  totalVacancies?: number
}

function buildSlotPayloadFields(
  shift: SlotPayloadInput,
  context: {
    programacaoId: string
    batchId: string
    status: 'rascunho' | 'publicada'
    prefeituraScope: unknown
    ubtScope: unknown
    contratoEntidadeId?: string
    publishedAt: string | null
  },
): Record<string, unknown> {
  let date: string
  let horaInicio: string
  let horaFim: string

  try {
    const bounds = resolveSlotClockBoundsFromIso(shift.startAt, shift.endAt)
    date = bounds.date
    horaInicio = bounds.horaInicio
    horaFim = bounds.horaFim
  } catch (error) {
    const message =
      error instanceof Error && error.message === 'Horário final deve ser posterior ao inicial.'
        ? error.message
        : 'Data/hora do plantão inválida.'
    throw new EscalaError(message, 'INVALID_DATA', 400)
  }

  if (shift.modality === 'presencial_ubt' && !shift.fullAddress?.trim()) {
    throw new EscalaError('Plantões presenciais precisam de endereço completo.', 'INVALID_DATA', 400)
  }

  if (shift.assignmentMode === 'assigned' && !shift.primaryDoctorId) {
    throw new EscalaError('Modo atribuído exige médico titular.', 'INVALID_DATA', 400)
  }

  const totalVacancies =
    shift.assignmentMode === 'open'
      ? Math.max(1, shift.vacancies ?? shift.totalVacancies ?? 1)
      : 0

  if (shift.assignmentMode === 'open' && totalVacancies <= 0) {
    throw new EscalaError('Plantões abertos precisam de ao menos uma vaga.', 'INVALID_DATA', 400)
  }

  assertValidRepasseRule(shift.repasseRule)
  const valorCentavos = resolveValorCentavosFromRepasseRule(shift.repasseRule)

  return {
    programacao_id: context.programacaoId,
    lote_id: context.batchId,
    data: date,
    hora_inicio: horaInicio,
    hora_fim: horaFim,
    especialidade_id: shift.specialtyId,
    modalidade: shift.modality,
    modo_atribuicao: shift.assignmentMode,
    vagas: totalVacancies,
    valor_centavos: valorCentavos,
    repasse_regra: serializeRepasseRule(shift.repasseRule),
    status: context.status,
    profissional_titular_id: shift.assignmentMode === 'assigned' ? shift.primaryDoctorId : null,
    fila_reserva: shift.backupDoctorIds ?? [],
    escopo_prefeitura: context.prefeituraScope,
    escopo_ubt: context.ubtScope,
    contrato_entidade_id: context.contratoEntidadeId ?? null,
    unidade_nome: shift.unitName?.trim() || '',
    cidade: shift.city?.trim() || '',
    cidade_uf: shift.cityUf?.trim() || '',
    endereco_completo:
      shift.modality === 'presencial_ubt' ? shift.fullAddress?.trim() || null : null,
    notas: shift.notes?.trim() || '',
    publicado_em: context.status === 'publicada' ? context.publishedAt : null,
    atualizado_em: new Date().toISOString(),
  }
}

export function buildSlotInsertRow(input: {
  shift: SlotPayloadInput
  programacaoId: string
  batchId: string
  status: 'rascunho' | 'publicada'
  prefeituraScope: unknown
  ubtScope: unknown
  contratoEntidadeId?: string
  publishedAt: string | null
}): Record<string, unknown> {
  return buildSlotPayloadFields(input.shift, input)
}

export function buildSlotUpdateRow(input: {
  shift: SlotPayloadInput
  programacaoId: string
  batchId: string
  status: 'rascunho' | 'publicada'
  prefeituraScope: unknown
  ubtScope: unknown
  contratoEntidadeId?: string
  publishedAt: string | null
}): Record<string, unknown> {
  return buildSlotPayloadFields(input.shift, input)
}

export async function formatSavedSlots(slotIds: string[]) {
  const rows = await loadSlotsByIds(slotIds)
  return rows.map((row) => formatSlotRow(row, []))
}
