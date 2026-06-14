import { Skeleton } from '../../../ui/Skeleton'

export function AdminNotificacoesPageHeaderSkeleton() {
  return (
    <header className="shrink-0" aria-hidden>
      <Skeleton className="h-3 w-[11.5rem]" />
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-7 w-44 max-w-full sm:h-8 sm:w-52" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-[88%] max-w-xl" />
        </div>
      </div>
    </header>
  )
}

export function AdminNotificacoesChannelStatCardSkeleton({ dualBadge = false }: { dualBadge?: boolean }) {
  return (
    <li className="rounded-xl border border-gray-100 bg-slate-50/80 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        {dualBadge ? (
          <span className="flex gap-1">
            <Skeleton className="h-5 w-[4.5rem] rounded-md" />
            <Skeleton className="h-5 w-[3.5rem] rounded-md" />
          </span>
        ) : (
          <Skeleton className="h-5 w-[5rem] rounded-md" />
        )}
      </div>
      <Skeleton className="mt-2 h-8 w-10" />
    </li>
  )
}
