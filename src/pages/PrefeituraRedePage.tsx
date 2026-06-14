import { PrefeituraRedeMainPanel } from '../components/prefeitura/rede/PrefeituraRedeMainPanel'
import { PrefeituraRedePageSkeleton } from '../components/prefeitura/skeletons/PrefeituraRedePageSkeleton'
import { PrefeituraRedeQuickActionsButton } from '../components/prefeitura/rede/PrefeituraRedeQuickActionsButton'
import { PrefeituraRedeSidebarPanel } from '../components/prefeitura/rede/PrefeituraRedeSidebarPanel'
import {
  dashboardPageScrollAreaClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { usePrefeituraNewUbtDrawer } from '../hooks/usePrefeituraNewUbtDrawer'
import { usePrefeituraPageAccess } from '../hooks/usePrefeituraPageAccess'
import { usePrefeituraRedePage } from '../hooks/usePrefeituraRedePage'
import { usePrefeituraRedeQuickActionDrawer } from '../hooks/usePrefeituraRedeQuickActionDrawer'
import { usePrefeituraRedeUnitActions } from '../hooks/usePrefeituraRedeUnitActions'
import { usePrefeituraUbsDetailDrawer } from '../hooks/usePrefeituraUbsDetailDrawer'

export function PrefeituraRedePage() {
  const { pageAccess } = usePrefeituraPageAccess('rede')
  const {
    units,
    kpiCards,
    regionSlices,
    stationStatusSlices,
    regionFilterOptions,
    statusFilterOptions,
    isLoading,
    loadError,
    reload,
    loadUnitDetail,
  } = usePrefeituraRedePage()
  const ubsDetailDrawer = usePrefeituraUbsDetailDrawer({ loadUnitDetail })
  const unitActions = usePrefeituraRedeUnitActions({
    onReload: reload,
    ubsDetailDrawer,
  })
  const quickActionDrawer = usePrefeituraRedeQuickActionDrawer({ units, onReload: reload })
  const newUbtDrawer = usePrefeituraNewUbtDrawer({ onRegistered: () => void reload() })

  return (
    <>
      <div
        className="flex h-full min-h-0 flex-1 flex-col"
        aria-label="Rede de teleatendimento"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <PrefeituraRedePageSkeleton />
        ) : (
          <div className={[dashboardPageShellClass, 'flex-1 bg-slate-50/80 py-5'].join(' ')}>
            <header className="relative z-30 shrink-0 overflow-visible">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                    Gestão da rede
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-[1.65rem]">
                    Unidades Básicas de Teleatendimento
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Unidades básicas de teleatendimento e terminais de atendimento da rede municipal.
                  </p>
                  {loadError ? (
                    <p className="mt-2 text-sm font-medium text-red-600">{loadError}</p>
                  ) : null}
                </div>
                <PrefeituraRedeQuickActionsButton onOpen={quickActionDrawer.openDrawer} />
              </div>
            </header>

            <div className="mt-4 shrink-0 overflow-visible">
              <KpiStatCards
                items={kpiCards}
                updateKey="prefeitura-rede"
                className="gap-3"
                animated
              />
            </div>

            <div className={[dashboardPageScrollAreaClass, 'mt-4 min-h-0 flex-1'].join(' ')}>
              <section className={[dashboardTwoColumnLayoutClass, 'pb-4'].join(' ')}>
                <PrefeituraRedeMainPanel
                  units={units}
                  regionFilterOptions={regionFilterOptions}
                  statusFilterOptions={statusFilterOptions}
                  canInsert={pageAccess.canInsert}
                  canEdit={pageAccess.canEdit}
                  canDelete={pageAccess.canDelete}
                  unitActions={unitActions}
                  newUbtDrawer={newUbtDrawer}
                />
                <PrefeituraRedeSidebarPanel
                  regionSlices={regionSlices}
                  stationStatusSlices={stationStatusSlices}
                />
              </section>
            </div>
          </div>
        )}
      </div>

      {ubsDetailDrawer.drawerElement}
      {quickActionDrawer.drawerElement}
      {newUbtDrawer.drawerElement}
      {unitActions.overlays}
    </>
  )
}
