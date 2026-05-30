import type {
  ProfissionalAvaliacoesFilters,
  ProfissionalPatientReview,
} from '../../types/profissionalAvaliacoes'
import { isProfissionalCriticalRating } from './profissionalAvaliacoesCritical'

export const defaultProfissionalAvaliacoesFilters: ProfissionalAvaliacoesFilters = {
  tab: 'todos',
  search: '',
}

export function filterProfissionalAvaliacoes(
  reviews: ProfissionalPatientReview[],
  filters: ProfissionalAvaliacoesFilters,
): ProfissionalPatientReview[] {
  let result = [...reviews]

  if (filters.tab === 'criticos') {
    result = result.filter((review) => isProfissionalCriticalRating(review.rating))
  }

  const query = filters.search.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (review) =>
        review.comment.toLowerCase().includes(query) ||
        review.patientName.toLowerCase().includes(query),
    )
  }

  return result.sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  )
}

export function countProfissionalCriticalReviews(reviews: ProfissionalPatientReview[]) {
  return reviews.filter((review) => isProfissionalCriticalRating(review.rating)).length
}
