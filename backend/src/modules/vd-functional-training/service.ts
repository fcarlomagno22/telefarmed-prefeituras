import { assertFunctionalTrainingExerciseId } from './exercise-catalog.js'
import {
  buildFavoritosDto,
  mapFavoritoRowsToExerciseIds,
  mapInsertFavoritoRow,
} from './favoritos.formatters.js'
import {
  deleteFavorito,
  insertFavorito,
  isUniqueViolationError as isFavoritoUniqueViolationError,
  listFavoritos,
} from './favoritos.repository.js'
import { VdFunctionalTrainingError } from './errors.js'
import {
  buildSessaoListResult,
  mapCreateInputToInsertRow,
  mapSessaoRow,
  type CreateFunctionalTrainingSessaoInput,
  type FunctionalTrainingSessaoDto,
  type ListFunctionalTrainingSessoesQuery,
} from './sessoes.formatters.js'
import {
  findSessaoByClientSessionId,
  insertSessao,
  isUniqueViolationError as isSessaoUniqueViolationError,
  listSessoes,
  listSessoesForWeeklyStats,
  resolveSessaoListBounds,
} from './sessoes.repository.js'
import type { VdFunctionalTrainingPacienteScope } from './types.js'
import { getFunctionalTrainingEstatisticasSemanais as computeEstatisticasSemanais } from './estatisticas-semanais.service.js'

export type FunctionalTrainingServiceDeps = {
  listFavoritos: typeof listFavoritos
  insertFavorito: typeof insertFavorito
  deleteFavorito: typeof deleteFavorito
  isFavoritoUniqueViolationError: typeof isFavoritoUniqueViolationError
  findSessaoByClientSessionId: typeof findSessaoByClientSessionId
  insertSessao: typeof insertSessao
  isSessaoUniqueViolationError: typeof isSessaoUniqueViolationError
  listSessoes: typeof listSessoes
  listSessoesForWeeklyStats: typeof listSessoesForWeeklyStats
}

const defaultServiceDeps: FunctionalTrainingServiceDeps = {
  listFavoritos,
  insertFavorito,
  deleteFavorito,
  isFavoritoUniqueViolationError,
  findSessaoByClientSessionId,
  insertSessao,
  isSessaoUniqueViolationError,
  listSessoes,
  listSessoesForWeeklyStats,
}

let serviceDeps: FunctionalTrainingServiceDeps = defaultServiceDeps

/** @internal Apenas para testes de integração/E2E. */
export function __setFunctionalTrainingServiceDepsForTests(
  overrides: Partial<FunctionalTrainingServiceDeps>,
): void {
  serviceDeps = { ...defaultServiceDeps, ...overrides }
}

/** @internal Apenas para testes de integração/E2E. */
export function __resetFunctionalTrainingServiceDepsForTests(): void {
  serviceDeps = defaultServiceDeps
}

function getServiceDeps(): FunctionalTrainingServiceDeps {
  return serviceDeps
}

export async function getFunctionalTrainingFavoritos(scope: VdFunctionalTrainingPacienteScope) {
  const deps = getServiceDeps()
  const rows = await deps.listFavoritos(scope)
  return buildFavoritosDto(mapFavoritoRowsToExerciseIds(rows))
}

export async function addFunctionalTrainingFavorito(
  scope: VdFunctionalTrainingPacienteScope,
  exerciseId: string,
) {
  const deps = getServiceDeps()
  const normalizedExerciseId = assertFunctionalTrainingExerciseId(exerciseId)
  const current = await deps.listFavoritos(scope)

  if (current.some((row) => row.exercise_id === normalizedExerciseId)) {
    return buildFavoritosDto(mapFavoritoRowsToExerciseIds(current))
  }

  try {
    await deps.insertFavorito(mapInsertFavoritoRow(scope, normalizedExerciseId))
  } catch (error) {
    if (!deps.isFavoritoUniqueViolationError(error)) {
      throw error
    }
  }

  const rows = await deps.listFavoritos(scope)
  return buildFavoritosDto(mapFavoritoRowsToExerciseIds(rows))
}

export async function removeFunctionalTrainingFavorito(
  scope: VdFunctionalTrainingPacienteScope,
  exerciseId: string,
) {
  const deps = getServiceDeps()
  const normalizedExerciseId = assertFunctionalTrainingExerciseId(exerciseId)
  await deps.deleteFavorito(scope, normalizedExerciseId)
  const rows = await deps.listFavoritos(scope)
  return buildFavoritosDto(mapFavoritoRowsToExerciseIds(rows))
}

export type RegisterFunctionalTrainingSessaoResult = {
  session: FunctionalTrainingSessaoDto
  created: boolean
}

export async function registerFunctionalTrainingSessao(
  scope: VdFunctionalTrainingPacienteScope,
  input: CreateFunctionalTrainingSessaoInput,
): Promise<RegisterFunctionalTrainingSessaoResult> {
  const deps = getServiceDeps()
  const existing = await deps.findSessaoByClientSessionId(scope, input.clientSessionId)

  if (existing) {
    if (existing.deleted_at) {
      throw new VdFunctionalTrainingError(
        'Esta sessão foi removida e não pode ser sincronizada novamente com o mesmo identificador.',
        'CONFLICT',
        409,
      )
    }

    return {
      session: mapSessaoRow(existing),
      created: false,
    }
  }

  const insertRow = mapCreateInputToInsertRow(scope, input)

  try {
    const created = await deps.insertSessao(insertRow)
    return {
      session: mapSessaoRow(created),
      created: true,
    }
  } catch (error) {
    if (!deps.isSessaoUniqueViolationError(error)) {
      throw error
    }

    const raced = await deps.findSessaoByClientSessionId(scope, input.clientSessionId)
    if (!raced) {
      throw error
    }

    if (raced.deleted_at) {
      throw new VdFunctionalTrainingError(
        'Esta sessão foi removida e não pode ser sincronizada novamente com o mesmo identificador.',
        'CONFLICT',
        409,
      )
    }

    return {
      session: mapSessaoRow(raced),
      created: false,
    }
  }
}

export async function listFunctionalTrainingSessoes(
  scope: VdFunctionalTrainingPacienteScope,
  query: ListFunctionalTrainingSessoesQuery,
) {
  const deps = getServiceDeps()
  const bounds = resolveSessaoListBounds(query)
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20

  const { rows, totalCount } = await deps.listSessoes(scope, {
    bounds,
    page,
    pageSize,
  })

  return buildSessaoListResult(rows, totalCount, page, pageSize)
}

export async function getFunctionalTrainingEstatisticasSemanais(
  scope: VdFunctionalTrainingPacienteScope,
  options: { weekStartIso?: string } = {},
) {
  const deps = getServiceDeps()
  return computeEstatisticasSemanais(scope, options, {
    listSessoesForWeeklyStats: deps.listSessoesForWeeklyStats,
  })
}
