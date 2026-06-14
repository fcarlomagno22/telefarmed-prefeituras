import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../../layout/dashboardPageLayout'
import {
  DashCardSkeleton,
  HorizontalBarsSkeleton,
  KpiCardsRowSkeleton,
  TableRowsSkeleton,
} from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../../../ui/Skeleton'

function MonitorTableSkeleton({
  columns,
  rows = 6,
  className = 'h-[25.5rem]',
}: {
  columns: number
  rows?: number
  className?: string
}) {
  return (
    <DashCardSkeleton
      className={className}
      titleWidth="w-56"
      subtitleWidth="w-44"
      showAction
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
    >
      <div className="min-h-0 flex-1 overflow-hidden px-3 py-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-3 py-2">
                  <Skeleton className={`mx-auto h-3 ${index === 0 ? 'w-20' : 'w-12'}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowsSkeleton columns={columns} rows={rows} />
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
        <Skeleton className="h-3 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      </div>
    </DashCardSkeleton>
  )
}

export function AdminMonitorMainPanelSkeleton() {
  return (
    <div className={dashboardPageScrollAreaClass} aria-busy="true" aria-label="Carregando monitor operacional">
      <div className={[dashboardPageScrollPaddingClass, 'w-full space-y-4 pt-5 sm:pt-6'].join(' ')}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </header>

        <KpiCardsRowSkeleton count={6} layout="grid-1x6" variant="centered" />

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,1fr)]">
          <div className="grid gap-4">
            <MonitorTableSkeleton columns={11} rows={7} className="h-[25.5rem]" />
            <MonitorTableSkeleton columns={7} rows={4} className="h-[16.5rem]" />
          </div>

          <div className="grid gap-4">
            <DashCardSkeleton
              className="h-[15rem]"
              titleWidth="w-36"
              subtitleWidth="w-52"
              showAction
              bodyClassName="flex min-h-0 flex-1 flex-col gap-3 p-4"
            >
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 rounded-lg" />
                ))}
              </div>
              <div className="grid flex-1 grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="rounded-xl" />
                ))}
              </div>
            </DashCardSkeleton>

            <DashCardSkeleton
              className="h-[11rem]"
              titleWidth="w-40"
              subtitleWidth="w-32"
              bodyClassName="p-0"
            >
              <div className="px-3 py-2">
                <table className="w-full">
                  <tbody>
                    <TableRowsSkeleton columns={4} rows={4} />
                  </tbody>
                </table>
              </div>
            </DashCardSkeleton>

            <DashCardSkeleton
              className="h-[10.5rem]"
              titleWidth="w-44"
              subtitleWidth="w-40"
              bodyClassName="grid grid-cols-7 gap-1 p-3"
            >
              {Array.from({ length: 21 }).map((_, index) => (
                <Skeleton key={index} className="h-8 rounded-md" />
              ))}
            </DashCardSkeleton>

            <DashCardSkeleton
              className="h-[8rem]"
              titleWidth="w-36"
              subtitleWidth="w-40"
              bodyClassName="grid grid-cols-2 gap-2 p-3"
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="rounded-xl" />
              ))}
            </DashCardSkeleton>

            <DashCardSkeleton className="min-h-[7rem]" titleWidth="w-28" subtitleWidth="w-36">
              <HorizontalBarsSkeleton rows={3} />
            </DashCardSkeleton>
          </div>
        </section>
      </div>
    </div>
  )
}
