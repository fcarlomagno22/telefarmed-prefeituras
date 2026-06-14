import { Skeleton } from '../../ui/Skeleton'
import { KpiCardsRowSkeleton } from './prefeituraSkeletonUi'

export function PrefeituraRelatoriosPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col" aria-busy="true" aria-label="Relatórios">
      <div className="flex flex-1 flex-col bg-slate-50/80 py-5">
        <header className="shrink-0">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="mt-2 h-8 w-32 max-w-full sm:w-40" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </header>

        <div className="mt-4 space-y-4">
          <KpiCardsRowSkeleton count={4} />

          <Skeleton className="h-28 w-full rounded-2xl" />

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-3 w-72 max-w-full" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-10 w-40 shrink-0 rounded-xl" />
                <Skeleton className="h-10 flex-1 rounded-xl" />
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
              </div>
            </div>
            <div className="space-y-0">
              <Skeleton className="h-10 w-full rounded-none" />
              <Skeleton className="h-16 w-full rounded-none" />
              <Skeleton className="h-14 w-full rounded-none" />
              <Skeleton className="h-14 w-full rounded-none" />
              <Skeleton className="h-16 w-full rounded-none" />
              <Skeleton className="h-14 w-full rounded-none" />
            </div>
            <div className="border-t border-gray-200 px-5 py-2">
              <Skeleton className="h-3 w-36" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
