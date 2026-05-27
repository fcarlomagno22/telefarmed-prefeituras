import { AdminClientesMainPanel } from '../components/admin/clientes/AdminClientesMainPanel'
import { AdminClientesMainPanelSkeleton } from '../components/admin/clientes/skeletons/AdminClientesMainPanelSkeleton'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function AdminClientesPage() {
  const isLoading = usePageSkeletonLoading(1200)

  return (
    <div
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label="Gestão de clientes"
      aria-busy={isLoading}
    >
      {isLoading ? <AdminClientesMainPanelSkeleton /> : <AdminClientesMainPanel />}
    </div>
  )
}
