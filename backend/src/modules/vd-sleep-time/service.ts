import { VdSleepTimeError } from './errors.js'
import {
  buildRegistroListResult,
  mapCreateInputToInsertRow,
  mapRegistroRow,
  resolveRegistroListBounds,
  type CreateSleepTimeRegistroInput,
  type ListSleepTimeRegistrosQuery,
  type SleepTimeRegistroDto,
} from './registros.formatters.js'
import {
  findRegistroByClientLogId,
  insertRegistro,
  isUniqueViolationError,
  listRegistros,
  softDeleteRegistro,
} from './registros.repository.js'
import type { VdSleepTimePacienteScope } from './types.js'

export type SleepTimeServiceDeps = {
  findRegistroByClientLogId: typeof findRegistroByClientLogId
  insertRegistro: typeof insertRegistro
  isUniqueViolationError: typeof isUniqueViolationError
  listRegistros: typeof listRegistros
  softDeleteRegistro: typeof softDeleteRegistro
}

const defaultServiceDeps: SleepTimeServiceDeps = {
  findRegistroByClientLogId,
  insertRegistro,
  isUniqueViolationError,
  listRegistros,
  softDeleteRegistro,
}

let serviceDeps: SleepTimeServiceDeps = defaultServiceDeps

/** @internal Apenas para testes de integração/E2E. */
export function __setSleepTimeServiceDepsForTests(overrides: Partial<SleepTimeServiceDeps>): void {
  serviceDeps = { ...defaultServiceDeps, ...overrides }
}

/** @internal Apenas para testes de integração/E2E. */
export function __resetSleepTimeServiceDepsForTests(): void {
  serviceDeps = defaultServiceDeps
}

function getServiceDeps(): SleepTimeServiceDeps {
  return serviceDeps
}

export type RegisterSleepTimeRegistroResult = {
  registro: SleepTimeRegistroDto
  created: boolean
}

export async function registerSleepTimeRegistro(
  scope: VdSleepTimePacienteScope,
  input: CreateSleepTimeRegistroInput,
): Promise<RegisterSleepTimeRegistroResult> {
  const deps = getServiceDeps()
  const existing = await deps.findRegistroByClientLogId(scope, input.clientLogId)

  if (existing) {
    if (existing.deleted_at) {
      throw new VdSleepTimeError(
        'Este registro foi removido e não pode ser sincronizado novamente com o mesmo identificador.',
        'CONFLICT',
        409,
      )
    }

    return {
      registro: mapRegistroRow(existing),
      created: false,
    }
  }

  const insertRow = mapCreateInputToInsertRow(scope, input)

  try {
    const created = await deps.insertRegistro(insertRow)
    return {
      registro: mapRegistroRow(created),
      created: true,
    }
  } catch (error) {
    if (!deps.isUniqueViolationError(error)) {
      throw error
    }

    const raced = await deps.findRegistroByClientLogId(scope, input.clientLogId)
    if (!raced) {
      throw error
    }

    if (raced.deleted_at) {
      throw new VdSleepTimeError(
        'Este registro foi removido e não pode ser sincronizado novamente com o mesmo identificador.',
        'CONFLICT',
        409,
      )
    }

    return {
      registro: mapRegistroRow(raced),
      created: false,
    }
  }
}

export async function listSleepTimeRegistros(
  scope: VdSleepTimePacienteScope,
  query: ListSleepTimeRegistrosQuery,
) {
  const deps = getServiceDeps()
  const bounds = resolveRegistroListBounds(query)
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 20

  const { rows, totalCount } = await deps.listRegistros(scope, {
    bounds,
    page,
    pageSize,
  })

  return buildRegistroListResult(rows, totalCount, page, pageSize)
}

export async function deleteSleepTimeRegistro(
  scope: VdSleepTimePacienteScope,
  id: string,
): Promise<SleepTimeRegistroDto> {
  const deps = getServiceDeps()
  const deleted = await deps.softDeleteRegistro(scope, id)

  if (!deleted) {
    throw new VdSleepTimeError('Registro não encontrado.', 'NOT_FOUND', 404)
  }

  return mapRegistroRow(deleted)
}
