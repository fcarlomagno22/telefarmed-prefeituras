import { Skeleton } from '../ui/Skeleton'

const TABLE_ROW_COUNT = 8
const HISTORY_ROW_COUNT = 3

export function AgendaMainPanelSkeleton() {
  return (
    <section
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      aria-busy="true"
      aria-label="Carregando agenda"
    >
      <div className="flex min-h-0 flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="mt-2 h-4 w-52 max-w-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-9 w-14 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="size-9 rounded-lg" />
          </div>
        </div>

        <Skeleton className="mt-5 h-11 w-full rounded-xl" />

        <div className="mt-3 flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-gray-100">
          <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 sm:px-5">
            <Skeleton className="mr-auto h-3 w-48 max-w-[55%]" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="min-h-0 flex-1 px-4 py-3 sm:px-5">
            <div className="mb-3 flex gap-3 border-b border-gray-100 pb-3">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-[28%]" />
              <Skeleton className="h-3 w-[14%]" />
              <Skeleton className="hidden h-3 w-[18%] sm:block" />
              <Skeleton className="h-3 w-[14%]" />
              <Skeleton className="ml-auto hidden h-3 w-16 sm:block" />
            </div>

            <ul className="divide-y divide-gray-100">
              {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
                <li key={index} className="flex items-center gap-3 py-3.5">
                  <Skeleton className="h-4 w-11 shrink-0" />
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 max-w-[75%]" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="hidden h-4 w-24 sm:block" />
                  <Skeleton className="hidden h-4 w-28 md:block" />
                  <Skeleton className="h-7 w-24 shrink-0 rounded-lg" />
                  <Skeleton className="hidden h-8 w-[9rem] shrink-0 rounded-lg sm:block" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 px-5 pt-5 sm:px-6 sm:pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="mt-2 h-4 w-64 max-w-full" />
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 pb-2 xl:grid-cols-[minmax(0,1fr)_minmax(180px,280px)] xl:items-end xl:gap-6">
          <ul className="min-w-0 space-y-2">
            {Array.from({ length: HISTORY_ROW_COUNT }).map((_, index) => (
              <li
                key={index}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
              >
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full max-w-xs" />
                </div>
                <Skeleton className="h-4 w-24 shrink-0" />
              </li>
            ))}
          </ul>

          <Skeleton className="mx-auto h-36 w-full max-w-[220px] rounded-xl xl:mx-0 xl:ml-auto xl:h-52 xl:max-w-[280px]" />
        </div>
      </div>
    </section>
  )
}
