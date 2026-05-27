import { Skeleton } from '../ui/Skeleton'

const STATUS_ROW_COUNT = 4

export function SuporteSidebarPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando resumo de suporte"
    >
      <div className="shrink-0 px-4 pt-4 pb-2">
        <Skeleton className="mx-auto h-28 w-full max-w-[220px] rounded-2xl sm:h-32" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <section className="border-t border-gray-200 p-5">
          <Skeleton className="h-5 w-48" />
          <ul className="mt-4 space-y-3">
            {Array.from({ length: STATUS_ROW_COUNT }).map((_, index) => (
              <li key={index} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-6 w-8" />
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-gray-200 p-5">
          <Skeleton className="h-5 w-44" />
          <div className="mt-4 flex items-center gap-4">
            <Skeleton className="size-[5.5rem] shrink-0 rounded-full" />
            <ul className="min-w-0 flex-1 space-y-2.5">
              {Array.from({ length: 3 }).map((_, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Skeleton className="size-2.5 shrink-0 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-12" />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-gray-200 p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 flex items-baseline gap-2">
            <Skeleton className="h-9 w-12" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="mt-3 h-[4.5rem] w-full rounded-lg" />
          <div className="mt-1 flex justify-between">
            <Skeleton className="h-2.5 w-8" />
            <Skeleton className="h-2.5 w-8" />
          </div>
        </section>
      </div>
    </aside>
  )
}
