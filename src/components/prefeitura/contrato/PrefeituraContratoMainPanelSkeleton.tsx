import { Skeleton } from '../../ui/Skeleton'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'
import { BarChartSkeleton, KpiCardsRowSkeleton } from '../skeletons/prefeituraSkeletonUi'

const TABLE_ROW_COUNT = 6

export function PrefeituraContratoMainPanelSkeleton() {
  return (
    <article
      className={[dashboardMainPanelSurfaceClass, 'flex min-h-0 flex-1 flex-col'].join(' ')}
      aria-busy="true"
      aria-label="Carregando histórico mensal do contrato"
    >
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-14 w-full max-w-xs shrink-0 rounded-lg" />
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-3">
        <div className="mb-3 shrink-0 rounded-xl border border-gray-100 bg-slate-50/60 px-2 py-2 sm:px-3">
          <div className="mb-2 flex justify-end">
            <Skeleton className="h-3 w-40" />
          </div>
          <BarChartSkeleton bars={10} className="h-[14.75rem]" />
        </div>

        <KpiCardsRowSkeleton
          count={3}
          className="mb-2 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="shrink-0">
            <div className="flex gap-2 border-b border-gray-200 bg-gray-50/90 px-3 py-2">
              {['w-10', 'w-16', 'w-16', 'w-10', 'w-12', 'w-14', 'w-6'].map((width, index) => (
                <Skeleton key={`header-col-${index}`} className={`h-3 ${width}`} />
              ))}
            </div>
            <ul className="divide-y divide-gray-100">
              {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
                <li key={index} className="flex items-center gap-2 px-3 py-2">
                  <Skeleton className="h-4 w-14 shrink-0" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <div className="mx-auto flex w-16 flex-col items-center gap-1">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-6 w-[5.75rem] rounded-lg" />
                  <Skeleton className="ml-auto h-4 w-4 shrink-0" />
                </li>
              ))}
            </ul>
          </div>
          <div className="min-h-0 flex-1" aria-hidden />
        </div>
      </div>
    </article>
  )
}
