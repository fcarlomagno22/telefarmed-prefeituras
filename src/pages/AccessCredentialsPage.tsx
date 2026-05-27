import { AccessCredentialsMainPanel } from '../components/credenciais/AccessCredentialsMainPanel'
import { AccessCredentialsMainPanelSkeleton } from '../components/credenciais/AccessCredentialsMainPanelSkeleton'
import { AccessCredentialsPageHeader } from '../components/credenciais/AccessCredentialsPageHeader'
import { AccessCredentialsPageHeaderSkeleton } from '../components/credenciais/AccessCredentialsPageHeaderSkeleton'
import { AccessCredentialsSidebarPanel } from '../components/credenciais/AccessCredentialsSidebarPanel'
import { AccessCredentialsSidebarPanelSkeleton } from '../components/credenciais/AccessCredentialsSidebarPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { useAccessCredentialUserDrawer } from '../hooks/useAccessCredentialUserDrawer'
import { useAccessLogsDrawer } from '../hooks/useAccessLogsDrawer'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function AccessCredentialsPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(1200)
  const userDrawer = useAccessCredentialUserDrawer()
  const accessLogsDrawer = useAccessLogsDrawer()

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <AccessCredentialsPageHeaderSkeleton />
          ) : (
            <AccessCredentialsPageHeader onNewUser={userDrawer.openCreate} />
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
                <AccessCredentialsMainPanelSkeleton />
                <AccessCredentialsSidebarPanelSkeleton />
              </>
            ) : (
              <>
                <AccessCredentialsMainPanel userDrawer={userDrawer} />
                <AccessCredentialsSidebarPanel
                  users={userDrawer.users}
                  onOpenAllAccesses={accessLogsDrawer.openDrawer}
                />
              </>
            )}
          </section>
        </div>
      </div>

      {userDrawer.drawerElement}
      {accessLogsDrawer.drawerElement}
    </DashboardLayout>
  )
}
