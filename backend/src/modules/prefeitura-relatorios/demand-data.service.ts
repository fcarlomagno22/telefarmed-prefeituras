import { supabaseAdmin } from '../../db/supabase.js'
import { loadActiveContratoIds } from '../ubt-agenda/ownership.js'
import { slotVisibleToUbt } from '../ubt-agenda/slot-utils.js'
import { periodBounds } from '../prefeitura-consultas/period.js'
import { isMissingRelationError } from './report-shared.js'

export type FilaSpecialtyRow = {
  id: string
  unidade_ubt_id: string
  especialidade_id: string | null
  chegada_em: string
  status: string
  origem: string
  agenda_consulta_id: string | null
}

export type EscalaSlotPeriodRow = {
  id: string
  data: string
  hora_inicio: string
  hora_fim: string
  especialidade_id: string
  vagas: number
  escopo_ubt: unknown
  modalidade: string
  status: string
}

export type PlantaoPeriodRow = {
  id: string
  slot_id: string
  profissional_id: string
  status: string
  profissional_nome: string
  slot: EscalaSlotPeriodRow
}

export async function loadFilaRowsWithSpecialty(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<FilaSpecialtyRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select(
      'id, unidade_ubt_id, especialidade_id, chegada_em, status, origem, agenda_consulta_id',
    )
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('chegada_em', startIso)
    .lte('chegada_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as FilaSpecialtyRow[]
}

export async function loadPublishedSlotsInPeriod(
  entidadeId: string,
  periodStart: string,
  periodEnd: string,
): Promise<EscalaSlotPeriodRow[]> {
  const contratoIds = await loadActiveContratoIds(entidadeId)
  if (contratoIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('escala_slots')
    .select('id, data, hora_inicio, hora_fim, especialidade_id, vagas, escopo_ubt, modalidade, status')
    .in('contrato_entidade_id', contratoIds)
    .gte('data', periodStart)
    .lte('data', periodEnd)
    .eq('status', 'publicada')

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as EscalaSlotPeriodRow[]
}

export async function loadPlantoesInPeriod(
  entidadeId: string,
  periodStart: string,
  periodEnd: string,
): Promise<PlantaoPeriodRow[]> {
  const contratoIds = await loadActiveContratoIds(entidadeId)
  if (contratoIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select(
      `
      id,
      slot_id,
      profissional_id,
      status,
      escala_slots!inner (
        id,
        data,
        hora_inicio,
        hora_fim,
        especialidade_id,
        vagas,
        escopo_ubt,
        modalidade,
        status,
        contrato_entidade_id
      ),
      usuarios_profissionais ( nome )
    `,
    )
    .in('status', ['confirmado', 'realizado'])
    .gte('escala_slots.data', periodStart)
    .lte('escala_slots.data', periodEnd)
    .eq('escala_slots.status', 'publicada')
    .in('escala_slots.contrato_entidade_id', contratoIds)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  const rows: PlantaoPeriodRow[] = []
  for (const raw of data ?? []) {
    const slotRaw = (raw as { escala_slots: unknown }).escala_slots
    const slot = (Array.isArray(slotRaw) ? slotRaw[0] : slotRaw) as EscalaSlotPeriodRow | null
    if (!slot) continue

    const profRaw = (raw as { usuarios_profissionais: unknown }).usuarios_profissionais
    const prof = (Array.isArray(profRaw) ? profRaw[0] : profRaw) as { nome?: string } | null

    rows.push({
      id: String((raw as { id: string }).id),
      slot_id: String((raw as { slot_id: string }).slot_id),
      profissional_id: String((raw as { profissional_id: string }).profissional_id),
      status: String((raw as { status: string }).status),
      profissional_nome: prof?.nome ? String(prof.nome) : 'Profissional',
      slot,
    })
  }

  return rows
}

export function slotVisibleCapacityForUnit(
  slot: EscalaSlotPeriodRow,
  unitId: string,
): number {
  if (!slotVisibleToUbt(slot.escopo_ubt, unitId, String(slot.modalidade ?? 'tele'))) {
    return 0
  }
  return Math.max(0, Number(slot.vagas ?? 0))
}

export function buildSpecialtyNameMap(
  consultaNames: Array<{ especialidade_id: string; especialidade_nome: string }>,
) {
  const map = new Map<string, string>()
  for (const row of consultaNames) {
    const id = String(row.especialidade_id)
    const name = String(row.especialidade_nome ?? '').trim()
    if (id && name) map.set(id, name)
  }
  return map
}

export function resolveSpecialtyLabel(id: string, names: Map<string, string>) {
  return names.get(id) ?? 'Especialidade'
}
