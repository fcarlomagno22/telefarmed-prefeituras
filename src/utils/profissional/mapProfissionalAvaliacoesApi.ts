import type { ProfissionalPatientReview } from '../../types/profissionalAvaliacoes'
import type { ProfissionalAvaliacoesApiSummary } from '../../types/profissionalAvaliacoesApi'
import type { ProfissionalAvaliacoesStats } from './computeProfissionalAvaliacoesStats'
import { getProfissionalStarGradient } from './profissionalStarRatingColors'

const STAR_COLORS = {
  5: getProfissionalStarGradient(5),
  4: getProfissionalStarGradient(4),
  3: getProfissionalStarGradient(3),
  2: getProfissionalStarGradient(2),
  1: getProfissionalStarGradient(1),
} as const

export function mapApiReviewToPatientReview(
  review: import('../../types/profissionalAvaliacoesApi').ProfissionalAvaliacoesApiReview,
): ProfissionalPatientReview {
  return {
    id: review.id,
    rating: review.rating,
    patientName: review.patientName,
    patientPhotoUrl: review.patientPhotoUrl,
    comment: review.comment,
    createdAtIso: review.createdAtIso,
    createdAtLabel: review.createdAtLabel,
  }
}

export function mapSummaryToAvaliacoesStats(
  summary: ProfissionalAvaliacoesApiSummary,
): ProfissionalAvaliacoesStats {
  const starDonut = summary.starBars
    .filter((bar) => bar.count > 0)
    .map((bar) => ({
      stars: bar.stars,
      count: bar.count,
      percent: bar.percent,
      colorFrom: STAR_COLORS[bar.stars].from,
      colorTo: STAR_COLORS[bar.stars].to,
    }))

  const sentimentSlices =
    summary.totalReviews === 0
      ? []
      : [
          {
            key: 'positive' as const,
            label: '4–5 estrelas',
            count: summary.positiveCount,
            percent: summary.positivePercent,
            gradientFrom: '#ff6b00',
            gradientTo: '#ffb347',
          },
          {
            key: 'critical' as const,
            label: 'Críticas (< 4)',
            count: summary.criticalCount,
            percent: 100 - summary.positivePercent,
            gradientFrom: '#ef4444',
            gradientTo: '#fca5a5',
          },
        ].filter((slice) => slice.count > 0)

  return {
    total: summary.totalReviews,
    averageRating: summary.averageRating,
    criticalCount: summary.criticalCount,
    positiveCount: summary.positiveCount,
    positivePercent: summary.positivePercent,
    withCommentCount: summary.withCommentCount,
    withCommentPercent: summary.withCommentPercent,
    starBars: summary.starBars,
    starDonut,
    sentimentSlices,
    weeklyReviewCounts: summary.weeklyTrend.map((point) => ({
      label: point.label,
      count: point.count,
    })),
    weeklyAverageRatings: summary.weeklyTrend.map((point) => ({
      label: point.label,
      average: point.averageRating,
    })),
    monthlyCounts: summary.monthlyCounts,
  }
}
