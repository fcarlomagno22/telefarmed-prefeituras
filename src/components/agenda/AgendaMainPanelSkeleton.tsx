import { Skeleton } from '../ui/Skeleton'

const TABLE_ROW_COUNT = 8

export function AgendaMainPanelSkeleton() {
  return (
    <section
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando agenda"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
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

        <Skeleton className="mt-5 h-11 w-full shrink-0 rounded-xl" />

        <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200">
          <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-4 py-2.5 sm:px-5">
            <Skeleton className="mr-auto h-3 w-48 max-w-[55%]" />
            <Skeleton className="h-4 w-20" />
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-3 sm:px-5">
            <div className="mb-3 flex gap-3 border-b border-gray-200 pb-3">
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
    </section>
  )
}
