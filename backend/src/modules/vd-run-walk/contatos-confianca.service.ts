import {
  mapContatoConfiancaRowToDto,
  mapContatosConfiancaRowsToListDto,
  MAX_TRUSTED_CONTACTS,
  normalizeCreateTrustedContactInput,
  normalizeUpdateTrustedContactInput,
  type CreateTrustedContactInput,
  type TrustedContactDto,
  type TrustedContactsListDto,
  type UpdateTrustedContactInput,
} from './contatos-confianca.formatters.js'
import {
  clearActiveSosContatos,
  countContatosConfianca,
  findContatoConfiancaByClientId,
  findContatoConfiancaById,
  insertContatoConfianca,
  listContatosConfianca,
  resolveNextContatoSortOrder,
  setActiveSosContato,
  softDeleteContatoConfianca,
  updateContatoConfianca,
} from './contatos-confianca.repository.js'
import { VdRunWalkError } from './errors.js'
import type { VdRunWalkPacienteScope } from './types.js'

export type ContatosConfiancaServiceDeps = {
  list: typeof listContatosConfianca
  count: typeof countContatosConfianca
  findById: typeof findContatoConfiancaById
  findByClientId: typeof findContatoConfiancaByClientId
  resolveNextSortOrder: typeof resolveNextContatoSortOrder
  insert: typeof insertContatoConfianca
  update: typeof updateContatoConfianca
  clearActiveSos: typeof clearActiveSosContatos
  setActiveSos: typeof setActiveSosContato
  softDelete: typeof softDeleteContatoConfianca
}

const defaultDeps: ContatosConfiancaServiceDeps = {
  list: listContatosConfianca,
  count: countContatosConfianca,
  findById: findContatoConfiancaById,
  findByClientId: findContatoConfiancaByClientId,
  resolveNextSortOrder: resolveNextContatoSortOrder,
  insert: insertContatoConfianca,
  update: updateContatoConfianca,
  clearActiveSos: clearActiveSosContatos,
  setActiveSos: setActiveSosContato,
  softDelete: softDeleteContatoConfianca,
}

async function loadListDto(
  scope: VdRunWalkPacienteScope,
  deps: ContatosConfiancaServiceDeps,
): Promise<TrustedContactsListDto> {
  let rows = await deps.list(scope)
  const activeRows = rows.filter((row) => row.is_active_sos)

  if (activeRows.length === 0 && rows.length > 0) {
    await deps.setActiveSos(scope, rows[0].id)
    rows = await deps.list(scope)
  } else if (activeRows.length > 1) {
    await deps.setActiveSos(scope, activeRows[0].id)
    rows = await deps.list(scope)
  }

  return mapContatosConfiancaRowsToListDto(rows)
}

export async function getRunWalkContatosConfianca(
  scope: VdRunWalkPacienteScope,
  deps: ContatosConfiancaServiceDeps = defaultDeps,
): Promise<TrustedContactsListDto> {
  return loadListDto(scope, deps)
}

export async function createRunWalkContatoConfianca(
  scope: VdRunWalkPacienteScope,
  input: CreateTrustedContactInput,
  deps: ContatosConfiancaServiceDeps = defaultDeps,
): Promise<TrustedContactsListDto> {
  const normalized = normalizeCreateTrustedContactInput(input)
  const existing = await deps.findByClientId(scope, normalized.clientContactId)

  if (existing && existing.deleted_at === null) {
    return updateRunWalkContatoConfianca(
      scope,
      existing.id,
      {
        name: normalized.name,
        phone: normalized.phoneDigits,
        liveShareEnabled: normalized.liveShareEnabled,
        isActiveSos: normalized.isActiveSos,
      },
      deps,
    )
  }

  const activeCount = await deps.count(scope)
  if (activeCount >= MAX_TRUSTED_CONTACTS) {
    throw new VdRunWalkError(
      `Você pode cadastrar no máximo ${MAX_TRUSTED_CONTACTS} contatos de confiança.`,
      'CONFLICT',
      409,
    )
  }

  const shouldActivate =
    normalized.isActiveSos || activeCount === 0

  if (shouldActivate) {
    await deps.clearActiveSos(scope)
  }

  const sortOrder = await deps.resolveNextSortOrder(scope)

  if (existing?.deleted_at) {
    await deps.update(scope, existing.id, {
      name: normalized.name,
      phoneDigits: normalized.phoneDigits,
      liveShareEnabled: normalized.liveShareEnabled,
      isActiveSos: shouldActivate,
      sortOrder,
      restore: true,
    })
  } else {
    await deps.insert(scope, {
      clientContactId: normalized.clientContactId,
      name: normalized.name,
      phoneDigits: normalized.phoneDigits,
      liveShareEnabled: normalized.liveShareEnabled,
      isActiveSos: shouldActivate,
      sortOrder,
    })
  }

  return loadListDto(scope, deps)
}

export async function updateRunWalkContatoConfianca(
  scope: VdRunWalkPacienteScope,
  id: string,
  input: UpdateTrustedContactInput,
  deps: ContatosConfiancaServiceDeps = defaultDeps,
): Promise<TrustedContactsListDto> {
  const existing = await deps.findById(scope, id)
  if (!existing) {
    throw new VdRunWalkError('Contato de confiança não encontrado.', 'NOT_FOUND', 404)
  }

  const normalized = normalizeUpdateTrustedContactInput(input)
  if (
    normalized.name === undefined &&
    normalized.phoneDigits === undefined &&
    normalized.liveShareEnabled === undefined &&
    normalized.isActiveSos === undefined
  ) {
    throw new VdRunWalkError('Informe ao menos um campo para atualizar.', 'INVALID_DATA', 400)
  }

  if (normalized.isActiveSos === true) {
    await deps.clearActiveSos(scope)
  }

  await deps.update(scope, id, {
    name: normalized.name,
    phoneDigits: normalized.phoneDigits,
    liveShareEnabled: normalized.liveShareEnabled,
    isActiveSos: normalized.isActiveSos,
  })

  return loadListDto(scope, deps)
}

export async function deleteRunWalkContatoConfianca(
  scope: VdRunWalkPacienteScope,
  id: string,
  deps: ContatosConfiancaServiceDeps = defaultDeps,
): Promise<TrustedContactsListDto> {
  const existing = await deps.findById(scope, id)
  if (!existing) {
    throw new VdRunWalkError('Contato de confiança não encontrado.', 'NOT_FOUND', 404)
  }

  const wasActiveSos = existing.is_active_sos
  await deps.softDelete(scope, id)

  if (wasActiveSos) {
    const remaining = await deps.list(scope)
    if (remaining[0]) {
      await deps.setActiveSos(scope, remaining[0].id)
    }
  }

  return loadListDto(scope, deps)
}

export async function activateRunWalkContatoConfiancaSos(
  scope: VdRunWalkPacienteScope,
  id: string,
  deps: ContatosConfiancaServiceDeps = defaultDeps,
): Promise<TrustedContactDto> {
  const existing = await deps.findById(scope, id)
  if (!existing) {
    throw new VdRunWalkError('Contato de confiança não encontrado.', 'NOT_FOUND', 404)
  }

  const row = await deps.setActiveSos(scope, id)
  return mapContatoConfiancaRowToDto(row)
}
