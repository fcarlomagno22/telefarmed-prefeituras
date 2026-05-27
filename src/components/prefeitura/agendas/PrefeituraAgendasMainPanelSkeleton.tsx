import { PrefeituraAgendasDayScheduleSkeleton } from './PrefeituraAgendasDayScheduleSkeleton'
import { PrefeituraAgendasHeatmapSkeleton } from './PrefeituraAgendasHeatmapSkeleton'

export function PrefeituraAgendasMainPanelSkeleton() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PrefeituraAgendasHeatmapSkeleton />
      <PrefeituraAgendasDayScheduleSkeleton />
    </div>
  )
}
