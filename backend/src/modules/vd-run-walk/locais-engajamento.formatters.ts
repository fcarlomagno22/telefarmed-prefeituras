import type { RunningRouteSpotComentarioRow } from './locais-engajamento.repository.js'
import type { RunningRouteSpotVote } from './types.js'

export const DEFAULT_COMENTARIOS_PAGE_SIZE = 20
export const MAX_COMENTARIOS_PAGE_SIZE = 50

export type RunningRouteSpotCommentDto = {
  id: string
  authorName: string
  text: string
  createdAt: string
}

export type RunningRouteLocalVotoResultDto = {
  userVote: RunningRouteSpotVote | null
  recommendCount: number
  notRecommendCount: number
}

export type RunningRouteLocalComentariosListDto = RunningRouteLocalVotoResultDto & {
  comments: RunningRouteSpotCommentDto[]
  totalCount: number
  hasMore: boolean
  page: number
  pageSize: number
}

export type ListRunningRouteComentariosQuery = {
  page?: number
  pageSize?: number
}

export function normalizeListComentariosQuery(query: ListRunningRouteComentariosQuery) {
  const pageSize = Math.min(
    Math.max(query.pageSize ?? DEFAULT_COMENTARIOS_PAGE_SIZE, 1),
    MAX_COMENTARIOS_PAGE_SIZE,
  )
  const page = Math.max(query.page ?? 1, 1)

  return { page, pageSize }
}

export function mapComentarioRowToDto(row: RunningRouteSpotComentarioRow): RunningRouteSpotCommentDto {
  return {
    id: row.id,
    authorName: row.author_name.trim(),
    text: row.text.trim(),
    createdAt: row.criado_em,
  }
}

export function buildComentariosListDto(input: {
  comments: RunningRouteSpotCommentDto[]
  totalCount: number
  page: number
  pageSize: number
  userVote: RunningRouteSpotVote | null
  recommendCount: number
  notRecommendCount: number
}): RunningRouteLocalComentariosListDto {
  const offset = (input.page - 1) * input.pageSize

  return {
    comments: input.comments,
    totalCount: input.totalCount,
    hasMore: offset + input.pageSize < input.totalCount,
    page: input.page,
    pageSize: input.pageSize,
    userVote: input.userVote,
    recommendCount: input.recommendCount,
    notRecommendCount: input.notRecommendCount,
  }
}

export function applyVoteTransition(
  currentVote: RunningRouteSpotVote | null,
  nextVote: RunningRouteSpotVote | null,
  recommendCount: number,
  notRecommendCount: number,
): {
  recommendCount: number
  notRecommendCount: number
  shouldDelete: boolean
  shouldUpsert: boolean
  upsertVote: RunningRouteSpotVote | null
} {
  let nextRecommend = recommendCount
  let nextNotRecommend = notRecommendCount

  if (currentVote === 'recommend') nextRecommend -= 1
  if (currentVote === 'not-recommend') nextNotRecommend -= 1

  if (nextVote === 'recommend') nextRecommend += 1
  if (nextVote === 'not-recommend') nextNotRecommend += 1

  return {
    recommendCount: Math.max(0, nextRecommend),
    notRecommendCount: Math.max(0, nextNotRecommend),
    shouldDelete: nextVote === null,
    shouldUpsert: nextVote !== null,
    upsertVote: nextVote,
  }
}
