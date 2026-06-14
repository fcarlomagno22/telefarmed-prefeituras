import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  prefeituraDashboardCardsRowClass,
} from '../../../layout/dashboardPageLayout'
import { adminDashboardTopRowSectionClass } from '../adminDashboardUi'
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

          <section className="min-w-0 xl:col-span-12">
            <AdminMunicipalitiesTableSkeleton />
          </section>
        </div>
      </div>
    </div>
  )
}
