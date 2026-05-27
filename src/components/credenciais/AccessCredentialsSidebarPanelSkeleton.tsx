import { DonutLegendSkeleton } from '../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../ui/Skeleton'

const LAST_ACCESS_COUNT = 4

export function AccessCredentialsSidebarPanelSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando resumo de credenciais"
    >
      <div className="shrink-0 px-3 pt-4 pb-2">
        <Skeleton className="mx-auto h-36 w-full max-w-[280px] rounded-2xl sm:h-40" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <section className="border-t border-gray-200 p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-3 w-28" />
          <Skeleton className="mt-2 h-9 w-16" />
          <div className="mt-4">
            <DonutLegendSkeleton rows={4} />
          </div>
        </section>

        <section className="border-t border-gray-200 p-5">
          <Skeleton className="h-5 w-40" />
          <div className="mt-4 flex flex-row-reverse items-center gap-4">
            <DonutLegendSkeleton rows={2} />
          </div>
        </section>

        <section className="border-t border-gray-200 p-5">
          <Skeleton className="h-5 w-32" />
          <ul className="mt-4 space-y-3">
            {Array.from({ length: LAST_ACCESS_COUNT }).map((_, index) => (
              <li key={index} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <Skeleton className="h-4 min-w-0 flex-1" />
                <Skeleton className="h-3 w-14 shrink-0" />
              </li>
            ))}
          </ul>
          <Skeleton className="mt-4 h-4 w-full max-w-[200px]" />
        </section>
      </div>
    </aside>
  )
}
