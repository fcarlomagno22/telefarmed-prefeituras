import { isRunWalkApiEnabled } from '../config/runWalkApi'
import {
  createRunWalkLocal,
  createRunWalkLocalComentario,
  listRunWalkLocais,
  listRunWalkLocalComentarios,
  postRunWalkLocalVoto,
  type RunningRouteLocalDto,
} from '../lib/api/vd/runWalk'
import type {
  RunningRouteSpotComment,
  RunningRouteSpotRecord,
  RunningRouteVote,
  SubmitRunningRouteSpotInput,
} from '../types/nearbyRunningRoutes'
import type { GeoCoordinates } from '../utils/geo'
import { uploadRunningRouteCoverPhoto } from '../utils/runningRouteCoverUpload'
import { isDevMockRunningRouteSpotId } from './mockNearbyRunningRoutes'

const DEFAULT_RADIUS_KM = 50

export type RunningRouteSpotEngagement = {
  recommendCount: number
  notRecommendCount: number
  userVote: RunningRouteVote | null
  comments: RunningRouteSpotComment[]
}

export type ListRunningRouteSpotsOptions = {
  radiusKm?: number
  page?: number
  pageSize?: number
}

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function mapDtoToRecord(dto: RunningRouteLocalDto): RunningRouteSpotRecord {
  return {
    id: dto.id,
    name: dto.name,
    type: dto.type,
    description: dto.description,
    latitude: dto.latitude,
    longitude: dto.longitude,
    addressLabel: dto.addressLabel ?? undefined,
    locationSource: dto.locationSource,
    coverPhotoUri: dto.coverPhotoUrl,
    submittedByCpf: dto.submittedByCpf ?? undefined,
    submittedByName: dto.submittedByName ?? undefined,
    recommendCount: dto.recommendCount,
    notRecommendCount: dto.notRecommendCount,
    createdAt: dto.createdAt,
  }
}

function mapCommentDto(comment: {
  id: string
  authorName: string
  text: string
  createdAt: string
}): RunningRouteSpotComment {
  return {
    id: comment.id,
    authorName: comment.authorName,
    text: comment.text,
    createdAt: comment.createdAt,
  }
}

function resolveDevMockEngagement(
  spotId: string,
  seed?: Pick<RunningRouteSpotRecord, 'recommendCount' | 'notRecommendCount'>,
): RunningRouteSpotEngagement {
  return {
    recommendCount: seed?.recommendCount ?? 0,
    notRecommendCount: seed?.notRecommendCount ?? 0,
    userVote: null,
    comments: [],
  }
}

export async function listRunningRouteSpots(
  origin: GeoCoordinates,
  options?: ListRunningRouteSpotsOptions,
): Promise<RunningRouteSpotRecord[]> {
  if (!isRunWalkApiEnabled()) {
    return []
  }

  try {
    const result = await listRunWalkLocais({
      latitude: origin.latitude,
      longitude: origin.longitude,
      radiusKm: options?.radiusKm ?? DEFAULT_RADIUS_KM,
      page: options?.page ?? 1,
      pageSize: options?.pageSize ?? 100,
    })

    return result.spots.map(mapDtoToRecord)
  } catch {
    return []
  }
}

export async function submitRunningRouteSpot(
  input: SubmitRunningRouteSpotInput,
): Promise<RunningRouteSpotRecord> {
  if (!isRunWalkApiEnabled()) {
    throw new Error('Cadastro de locais indisponível no modo offline.')
  }

  if (isGuestPatient(input.submittedByCpf)) {
    throw new Error('Cadastro de locais disponível apenas para usuários autenticados.')
  }

  const uploadedCover = input.coverPhotoUri
    ? await uploadRunningRouteCoverPhoto(input.coverPhotoUri)
    : null

  const remoteRecord = await createRunWalkLocal({
    name: input.name.trim(),
    description: input.description?.trim() ?? '',
    type: input.type,
    latitude: input.latitude,
    longitude: input.longitude,
    addressLabel: input.addressLabel.trim(),
    locationSource: input.locationSource,
    ...(uploadedCover ? { coverPhotoStoragePath: uploadedCover.storagePath } : {}),
    submittedByName: input.submittedByName,
  })

  return mapDtoToRecord(remoteRecord)
}

export async function loadRunningRouteSpotEngagement(
  spotId: string,
  seed?: Pick<RunningRouteSpotRecord, 'recommendCount' | 'notRecommendCount'>,
): Promise<RunningRouteSpotEngagement> {
  if (isDevMockRunningRouteSpotId(spotId)) {
    return resolveDevMockEngagement(spotId, seed)
  }

  const result = await listRunWalkLocalComentarios(spotId)
  return {
    recommendCount: result.recommendCount,
    notRecommendCount: result.notRecommendCount,
    userVote: result.userVote,
    comments: result.comments.map(mapCommentDto),
  }
}

export async function voteRunningRouteSpot(
  spotId: string,
  vote: RunningRouteVote | null,
  seed?: Pick<RunningRouteSpotRecord, 'recommendCount' | 'notRecommendCount'>,
): Promise<RunningRouteSpotEngagement> {
  if (isDevMockRunningRouteSpotId(spotId)) {
    return resolveDevMockEngagement(spotId, seed)
  }

  const result = await postRunWalkLocalVoto(spotId, vote)
  const comments = await listRunWalkLocalComentarios(spotId)

  return {
    recommendCount: result.recommendCount,
    notRecommendCount: result.notRecommendCount,
    userVote: result.userVote,
    comments: comments.comments.map(mapCommentDto),
  }
}

export async function commentRunningRouteSpot(
  spotId: string,
  authorName: string,
  text: string,
  seed?: Pick<RunningRouteSpotRecord, 'recommendCount' | 'notRecommendCount'>,
): Promise<RunningRouteSpotEngagement> {
  const trimmed = text.trim()
  if (!trimmed) {
    return loadRunningRouteSpotEngagement(spotId, seed)
  }

  if (isDevMockRunningRouteSpotId(spotId)) {
    const base = resolveDevMockEngagement(spotId, seed)
    return {
      ...base,
      comments: [
        {
          id: `dev-mock-comment-${Date.now()}`,
          authorName,
          text: trimmed,
          createdAt: new Date().toISOString(),
        },
        ...base.comments,
      ],
    }
  }

  await createRunWalkLocalComentario(spotId, {
    text: trimmed,
    authorName,
  })

  return loadRunningRouteSpotEngagement(spotId, seed)
}
