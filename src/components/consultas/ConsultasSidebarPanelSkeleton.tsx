import { Skeleton } from '../ui/Skeleton'

type ConsultasSidebarPanelSkeletonProps = {
  showIllustration?: boolean
}

export function ConsultasSidebarPanelSkeleton({
  showIllustration = true,
}: ConsultasSidebarPanelSkeletonProps = {}) {
  return (
    <aside
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando resumo de consultas"
    >
      {showIllustration ? (
        <Skeleton className="mx-4 mt-4 h-32 w-[calc(100%-2rem)] max-w-[240px] rounded-xl" />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-6">
        <Skeleton className="mx-auto h-6 w-32" />
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-3">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-20" />
              <Skeleton className="mt-1 h-6 w-14" />
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="mt-4 h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
