import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../../layout/dashboardPageLayout'
import { KpiCardsRowSkeleton, TableRowsSkeleton } from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../../../ui/Skeleton'

const cardSurfaceClass = [
  'rounded-2xl border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

const financeiroMainCardHeightClass = 'h-[calc(100dvh-20.5rem)] min-h-[34rem]'

function FinanceiroTabsSkeleton() {
  const tabWidths = ['w-24', 'w-16', 'w-14', 'w-16']
  return (
    <nav
      aria-hidden
      className="flex shrink-0 gap-0 border-b border-gray-200 bg-white px-4 sm:px-5"
    >
      {tabWidths.map((width, index) => (
        <div key={index} className="relative shrink-0 px-4 py-3 sm:px-5">
          <Skeleton className={`h-4 ${width}`} />
          {index === 0 ? (
            <span
              className="pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 sm:inset-x-4"
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </nav>
  )
}

export function AdminFinanceiroMainPanelSkeleton() {
  return (
    <div className={dashboardPageScrollAreaClass} aria-busy="true" aria-label="Carregando financeiro">
      <div className={[dashboardPageScrollPaddingClass, 'mt-4 space-y-4 pb-5'].join(' ')}>
        <KpiCardsRowSkeleton
          count={4}
          className="gap-3 sm:grid-cols-2 xl:grid-cols-4"
        />

        <section
          className={[cardSurfaceClass, financeiroMainCardHeightClass, 'flex min-h-0 flex-col overflow-hidden'].join(' ')}
        >
          <FinanceiroTabsSkeleton />

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-72 max-w-full" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
              <Skeleton className="h-8 w-52 rounded-lg" />
            </div>

            <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center">
              <Skeleton className="h-10 w-full flex-1 rounded-xl" />
              <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-3">
                <Skeleton className="h-10 w-full rounded-xl sm:w-44" />
                <Skeleton className="h-10 w-full rounded-xl sm:w-40" />
                <Skeleton className="h-10 w-full rounded-xl sm:w-36" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden px-2 py-2">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <th key={index} className="px-4 py-3">
                        <Skeleton className={`mx-auto h-3 ${index === 0 ? 'w-28' : 'w-16'}`} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableRowsSkeleton
                    columns={7}
                    rows={10}
                    columnWidths={['w-44', 'w-24', 'w-20', 'w-16', 'w-20', 'w-24', 'w-16']}
                  />
                </tbody>
              </table>
            </div>

            <footer className="flex shrink-0 items-center justify-between border-t border-gray-200 px-4 py-3">
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="size-8 rounded-lg" />
                ))}
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  )
}
