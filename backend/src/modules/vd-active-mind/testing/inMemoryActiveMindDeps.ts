import { randomUUID } from 'node:crypto'
import type { InsertSessaoRow } from '../sessoes.formatters.js'
import { isUniqueViolationError } from '../sessoes.repository.js'
import type { ActiveMindServiceDeps } from '../service.js'
import type { ActiveMindSessaoRow, VdActiveMindPacienteScope } from '../types.js'

export function createInMemoryActiveMindDeps(): {
  deps: ActiveMindServiceDeps
  sessoes: ActiveMindSessaoRow[]
} {
  const sessoes: ActiveMindSessaoRow[] = []

  const deps: ActiveMindServiceDeps = {
    findByClientSessionId: async (scope, clientSessionId) => {
      const row = sessoes.find(
        (item) =>
          item.paciente_id === scope.pacienteId &&
          item.entidade_contratante_id === scope.entidadeContratanteId &&
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
      const created: ActiveMindSessaoRow = {
        id: randomUUID(),
        paciente_id: row.paciente_id,
        entidade_contratante_id: row.entidade_contratante_id,
        client_session_id: row.client_session_id,
        game_id: row.game_id,
        difficulty: row.difficulty,
        puzzle_id: row.puzzle_id,
        duration_sec: row.duration_sec,
        attempts: row.attempts,
        correct: row.correct,
        errors: row.errors,
        reveals: row.reveals,
        completed_at: row.completed_at,
        deleted_at: null,
        criado_em: now,
        atualizado_em: now,
      }
      sessoes.push(created)
      return created
    },

    isUniqueViolationError,

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
          if (filters.gameId && row.game_id !== filters.gameId) {
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

    softDeleteSessao: async (scope: VdActiveMindPacienteScope, id: string) => {
      const index = sessoes.findIndex(
        (row) =>
          row.paciente_id === scope.pacienteId &&
          row.entidade_contratante_id === scope.entidadeContratanteId &&
          row.id === id &&
          row.deleted_at == null,
      )
      if (index < 0) return null

      const deletedAt = new Date().toISOString()
      sessoes[index] = {
        ...sessoes[index]!,
        deleted_at: deletedAt,
        atualizado_em: deletedAt,
      }
      return sessoes[index]!
    },

    listSessoesForWeeklyStats: async (scope, bounds) =>
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
          game_id: row.game_id,
          difficulty: row.difficulty,
          duration_sec: row.duration_sec,
          attempts: row.attempts,
          correct: row.correct,
          errors: row.errors,
          reveals: row.reveals,
        })),
  }

  return { deps, sessoes }
}
