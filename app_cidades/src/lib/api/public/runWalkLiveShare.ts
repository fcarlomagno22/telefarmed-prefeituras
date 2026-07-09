import { API_BASE_URL } from '../../../config/api'
import type { LiveShareSessionSnapshot } from '../../../types/runWalkLiveShare'

export class RunWalkLiveSharePublicApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'RunWalkLiveSharePublicApiError'
    this.code = code
    this.status = status
  }
}

type LiveSharePointDto = {
  id: string
  latitude: number
  longitude: number
  accuracyMeters: number | null
  recordedAt: string
}

type LiveShareSessionPublicDto = {
  id: string
  shareToken: string
  participantName: string
  participantPhotoUrl?: string | null
  activityName: string
  isActive: boolean
  startedAt: string
  expiresAt: string
  points: LiveSharePointDto[]
}

type LiveShareSessionPublicResult = {
  session: LiveShareSessionPublicDto
}

function normalizeLiveShareToken(token: string): string {
  return token.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

async function parseError(response: Response): Promise<RunWalkLiveSharePublicApiError> {
  let message = 'Não foi possível carregar o acompanhamento.'
  let code = 'UNKNOWN'

  try {
    const body = (await response.json()) as {
      error?: string
      message?: string
      code?: string
    }
    if (body.error) message = body.error
    else if (body.message) message = body.message
    if (body.code) code = body.code
  } catch {
    // ignore
  }

  return new RunWalkLiveSharePublicApiError(message, code, response.status)
}

export function isRunWalkLiveSharePublicApiError(
  error: unknown,
): error is RunWalkLiveSharePublicApiError {
  return error instanceof RunWalkLiveSharePublicApiError
}

function mapPublicSession(result: LiveShareSessionPublicResult): LiveShareSessionSnapshot {
  const { session } = result
  return {
    id: session.id,
    shareToken: session.shareToken,
    participantName: session.participantName,
    participantPhotoUrl: session.participantPhotoUrl ?? null,
    activityName: session.activityName,
    isActive: session.isActive,
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    points: session.points.map((point) => ({
      id: point.id,
      latitude: point.latitude,
      longitude: point.longitude,
      accuracyMeters: point.accuracyMeters,
      recordedAt: point.recordedAt,
    })),
  }
}

export async function fetchPublicLiveShareSession(
  token: string,
): Promise<LiveShareSessionSnapshot> {
  const normalizedToken = normalizeLiveShareToken(token)
  const response = await fetch(
    `${API_BASE_URL}/public/live-share/${encodeURIComponent(normalizedToken)}`,
  )

  if (!response.ok) throw await parseError(response)

  const body = (await response.json()) as LiveShareSessionPublicResult
  return mapPublicSession(body)
}
