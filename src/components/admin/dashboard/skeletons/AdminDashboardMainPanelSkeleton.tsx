import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  prefeituraDashboardCardsRowClass,
} from '../../../layout/dashboardPageLayout'
import { adminDashboardTopRowSectionClass } from '../adminDashboardUi'
import { Skeleton } from '../../../ui/Skeleton'
import {
  AdminDashboardHeaderSkeleton,
  AdminDashboardKpiGridSkeleton,
  AdminHourlyChartPanelSkeleton,
  AdminMunicipalitiesTableSkeleton,
  AdminNocCentralPanelSkeleton,
  AdminOperationalSummaryPanelSkeleton,
  AdminPlatformPackagePanelSkeleton,
  AdminRevenuePanelSkeleton,
  AdminTerminalsPanelSkeleton,
} from './adminDashboardSkeletonPanels'

export function AdminDashboardMainPanelSkeleton() {
  return (
    <div className={dashboardPageScrollAreaClass} aria-hidden>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          'w-full space-y-4 pt-5 sm:pt-6',
        ].join(' ')}
      >
        <AdminDashboardHeaderSkeleton />

        <AdminDashboardKpiGridSkeleton className="w-full" />

        <div className="grid gap-4 xl:grid-cols-12">
          <section
            className={[
              prefeituraDashboardCardsRowClass,
              adminDashboardTopRowSectionClass,
              'lg:col-span-12 lg:grid-cols-12',
            ].join(' ')}
          >
            <div className="flex min-h-0 lg:col-span-4">
              <AdminHourlyChartPanelSkeleton className="h-full w-full" />
            </div>

            <div
              className={[
                prefeituraDashboardCardsRowClass,
                'h-full min-h-0 sm:grid-cols-2 lg:col-span-8',
              ].join(' ')}
            >
              <AdminNocCentralPanelSkeleton className="h-full" />
              <AdminPlatformPackagePanelSkeleton className="h-full" />
            </div>
          </section>

          <section
            className={[prefeituraDashboardCardsRowClass, 'lg:col-span-12 lg:grid-cols-3'].join(
              ' ',
            )}
          >
            <AdminTerminalsPanelSkeleton className="h-full" />
            <AdminRevenuePanelSkeleton className="h-full" />
            <AdminOperationalSummaryPanelSkeleton className="h-full" />
          </section>

          <section className="min-w-0 space-y-3 xl:col-span-12">
            <div className="px-0.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-6 w-56" />
              <Skeleton className="mt-1 h-3 w-72" />
            </div>
            <div className="grid gap-4 xl:grid-cols-12">
              <Skeleton className="min-h-[18rem] rounded-2xl xl:col-span-4" />
              <Skeleton className="min-h-[18rem] rounded-2xl xl:col-span-8" />
              <Skeleton className="min-h-[16rem] rounded-2xl xl:col-span-4" />
              <Skeleton className="min-h-[16rem] rounded-2xl xl:col-span-4" />
              <Skeleton className="min-h-[16rem] rounded-2xl xl:col-span-4" />
            </div>
          </section>

          <section className="min-w-0 xl:col-span-12">
            <AdminMunicipalitiesTableSkeleton />
          </section>
        </div>
      </div>
    </div>
  )
}
