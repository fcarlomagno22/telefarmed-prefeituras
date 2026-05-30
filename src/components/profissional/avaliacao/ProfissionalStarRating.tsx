import { Star } from 'lucide-react'

type ProfissionalStarRatingProps = {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

export function ProfissionalStarRating({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  className = '',
}: ProfissionalStarRatingProps) {
  const roundedDisplay = Math.round(rating * 10) / 10
  const filledThrough = Math.round(rating)

  return (
    <div className={['flex flex-wrap items-center gap-2', className].join(' ')}>
      <div className="flex items-center gap-0.5" aria-label={`${roundedDisplay} de ${max} estrelas`}>
        {Array.from({ length: max }).map((_, index) => {
          const filled = index < filledThrough
          return (
            <Star
              key={index}
              className={[
                sizeClasses[size],
                filled
                  ? 'fill-amber-400 text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.45)]'
                  : 'fill-gray-100 text-gray-300',
              ].join(' ')}
              aria-hidden
            />
          )
        })}
      </div>
      {showValue ? (
        <span className="text-sm font-bold tabular-nums text-gray-900">
          {roundedDisplay.toFixed(1)} / {max}
        </span>
      ) : null}
    </div>
  )
}
