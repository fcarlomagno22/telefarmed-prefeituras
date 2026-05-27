import { Skeleton } from '../ui/Skeleton'

const TABLE_ROW_COUNT = 8

export function ConsultasMainPanelSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
      aria-busy="true"
      aria-label="Carregando consultas"
    >
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] sm:px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-xl" />
          ))}
        </div>
        <div className="mt-5 flex justify-between gap-3 border-t border-gray-200 pt-5">
          <Skeleton className="h-10 w-36 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-5 w-44" />
          </div>
          <Skeleton className="h-9 w-48 rounded-xl" />
        </div>
        <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-3 sm:px-6">
          <Skeleton className="h-3 w-48 max-w-[60%]" />
          <Skeleton className="ml-auto h-4 w-20" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden px-5 py-3 sm:px-6">
          <div className="mb-3 flex gap-2 border-b border-gray-200 pb-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-3 flex-1" />
            ))}
          </div>
          <ul className="divide-y divide-gray-100">
            {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
              <li key={index} className="flex items-center gap-3 py-4">
                <Skeleton className="h-8 w-16 shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="hidden h-4 w-24 md:block" />
                <Skeleton className="hidden h-4 w-28 lg:block" />
                <Skeleton className="hidden h-6 w-20 xl:block" />
                <Skeleton className="size-8 shrink-0 rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
        <footer className="flex shrink-0 justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
          <Skeleton className="h-3 w-52" />
          <div className="flex gap-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="size-8 rounded-lg" />
            ))}
          </div>
        </footer>
      </section>
    </div>
  )
}
