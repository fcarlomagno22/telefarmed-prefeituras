import { vdRequest } from './client'

export type LiveSharePointDto = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

export type LiveShareSessionDto = {
  id: string
  shareToken: string
  participantName: string
  activityName: string
  isActive: boolean
  startedAt: string
  expiresAt: string
}

export type CreateRunWalkLiveSessionInput = {
  participantName: string
  activityName: string
  initialPoint?: {
    latitude: number
    longitude: number
    accuracyMeters?: number | null
    recordedAt?: string
  }
}

export type CreateRunWalkLiveSessionResult = {
  session: LiveShareSessionDto
  shareToken: string
  shareUrl: string
  points: LiveSharePointDto[]
}

export type AppendRunWalkLiveSessionPointsInput = {
  points: Array<{
    latitude: number
    longitude: number
    accuracyMeters?: number | null
    recordedAt?: string
  }>
}

export type AppendRunWalkLiveSessionPointsResult = {
  points: LiveSharePointDto[]
  insertedCount: number
}

export type EndRunWalkLiveSessionResult = {
  session: LiveShareSessionDto
}

export async function createRunWalkLiveSession(
  input: CreateRunWalkLiveSessionInput,
): Promise<CreateRunWalkLiveSessionResult> {
  return vdRequest<CreateRunWalkLiveSessionResult>({
    method: 'POST',
    path: '/vd/run-walk/live-sessoes',
    body: input,
    credentials: 'include',
  })
}

export async function appendRunWalkLiveSessionPoints(
  sessionId: string,
  input: AppendRunWalkLiveSessionPointsInput,
): Promise<AppendRunWalkLiveSessionPointsResult> {
  return vdRequest<AppendRunWalkLiveSessionPointsResult>({
    method: 'POST',
    path: `/vd/run-walk/live-sessoes/${sessionId}/pontos`,
    body: input,
    credentials: 'include',
  })
}

export async function endRunWalkLiveSession(
  sessionId: string,
): Promise<EndRunWalkLiveSessionResult> {
  return vdRequest<EndRunWalkLiveSessionResult>({
    method: 'PATCH',
    path: `/vd/run-walk/live-sessoes/${sessionId}/encerrar`,
    credentials: 'include',
  })
}
