import { Skeleton } from '../ui/Skeleton'

export function ProfissionalPageHeaderSkeleton() {
  return (
    <header className="shrink-0" aria-busy="true" aria-label="Carregando página">
      <Skeleton className="h-3 w-40" />
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-12 w-[12.5rem] rounded-2xl" />
        </div>
      </div>
    </header>
  )
}
