import { Skeleton } from '../../ui/Skeleton'

export function PrefeituraContratoExpiryBannerSkeleton() {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 p-5 sm:p-6"
      aria-hidden
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-56 max-w-full sm:w-72" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-full max-w-xl" />
          </div>
        </div>
        <div className="shrink-0 rounded-xl border border-white/70 bg-white/50 px-4 py-3">
          <Skeleton className="mx-auto h-3 w-28" />
          <div className="mt-2 flex justify-center gap-1">
            <Skeleton className="h-11 w-9 rounded-lg" />
            <Skeleton className="h-11 w-9 rounded-lg" />
            <Skeleton className="h-11 w-9 rounded-lg" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
    </section>
  )
}
