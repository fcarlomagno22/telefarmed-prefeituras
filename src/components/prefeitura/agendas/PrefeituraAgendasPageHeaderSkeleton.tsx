import { Skeleton } from '../../ui/Skeleton'

export function PrefeituraAgendasPageHeaderSkeleton() {
  return (
    <header aria-busy="true" aria-label="Carregando agendas">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mt-1 h-8 w-28 sm:w-36" />
      <Skeleton className="mt-1 h-4 w-full max-w-md" />
    </header>
  )
}
