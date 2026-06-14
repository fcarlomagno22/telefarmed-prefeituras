import { buildSummaryFromReviews } from './formatters.js'
import { loadProfissionalReviews } from './query.service.js'
import type { ListAvaliacoesQuery, ProfissionalAvaliacoesApiSummary } from './schemas.js'

export async function getProfissionalAvaliacoesSummary(
  profissionalId: string,
  query: Omit<ListAvaliacoesQuery, 'limit' | 'offset'>,
): Promise<ProfissionalAvaliacoesApiSummary> {
  const reviews = await loadProfissionalReviews(profissionalId, {
    ...query,
    limit: 200,
    offset: 0,
  })
  return buildSummaryFromReviews(reviews)
}
