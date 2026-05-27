import { Skeleton } from '../ui/Skeleton'

const PIXEL_CHART_ROWS = 5
const PIXEL_COUNT = 12
const CLIMATE_BAR_HEIGHTS = ['h-10', 'h-14', 'h-12', 'h-16', 'h-11', 'h-12'] as const
const QUICK_ACTION_COUNT = 3

function PixelChartRowSkeleton() {
  return (
    <div className="flex items-center gap-2.5">
      <Skeleton className="h-5 w-7 shrink-0" />
      <div className="flex min-w-0 flex-1 gap-[3px]">
        {Array.from({ length: PIXEL_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-3.5 flex-1 rounded-[3px]" />
        ))}
      </div>
    </div>
  )
}

export function AgendaSidebarPanelSkeleton() {
  return (
    <aside
      className="flex w-full flex-col gap-4"
      aria-busy="true"
      aria-label="Carregando painel lateral da agenda"
    >
      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <Skeleton className="h-6 w-32" />
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: QUICK_ACTION_COUNT }).map((_, index) => (
            <div
              key={index}
              className={[
                'flex items-center gap-3 rounded-xl px-4 py-3',
                index === 0
                  ? 'bg-gray-200/60'
                  : 'border border-gray-200 bg-gray-50/60',
              ].join(' ')}
            >
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <Skeleton className="h-6 w-36" />

        <div className="mt-4 flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-10" />
        </div>

        <div className="mt-4 space-y-2.5">
          {Array.from({ length: PIXEL_CHART_ROWS }).map((_, index) => (
            <PixelChartRowSkeleton key={index} />
          ))}
        </div>

        <div className="mt-5 border-t border-gray-200 pt-4">
          <div className="flex items-end justify-between gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-14" />
          </div>
          <Skeleton className="mt-2 h-2.5 w-full rounded-full" />
        </div>
      </section>

      <section className="shrink-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-3 w-48" />

        <div className="mt-4 flex items-end justify-between gap-1.5">
          {CLIMATE_BAR_HEIGHTS.map((heightClass, index) => (
            <div key={index} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-4" />
              <Skeleton className={`w-full max-w-7 rounded-t-md ${heightClass}`} />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
