import { Skeleton } from '../../ui/Skeleton'

export function PrefeituraContratoPageHeaderSkeleton() {
  return (
    <header className="space-y-2" aria-busy="true" aria-label="Carregando gestão de contrato">
      <Skeleton className="h-3 w-36" />
      <Skeleton className="h-8 w-32 sm:w-40" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </header>
  )
}
