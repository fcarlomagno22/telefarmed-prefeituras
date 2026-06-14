import { profissionalAvaliacoesReviews } from '../../../data/profissionalAvaliacoesMock'
import type {
  ProfissionalAvaliacoesApiReview,
  ProfissionalAvaliacoesApiSummary,
  ProfissionalAvaliacoesListQuery,
  ProfissionalAvaliacoesListResponse,
} from '../../../types/profissionalAvaliacoesApi'
import { computeProfissionalAvaliacoesStats } from '../../../utils/profissional/computeProfissionalAvaliacoesStats'
import { isProfissionalCriticalRating } from '../../../utils/profissional/profissionalAvaliacoesCritical'
import { mockDelay } from '../delay'

export class ProfissionalAvaliacoesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ProfissionalAvaliacoesApiError'
    this.status = status
    this.code = code
  }
}

export function isProfissionalAvaliacoesApiError(
  error: unknown,
): error is ProfissionalAvaliacoesApiError {
  return error instanceof ProfissionalAvaliacoesApiError
}

export type { ProfissionalAvaliacoesApiReview, ProfissionalAvaliacoesApiSummary }

const ALL_REVIEWS: ProfissionalAvaliacoesApiReview[] = profissionalAvaliacoesReviews.map(
  (review, index) => ({
    id: review.id,
    rating: review.rating,
    patientName: review.patientName,
    patientPhotoUrl: review.patientPhotoUrl,
    comment: review.comment,
    createdAtIso: review.createdAtIso,
    createdAtLabel: review.createdAtLabel,
    consultaRef: `ATD-202605${String(28 - index).padStart(2, '0')}-${String(index + 1).padStart(3, '0')}`,
  }),
)

function filterReviews(query?: ProfissionalAvaliacoesListQuery): ProfissionalAvaliacoesApiReview[] {
  let rows = ALL_REVIEWS

  if (query?.criticos) {
    rows = rows.filter((review) => isProfissionalCriticalRating(review.rating))
  }

  if (query?.search?.trim()) {
    const term = query.search.trim().toLowerCase()
    rows = rows.filter(
      (review) =>
        review.patientName.toLowerCase().includes(term) ||
        review.comment.toLowerCase().includes(term),
    )
  }

  if (query?.notaMinima != null) {
    rows = rows.filter((review) => review.rating >= query.notaMinima!)
  }

  return rows
}

function buildSummary(reviews: ProfissionalAvaliacoesApiReview[]): ProfissionalAvaliacoesApiSummary {
  const stats = computeProfissionalAvaliacoesStats(
    reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      patientName: review.patientName,
      patientPhotoUrl: review.patientPhotoUrl,
      comment: review.comment,
      createdAtIso: review.createdAtIso,
      createdAtLabel: review.createdAtLabel,
    })),
  )

  return {
    averageRating: stats.averageRating,
    totalReviews: stats.total,
    criticalCount: stats.criticalCount,
    positiveCount: stats.positiveCount,
    positivePercent: stats.positivePercent,
    withCommentCount: stats.withCommentCount,
    withCommentPercent: stats.withCommentPercent,
    fiveStarCount: stats.starBars.find((bar) => bar.stars === 5)?.count ?? 0,
    fourStarCount: stats.starBars.find((bar) => bar.stars === 4)?.count ?? 0,
    starBars: stats.starBars,
    weeklyTrend: stats.weeklyReviewCounts.map((point, index) => ({
      label: point.label,
      count: point.count,
      averageRating: stats.weeklyAverageRatings[index]?.average ?? 0,
    })),
    monthlyCounts: stats.monthlyCounts,
  }
}

export async function fetchProfissionalAvaliacoesSummary(
  _accessToken: string,
  query?: Omit<ProfissionalAvaliacoesListQuery, 'limit' | 'offset'>,
): Promise<ProfissionalAvaliacoesApiSummary> {
  const reviews = filterReviews(query)
  return mockDelay(buildSummary(reviews))
}

export async function fetchProfissionalAvaliacoesList(
  _accessToken: string,
  query?: ProfissionalAvaliacoesListQuery,
): Promise<ProfissionalAvaliacoesListResponse> {
  const rows = filterReviews(query)
  const limit = query?.limit ?? 100
  const offset = query?.offset ?? 0

  return mockDelay({
    reviews: rows.slice(offset, offset + limit),
    total: rows.length,
    limit,
    offset,
  })
}
