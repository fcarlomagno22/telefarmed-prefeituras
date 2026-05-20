import { Star } from 'lucide-react'
import { useState } from 'react'

export type ConsultationFeedback = {
  rating: number
  comment: string
}

const STAR_GRADIENT_ID = 'rating-star-gradient'

type ConsultationFeedbackPanelProps = {
  onSubmit: (feedback: ConsultationFeedback) => void
  onSkip: () => void
}

export function ConsultationFeedbackPanel({
  onSubmit,
  onSkip,
}: ConsultationFeedbackPanelProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')

  const displayRating = hoverRating || rating

  function handleSubmit() {
    if (rating < 1) return
    onSubmit({ rating, comment: comment.trim() })
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center text-center">
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <linearGradient id={STAR_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff59d" />
            <stop offset="55%" stopColor="#ffca28" />
            <stop offset="100%" stopColor="#ff8f00" />
          </linearGradient>
        </defs>
      </svg>

      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Como foi o atendimento?</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
        Avalie com estrelas e, se quiser, deixe um comentário sobre o atendimento ou o
        profissional.
      </p>

      <div
        className="mt-8 flex items-center justify-center gap-1.5 sm:gap-2"
        role="radiogroup"
        aria-label="Nota do atendimento"
      >
        {[1, 2, 3, 4, 5].map((value) => {
          const filled = value <= displayRating
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoverRating(value)}
              onMouseLeave={() => setHoverRating(0)}
              onFocus={() => setHoverRating(value)}
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

      <label className="mt-8 w-full text-left">
        <span className="mb-2 block text-sm font-medium text-gray-700">
          Comentário <span className="font-normal text-gray-400">(opcional)</span>
        </span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Conte como foi o atendimento ou o profissional..."
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
        />
      </label>

      <button
        type="button"
        disabled={rating < 1}
        onClick={handleSubmit}
        className="btn-brand-gradient mt-8 w-full rounded-xl px-8 py-3.5 text-sm font-semibold"
      >
        Enviar avaliação
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-sm font-medium text-gray-500 underline-offset-2 transition hover:text-gray-700 hover:underline"
      >
        Pular avaliação
      </button>
    </div>
  )
}
