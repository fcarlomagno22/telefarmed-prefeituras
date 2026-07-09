import {
  aggregateWeeklyTrainingStats,
  resolveCurrentWeekStartIso,
  resolveWeekBounds,
  type WeeklyTrainingStatsDto,
} from './sessoes.formatters.js'
import { listSessoesForWeeklyStats } from './sessoes.repository.js'
import type { VdFunctionalTrainingPacienteScope } from './types.js'

export async function getFunctionalTrainingEstatisticasSemanais(
  scope: VdFunctionalTrainingPacienteScope,
  options: { weekStartIso?: string } = {},
  deps: { listSessoesForWeeklyStats: typeof listSessoesForWeeklyStats } = {
    listSessoesForWeeklyStats,
  },
): Promise<WeeklyTrainingStatsDto> {
  const weekStartIso = resolveCurrentWeekStartIso(new Date(), options.weekStartIso)
  const bounds = resolveWeekBounds(weekStartIso)
  const rows = await deps.listSessoesForWeeklyStats(scope, bounds)
  return aggregateWeeklyTrainingStats(rows)
}
