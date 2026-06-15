import { Skeleton } from '../../../ui/Skeleton'
import { HorizontalBarsSkeleton, KpiCardsRowSkeleton } from '../../../prefeitura/skeletons/prefeituraSkeletonUi'

export function AdminPosConsultaKpiSectionSkeleton() {
  return (
    <section className="min-w-0 xl:col-span-12">
      <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
        <div className="space-y-5 p-4 sm:p-5">
          <KpiCardsRowSkeleton
            count={4}
            className="grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            variant="centered"
          />
          <div className="rounded-xl border border-gray-100 bg-slate-50/60 p-4 sm:p-5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
            <div className="mt-5 grid gap-6 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
              <Skeleton className="mx-auto size-[8.5rem] rounded-full sm:mx-0" />
              <HorizontalBarsSkeleton rows={3} />
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-slate-50/60 p-4 sm:p-5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-4 w-56 max-w-full" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
