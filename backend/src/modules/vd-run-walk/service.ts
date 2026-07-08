import {
  buildRunWalkAtividadesResumo,
  mapRowToResumoAtividade,
  resolveResumoFetchBounds,
  type ResumoRunWalkAtividadesQuery,
  type RunWalkAtividadesResumoDto,
} from './atividades-resumo.formatters.js'
import {
  buildAtividadeListResult,
  mapAtividadeDetailRow,
  mapAtividadeRow,
  mapCreateInputToInsertRow,
  mapPatchCheckinInputToUpdateRow,
  resolveAtividadeListBounds,
  resolveAtividadeListPagination,
  type CreateRunWalkAtividadeInput,
  type ListRunWalkAtividadesQuery,
  type PatchRunWalkAtividadeCheckinInput,
  type RunWalkAtividadeDetailDto,
  type RunWalkAtividadeDto,
  type RunWalkAtividadeListResultDto,
} from './atividades.formatters.js'
import {
  findAtividadeByClientActivityId,
  findAtividadeById,
  insertAtividade,
  isUniqueViolationError,
  listAtividades,
  listAtividadesForResumo,
  softDeleteAtividade,
  updateAtividadeCheckin,
} from './atividades.repository.js'
import { VdRunWalkError } from './errors.js'
import { toVdRunWalkHealthDto } from './formatters.js'
import { refreshProgressoSemanalAfterAtividadeChange } from './progresso-semanal.service.js'
import {
  syncRunWalkAtividadeToMetricas,
} from './run-walk-metricas-sync.service.js'
import type { VdRunWalkHealthDto, VdRunWalkPacienteScope } from './types.js'

export type RunWalkCoreServiceDeps = {
  findAtividadeByClientActivityId: typeof findAtividadeByClientActivityId
  insertAtividade: typeof insertAtividade
  isUniqueViolationError: typeof isUniqueViolationError
  listAtividades: typeof listAtividades
  listAtividadesForResumo: typeof listAtividadesForResumo
  syncRunWalkAtividadeToMetricas: typeof syncRunWalkAtividadeToMetricas
}

const defaultCoreServiceDeps: RunWalkCoreServiceDeps = {
  findAtividadeByClientActivityId,
  insertAtividade,
  isUniqueViolationError,
  listAtividades,
  listAtividadesForResumo,
  syncRunWalkAtividadeToMetricas,
}

let coreServiceDeps: RunWalkCoreServiceDeps = defaultCoreServiceDeps

/** @internal Apenas para testes de integração/E2E. */
export function __setRunWalkCoreServiceDepsForTests(
  overrides: Partial<RunWalkCoreServiceDeps>,
): void {
  coreServiceDeps = { ...defaultCoreServiceDeps, ...overrides }
}

/** @internal Apenas para testes de integração/E2E. */
export function __resetRunWalkCoreServiceDepsForTests(): void {
  coreServiceDeps = defaultCoreServiceDeps
}

function getCoreServiceDeps(): RunWalkCoreServiceDeps {
  return coreServiceDeps
}

export type RegisterRunWalkAtividadeResult = {
  activity: RunWalkAtividadeDto
  created: boolean
}

async function trySyncRunWalkAtividadeToMetricas(
  scope: VdRunWalkPacienteScope,
  activity: RunWalkAtividadeDto,
): Promise<void> {
  const deps = getCoreServiceDeps()
  try {
    await deps.syncRunWalkAtividadeToMetricas({
      scope,
      activity: {
        id: activity.id,
        modality: activity.modality,
        stepCount: activity.stepCount,
        distanceKm: activity.distanceKm,
        activeMinutes: activity.activeMinutes,
        estimatedCalories: activity.estimatedCalories,
        completedAt: activity.completedAt,
      },
    })
  } catch (error) {
    console.error(
      '[vd-run-walk] Falha ao sincronizar atividade para Minhas Métricas.',
      activity.id,
      error,
    )
  }
}

export async function getVdRunWalkHealth(
  _scope: VdRunWalkPacienteScope,
): Promise<VdRunWalkHealthDto> {
  return toVdRunWalkHealthDto()
}

