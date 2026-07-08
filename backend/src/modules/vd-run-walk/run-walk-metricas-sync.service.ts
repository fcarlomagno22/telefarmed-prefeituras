import {
  deriveStepsFromDistanceKm,
  deriveStepsFromDurationMinutes,
  formatAtividadeDistanceKm,
  formatAtividadeSteps,
} from '../vd-metricas/atividade.formatters.js'
import {
  insertRunWalkAtividadeLeitura,
  type RunWalkAtividadeLeituraKind,
} from '../vd-metricas/atividade.repository.js'
import {
  existsLeituraFromRunWalkActivity,
  RUN_WALK_ACTIVITY_METADATA_KEY,
} from '../vd-metricas/leituras.repository.js'
import type { VdMetricasPacienteScope } from '../vd-metricas/types.js'
import type { RunWalkModality } from './types.js'

export type SyncRunWalkAtividadeToMetricasInput = {
  scope: VdMetricasPacienteScope
  activity: {
    id: string
    modality: RunWalkModality
    stepCount: number
    distanceKm: number
    activeMinutes: number
    estimatedCalories: number
    completedAt: string
  }
}

export type SyncRunWalkAtividadeToMetricasResult = {
  created: boolean
  skippedReason?: 'already_synced'
}

export type RunWalkMetricasSyncDeps = {
  existsLeitura: typeof existsLeituraFromRunWalkActivity
  insertLeitura: typeof insertRunWalkAtividadeLeitura
}

const defaultDeps: RunWalkMetricasSyncDeps = {
  existsLeitura: existsLeituraFromRunWalkActivity,
  insertLeitura: insertRunWalkAtividadeLeitura,
}

export function mapRunWalkModalityToMetricasKind(
  modality: RunWalkModality,
): RunWalkAtividadeLeituraKind {
  if (modality === 'run') return 'corrida'
  if (modality === 'run-walk') return 'corrida-caminhada'
  return 'caminhada'
}

export function resolveRunWalkActivitySteps(input: {
  stepCount: number
  distanceKm: number
  activeMinutes: number
}): number {
  if (input.stepCount > 0) {
    return formatAtividadeSteps(input.stepCount)
  }

  if (input.distanceKm > 0) {
    return deriveStepsFromDistanceKm(input.distanceKm)
  }

  if (input.activeMinutes > 0) {
    return deriveStepsFromDurationMinutes(input.activeMinutes)
  }

  return 0
}

export async function syncRunWalkAtividadeToMetricas(
  input: SyncRunWalkAtividadeToMetricasInput,
  deps: RunWalkMetricasSyncDeps = defaultDeps,
): Promise<SyncRunWalkAtividadeToMetricasResult> {
  const exists = await deps.existsLeitura(input.scope.pacienteId, input.activity.id)
  if (exists) {
    return { created: false, skippedReason: 'already_synced' }
  }

  const steps = resolveRunWalkActivitySteps({
    stepCount: input.activity.stepCount,
    distanceKm: input.activity.distanceKm,
    activeMinutes: input.activity.activeMinutes,
  })

  if (steps <= 0) {
    return { created: false }
  }

  await deps.insertLeitura(input.scope, {
    steps,
    distanceKm: formatAtividadeDistanceKm(input.activity.distanceKm),
    durationMinutes: input.activity.activeMinutes,
    estimatedCalories: input.activity.estimatedCalories,
    recordedAtIso: input.activity.completedAt,
    runWalkActivityId: input.activity.id,
    kind: mapRunWalkModalityToMetricasKind(input.activity.modality),
  })

  return { created: true }
}

export { RUN_WALK_ACTIVITY_METADATA_KEY }
