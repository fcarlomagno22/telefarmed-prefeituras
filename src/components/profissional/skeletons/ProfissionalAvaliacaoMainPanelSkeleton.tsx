import { Skeleton } from '../../ui/Skeleton'
import { profissionalAvaliacoesPanelClass } from '../avaliacao/profissionalAvaliacoesUi'

const REVIEW_CARD_COUNT = 4

function ReviewCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="p-4 sm:p-5">
        <div className="flex gap-3.5 sm:gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-3.5 w-3.5 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="mt-4 h-16 w-full rounded-xl" />
      </div>
    </li>
  )
}

function HeroCardSkeleton() {
  return (
    <section className={[profissionalAvaliacoesPanelClass, 'relative shrink-0 overflow-hidden p-5'].join(' ')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Skeleton className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-4 rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-4 w-48 max-w-full" />
          </div>
        </div>
        <div className="grid w-full max-w-[15rem] grid-cols-3 gap-2 sm:w-[15rem] sm:shrink-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProfissionalAvaliacaoMainPanelSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4" aria-busy="true" aria-label="Carregando avaliações">
      <HeroCardSkeleton />

      <section className={[profissionalAvaliacoesPanelClass, 'flex min-h-0 flex-1 flex-col'].join(' ')}>
        <div className="shrink-0 px-4 pt-3 sm:px-5 sm:pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="inline-flex w-full max-w-sm gap-1 rounded-xl bg-gray-100/90 p-1">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-lg sm:max-w-xs" />
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-4 overflow-hidden px-4 py-4 sm:px-5">
          {Array.from({ length: REVIEW_CARD_COUNT }).map((_, index) => (
            <ReviewCardSkeleton key={index} />
          ))}
        </ul>
      </section>
    </div>
  )
}
