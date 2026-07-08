import {
  buildRunWalkLocalCoverStoragePath,
  createRunWalkLocalCoverUploadUrl as signRunWalkLocalCoverUploadUrl,
} from '../../lib/runWalkLocalCover.js'
import { VdRunWalkError } from './errors.js'
import {
  buildLocaisListDto,
  mapRunningRouteSpotRowToDto,
  normalizeListLocaisQuery,
  resolveCoverPhotoReference,
  type CreateRunningRouteLocalInput,
  type ListRunningRouteLocaisQuery,
  type RunningRouteLocaisListDto,
  type RunningRouteLocalDto,
} from './locais.formatters.js'
import {
  insertRunningRouteSpot,
  listRunningRouteSpotsInBounds,
} from './locais.repository.js'
import type { VdRunWalkPacienteScope } from './types.js'

export type LocaisServiceDeps = {
  listInBounds: typeof listRunningRouteSpotsInBounds
  insert: typeof insertRunningRouteSpot
  createCoverUploadUrl: typeof signRunWalkLocalCoverUploadUrl
  buildCoverStoragePath: typeof buildRunWalkLocalCoverStoragePath
}

const defaultDeps: LocaisServiceDeps = {
  listInBounds: listRunningRouteSpotsInBounds,
  insert: insertRunningRouteSpot,
  createCoverUploadUrl: signRunWalkLocalCoverUploadUrl,
  buildCoverStoragePath: buildRunWalkLocalCoverStoragePath,
}

function normalizeCreateInput(input: CreateRunningRouteLocalInput) {
  const name = input.name.trim()
  const description = input.description?.trim() ?? ''
  const addressLabel = input.addressLabel.trim()

  if (name.length < 3) {
    throw new VdRunWalkError('Informe um nome com pelo menos 3 caracteres.', 'INVALID_DATA', 400)
  }

  if (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude)) {
    throw new VdRunWalkError('Informe coordenadas válidas.', 'INVALID_DATA', 400)
  }

  const coverPhotoReference = resolveCoverPhotoReference(input)

  return {
    name,
    description,
    type: input.type,
    latitude: input.latitude,
    longitude: input.longitude,
    addressLabel,
    locationSource: input.locationSource,
    coverPhotoReference,
  }
}

export async function listRunWalkLocais(
  scope: VdRunWalkPacienteScope,
  query: ListRunningRouteLocaisQuery,
  deps: LocaisServiceDeps = defaultDeps,
): Promise<RunningRouteLocaisListDto> {
  const normalized = normalizeListLocaisQuery(query)
  const rows = await deps.listInBounds(scope, {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
    radiusKm: normalized.radiusKm,
  })

  return buildLocaisListDto(
    rows,
    { latitude: normalized.latitude, longitude: normalized.longitude },
    normalized.radiusKm,
    normalized.page,
    normalized.pageSize,
  )
}

export async function createRunWalkLocal(
  scope: VdRunWalkPacienteScope,
  input: CreateRunningRouteLocalInput,
  submittedByName: string,
  deps: LocaisServiceDeps = defaultDeps,
): Promise<RunningRouteLocalDto> {
  const normalized = normalizeCreateInput(input)
  const trimmedName = submittedByName.trim() || 'Participante'

  const row = await deps.insert(scope, {
    ...input,
    name: normalized.name,
    description: normalized.description,
    addressLabel: normalized.addressLabel,
    coverPhotoReference: normalized.coverPhotoReference,
    submittedByName: trimmedName,
  })

  return await mapRunningRouteSpotRowToDto(row, {
    latitude: normalized.latitude,
    longitude: normalized.longitude,
  })
}

export async function createRunWalkLocalCoverUploadUrl(
  scope: VdRunWalkPacienteScope,
  deps: LocaisServiceDeps = defaultDeps,
) {
  const storagePath = deps.buildCoverStoragePath(
    scope.entidadeContratanteId,
    scope.pacienteId,
  )

  return deps.createCoverUploadUrl(storagePath)
}
