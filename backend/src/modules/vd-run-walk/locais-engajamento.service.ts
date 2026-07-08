import { VdRunWalkError } from './errors.js'
import {
  applyVoteTransition,
  buildComentariosListDto,
  mapComentarioRowToDto,
  normalizeListComentariosQuery,
  type ListRunningRouteComentariosQuery,
  type RunningRouteLocalComentariosListDto,
  type RunningRouteLocalVotoResultDto,
  type RunningRouteSpotCommentDto,
} from './locais-engajamento.formatters.js'
import {
  deleteRunningRouteSpotVoto,
  findRunningRouteSpotVoto,
  insertRunningRouteSpotComentario,
  listRunningRouteSpotComentarios,
  upsertRunningRouteSpotVoto,
} from './locais-engajamento.repository.js'
import {
  findRunningRouteSpotById,
  updateRunningRouteSpotCounters,
} from './locais.repository.js'
import type { RunningRouteSpotVote } from './types.js'
import type { VdRunWalkPacienteScope } from './types.js'

export type LocaisEngajamentoServiceDeps = {
  findSpotById: typeof findRunningRouteSpotById
  findVote: typeof findRunningRouteSpotVoto
  upsertVote: typeof upsertRunningRouteSpotVoto
  deleteVote: typeof deleteRunningRouteSpotVoto
  updateCounters: typeof updateRunningRouteSpotCounters
  listComentarios: typeof listRunningRouteSpotComentarios
  insertComentario: typeof insertRunningRouteSpotComentario
}

const defaultDeps: LocaisEngajamentoServiceDeps = {
  findSpotById: findRunningRouteSpotById,
  findVote: findRunningRouteSpotVoto,
  upsertVote: upsertRunningRouteSpotVoto,
  deleteVote: deleteRunningRouteSpotVoto,
  updateCounters: updateRunningRouteSpotCounters,
  listComentarios: listRunningRouteSpotComentarios,
  insertComentario: insertRunningRouteSpotComentario,
}

async function assertAccessibleSpot(
  scope: VdRunWalkPacienteScope,
  spotId: string,
  deps: LocaisEngajamentoServiceDeps,
) {
  const spot = await deps.findSpotById(scope, spotId)
  if (!spot) {
    throw new VdRunWalkError('Local para correr não encontrado.', 'NOT_FOUND', 404)
  }
  return spot
}

export async function postRunWalkLocalVoto(
  scope: VdRunWalkPacienteScope,
  spotId: string,
  vote: RunningRouteSpotVote | null,
  deps: LocaisEngajamentoServiceDeps = defaultDeps,
): Promise<RunningRouteLocalVotoResultDto> {
  const spot = await assertAccessibleSpot(scope, spotId, deps)
  const currentVoteRow = await deps.findVote(scope, spotId)
  const currentVote = currentVoteRow?.vote ?? null

  const transition = applyVoteTransition(
    currentVote,
    vote,
    spot.recommend_count,
    spot.not_recommend_count,
  )

  if (transition.shouldDelete) {
    if (currentVoteRow) {
      await deps.deleteVote(scope, spotId)
    }
  } else if (transition.shouldUpsert && transition.upsertVote) {
    await deps.upsertVote(scope, spotId, transition.upsertVote)
  }

  const updatedSpot = await deps.updateCounters(
    spotId,
    transition.recommendCount,
    transition.notRecommendCount,
  )

  return {
    userVote: vote,
    recommendCount: updatedSpot.recommend_count,
    notRecommendCount: updatedSpot.not_recommend_count,
  }
}

export async function listRunWalkLocalComentarios(
  scope: VdRunWalkPacienteScope,
  spotId: string,
  query: ListRunningRouteComentariosQuery,
  deps: LocaisEngajamentoServiceDeps = defaultDeps,
): Promise<RunningRouteLocalComentariosListDto> {
  const spot = await assertAccessibleSpot(scope, spotId, deps)
  const normalized = normalizeListComentariosQuery(query)
  const [voteRow, comentarios] = await Promise.all([
    deps.findVote(scope, spotId),
    deps.listComentarios({
      spotId,
      page: normalized.page,
      pageSize: normalized.pageSize,
    }),
  ])

  return buildComentariosListDto({
    comments: comentarios.rows.map(mapComentarioRowToDto),
    totalCount: comentarios.totalCount,
    page: normalized.page,
    pageSize: normalized.pageSize,
    userVote: voteRow?.vote ?? null,
    recommendCount: spot.recommend_count,
    notRecommendCount: spot.not_recommend_count,
  })
}

export async function createRunWalkLocalComentario(
  scope: VdRunWalkPacienteScope,
  spotId: string,
  text: string,
  authorName: string,
  deps: LocaisEngajamentoServiceDeps = defaultDeps,
): Promise<RunningRouteSpotCommentDto> {
  await assertAccessibleSpot(scope, spotId, deps)

  const trimmed = text.trim()
  if (!trimmed) {
    throw new VdRunWalkError('Informe o texto do comentário.', 'INVALID_DATA', 400)
  }

  const row = await deps.insertComentario(
    scope,
    spotId,
    authorName.trim() || 'Participante',
    trimmed,
  )

  return mapComentarioRowToDto(row)
}
