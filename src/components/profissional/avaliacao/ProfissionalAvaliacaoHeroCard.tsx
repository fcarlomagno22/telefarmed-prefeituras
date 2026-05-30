import type { ReactNode } from 'react'
import { AlertTriangle, Star } from 'lucide-react'
import { ProfissionalStarRating } from './ProfissionalStarRating'
import { profissionalAvaliacoesPanelClass } from './profissionalAvaliacoesUi'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function reviewLabel(count: number) {
  return count === 1 ? 'avaliação' : 'avaliações'
}

function criticalLabel(count: number) {
  return count === 1 ? 'crítica' : 'críticas'
}

type ProfissionalAvaliacaoHeroCardProps = {
  averageRating: number
  totalReviews: number
  criticalTotal: number
  fiveStarCount: number
  fourStarCount: number
}

export function ProfissionalAvaliacaoHeroCard({
  averageRating,
  totalReviews,
  criticalTotal,
  fiveStarCount,
  fourStarCount,
}: ProfissionalAvaliacaoHeroCardProps) {
  return (
    <section
      data-tour="avaliacao-hero"
      className={[
        profissionalAvaliacoesPanelClass,
        'relative shrink-0 overflow-hidden p-0',
      ].join(' ')}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-amber-50/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--brand-primary)]/5 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div
            className={[
              'flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl',
              'bg-white shadow-sm ring-1 ring-orange-100/90',
            ].join(' ')}
          >
            <span className="text-3xl font-bold leading-none tabular-nums tracking-tight text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              de 5
            </span>
          </div>

          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
              Sua pontuação
            </p>
            <ProfissionalStarRating rating={averageRating} size="md" className="mt-1.5" />
            <p className="mt-2 text-sm leading-snug text-gray-600">
              <span className="font-semibold text-gray-900">
                {formatNumber(totalReviews)} {reviewLabel(totalReviews)}
              </span>{' '}
              no período
              {criticalTotal > 0 ? (
                <>
                  {' '}
                  ·{' '}
                  <span className="font-semibold text-red-600">
                    {formatNumber(criticalTotal)} {criticalLabel(criticalTotal)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="grid w-full max-w-[15rem] grid-cols-3 gap-2 sm:w-[15rem] sm:shrink-0">
          <HeroStatCell
            label="5 estrelas"
            value={fiveStarCount}
            starsFilled={5}
            tone="gold"
          />
          <HeroStatCell
            label="4 estrelas"
            value={fourStarCount}
            starsFilled={4}
            tone="gold"
          />
          <HeroStatCell
            label="Críticas"
            value={criticalTotal}
            tone="critical"
            icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
          />
        </div>
      </div>
    </section>
  )
}

function HeroStatCell({
  label,
  value,
  starsFilled,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: number
  starsFilled?: number
  tone?: 'gold' | 'critical' | 'neutral'
  icon?: ReactNode
}) {
  const toneStyles = {
    gold: {
      value: 'text-amber-900',
      ring: 'ring-amber-100/80',
      bg: 'bg-amber-50/40 hover:bg-amber-50/70',
    },
    critical: {
      value: 'text-red-800',
      ring: 'ring-red-100/80',
      bg: 'bg-red-50/50 hover:bg-red-50/80',
    },
    neutral: {
      value: 'text-gray-900',
      ring: 'ring-gray-100',
      bg: 'bg-white/50 hover:bg-white/80',
    },
  }[tone]

  return (
    <div
      className={[
        'flex aspect-square w-full min-w-0 flex-col items-center justify-between rounded-xl p-2.5 text-center shadow-sm transition',
        toneStyles.bg,
        toneStyles.ring,
        'ring-1',
      ].join(' ')}
    >
      <div className="flex h-5 shrink-0 items-center justify-center">
        {icon ??
          (starsFilled !== undefined ? (
            <span className="flex gap-px" aria-hidden>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={[
                    'h-2.5 w-2.5',
                    index < starsFilled
                      ? 'fill-amber-400 text-amber-500'
                      : 'fill-gray-100 text-gray-200',
                  ].join(' ')}
                />
              ))}
            </span>
          ) : null)}
      </div>
      <span
        className={['text-2xl font-bold leading-none tabular-nums', toneStyles.value].join(' ')}
      >
        {formatNumber(value)}
      </span>
      <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-gray-500">
        {label}
      </span>
    </div>
  )
}
