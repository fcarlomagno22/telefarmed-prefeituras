import { mapReviewRowToApi } from './formatters.js'
import { loadProfissionalReviews } from './query.service.js'
import type { ListAvaliacoesQuery, ProfissionalAvaliacoesListApi } from './schemas.js'

export async function listProfissionalAvaliacoes(
  profissionalId: string,
  query: ListAvaliacoesQuery,
): Promise<ProfissionalAvaliacoesListApi> {
  const reviews = await loadProfissionalReviews(profissionalId, query)
  const limit = query.limit
  const offset = query.offset

  return {
    reviews: reviews.slice(offset, offset + limit).map(mapReviewRowToApi),
    total: reviews.length,
    limit,
    offset,
  }
}
