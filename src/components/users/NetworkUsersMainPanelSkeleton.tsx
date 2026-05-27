import { Skeleton } from '../ui/Skeleton'

const TABLE_ROW_COUNT = 7

export function NetworkUsersMainPanelSkeleton() {
  return (
    <section
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando lista de usuários"
    >
      <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-full max-w-md" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full shrink-0 rounded-xl sm:w-28" />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3.5"
            >
              <Skeleton className="size-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="mx-auto h-3 w-20" />
                <Skeleton className="mx-auto h-6 w-16" />
                <Skeleton className="mx-auto h-3 w-14" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-3 sm:px-6">
        <Skeleton className="h-3 w-48 max-w-[60%]" />
        <Skeleton className="ml-auto h-4 w-20" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-5 py-3 sm:px-6">
        <div className="mb-3 flex gap-3 border-b border-gray-200 pb-3">
          <Skeleton className="h-3 w-[24%]" />
          <Skeleton className="h-3 w-[12%]" />
          <Skeleton className="h-3 w-[12%]" />
          <Skeleton className="hidden h-3 w-[12%] sm:block" />
          <Skeleton className="hidden h-3 w-[16%] md:block" />
          <Skeleton className="hidden h-3 w-[16%] lg:block" />
          <Skeleton className="ml-auto h-3 w-8" />
        </div>
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: TABLE_ROW_COUNT }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 py-4">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-36 max-w-[70%]" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="hidden h-4 w-16 sm:block" />
              <Skeleton className="hidden h-4 w-24 md:block" />
              <Skeleton className="hidden h-4 w-20 lg:block" />
              <Skeleton className="hidden h-4 w-28 xl:block" />
              <Skeleton className="size-8 shrink-0 rounded-lg" />
            </li>
          ))}
        </ul>
      </div>

      <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Skeleton className="h-3 w-52" />
        <div className="flex items-center gap-1">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="size-8 rounded-lg" />
          ))}
        </div>
      </footer>
    </section>
  )
}
