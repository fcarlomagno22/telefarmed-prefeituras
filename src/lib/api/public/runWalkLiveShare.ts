import { API_BASE_URL } from '../config'
import type { LiveShareSessionPublicResult } from '../../../types/runWalkLiveSharePublic'

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

export function isRunWalkLiveSharePublicApiError(
  error: unknown,
): error is RunWalkLiveSharePublicApiError {
  return error instanceof RunWalkLiveSharePublicApiError
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

export async function apiFetchLiveShareSession(
  token: string,
): Promise<LiveShareSessionPublicResult> {
  const normalizedToken = normalizeLiveShareToken(token)
  const response = await fetch(
    `${API_BASE_URL}/public/live-share/${encodeURIComponent(normalizedToken)}`,
  )

  if (!response.ok) throw await parseError(response)
  return (await response.json()) as LiveShareSessionPublicResult
}
