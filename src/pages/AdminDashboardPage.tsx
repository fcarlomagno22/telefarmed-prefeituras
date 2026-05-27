import { AdminDashboardMainPanel } from '../components/admin/dashboard/AdminDashboardMainPanel'
import { AdminDashboardMainPanelSkeleton } from '../components/admin/dashboard/skeletons/AdminDashboardMainPanelSkeleton'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function AdminDashboardPage() {
  const isLoading = usePageSkeletonLoading(1400)

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Dashboard administrativo"
      aria-busy={isLoading}
    >
      {isLoading ? <AdminDashboardMainPanelSkeleton /> : <AdminDashboardMainPanel />}
    </div>
  )
}
