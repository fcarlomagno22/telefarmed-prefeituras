import { Skeleton } from '../ui/Skeleton'

const TABLE_ROW_COUNT = 6

export function AuditLogsMainPanelSkeleton() {
  return (
    <section
      className="relative flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando logs de auditoria"
    >
      <header className="shrink-0 border-b border-gray-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-40 sm:h-7 sm:w-48" />
            <Skeleton className="h-4 w-64 max-w-full sm:w-80" />
          </div>
          <Skeleton className="h-10 w-28 shrink-0 rounded-xl" />
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center">
          <Skeleton className="h-10 w-full flex-1 rounded-xl" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:shrink-0 xl:gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl xl:w-[8.5rem]" />
            ))}
          </div>
          <Skeleton className="h-10 w-full shrink-0 rounded-xl xl:w-40" />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto px-3 py-3 sm:px-4">
        <div className="mb-3 flex gap-2 border-b border-gray-100 pb-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={index}
              className={[
                'h-3 shrink-0',
                index === 0 ? 'w-6' : 'flex-1',
              ].join(' ')}
            />
          ))}
        </div>
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 py-3.5">
              <Skeleton className="size-5 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <div className="flex min-w-[5rem] flex-1 flex-col items-center gap-1.5">
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2.5 w-16" />
              </div>
              <Skeleton className="hidden h-4 w-20 sm:block" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="hidden h-4 w-28 lg:block" />
              <Skeleton className="hidden h-3 w-16 xl:block" />
              <Skeleton className="hidden h-4 w-24 xl:block" />
            </li>
          ))}
        </ul>
      </div>

      <footer className="shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-3 w-52" />
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton key={index} className="size-8 rounded-lg" />
            ))}
          </div>
        </div>
      </footer>
    </section>
  )
}
