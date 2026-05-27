import { AdminMonitorMainPanel } from '../components/admin/monitor/AdminMonitorMainPanel'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function AdminMonitorPage() {
  const isLoading = usePageSkeletonLoading(900)

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Monitor operacional administrativo"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <div className="flex h-full min-h-0 flex-1 animate-pulse flex-col gap-4 p-6">
          <div className="h-8 w-80 rounded-xl bg-gray-200" />
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-24 rounded-2xl bg-gray-200" />
            ))}
          </div>
          <div className="grid flex-1 grid-cols-[1.65fr_1fr] gap-4">
            <div className="rounded-2xl bg-gray-200" />
            <div className="rounded-2xl bg-gray-200" />
          </div>
        </div>
      ) : (
        <AdminMonitorMainPanel />
      )}
    </div>
  )
}
