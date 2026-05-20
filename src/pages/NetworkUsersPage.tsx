import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { NetworkUsersAboutPanel } from '../components/users/NetworkUsersAboutPanel'
import { NetworkUsersAboutPanelSkeleton } from '../components/users/NetworkUsersAboutPanelSkeleton'
import { NetworkUsersMainPanel } from '../components/users/NetworkUsersMainPanel'
import { NetworkUsersMainPanelSkeleton } from '../components/users/NetworkUsersMainPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { unitStation } from '../data/unitDashboardMock'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function NetworkUsersPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(2000)

  const unitLabel = unitStation.unitName.split('—')[0]?.trim() ?? unitStation.unitName

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-6 lg:px-10">
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Usuários da rede"
              subtitle={`${unitLabel} — Todos os pacientes atendidos`}
            />
          )}
        </div>

        <section className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 pb-5 sm:mt-6 sm:pb-6 xl:grid-cols-[1fr_320px] xl:grid-rows-1">
          {isLoading ? (
            <>
              <NetworkUsersMainPanelSkeleton />
              <NetworkUsersAboutPanelSkeleton />
            </>
          ) : (
            <>
              <NetworkUsersMainPanel />
              <NetworkUsersAboutPanel />
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
