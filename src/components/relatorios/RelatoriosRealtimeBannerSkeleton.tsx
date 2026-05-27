import { Skeleton } from '../ui/Skeleton'

export function RelatoriosRealtimeBannerSkeleton() {
  return (
    <section
      className="relative shrink-0 overflow-hidden rounded-2xl border border-orange-100/80 bg-gradient-to-r from-orange-50/90 via-amber-50/60 to-orange-50/40 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-hidden
    >
      <div className="flex min-h-[7.5rem] flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 xl:min-h-[8.5rem]">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-52 sm:h-5" />
            <Skeleton className="h-3 w-full max-w-xl" />
            <Skeleton className="h-3 w-4/5 max-w-md" />
          </div>
        </div>
        <Skeleton className="hidden h-28 w-[200px] shrink-0 rounded-xl sm:block" />
      </div>
    </section>
  )
}
