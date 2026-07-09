import { randomUUID } from 'node:crypto'
import type { InsertRegistroRow } from '../registros.formatters.js'
import { isUniqueViolationError } from '../registros.repository.js'
import type { SleepTimeServiceDeps } from '../service.js'
import type { SleepTimeRegistroRow, VdSleepTimePacienteScope } from '../types.js'

export function createInMemorySleepTimeDeps(): {
  deps: SleepTimeServiceDeps
  registros: SleepTimeRegistroRow[]
} {
  const registros: SleepTimeRegistroRow[] = []

  const deps: SleepTimeServiceDeps = {
    findRegistroByClientLogId: async (scope, clientLogId) => {
      const row = registros.find(
        (item) =>
          item.paciente_id === scope.pacienteId &&
          item.entidade_contratante_id === scope.entidadeContratanteId &&
          item.client_log_id === clientLogId,
      )
      return row ?? null
    },

    insertRegistro: async (row: InsertRegistroRow) => {
      const duplicate = registros.find(
        (item) =>
          item.paciente_id === row.paciente_id && item.client_log_id === row.client_log_id,
      )
      if (duplicate) {
        throw { code: '23505' }
      }

      const now = new Date().toISOString()
      const created: SleepTimeRegistroRow = {
        id: randomUUID(),
        paciente_id: row.paciente_id,
        entidade_contratante_id: row.entidade_contratante_id,
        client_log_id: row.client_log_id,
        bed_at: row.bed_at,
        wake_at: row.wake_at,
        duration_minutes: row.duration_minutes,
        quality: row.quality,
        wake_count: row.wake_count,
        notes: row.notes,
        deleted_at: null,
        criado_em: now,
        atualizado_em: now,
      }
      registros.push(created)
      return created
    },

    isUniqueViolationError,

    listRegistros: async (scope, filters) => {
      const filtered = registros
        .filter(
          (row) =>
            row.paciente_id === scope.pacienteId &&
            row.entidade_contratante_id === scope.entidadeContratanteId &&
            row.deleted_at == null,
        )
        .filter((row) => {
          if (filters.bounds.startIso && row.wake_at < filters.bounds.startIso) {
            return false
          }
          if (filters.bounds.endIso && row.wake_at > filters.bounds.endIso) {
            return false
          }
          return true
        })
        .sort((left, right) => right.wake_at.localeCompare(left.wake_at))

      const offset = (filters.page - 1) * filters.pageSize
      return {
        rows: filtered.slice(offset, offset + filters.pageSize),
        totalCount: filtered.length,
      }
    },

    softDeleteRegistro: async (scope: VdSleepTimePacienteScope, id: string) => {
      const index = registros.findIndex(
        (row) =>
          row.paciente_id === scope.pacienteId &&
          row.entidade_contratante_id === scope.entidadeContratanteId &&
          row.id === id &&
          row.deleted_at == null,
      )
      if (index < 0) return null

      const deletedAt = new Date().toISOString()
      registros[index] = {
        ...registros[index]!,
        deleted_at: deletedAt,
        atualizado_em: deletedAt,
      }
      return registros[index]!
    },
  }

  return { deps, registros }
}
