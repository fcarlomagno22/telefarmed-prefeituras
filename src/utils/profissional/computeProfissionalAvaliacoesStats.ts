import type { ProfissionalPatientReview } from '../../types/profissionalAvaliacoes'
import { isProfissionalCriticalRating } from './profissionalAvaliacoesCritical'

export type ProfissionalAvaliacoesStarBar = {
  stars: 1 | 2 | 3 | 4 | 5
  count: number
  percent: number
}

export type ProfissionalAvaliacoesStats = {
  total: number
  averageRating: number
  criticalCount: number
  positiveCount: number
  positivePercent: number
  withCommentCount: number
  withCommentPercent: number
  starBars: ProfissionalAvaliacoesStarBar[]
  starDonut: { stars: number; count: number; percent: number; colorFrom: string; colorTo: string }[]
  sentimentSlices: {
    key: 'positive' | 'critical'
    label: string
    count: number
    percent: number
    gradientFrom: string
    gradientTo: string
  }[]
  weeklyReviewCounts: { label: string; count: number }[]
  weeklyAverageRatings: { label: string; average: number }[]
  monthlyCounts: { label: string; count: number }[]
}

const STAR_COLORS: Record<number, { from: string; to: string }> = {
  5: { from: '#f59e0b', to: '#fbbf24' },
  4: { from: '#fb923c', to: '#fdba74' },
  3: { from: '#94a3b8', to: '#cbd5e1' },
  2: { from: '#f87171', to: '#fca5a5' },
  1: { from: '#dc2626', to: '#f87171' },
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function formatWeekLabel(weekStart: Date) {
  const day = weekStart.getDate()
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(weekStart)
    .replace('.', '')
  return `${day} ${month}`
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
    .format(date)
    .replace('.', '')
}

export function computeProfissionalAvaliacoesStats(
  reviews: ProfissionalPatientReview[],
): ProfissionalAvaliacoesStats {
  const total = reviews.length
  const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0)
  const averageRating = total > 0 ? Number((ratingSum / total).toFixed(1)) : 0
  const criticalCount = reviews.filter((r) => isProfissionalCriticalRating(r.rating)).length
  const positiveCount = total - criticalCount
  const positivePercent = total > 0 ? Math.round((positiveCount / total) * 100) : 0
  const withCommentCount = reviews.filter((r) => r.comment.trim().length > 0).length
  const withCommentPercent = total > 0 ? Math.round((withCommentCount / total) * 100) : 0

  const starCounts = new Map<1 | 2 | 3 | 4 | 5, number>([
    [5, 0],
    [4, 0],
    [3, 0],
    [2, 0],
    [1, 0],
  ])
  reviews.forEach((review) => {
    starCounts.set(review.rating, (starCounts.get(review.rating) ?? 0) + 1)
  })

  const starBars: ProfissionalAvaliacoesStarBar[] = ([5, 4, 3, 2, 1] as const).map((stars) => {
    const count = starCounts.get(stars) ?? 0
    return {
      stars,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })

  const starDonut = starBars
    .filter((bar) => bar.count > 0)
    .map((bar) => ({
      stars: bar.stars,
      count: bar.count,
      percent: bar.percent,
      colorFrom: STAR_COLORS[bar.stars].from,
      colorTo: STAR_COLORS[bar.stars].to,
    }))

  const sentimentSlices =
    total === 0
      ? []
      : [
          {
            key: 'positive' as const,
            label: '4–5 estrelas',
            count: positiveCount,
            percent: positivePercent,
            gradientFrom: '#ff6b00',
            gradientTo: '#ffb347',
          },
          {
            key: 'critical' as const,
            label: 'Críticas (< 4)',
            count: criticalCount,
            percent: 100 - positivePercent,
            gradientFrom: '#ef4444',
            gradientTo: '#fca5a5',
          },
        ].filter((slice) => slice.count > 0)

  const anchor =
    reviews.length > 0
      ? new Date(
          reviews.reduce(
            (latest, r) =>
              new Date(r.createdAtIso) > latest ? new Date(r.createdAtIso) : latest,
            new Date(reviews[0].createdAtIso),
          ),
        )
      : new Date()

  const weekBuckets = new Map<
    string,
    { label: string; count: number; ratingSum: number; sortKey: number }
  >()
  for (let index = 7; index >= 0; index -= 1) {
    const weekStart = startOfWeek(new Date(anchor))
    weekStart.setDate(weekStart.getDate() - index * 7)
    const key = weekStart.toISOString().slice(0, 10)
    weekBuckets.set(key, {
      label: formatWeekLabel(weekStart),
      count: 0,
      ratingSum: 0,
      sortKey: weekStart.getTime(),
    })
  }

  reviews.forEach((review) => {
    const weekStart = startOfWeek(new Date(review.createdAtIso))
    const key = weekStart.toISOString().slice(0, 10)
    const bucket = weekBuckets.get(key)
    if (bucket) {
      bucket.count += 1
      bucket.ratingSum += review.rating
    }
  })

  const weeklySorted = [...weekBuckets.values()].sort((a, b) => a.sortKey - b.sortKey)
  const weeklyReviewCounts = weeklySorted.map(({ label, count }) => ({ label, count }))
  const weeklyAverageRatings = weeklySorted.map(({ label, count, ratingSum }) => ({
    label,
    average: count > 0 ? Number((ratingSum / count).toFixed(1)) : 0,
  }))

  const monthBuckets = new Map<string, { label: string; count: number; sortKey: number }>()
  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() - index, 1)
    const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`
    monthBuckets.set(key, {
      label: formatMonthLabel(monthDate),
      count: 0,
      sortKey: monthDate.getTime(),
    })
  }

  reviews.forEach((review) => {
    const date = new Date(review.createdAtIso)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthBuckets.get(key)
    if (bucket) bucket.count += 1
  })

  const monthlyCounts = [...monthBuckets.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, count }) => ({ label, count }))

  return {
    total,
    averageRating,
    criticalCount,
    positiveCount,
    positivePercent,
    withCommentCount,
    withCommentPercent,
    starBars,
    starDonut,
    sentimentSlices,
    weeklyReviewCounts,
    weeklyAverageRatings,
    monthlyCounts,
  }
}
