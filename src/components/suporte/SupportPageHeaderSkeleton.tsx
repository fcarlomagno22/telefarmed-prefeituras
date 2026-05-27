import { Skeleton } from '../ui/Skeleton'

type SupportPageHeaderSkeletonProps = {
  variant?: 'ubt' | 'prefeitura'
}

export function SupportPageHeaderSkeleton({
  variant = 'ubt',
}: SupportPageHeaderSkeletonProps) {
  const isPrefeitura = variant === 'prefeitura'

  return (
    <header className="shrink-0" aria-busy="true" aria-label="Carregando suporte">
      <Skeleton className="h-3 w-48" />
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-48 sm:h-8 sm:w-56" />
          <Skeleton className="h-4 w-full max-w-xl" />
          {isPrefeitura ? (
            <>
              <Skeleton className="h-4 w-full max-w-lg" />
              <Skeleton className="h-3 w-64" />
            </>
          ) : null}
        </div>
        <Skeleton className="h-11 w-44 shrink-0 rounded-xl" />
      </div>
    </header>
  )
}
