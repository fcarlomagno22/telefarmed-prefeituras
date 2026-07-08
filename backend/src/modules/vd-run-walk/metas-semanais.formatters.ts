import type { z } from 'zod'
import type { upsertMetasSemanaisBodySchema } from './schemas.js'
import { resolveWeekStartDateKeyFromCompletedAt } from './atividades.formatters.js'

export type UpsertMetasSemanaisInput = z.infer<typeof upsertMetasSemanaisBodySchema>

/** Alinhado a WeeklyGoalTargets (app_cidades/src/types/runWalk.ts). */
export type WeeklyGoalTargetsDto = {
  targetActivities: number
  targetActiveMinutes: number
  targetMovementDays: number
}

export type RunWalkMetasSemanaisDto = {
  weekStartDate: string
  targets: WeeklyGoalTargetsDto | null
  createdAt: string | null
  updatedAt: string | null
}

export type RunWalkMetasSemanalRow = {
  id: string
  paciente_id: string
  entidade_contratante_id: string
  semana_inicio: string
  target_activities: number
  target_active_minutes: number
  target_movement_days: number
  criado_em: string
  atualizado_em: string
}

export function resolveCurrentWeekStartDateKey(now = new Date()): string {
  return resolveWeekStartDateKeyFromCompletedAt(now.toISOString())
}

export function mapMetasSemanalRowToDto(row: RunWalkMetasSemanalRow): RunWalkMetasSemanaisDto {
  return {
    weekStartDate: row.semana_inicio,
    targets: {
      targetActivities: row.target_activities,
      targetActiveMinutes: row.target_active_minutes,
      targetMovementDays: row.target_movement_days,
    },
    createdAt: row.criado_em,
    updatedAt: row.atualizado_em,
  }
}

export function buildEmptyMetasSemanaisDto(weekStartDate: string): RunWalkMetasSemanaisDto {
  return {
    weekStartDate,
    targets: null,
    createdAt: null,
    updatedAt: null,
  }
}

export function mapUpsertInputToRowFields(input: UpsertMetasSemanaisInput) {
  return {
    target_activities: input.targetActivities,
    target_active_minutes: input.targetActiveMinutes,
    target_movement_days: input.targetMovementDays,
  }
}
