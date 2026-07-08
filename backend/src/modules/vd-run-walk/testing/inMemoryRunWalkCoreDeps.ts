import { randomUUID } from 'node:crypto'
import type { ListAtividadesRepositoryQuery } from '../atividades.repository.js'
import { isUniqueViolationError } from '../atividades.repository.js'
import type { RunWalkAtividadeRow, VdRunWalkPacienteScope } from '../types.js'
import type { RunWalkCoreServiceDeps } from '../service.js'
import {
  syncRunWalkAtividadeToMetricas,
  type RunWalkMetricasSyncDeps,
} from '../run-walk-metricas-sync.service.js'

function sortActivities(
  rows: RunWalkAtividadeRow[],
  sort: ListAtividadesRepositoryQuery['sort'],
) {
  const copy = [...rows]
  if (sort === 'distance') {
    return copy.sort((left, right) => right.distance_km - left.distance_km)
  }
  if (sort === 'duration') {
    return copy.sort((left, right) => right.elapsed_seconds - left.elapsed_seconds)
  }
  return copy.sort((left, right) => right.completed_at.localeCompare(left.completed_at))
}

export function createInMemoryRunWalkCoreDeps(): {
  deps: RunWalkCoreServiceDeps
  metricasInserts: Array<Record<string, unknown>>
  activities: Map<string, RunWalkAtividadeRow>
} {
  const activities = new Map<string, RunWalkAtividadeRow>()
  const metricasInserts: Array<Record<string, unknown>> = []
  const syncedActivityIds = new Set<string>()

  const metricasSyncDeps: RunWalkMetricasSyncDeps = {
    existsLeitura: async (_pacienteId, runWalkActivityId) =>
      syncedActivityIds.has(runWalkActivityId),
    insertLeitura: async (_scope, input) => {
      syncedActivityIds.add(input.runWalkActivityId)
      metricasInserts.push({ ...input })
      return {
        id: randomUUID(),
        paciente_id: input.runWalkActivityId,
        entidade_contratante_id: 'ent-1',
        tipo: 'passos',
        registrado_em: input.recordedAtIso,
        origem: 'sistema',
        valor: input.steps,
        valor_secundario: null,
        contexto_glicemia: null,
        medida_corporal: null,
        metadados: {
          kind: input.kind,
          runWalkActivityId: input.runWalkActivityId,
        },
        criado_em: input.recordedAtIso,
      }
    },
  }

  const deps: RunWalkCoreServiceDeps = {
    findAtividadeByClientActivityId: async (scope, clientActivityId) => {
      for (const row of activities.values()) {
        if (
          row.paciente_id === scope.pacienteId &&
          row.client_activity_id === clientActivityId
        ) {
          return row
        }
      }
      return null
    },
    insertAtividade: async (input) => {
      const now = new Date().toISOString()
      const row: RunWalkAtividadeRow = {
        id: randomUUID(),
        paciente_id: input.paciente_id,
        entidade_contratante_id: input.entidade_contratante_id,
        client_activity_id: input.client_activity_id,
        modality: input.modality,
        activity_name: input.activity_name,
        elapsed_seconds: input.elapsed_seconds,
        distance_km: input.distance_km,
        average_speed_kmh: input.average_speed_kmh,
        pace_min_per_km: input.pace_min_per_km,
        step_count: input.step_count,
        heart_rate_bpm: input.heart_rate_bpm,
        estimated_calories: input.estimated_calories,
        active_minutes: input.active_minutes,
        completed_at: input.completed_at,
        trail_simplified: input.trail_simplified,
        trail_point_count: input.trail_point_count,
        location_city: input.location_city,
        location_state: input.location_state,
        check_in: input.check_in,
        check_in_skipped: input.check_in_skipped,
        deleted_at: null,
        criado_em: now,
        atualizado_em: now,
      }
      activities.set(row.client_activity_id, row)
      return row
    },
    isUniqueViolationError,
    listAtividades: async (scope, filters) => {
      let rows = [...activities.values()].filter(
        (row) =>
          row.paciente_id === scope.pacienteId &&
          row.entidade_contratante_id === scope.entidadeContratanteId &&
          row.deleted_at == null,
      )

      if (filters.bounds.startIso) {
        rows = rows.filter((row) => row.completed_at >= filters.bounds.startIso!)
      }
      if (filters.bounds.endIso) {
        rows = rows.filter((row) => row.completed_at <= filters.bounds.endIso!)
      }
      if (filters.minDistanceKm > 0) {
        rows = rows.filter((row) => row.distance_km >= filters.minDistanceKm)
      }

      const sorted = sortActivities(rows, filters.sort)
      const offset = (filters.page - 1) * filters.pageSize
      const pageRows = sorted.slice(offset, offset + filters.pageSize)

      return {
        rows: pageRows,
        totalCount: sorted.length,
      }
    },
    listAtividadesForResumo: async (scope, bounds) => {
      return [...activities.values()]
        .filter(
          (row) =>
            row.paciente_id === scope.pacienteId &&
            row.entidade_contratante_id === scope.entidadeContratanteId &&
            row.deleted_at == null,
        )
        .filter((row) => (bounds.startIso ? row.completed_at >= bounds.startIso : true))
        .filter((row) => (bounds.endIso ? row.completed_at <= bounds.endIso : true))
        .map((row) => ({
          id: row.id,
          activity_name: row.activity_name,
          modality: row.modality,
          distance_km: row.distance_km,
          active_minutes: row.active_minutes,
          estimated_calories: row.estimated_calories,
          elapsed_seconds: row.elapsed_seconds,
          pace_min_per_km: row.pace_min_per_km,
          completed_at: row.completed_at,
        }))
        .sort((left, right) => left.completed_at.localeCompare(right.completed_at))
    },
    syncRunWalkAtividadeToMetricas: async (input) =>
      syncRunWalkAtividadeToMetricas(input, metricasSyncDeps),
  }

  return { deps, metricasInserts, activities }
}
