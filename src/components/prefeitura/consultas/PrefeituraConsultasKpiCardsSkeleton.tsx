import { Skeleton } from '../../ui/Skeleton'
import { prefeituraConsultasCardClass } from './prefeituraConsultasCardClass'

const KPI_COUNT = 5

export function PrefeituraConsultasKpiCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      aria-busy="true"
      aria-label="Carregando indicadores de consultas"
    >
      {Array.from({ length: KPI_COUNT }).map((_, index) => (
        <article
          key={index}
          className={['relative overflow-hidden px-4 py-3.5', prefeituraConsultasCardClass].join(
            ' ',
          )}
        >
          <Skeleton className="absolute inset-x-4 top-0 h-0.5 rounded-full" />
          <Skeleton className="mx-auto h-3 w-28" />
          <Skeleton className="mx-auto mt-1 h-7 w-20" />
          <div className="mt-1 flex items-center justify-center gap-1">
            <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-36" />
          </div>
        </article>
      ))}
    </div>
  )
}
