import { Skeleton } from '../../ui/Skeleton'
import {
  DashCardSkeleton,
  HorizontalBarsSkeleton,
  KpiCardsRowSkeleton,
  TableRowsSkeleton,
} from './prefeituraSkeletonUi'

function RedeSidebarSkeleton() {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <Skeleton className="h-5 w-44" />
        <div className="mt-4">
          <HorizontalBarsSkeleton rows={5} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-1 h-3 w-32" />
        <div className="mt-4">
          <HorizontalBarsSkeleton rows={4} />
        </div>
      </section>

      <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-end rounded-2xl border border-dashed border-gray-200 bg-white/80 p-6 xl:min-h-0">
        <Skeleton className="h-40 w-full max-w-[220px] rounded-2xl" />
        <Skeleton className="mt-4 h-3 w-48" />
      </div>
    </aside>
  )
}

function RedeMainPanelSkeleton() {
  return (
    <section className="flex h-full min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <header className="shrink-0 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-64 max-w-full sm:w-72" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <Skeleton className="h-10 min-h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl sm:w-48" />
          <Skeleton className="h-10 w-full rounded-xl sm:w-52" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['w-24', 'w-16', 'w-16', 'w-20', 'w-14', 'w-16', 'w-12'].map((width, index) => (
                <th key={index} className="px-4 py-3.5">
                  <Skeleton className={`mx-auto h-3 ${width}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowsSkeleton
              columns={7}
              rows={5}
              columnWidths={[
                'w-48',
                'mx-auto w-20',
                'mx-auto w-24',
                'mx-auto w-28',
                'mx-auto w-10',
                'mx-auto w-24',
                'mx-auto size-8 rounded-lg',
              ]}
            />
          </tbody>
        </table>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Skeleton className="h-3 w-48" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="size-8 rounded-lg" />
          ))}
        </div>
      </footer>
    </section>
  )
}

export function PrefeituraRedePageSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-slate-50/80 py-5">
      <header className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-11 w-44 rounded-xl" />
        </div>
      </header>

      <div className="mt-4 shrink-0">
        <KpiCardsRowSkeleton count={4} className="gap-3 sm:grid-cols-2 xl:grid-cols-4" />
      </div>

      <section className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[1fr_320px] xl:items-stretch">
        <RedeMainPanelSkeleton />
        <RedeSidebarSkeleton />
      </section>
    </div>
  )
}
