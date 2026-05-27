import { Skeleton } from '../../ui/Skeleton'
import { prefeituraAgendasBottomCardHeightClass } from './prefeituraAgendasUi'

type PrefeituraAgendasBottomCardSkeletonProps = {
  titleWidth?: string
  rowCount?: number
}

export function PrefeituraAgendasBottomCardSkeleton({
  titleWidth = 'w-40',
  rowCount = 4,
}: PrefeituraAgendasBottomCardSkeletonProps) {
  return (
    <article
      className={[
        'flex shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]',
        prefeituraAgendasBottomCardHeightClass,
      ].join(' ')}
      aria-hidden
    >
      <header className="shrink-0 border-b border-gray-100 px-4 py-3">
        <Skeleton className={`h-4 ${titleWidth}`} />
        <Skeleton className="mt-1 h-3 w-28" />
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-4 py-3">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </article>
  )
}
