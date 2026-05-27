import { AccessCredentialsSidebarPanel } from '../../credenciais/AccessCredentialsSidebarPanel'
import { AccessCredentialsSidebarPanelSkeleton } from '../../credenciais/AccessCredentialsSidebarPanelSkeleton'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../../layout/dashboardPageLayout'
import { usePrefeituraAccessCredentialUserDrawer } from '../../../hooks/usePrefeituraAccessCredentialUserDrawer'
import { useAccessLogsDrawer } from '../../../hooks/useAccessLogsDrawer'
import { usePageSkeletonLoading } from '../../../hooks/usePageSkeletonLoading'
import { PrefeituraAccessCredentialsMainPanel } from './PrefeituraAccessCredentialsMainPanel'
import { PrefeituraAccessCredentialsMainPanelSkeleton } from './PrefeituraAccessCredentialsMainPanelSkeleton'
import { PrefeituraAccessCredentialsPageHeader } from './PrefeituraAccessCredentialsPageHeader'
import { PrefeituraAccessCredentialsPageHeaderSkeleton } from './PrefeituraAccessCredentialsPageHeaderSkeleton'

export function PrefeituraAccessCredentialsPageContent() {
  const isLoading = usePageSkeletonLoading(1200)
  const userDrawer = usePrefeituraAccessCredentialUserDrawer()
  const accessLogsDrawer = useAccessLogsDrawer()

  return (
    <>
      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <PrefeituraAccessCredentialsPageHeaderSkeleton />
          ) : (
            <PrefeituraAccessCredentialsPageHeader onNewUser={userDrawer.openCreate} />
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
                <PrefeituraAccessCredentialsMainPanelSkeleton />
                <AccessCredentialsSidebarPanelSkeleton />
              </>
            ) : (
              <>
                <PrefeituraAccessCredentialsMainPanel userDrawer={userDrawer} />
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
    </>
  )
}
