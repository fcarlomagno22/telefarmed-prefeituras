import { useId } from 'react'
import { Star } from 'lucide-react'
import {
  getProfissionalStarColors,
  resolveProfissionalStarLevel,
} from '../../../utils/profissional/profissionalStarRatingColors'

type ProfissionalStarRatingProps = {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
  /** `level` colore pela nota; `yellowGradient` usa degradê dourado (ex.: sua pontuação). */
  variant?: 'level' | 'yellowGradient'
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const

const YELLOW_GRADIENT_STOPS = [
  { offset: '0%', color: '#fffbeb' },
  { offset: '28%', color: '#fef08a' },
  { offset: '58%', color: '#fde047' },
  { offset: '82%', color: '#facc15' },
  { offset: '100%', color: '#eab308' },
] as const

export function ProfissionalStarRating({
  rating,
  max = 5,
  size = 'md',
  showValue = false,
  className = '',
  variant = 'level',
}: ProfissionalStarRatingProps) {
  const rawGradientId = useId()
  const gradientId = `prof-star-yellow-${rawGradientId.replace(/:/g, '')}`
  const shadowId = `${gradientId}-shadow`

  const roundedDisplay = Math.round(rating * 10) / 10
  const filledThrough = Math.round(rating)
  const useYellowGradient = variant === 'yellowGradient'

  const levelColors = !useYellowGradient ? getProfissionalStarColors(rating) : null
  const filledStarClass =
    levelColors?.starClass ??
    'fill-orange-500 text-orange-500 drop-shadow-[0_1px_2px_rgba(255,107,0,0.4)]'

  return (
    <div className={['flex flex-wrap items-center gap-2', className].join(' ')}>
      {useYellowGradient ? (
        <svg aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              {YELLOW_GRADIENT_STOPS.map((stop) => (
                <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
            <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.75" floodColor="#f59e0b" floodOpacity="0.4" />
            </filter>
          </defs>
        </svg>
      ) : null}

      <div className="flex items-center gap-0.5" aria-label={`${roundedDisplay} de ${max} estrelas`}>
        {Array.from({ length: max }).map((_, index) => {
          const filled = index < filledThrough

          if (useYellowGradient) {
            return (
              <Star
                key={index}
                className={[
                  sizeClasses[size],
                  filled ? '' : 'fill-gray-100 text-gray-300',
                ].join(' ')}
                fill={filled ? `url(#${gradientId})` : undefined}
                stroke={filled ? `url(#${gradientId})` : undefined}
                style={filled ? { filter: `url(#${shadowId})` } : undefined}
                aria-hidden
              />
            )
          }

          return (
            <Star
              key={index}
              className={[
                sizeClasses[size],
                filled ? filledStarClass : 'fill-gray-100 text-gray-300',
              ].join(' ')}
              aria-hidden
            />
          )
        })}
      </div>

      {showValue ? (
        <span className="text-sm font-bold tabular-nums text-gray-900">
          {roundedDisplay.toFixed(1)} / {max}
          {variant === 'level' ? (
            <span className="sr-only"> ({resolveProfissionalStarLevel(rating)} estrelas)</span>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}
