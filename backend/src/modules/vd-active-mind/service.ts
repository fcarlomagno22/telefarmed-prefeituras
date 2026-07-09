import { assertActiveMindGameId } from './game-catalog.js'
import { VdActiveMindError } from './errors.js'
import {
  buildSessaoListResult,
  mapCreateInputToInsertRow,
  mapSessaoRow,
  type CreateActiveMindSessaoInput,
  type ListActiveMindSessoesQuery,
} from './sessoes.formatters.js'
import {
  findByClientSessionId,
  insertSessao,
  isUniqueViolationError,
  listSessoes,
  listSessoesForWeeklyStats,
  resolveSessaoListBounds,
  softDeleteSessao,
} from './sessoes.repository.js'
import type { ActiveMindSessaoDto, VdActiveMindPacienteScope } from './types.js'
import { getActiveMindEstatisticasSemanais as computeEstatisticasSemanais } from './estatisticas-semanais.service.js'

export type ActiveMindServiceDeps = {
  findByClientSessionId: typeof findByClientSessionId
  insertSessao: typeof insertSessao
  isUniqueViolationError: typeof isUniqueViolationError
  listSessoes: typeof listSessoes
  softDeleteSessao: typeof softDeleteSessao
  listSessoesForWeeklyStats: typeof listSessoesForWeeklyStats
}

const defaultServiceDeps: ActiveMindServiceDeps = {
  findByClientSessionId,
  insertSessao,
  isUniqueViolationError,
  listSessoes,
  softDeleteSessao,
  listSessoesForWeeklyStats,
}

let serviceDeps: ActiveMindServiceDeps = defaultServiceDeps

/** @internal Apenas para testes de integração/E2E. */
export function __setActiveMindServiceDepsForTests(overrides: Partial<ActiveMindServiceDeps>): void {
  serviceDeps = { ...defaultServiceDeps, ...overrides }
}

/** @internal Apenas para testes de integração/E2E. */
export function __resetActiveMindServiceDepsForTests(): void {
  serviceDeps = defaultServiceDeps
}

function getServiceDeps(): ActiveMindServiceDeps {
  return serviceDeps
}

export type CreateActiveMindSessaoResult = {
  session: ActiveMindSessaoDto
  created: boolean
}

export async function createSessao(
  scope: VdActiveMindPacienteScope,
  input: CreateActiveMindSessaoInput,
): Promise<CreateActiveMindSessaoResult> {
  const deps = getServiceDeps()
  assertActiveMindGameId(input.gameId)

  const existing = await deps.findByClientSessionId(scope, input.clientSessionId)

  if (existing) {
    if (existing.deleted_at) {
      throw new VdActiveMindError(
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
    if (!deps.isUniqueViolationError(error)) {
      throw error
    }

    const raced = await deps.findByClientSessionId(scope, input.clientSessionId)
    if (!raced) {
      throw error
    }

    if (raced.deleted_at) {
      throw new VdActiveMindError(
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

export async function listActiveMindSessoes(
  scope: VdActiveMindPacienteScope,
  query: ListActiveMindSessoesQuery,
) {
  const deps = getServiceDeps()
  const { startIso, endIso, gameId } = resolveSessaoListBounds(query)
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20

  const { rows, totalCount } = await deps.listSessoes(scope, {
    bounds: { startIso, endIso },
    gameId,
    page,
    pageSize,
  })

  return buildSessaoListResult(rows, totalCount, page, pageSize)
}

export async function deleteSessao(
  scope: VdActiveMindPacienteScope,
  id: string,
): Promise<ActiveMindSessaoDto> {
  const deps = getServiceDeps()
  const deleted = await deps.softDeleteSessao(scope, id)

  if (!deleted) {
    throw new VdActiveMindError('Sessão não encontrada.', 'NOT_FOUND', 404)
  }

  return mapSessaoRow(deleted)
}

export async function getActiveMindEstatisticasSemanais(
  scope: VdActiveMindPacienteScope,
  options: { weekStartIso?: string } = {},
) {
  const deps = getServiceDeps()
  return computeEstatisticasSemanais(scope, options, {
    listSessoesForWeeklyStats: deps.listSessoesForWeeklyStats,
  })
}
