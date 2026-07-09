import {
  aggregateWeeklyActiveMindStats,
  resolveCurrentWeekStartIso,
  resolveWeekBounds,
  type WeeklyActiveMindStatsDto,
} from './sessoes.formatters.js'
import { listSessoesForWeeklyStats } from './sessoes.repository.js'
import type { VdActiveMindPacienteScope } from './types.js'

export async function getActiveMindEstatisticasSemanais(
  scope: VdActiveMindPacienteScope,
  options: { weekStartIso?: string } = {},
  deps: { listSessoesForWeeklyStats: typeof listSessoesForWeeklyStats } = {
    listSessoesForWeeklyStats,
  },
): Promise<WeeklyActiveMindStatsDto> {
  const weekStartIso = resolveCurrentWeekStartIso(new Date(), options.weekStartIso)
  const bounds = resolveWeekBounds(weekStartIso)
  const rows = await deps.listSessoesForWeeklyStats(scope, bounds)
  return aggregateWeeklyActiveMindStats(rows, bounds)
}