export async function listRunWalkAtividades(
  scope: VdRunWalkPacienteScope,
  query: ListRunWalkAtividadesQuery,
): Promise<RunWalkAtividadeListResultDto> {
  const deps = getCoreServiceDeps()
  const bounds = resolveAtividadeListBounds(query)
  const pagination = resolveAtividadeListPagination(query)

  const { rows, totalCount } = await deps.listAtividades(scope, {
    bounds,
    sort: query.sort ?? 'recent',
    minDistanceKm: query.minDistanceKm ?? 0,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })

  return buildAtividadeListResult(
    rows,
    totalCount,
    pagination.page,
    pagination.pageSize,
  )
}

export async function getRunWalkAtividadesResumo(
  scope: VdRunWalkPacienteScope,
  query: ResumoRunWalkAtividadesQuery,
): Promise<RunWalkAtividadesResumoDto> {
  const deps = getCoreServiceDeps()
  const fetchBounds = resolveResumoFetchBounds(query)
  const rows = await deps.listAtividadesForResumo(scope, fetchBounds)
  const activities = rows.map((row) => mapRowToResumoAtividade(row))

  return buildRunWalkAtividadesResumo(activities, query)
}

export async function getRunWalkAtividadeById(
  scope: VdRunWalkPacienteScope,
  atividadeId: string,
): Promise<RunWalkAtividadeDetailDto> {
  const row = await findAtividadeById(scope, atividadeId)
  if (!row) {
    throw new VdRunWalkError('Atividade não encontrada.', 'NOT_FOUND', 404)
  }

  return mapAtividadeDetailRow(row)
}

export async function deleteRunWalkAtividade(
  scope: VdRunWalkPacienteScope,
  atividadeId: string,
): Promise<void> {
  const existing = await findAtividadeById(scope, atividadeId)
  const completedAtIso = existing?.completed_at

  const result = await softDeleteAtividade(scope, atividadeId)

  if (result === 'not_found') {
    throw new VdRunWalkError('Atividade não encontrada.', 'NOT_FOUND', 404)
  }

  if (result === 'deleted' && completedAtIso) {
    await refreshProgressoSemanalAfterAtividadeChange(scope, completedAtIso)
  }
}

export async function registerRunWalkAtividade(
  scope: VdRunWalkPacienteScope,
  input: CreateRunWalkAtividadeInput,
): Promise<RegisterRunWalkAtividadeResult> {
  const deps = getCoreServiceDeps()
  const existing = await deps.findAtividadeByClientActivityId(scope, input.clientActivityId)
  if (existing) {
    if (existing.deleted_at) {
      throw new VdRunWalkError(
        'Esta atividade foi removida e não pode ser sincronizada novamente com o mesmo identificador.',
        'CONFLICT',
        409,
      )
    }

    const activity = mapAtividadeRow(existing)
    await trySyncRunWalkAtividadeToMetricas(scope, activity)

    return {
      activity,
      created: false,
    }
  }

  const insertRow = mapCreateInputToInsertRow(scope, input)

  try {
    const created = await deps.insertAtividade(insertRow)
    const activity = mapAtividadeRow(created)
    await trySyncRunWalkAtividadeToMetricas(scope, activity)

    return {
      activity,
      created: true,
    }
  } catch (error) {
    if (!deps.isUniqueViolationError(error)) {
      throw error
    }

    const raced = await deps.findAtividadeByClientActivityId(scope, input.clientActivityId)
    if (!raced) {
      throw error
    }

    if (raced.deleted_at) {
      throw new VdRunWalkError(
        'Esta atividade foi removida e não pode ser sincronizada novamente com o mesmo identificador.',
        'CONFLICT',
        409,
      )
    }

    const activity = mapAtividadeRow(raced)
    await trySyncRunWalkAtividadeToMetricas(scope, activity)

    return {
      activity,
      created: false,
    }
  }
}

export async function patchRunWalkAtividadeCheckin(
  scope: VdRunWalkPacienteScope,
  atividadeId: string,
  input: PatchRunWalkAtividadeCheckinInput,
): Promise<RunWalkAtividadeDto> {
  const existing = await findAtividadeById(scope, atividadeId)
  if (!existing) {
    throw new VdRunWalkError('Atividade não encontrada.', 'NOT_FOUND', 404)
  }

  const updated = await updateAtividadeCheckin(
    scope,
    atividadeId,
    mapPatchCheckinInputToUpdateRow(input),
  )

  if (!updated) {
    throw new VdRunWalkError('Atividade não encontrada.', 'NOT_FOUND', 404)
  }

  return mapAtividadeRow(updated)
}
