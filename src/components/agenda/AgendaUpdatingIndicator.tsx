type SequentialDotsProps = {
  layout?: 'horizontal' | 'vertical'
  dotClassName?: string
  className?: string
}

export function SequentialDots({
  layout = 'horizontal',
  dotClassName = 'h-1 w-1 rounded-full bg-current',
  className = '',
}: SequentialDotsProps) {
  const containerClass =
    layout === 'vertical'
      ? 'inline-flex flex-col items-center justify-center gap-[3px]'
      : 'inline-flex items-center gap-[2px]'

  return (
    <span className={[containerClass, className].filter(Boolean).join(' ')} aria-hidden>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`${dotClassName} animate-pulse`}
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </span>
  )
}

const STATUS_BADGE_WIDTH = 'w-[9rem]'

export function AgendaUpdatingStatusBadge() {
  return (
    <span
      className={[
        'relative inline-flex h-8 items-center justify-center overflow-hidden rounded-lg bg-transparent px-2 pb-2 text-xs font-semibold text-gray-500',
        STATUS_BADGE_WIDTH,
      ].join(' ')}
      aria-live="polite"
      aria-label="Atualizando situação"
    >
      <span className="inline-flex items-baseline">
        Atualizando
        <span className="inline-flex w-[1.125rem] justify-start" aria-hidden>
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="animate-pulse"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              .
            </span>
          ))}
        </span>
      </span>
      <span
        className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-gray-200 via-gray-400 to-gray-200 opacity-80"
        aria-hidden
      />
    </span>
  )
}
