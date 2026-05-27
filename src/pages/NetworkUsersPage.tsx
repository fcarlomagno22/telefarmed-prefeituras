import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { NetworkUsersAboutPanel } from '../components/users/NetworkUsersAboutPanel'
import { NetworkUsersAboutPanelSkeleton } from '../components/users/NetworkUsersAboutPanelSkeleton'
import { NetworkUsersMainPanel } from '../components/users/NetworkUsersMainPanel'
import { NetworkUsersMainPanelSkeleton } from '../components/users/NetworkUsersMainPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { unitStation } from '../data/unitDashboardMock'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function NetworkUsersPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(2000)

  const unitLabel = unitStation.unitName.split('—')[0]?.trim() ?? unitStation.unitName

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Usuários da rede"
              subtitle={`${unitLabel} — Todos os pacientes atendidos`}
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
                <div className="flex h-full min-h-0 min-w-0 flex-col [&>section]:h-full [&>section]:min-h-0 [&>section]:flex-1">
                  <NetworkUsersMainPanelSkeleton />
                </div>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <NetworkUsersAboutPanelSkeleton />
                </div>
              </>
            ) : (
              <>
                <NetworkUsersMainPanel />
                <NetworkUsersAboutPanel />
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
