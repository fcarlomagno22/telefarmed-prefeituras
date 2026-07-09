import { randomUUID } from 'node:crypto'
import type { InsertFavoritoRow } from '../favoritos.formatters.js'
import { isUniqueViolationError as isFavoritoUniqueViolationError } from '../favoritos.repository.js'
import type { InsertSessaoRow } from '../sessoes.formatters.js'
import { isUniqueViolationError as isSessaoUniqueViolationError } from '../sessoes.repository.js'
import type { FunctionalTrainingServiceDeps } from '../service.js'
import type {
  FunctionalTrainingFavoritoRow,
  FunctionalTrainingSessaoRow,
  VdFunctionalTrainingPacienteScope,
} from '../types.js'

export function createInMemoryFunctionalTrainingDeps(): {
  deps: FunctionalTrainingServiceDeps
  favoritos: FunctionalTrainingFavoritoRow[]
  sessoes: FunctionalTrainingSessaoRow[]
} {
  const favoritos: FunctionalTrainingFavoritoRow[] = []
  const sessoes: FunctionalTrainingSessaoRow[] = []

  const deps: FunctionalTrainingServiceDeps = {
    listFavoritos: async (scope) =>
      favoritos
        .filter(
          (row) =>
            row.paciente_id === scope.pacienteId &&
            row.entidade_contratante_id === scope.entidadeContratanteId,
        )
        .sort((left, right) => right.criado_em.localeCompare(left.criado_em)),

    insertFavorito: async (row: InsertFavoritoRow) => {
      const duplicate = favoritos.find(
        (item) =>
          item.paciente_id === row.paciente_id && item.exercise_id === row.exercise_id,
      )
      if (duplicate) {
        throw { code: '23505' }
      }

      const created: FunctionalTrainingFavoritoRow = {
        id: randomUUID(),
        paciente_id: row.paciente_id,
        entidade_contratante_id: row.entidade_contratante_id,
        exercise_id: row.exercise_id,
        criado_em: new Date().toISOString(),
      }
      favoritos.push(created)
      return created
    },

    deleteFavorito: async (scope, exerciseId) => {
      const index = favoritos.findIndex(
        (row) =>
          row.paciente_id === scope.pacienteId &&
          row.entidade_contratante_id === scope.entidadeContratanteId &&
          row.exercise_id === exerciseId,
      )
      if (index < 0) return false
      favoritos.splice(index, 1)
      return true
    },

    isFavoritoUniqueViolationError,

    findSessaoByClientSessionId: async (scope, clientSessionId) => {
      const row = sessoes.find(
        (item) =>
          item.paciente_id === scope.pacienteId &&
          item.client_session_id === clientSessionId,
      )
      return row ?? null
    },

    insertSessao: async (row: InsertSessaoRow) => {
      const duplicate = sessoes.find(
        (item) =>
          item.paciente_id === row.paciente_id &&
          item.client_session_id === row.client_session_id,
      )
      if (duplicate) {
        throw { code: '23505' }
      }

      const now = new Date().toISOString()
      const created: FunctionalTrainingSessaoRow = {
        id: randomUUID(),
        paciente_id: row.paciente_id,
        entidade_contratante_id: row.entidade_contratante_id,
        client_session_id: row.client_session_id,
        modo: row.modo,
        duration_sec: row.duration_sec,
        total_active_sec: row.total_active_sec,
        exercise_ids: [...row.exercise_ids],
        completed_at: row.completed_at,
        deleted_at: null,
        criado_em: now,
        atualizado_em: now,
      }
      sessoes.push(created)
      return created
    },

    isSessaoUniqueViolationError,

    listSessoes: async (scope, filters) => {
      const filtered = sessoes
        .filter(
          (row) =>
            row.paciente_id === scope.pacienteId &&
            row.entidade_contratante_id === scope.entidadeContratanteId &&
            row.deleted_at == null,
        )
        .filter((row) => {
          if (filters.bounds.startIso && row.completed_at < filters.bounds.startIso) {
            return false
          }
          if (filters.bounds.endIso && row.completed_at > filters.bounds.endIso) {
            return false
          }
          return true
        })
        .sort((left, right) => right.completed_at.localeCompare(left.completed_at))

      const offset = (filters.page - 1) * filters.pageSize
      return {
        rows: filtered.slice(offset, offset + filters.pageSize),
        totalCount: filtered.length,
      }
    },

    listSessoesForWeeklyStats: async (
      scope: VdFunctionalTrainingPacienteScope,
      bounds: { startIso: string; endIso: string },
    ) =>
      sessoes
        .filter(
          (row) =>
            row.paciente_id === scope.pacienteId &&
            row.entidade_contratante_id === scope.entidadeContratanteId &&
            row.deleted_at == null &&
            row.completed_at >= bounds.startIso &&
            row.completed_at <= bounds.endIso,
        )
        .map((row) => ({
          total_active_sec: row.total_active_sec,
          exercise_ids: [...row.exercise_ids],
        })),
  }

  return { deps, favoritos, sessoes }
}
