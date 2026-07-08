import {
  aggregateWeeklyProgressFromActivities,
  resolveWeekBoundsFromStartDateKey,
  resolveWeekStartDateKeyFromCompletedAt,
} from './atividades.formatters.js'
import { listAtividadesForWeek, listAtividadesForWeekProgress } from './atividades.repository.js'
import { findMetasSemanaisBySemana } from './metas-semanais.repository.js'
import { resolveCurrentWeekStartDateKey } from './metas-semanais.formatters.js'
import {
  buildMetasSemanaisProgresso,
  type RunWalkMetasSemanaisProgressoDto,
} from './progresso-semanal.formatters.js'
import type { VdRunWalkPacienteScope } from './types.js'
import {
  findProgressoSemanalBySemana,
  updateProgressoSemanalMaterialized,
} from './progresso-semanal.repository.js'

export type MetasSemanaisProgressoServiceDeps = {
  resolveWeekStart: typeof resolveCurrentWeekStartDateKey
  listWeekActivities: typeof listAtividadesForWeekProgress
  findMetas: typeof findMetasSemanaisBySemana
  findProgressoExtras: typeof findProgressoSemanalBySemana
}

const defaultProgressoDeps: MetasSemanaisProgressoServiceDeps = {
  resolveWeekStart: resolveCurrentWeekStartDateKey,
  listWeekActivities: listAtividadesForWeekProgress,
  findMetas: findMetasSemanaisBySemana,
  findProgressoExtras: findProgressoSemanalBySemana,
}

export async function getRunWalkMetasSemanaisProgresso(
  scope: VdRunWalkPacienteScope,
  now = new Date(),
  deps: MetasSemanaisProgressoServiceDeps = defaultProgressoDeps,
): Promise<RunWalkMetasSemanaisProgressoDto> {
  const weekStartDate = deps.resolveWeekStart(now)
  const bounds = resolveWeekBoundsFromStartDateKey(weekStartDate)

  const [activityRows, metasRow, progressoRow] = await Promise.all([
    deps.listWeekActivities(scope, bounds),
    deps.findMetas(scope, weekStartDate),
    deps.findProgressoExtras(scope, weekStartDate),
  ])

  return buildMetasSemanaisProgresso({
    weekStartDate,
    activities: activityRows.map((row) => ({
      id: row.id,
      modality: row.modality,
      activityName: row.activity_name,
      activeMinutes: row.active_minutes,
      completedAt: row.completed_at,
    })),
    targets: metasRow
      ? {
          targetActivities: metasRow.target_activities,
          targetActiveMinutes: metasRow.target_active_minutes,
          targetMovementDays: metasRow.target_movement_days,
        }
      : null,
    dailyExtraMinutes: progressoRow?.daily_extra_minutes ?? {},
    extraCompletedActivities: progressoRow?.extra_completed_activities ?? 0,
    now,
  })
}

export async function refreshProgressoSemanalAfterAtividadeChange(
  scope: VdRunWalkPacienteScope,
  completedAtIso: string,
): Promise<void> {
  const semanaInicio = resolveWeekStartDateKeyFromCompletedAt(completedAtIso)
  const progresso = await findProgressoSemanalBySemana(scope, semanaInicio)
  if (!progresso) return

  const bounds = resolveWeekBoundsFromStartDateKey(semanaInicio)
  const activities = await listAtividadesForWeek(scope, bounds)
  const materialized = aggregateWeeklyProgressFromActivities(activities)

  await updateProgressoSemanalMaterialized(scope, semanaInicio, materialized)
}
