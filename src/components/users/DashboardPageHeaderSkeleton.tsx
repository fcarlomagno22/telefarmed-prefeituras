import { Skeleton } from '../ui/Skeleton'

export function DashboardPageHeaderSkeleton() {
  return (
    <header
      className="flex flex-wrap items-start justify-between gap-4"
      aria-busy="true"
      aria-label="Carregando cabeçalho"
    >
      <div>
        <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
        <Skeleton className="mt-2 h-4 w-64 max-w-full sm:w-80" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 w-36 rounded-full" />
        <Skeleton className="h-9 w-16 rounded-full" />
      </div>
    </header>
  )
}
