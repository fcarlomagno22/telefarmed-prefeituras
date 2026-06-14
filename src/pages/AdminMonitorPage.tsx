import { AdminMonitorMainPanel } from '../components/admin/monitor/AdminMonitorMainPanel'
import { AdminMonitorMainPanelSkeleton } from '../components/admin/monitor/skeletons/AdminMonitorMainPanelSkeleton'
import { useAdminMonitorPage } from '../hooks/useAdminMonitorPage'

export function AdminMonitorPage() {
  const {
    monitor,
    filters,
    isLoading,
    loadError,
    reload,
    setEntidadeId,
    setRegionKey,
    setTimelinePeriod,
  } = useAdminMonitorPage()

  if (loadError && !monitor) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-gray-600">{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      aria-label="Monitor operacional administrativo"
      aria-busy={isLoading}
    >
      {isLoading && !monitor ? (
        <AdminMonitorMainPanelSkeleton />
      ) : monitor ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {loadError ? (
            <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : null}
          <AdminMonitorMainPanel
            monitor={monitor}
            selectedEntidadeId={filters.entidadeId}
            regionKey={filters.regionKey}
            timelinePeriod={filters.timelinePeriod}
            onEntidadeChange={setEntidadeId}
            onRegionChange={setRegionKey}
            onTimelineChange={setTimelinePeriod}
          />
        </div>
      ) : (
        <AdminMonitorMainPanelSkeleton />
      )}
    </div>
  )
}
