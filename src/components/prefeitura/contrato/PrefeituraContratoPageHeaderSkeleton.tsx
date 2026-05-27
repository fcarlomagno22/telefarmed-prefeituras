import { Skeleton } from '../../ui/Skeleton'

export function PrefeituraContratoPageHeaderSkeleton() {
  return (
    <header
      className="flex flex-wrap items-start justify-between gap-4"
      aria-busy="true"
      aria-label="Carregando gestão de contrato"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-8 w-32 sm:w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Skeleton className="h-[4.25rem] w-full max-w-[20rem] shrink-0 rounded-xl sm:w-72" />
    </header>
  )
}
