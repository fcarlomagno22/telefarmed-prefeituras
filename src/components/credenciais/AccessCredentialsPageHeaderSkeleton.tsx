import { Skeleton } from '../ui/Skeleton'

export function AccessCredentialsPageHeaderSkeleton() {
  return (
    <header className="shrink-0" aria-busy="true" aria-label="Carregando credenciais de acesso">
      <Skeleton className="h-3 w-44" />
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-56 sm:h-8 sm:w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-xl" />
      </div>
    </header>
  )
}
