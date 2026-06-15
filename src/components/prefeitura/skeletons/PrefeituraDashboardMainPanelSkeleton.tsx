import { Skeleton } from '../../ui/Skeleton'
import {
  BarChartSkeleton,
  DashCardSkeleton,
  DonutLegendSkeleton,
  HorizontalBarsSkeleton,
  KpiCardsRowSkeleton,
  TableRowsSkeleton,
} from './prefeituraSkeletonUi'

function AlertListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: 3 }, (_, index) => (
        <li key={index} className="flex gap-3 px-4 py-3.5">
          <Skeleton className="mt-0.5 size-8 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function PackageUsageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 px-2 py-2">
      <Skeleton className="size-28 rounded-full" />
      <div className="w-full space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-2.5 w-full rounded-full" />
        <Skeleton className="mx-auto h-3 w-32" />
      </div>
    </div>
  )
}

function SlaListSkeleton() {
  return (
    <ul className="divide-y divide-gray-100">
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className="flex items-center justify-between gap-3 px-4 py-3">
          <Skeleton className="h-3.5 w-36" />
          <Skeleton className="h-6 w-[5.5rem] rounded-lg" />
        </li>
      ))}
    </ul>
  )
}

export function PrefeituraDashboardMainPanelSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-slate-50/80">
      <div className="w-full space-y-4 py-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-72 max-w-full sm:w-80" />
          </div>
          <Skeleton className="h-8 w-36 rounded-full" />
        </header>

        <section className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index}>
                <Skeleton className="mb-1.5 h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </section>

        <KpiCardsRowSkeleton count={6} />

        <div className="grid gap-4 xl:grid-cols-12">
          <section className="grid grid-cols-1 items-stretch gap-4 lg:col-span-12 lg:grid-cols-12">
            <DashCardSkeleton
              className="h-full lg:col-span-5"
              titleWidth="w-36"
              subtitleWidth="w-52"
              bodyClassName="px-2 pb-3 pt-1"
            >
              <BarChartSkeleton bars={10} className="h-52" />
            </DashCardSkeleton>

            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:col-span-7">
              <DashCardSkeleton
                className="h-full"
                titleWidth="w-32"
                subtitleWidth="w-44"
                showAction
                bodyClassName="p-0"
              >
                <AlertListSkeleton />
              </DashCardSkeleton>

              <DashCardSkeleton
                className="h-full"
                titleWidth="w-40"
                subtitleWidth="w-36"
                bodyClassName="p-3"
              >
                <PackageUsageSkeleton />
              </DashCardSkeleton>
            </div>
          </section>

          <section className="grid grid-cols-1 items-stretch gap-4 lg:col-span-12 lg:grid-cols-12">
            <DashCardSkeleton
              className="h-full lg:col-span-5"
              titleWidth="w-44"
              subtitleWidth="w-32"
              showAction
              bodyClassName="p-4"
            >
              <DonutLegendSkeleton rows={5} />
            </DashCardSkeleton>

            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:col-span-7">
              <DashCardSkeleton
                className="h-full"
                titleWidth="w-36"
                subtitleWidth="w-40"
                showAction
                bodyClassName="p-4"
              >
                <HorizontalBarsSkeleton rows={5} />
              </DashCardSkeleton>

              <DashCardSkeleton
                className="h-full"
                titleWidth="w-44"
                subtitleWidth="w-28"
                showAction
                bodyClassName="p-0"
              >
                <SlaListSkeleton />
              </DashCardSkeleton>
            </div>
          </section>

          <section className="min-w-0 space-y-3 xl:col-span-12">
            <div className="px-0.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-6 w-64" />
              <Skeleton className="mt-1 h-3 w-80" />
            </div>
            <div className="grid gap-4 xl:grid-cols-12">
              <Skeleton className="min-h-[18rem] rounded-2xl xl:col-span-4" />
              <Skeleton className="min-h-[18rem] rounded-2xl xl:col-span-8" />
              <Skeleton className="min-h-[16rem] rounded-2xl xl:col-span-4" />
              <Skeleton className="min-h-[16rem] rounded-2xl xl:col-span-4" />
              <Skeleton className="min-h-[16rem] rounded-2xl xl:col-span-4" />
            </div>
          </section>

          <DashCardSkeleton
            className="w-full xl:col-span-12"
            titleWidth="w-56"
            subtitleWidth="w-40"
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-slate-50/90">
                    {['w-36', 'w-20', 'w-16', 'w-14', 'w-12', 'w-14', 'w-12', 'w-16', 'w-10'].map(
                      (width, index) => (
                        <th key={index} className="px-4 py-3">
                          <Skeleton className={`mx-auto h-3 ${width}`} />
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <TableRowsSkeleton
                    columns={9}
                    rows={6}
                    columnWidths={[
                      'w-44',
                      'w-24',
                      'w-20',
                      'mx-auto w-10',
                      'mx-auto w-8',
                      'mx-auto w-12',
                      'mx-auto w-8',
                      'mx-auto w-16',
                      'mx-auto size-8 rounded-lg',
                    ]}
                  />
                </tbody>
              </table>
            </div>
          </DashCardSkeleton>
        </div>
      </div>
    </div>
  )
}
