import { ConsultasMainPanel } from '../components/consultas/ConsultasMainPanel'
import { ConsultasMainPanelSkeleton } from '../components/consultas/ConsultasMainPanelSkeleton'
import { ConsultasSidebarPanel } from '../components/consultas/ConsultasSidebarPanel'
import { ConsultasSidebarPanelSkeleton } from '../components/consultas/ConsultasSidebarPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useNetworkUserDrawer } from '../hooks/useNetworkUserDrawer'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function ConsultasPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(2000)
  const networkUserDrawer = useNetworkUserDrawer()

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Consultas"
              subtitle="Histórico e gestão de atendimentos realizados"
            />
          )}
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col pb-5',
          ].join(' ')}
        >
          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <ConsultasMainPanelSkeleton />
                </div>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <ConsultasSidebarPanelSkeleton />
                </div>
              </>
            ) : (
              <>
                <ConsultasMainPanel networkUserDrawer={networkUserDrawer} />
                <ConsultasSidebarPanel />
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
