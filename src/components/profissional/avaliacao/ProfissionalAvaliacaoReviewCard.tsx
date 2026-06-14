import { AlertTriangle, CalendarClock, Quote } from 'lucide-react'
import type { ProfissionalPatientReview } from '../../../types/profissionalAvaliacoes'
import { formatProfissionalReviewDateTime } from '../../../utils/profissional/formatProfissionalReviewDateTime'
import { isProfissionalCriticalRating } from '../../../utils/profissional/profissionalAvaliacoesCritical'
import { getProfissionalStarColors } from '../../../utils/profissional/profissionalStarRatingColors'
import { ProfissionalStarRating } from './ProfissionalStarRating'
import { profissionalAvaliacoesCriticalBadgeClass } from './profissionalAvaliacoesUi'

type ProfissionalAvaliacaoReviewCardProps = {
  review: ProfissionalPatientReview
  tourDataTarget?: string
}

export function ProfissionalAvaliacaoReviewCard({
  review,
  tourDataTarget,
}: ProfissionalAvaliacaoReviewCardProps) {
  const isCritical = isProfissionalCriticalRating(review.rating)
  const starColors = getProfissionalStarColors(review.rating)
  const { full: evaluatedAt } = formatProfissionalReviewDateTime(review.createdAtIso)

  return (
    <li
      {...(tourDataTarget ? { 'data-tour': tourDataTarget } : {})}
      className={[
        'group overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]',
        'transition hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.06)]',
        isCritical ? 'border-red-100/90' : 'border-gray-200/90',
      ].join(' ')}
    >
      <div
        className={['h-1 w-full bg-gradient-to-r', starColors.topBarClass].join(' ')}
        aria-hidden
      />

      <div className="p-4 sm:p-5">
        <div className="flex gap-3.5 sm:gap-4">
          <div className="relative shrink-0">
            <img
              src={review.patientPhotoUrl}
              alt={review.patientName}
              className={[
                'h-14 w-14 rounded-2xl object-cover shadow-md ring-2',
                isCritical ? 'ring-red-100' : starColors.ringClass,
              ].join(' ')}
            />
            <span
              className={[
                'absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-lg px-1 text-[10px] font-bold tabular-nums text-white shadow-sm',
                starColors.badgeClass,
              ].join(' ')}
              aria-label={`${review.rating} estrelas`}
            >
              {review.rating}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-gray-900">{review.patientName}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                    <time dateTime={review.createdAtIso}>{evaluatedAt}</time>
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">{review.createdAtLabel}</p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
                <ProfissionalStarRating rating={review.rating} size="sm" />
                {isCritical ? (
                  <span className={profissionalAvaliacoesCriticalBadgeClass}>
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Crítica
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          className={[
            'relative mt-4 rounded-xl px-4 py-3.5',
            isCritical ? 'bg-red-50/50 ring-1 ring-red-100/80' : 'bg-gray-50/80 ring-1 ring-gray-100',
          ].join(' ')}
        >
          <Quote
            className={[
              'absolute left-3 top-3 h-4 w-4 opacity-40',
              isCritical ? 'text-red-400' : 'text-[var(--brand-primary)]',
            ].join(' ')}
            aria-hidden
          />
          <p className="relative pl-5 text-sm leading-relaxed text-gray-700">{review.comment}</p>
        </div>
      </div>
    </li>
  )
}
