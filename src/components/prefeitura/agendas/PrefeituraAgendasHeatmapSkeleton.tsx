import { Skeleton } from '../../ui/Skeleton'
import { heatmapUnitsBodyMaxHeightClass } from './prefeituraAgendasUi'

const UNIT_ROWS = 5
const DAY_COLS = 7

export function PrefeituraAgendasHeatmapSkeleton() {
  return (
    <section
      className="shrink-0 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]"
      aria-busy="true"
      aria-label="Carregando heatmap de comparecimento"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1 text-center">
            <Skeleton className="mx-auto h-4 w-36" />
            <Skeleton className="mx-auto h-3 w-24" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div
          className={[
            'overflow-x-auto rounded-xl border border-gray-100',
            heatmapUnitsBodyMaxHeightClass,
          ].join(' ')}
        >
          <div className="min-w-[640px] p-2">
            <div className="mb-2 flex gap-2">
              <Skeleton className="h-8 w-24 shrink-0" />
              {Array.from({ length: DAY_COLS }).map((_, index) => (
                <Skeleton key={index} className="h-10 min-w-[4.5rem] flex-1 rounded-lg" />
              ))}
            </div>
            {Array.from({ length: UNIT_ROWS }).map((_, rowIndex) => (
              <div key={rowIndex} className="mb-2 flex gap-2">
                <Skeleton className="h-12 w-24 shrink-0 rounded-lg" />
                {Array.from({ length: DAY_COLS }).map((_, colIndex) => (
                  <Skeleton
                    key={colIndex}
                    className="h-12 min-w-[4.5rem] flex-1 rounded-lg"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5">
        <Skeleton className="h-3 w-64" />
      </div>
    </section>
  )
}
