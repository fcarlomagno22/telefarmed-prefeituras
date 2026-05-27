import { PrefeituraDashboardMainPanel } from '../components/prefeitura/PrefeituraDashboardMainPanel'
import { PrefeituraDashboardMainPanelSkeleton } from '../components/prefeitura/skeletons/PrefeituraDashboardMainPanelSkeleton'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function PrefeituraDashboardPage() {
  const isLoading = usePageSkeletonLoading(1500)

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Dashboard municipal"
      aria-busy={isLoading}
    >
      {isLoading ? <PrefeituraDashboardMainPanelSkeleton /> : <PrefeituraDashboardMainPanel />}
    </div>
  )
}
