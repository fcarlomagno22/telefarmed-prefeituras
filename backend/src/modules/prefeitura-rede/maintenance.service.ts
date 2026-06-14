import { supabaseAdmin } from '../../db/supabase.js'
import {
  mapUnitRowToApi,
  normalizeMaintenanceIndexes,
  resolveOperationalStatus,
} from './formatters.js'
import { PrefeituraRedeError } from './errors.js'
import type { MaintenanceBody } from './schemas.js'
import { loadRedeUnitRows } from './units.service.js'

export async function getRedeMaintenance(entidadeId: string) {
  const rows = await loadRedeUnitRows(entidadeId)
  return {
    items: rows.map((row) => ({
      unitId: row.id,
      terminalIndexes: normalizeMaintenanceIndexes(row.terminais_manutencao, row.terminais_total),
    })),
  }
}

export async function updateRedeMaintenance(entidadeId: string, body: MaintenanceBody) {
  const rows = await loadRedeUnitRows(entidadeId)
  const rowsById = new Map(rows.map((row) => [row.id, row]))

  for (const item of body.items) {
    const row = rowsById.get(item.unitId)
    if (!row) {
      throw new PrefeituraRedeError('Unidade não encontrada.', 'NOT_FOUND', 404)
    }

    const terminalIndexes = normalizeMaintenanceIndexes(item.terminalIndexes, row.terminais_total)
    const estadoOperacional = resolveOperationalStatus(
      row.estado_operacional === 'inativa' ? 'inativa' : 'ativa',
      row.terminais_total,
      terminalIndexes,
    )

    const { error } = await supabaseAdmin
      .from('unidades_ubt')
      .update({
        terminais_manutencao: terminalIndexes,
        estado_operacional: estadoOperacional,
      })
      .eq('id', item.unitId)
      .eq('entidade_contratante_id', entidadeId)

    if (error) throw error
  }

  const updatedUnits = await loadRedeUnitRows(entidadeId)
  return {
    items: updatedUnits.map((row) => ({
      unitId: row.id,
      terminalIndexes: normalizeMaintenanceIndexes(row.terminais_manutencao, row.terminais_total),
    })),
    units: updatedUnits.map((row) => mapUnitRowToApi(row)),
  }
}
