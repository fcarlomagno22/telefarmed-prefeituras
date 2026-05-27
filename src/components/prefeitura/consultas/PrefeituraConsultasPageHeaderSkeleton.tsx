import { Skeleton } from '../../ui/Skeleton'

export function PrefeituraConsultasPageHeaderSkeleton() {
  return (
    <header aria-busy="true" aria-label="Carregando consultas">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="mt-1 h-8 w-32 sm:w-40" />
      <Skeleton className="mt-1 h-4 w-full max-w-lg" />
    </header>
  )
}
