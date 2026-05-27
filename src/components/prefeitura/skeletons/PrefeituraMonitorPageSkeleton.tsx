import { Skeleton } from '../../ui/Skeleton'
import {
  BarChartSkeleton,
  DashCardSkeleton,
  TableRowsSkeleton,
} from './prefeituraSkeletonUi'

function MonitorTabsSkeleton() {
  return (
    <div className="flex gap-1 border-b border-gray-100 px-4 pt-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="mb-[-1px] h-8 w-28 rounded-t-lg" />
      ))}
    </div>
  )
}

function MonitorComparisonSkeleton() {
  return (
    <>
      <MonitorTabsSkeleton />
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 px-4 py-3"
          >
            <Skeleton className="h-5 w-6 shrink-0" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-4 w-14" />
          </div>
        ))}
      </div>
      <div className="flex justify-end border-t border-gray-100 px-4 py-2.5">
        <Skeleton className="h-3 w-36" />
      </div>
    </>
  )
}

function MonitorIllustrationSkeleton() {
  return (
    <DashCardSkeleton
      className="h-full"
      titleWidth="w-40"
      subtitleWidth="w-56"
      bodyClassName="flex flex-1 flex-col items-center justify-center gap-4 p-6"
    >
      <Skeleton className="h-36 w-full max-w-[240px] rounded-2xl" />
      <Skeleton className="h-3 w-56" />
      <Skeleton className="h-3 w-44" />
    </DashCardSkeleton>
  )
}

export function PrefeituraMonitorPageSkeleton() {
  return (
    <div className="w-full space-y-4 py-5">
      <header className="shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_400px] xl:items-stretch">
        <DashCardSkeleton
          className="h-full min-h-[280px]"
          titleWidth="w-28"
          subtitleWidth="w-52"
          showAction
          bodyClassName="flex min-h-0 flex-1 flex-col p-0"
        >
          <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-6 w-20 rounded-full" />
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/90">
                  {Array.from({ length: 6 }, (_, index) => (
                    <th key={index} className="px-3 py-2.5">
                      <Skeleton className="mx-auto h-3 w-14" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableRowsSkeleton
                  columns={6}
                  rows={6}
                  columnWidths={[
                    'w-32',
                    'mx-auto w-16',
                    'mx-auto w-16',
                    'mx-auto w-12',
                    'mx-auto w-12',
                    'mx-auto w-20',
                  ]}
                />
              </tbody>
            </table>
          </div>
        </DashCardSkeleton>

        <DashCardSkeleton
          className="h-full min-h-[280px]"
          titleWidth="w-32"
          subtitleWidth="w-56"
          showAction
          bodyClassName="flex min-h-0 flex-1 flex-col p-4"
        >
          <BarChartSkeleton bars={12} className="h-full min-h-[200px]" />
        </DashCardSkeleton>

        <DashCardSkeleton
          className="h-full min-h-[260px]"
          titleWidth="w-40"
          subtitleWidth="w-36"
          bodyClassName="flex min-h-0 flex-1 flex-col p-0"
        >
          <MonitorComparisonSkeleton />
        </DashCardSkeleton>

        <MonitorIllustrationSkeleton />

        <div className="xl:col-span-2">
          <DashCardSkeleton
            titleWidth="w-52"
            subtitleWidth="w-64"
            showAction
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-fixed text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50/90">
                    {Array.from({ length: 8 }, (_, index) => (
                      <th key={index} className="px-4 py-3">
                        <Skeleton className="mx-auto h-3 w-16" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableRowsSkeleton
                    columns={8}
                    rows={5}
                    columnWidths={[
                      'w-28',
                      'mx-auto w-24',
                      'mx-auto w-20',
                      'mx-auto w-10',
                      'mx-auto w-32',
                      'mx-auto w-8',
                      'mx-auto w-14',
                      'mx-auto w-24',
                    ]}
                  />
                </tbody>
              </table>
            </div>
          </DashCardSkeleton>
        </div>
      </section>
    </div>
  )
}
