import { supabaseAdmin } from '../../db/supabase.js'
import { ProfissionalAgendaError } from './errors.js'
import type { PlantaoConfirmadoRow } from './types.js'

export async function assertPlantaoBelongsToProfissional(
  profissionalId: string,
  plantaoId: string,
): Promise<PlantaoConfirmadoRow> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id, status, profissional_id')
    .eq('id', plantaoId)
    .eq('profissional_id', profissionalId)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new ProfissionalAgendaError('Plantão não encontrado.', 'NOT_FOUND', 404)
  }

  if (!['confirmado', 'realizado'].includes(String(data.status))) {
    throw new ProfissionalAgendaError('Plantão não está disponível.', 'FORBIDDEN', 403)
  }

  return {
    id: String(data.id),
    slot_id: String(data.slot_id),
    status: String(data.status),
    profissional_id: String(data.profissional_id),
  }
}

export async function loadSlotIdsForProfissionalPlantoes(
  profissionalId: string,
  dateFrom: string,
  dateTo: string,
): Promise<Map<string, string>> {
  const { data, error } = await supabaseAdmin
    .from('escala_plantoes_confirmados')
    .select('id, slot_id, escala_slots!inner(data)')
    .eq('profissional_id', profissionalId)
    .in('status', ['confirmado', 'realizado'])
    .gte('escala_slots.data', dateFrom)
    .lte('escala_slots.data', dateTo)

  if (error) throw error

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(String(row.id), String(row.slot_id))
  }
  return map
}
