import type { ConsultaAvaliacaoRow, ProfissionalReviewRow } from './types.js'
import type {
  ProfissionalAvaliacoesApiReview,
  ProfissionalAvaliacoesApiSummary,
} from './schemas.js'

const CRITICAL_RATING_MAX = 3

export function isCriticalRating(rating: number): boolean {
  return rating <= CRITICAL_RATING_MAX
}

export function resolveReviewRating(row: ConsultaAvaliacaoRow): 1 | 2 | 3 | 4 | 5 {
  const raw = row.nota_profissional ?? row.nota
  const normalized = Math.min(5, Math.max(1, Math.round(Number(raw))))
  return normalized as 1 | 2 | 3 | 4 | 5
}

export function resolveReviewComment(row: ConsultaAvaliacaoRow): string {
  return row.comentario_profissional?.trim() || row.comentario?.trim() || ''
}

export function formatRelativeReviewLabel(iso: string, now = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Math.max(0, now.getTime() - date.getTime())
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return 'Agora há pouco'
  if (diffMinutes < 60) return diffMinutes === 1 ? 'Há 1 minuto' : `Há ${diffMinutes} minutos`
  if (diffHours < 24) return diffHours === 1 ? 'Há 1 hora' : `Há ${diffHours} horas`
  if (diffDays === 1) return 'Há 1 dia'
  if (diffDays < 7) return `Há ${diffDays} dias`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return diffWeeks === 1 ? 'Há 1 semana' : `Há ${diffWeeks} semanas`

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function mapReviewRowToApi(review: ProfissionalReviewRow): ProfissionalAvaliacoesApiReview {
  return {
    id: review.id,
    rating: review.rating,
    patientName: review.patientName,
    patientPhotoUrl: review.patientPhotoUrl,
    comment: review.comment,
    createdAtIso: review.createdAtIso,
    createdAtLabel: formatRelativeReviewLabel(review.createdAtIso),
    consultaRef: review.consultaRef,
  }
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

export function buildSummaryFromReviews(
  reviews: ProfissionalReviewRow[],
): ProfissionalAvaliacoesApiSummary {
  const total = reviews.length
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0)
  const averageRating = total > 0 ? Number((ratingSum / total).toFixed(1)) : 0
  const criticalCount = reviews.filter((review) => isCriticalRating(review.rating)).length
  const positiveCount = total - criticalCount
  const positivePercent = total > 0 ? Math.round((positiveCount / total) * 100) : 0
  const withCommentCount = reviews.filter((review) => review.comment.trim().length > 0).length
  const withCommentPercent = total > 0 ? Math.round((withCommentCount / total) * 100) : 0

  const starCounts = new Map<1 | 2 | 3 | 4 | 5, number>([
    [5, 0],
    [4, 0],
    [3, 0],
    [2, 0],
    [1, 0],
  ])

  for (const review of reviews) {
    starCounts.set(review.rating, (starCounts.get(review.rating) ?? 0) + 1)
  }

  const starBars = ([5, 4, 3, 2, 1] as const).map((stars) => {
    const count = starCounts.get(stars) ?? 0
    return {
      stars,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })

  const anchor =
    reviews.length > 0
      ? new Date(
          reviews.reduce(
            (latest, review) =>
              new Date(review.createdAtIso) > latest ? new Date(review.createdAtIso) : latest,
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

  for (const review of reviews) {
    const weekStart = startOfWeek(new Date(review.createdAtIso))
    const key = weekStart.toISOString().slice(0, 10)
    const bucket = weekBuckets.get(key)
    if (!bucket) continue
    bucket.count += 1
    bucket.ratingSum += review.rating
  }

  const weeklySorted = [...weekBuckets.values()].sort((a, b) => a.sortKey - b.sortKey)
  const weeklyTrend = weeklySorted.map(({ label, count, ratingSum }) => ({
    label,
    count,
    averageRating: count > 0 ? Number((ratingSum / count).toFixed(1)) : 0,
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

  for (const review of reviews) {
    const date = new Date(review.createdAtIso)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    const bucket = monthBuckets.get(key)
    if (bucket) bucket.count += 1
  }

  const monthlyCounts = [...monthBuckets.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, count }) => ({ label, count }))

  return {
    averageRating,
    totalReviews: total,
    criticalCount,
    positiveCount,
    positivePercent,
    withCommentCount,
    withCommentPercent,
    fiveStarCount: starCounts.get(5) ?? 0,
    fourStarCount: starCounts.get(4) ?? 0,
    starBars,
    weeklyTrend,
    monthlyCounts,
  }
}
