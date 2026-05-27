import { Star } from 'lucide-react'
import { useState } from 'react'

const STAR_GRADIENT_ID = 'patient-feedback-star-gradient'

type FeedbackStarRatingProps = {
  value: number
  onChange: (rating: number) => void
  ariaLabel: string
}

export function FeedbackStarRating({ value, onChange, ariaLabel }: FeedbackStarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const displayRating = hoverRating || value

  return (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id={STAR_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff59d" />
            <stop offset="55%" stopColor="#ffca28" />
            <stop offset="100%" stopColor="#ff8f00" />
          </linearGradient>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center gap-1.5 sm:gap-2"
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {[1, 2, 3, 4, 5].map((starValue) => {
          const filled = starValue <= displayRating
          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={`${starValue} ${starValue === 1 ? 'estrela' : 'estrelas'}`}
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoverRating(starValue)}
              onMouseLeave={() => setHoverRating(0)}
              onFocus={() => setHoverRating(starValue)}
              onBlur={() => setHoverRating(0)}
              className="rounded-lg p-1.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
            >
              <Star
                className="h-9 w-9 sm:h-10 sm:w-10"
                strokeWidth={1.5}
                stroke={filled ? '#f59e0b' : '#d1d5db'}
                fill={filled ? `url(#${STAR_GRADIENT_ID})` : 'none'}
              />
            </button>
          )
        })}
      </div>
    </>
  )
}
