import { VdRunWalkError } from './errors.js'
import {
  buildLiveSharePublicUrl,
  generateLiveShareToken,
  isLiveSessionExpired,
  mapCreateInputToInsertRow,
  mapLivePointRow,
  mapLiveSessionRow,
  mapPointInputToInsertRow,
  type AppendLiveSessionPointsInput,
  type CreateLiveSessionInput,
  type CreateLiveSessionResultDto,
  type AppendLiveSessionPointsResultDto,
  type EndLiveSessionResultDto,
} from './live-sessions.formatters.js'
import {
  endLiveSession,
  findLiveSessionById,
  insertLivePoints,
  insertLiveSession,
  isUniqueViolationError,
} from './live-sessions.repository.js'
import type { VdRunWalkPacienteScope } from './types.js'

function assertSessionWritable(
  row: Awaited<ReturnType<typeof findLiveSessionById>>,
): asserts row is NonNullable<typeof row> {
  if (!row) {
    throw new VdRunWalkError('Sessão live share não encontrada.', 'NOT_FOUND', 404)
  }

  if (!row.is_active || isLiveSessionExpired(row)) {
    throw new VdRunWalkError('Sessão live share inativa ou expirada.', 'CONFLICT', 409)
  }
}

async function createLiveSessionWithToken(
  scope: VdRunWalkPacienteScope,
  input: CreateLiveSessionInput,
  shareToken: string,
) {
  return insertLiveSession(mapCreateInputToInsertRow(scope, input, shareToken))
}

export async function createRunWalkLiveSession(
  scope: VdRunWalkPacienteScope,
  input: CreateLiveSessionInput,
): Promise<CreateLiveSessionResultDto> {
  let shareToken = generateLiveShareToken()
  let sessionRow = null as Awaited<ReturnType<typeof createLiveSessionWithToken>> | null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      sessionRow = await createLiveSessionWithToken(scope, input, shareToken)
      break
    } catch (error) {
      if (!isUniqueViolationError(error)) throw error
      shareToken = generateLiveShareToken()
    }
  }

  if (!sessionRow) {
    throw new VdRunWalkError(
      'Não foi possível gerar um link de compartilhamento.',
      'CONFLICT',
      409,
    )
  }

  const points = []

  if (input.initialPoint) {
    const inserted = await insertLivePoints([
      mapPointInputToInsertRow(sessionRow.id, input.initialPoint),
    ])
    points.push(...inserted.map(mapLivePointRow))
  }

  const session = mapLiveSessionRow(sessionRow)

  return {
    session,
    shareToken: session.shareToken,
    shareUrl: buildLiveSharePublicUrl(session.shareToken),
    points,
  }
}

export async function appendRunWalkLiveSessionPoints(
  scope: VdRunWalkPacienteScope,
  sessionId: string,
  input: AppendLiveSessionPointsInput,
): Promise<AppendLiveSessionPointsResultDto> {
  const sessionRow = await findLiveSessionById(scope, sessionId)
  assertSessionWritable(sessionRow)

  const rows = input.points.map((point) => mapPointInputToInsertRow(sessionRow.id, point))
  const inserted = await insertLivePoints(rows)

  return {
    points: inserted.map(mapLivePointRow),
    insertedCount: inserted.length,
  }
}

export async function endRunWalkLiveSession(
  scope: VdRunWalkPacienteScope,
  sessionId: string,
): Promise<EndLiveSessionResultDto> {
  const existing = await findLiveSessionById(scope, sessionId)
  if (!existing) {
    throw new VdRunWalkError('Sessão live share não encontrada.', 'NOT_FOUND', 404)
  }

  const ended = await endLiveSession(scope, sessionId)
  if (!ended) {
    throw new VdRunWalkError('Sessão live share não encontrada.', 'NOT_FOUND', 404)
  }

  return {
    session: mapLiveSessionRow(ended),
  }
}
