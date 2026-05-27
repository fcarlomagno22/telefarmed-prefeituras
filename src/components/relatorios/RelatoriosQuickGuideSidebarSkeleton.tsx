import { Skeleton } from '../ui/Skeleton'

const GUIDE_STEP_COUNT = 5

export function RelatoriosQuickGuideSidebarSkeleton() {
  return (
    <aside
      className="flex h-full min-h-0 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
      aria-busy="true"
      aria-label="Carregando guia rápido de relatórios"
    >
      <div className="shrink-0">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="mt-3 h-5 w-44" />
        <Skeleton className="mt-1 h-3 w-full" />
        <Skeleton className="mt-1 h-3 w-[90%]" />
      </div>

      <ol className="min-h-0 flex-1 space-y-4">
        {Array.from({ length: GUIDE_STEP_COUNT }).map((_, index) => (
          <li key={index} className="flex gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </span>
          </li>
        ))}
      </ol>

      <div className="shrink-0 rounded-xl border border-orange-100 bg-orange-50/80 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>
    </aside>
  )
}
