import { Skeleton } from '../../../ui/Skeleton'
import {
  DashCardSkeleton,
  KpiCardsRowSkeleton,
} from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../../layout/dashboardPageLayout'
import { adminDashboardTopRowSectionClass } from '../adminDashboardUi'

export function AdminDashboardMainPanelSkeleton() {
  return (
    <div className={dashboardPageScrollAreaClass}>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          'w-full space-y-4 pt-5 sm:pt-6',
        ].join(' ')}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-8 w-80 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-8 w-36 rounded-full" />
        </header>

        <div
          className={[
            'grid gap-4 lg:grid-cols-12',
            adminDashboardTopRowSectionClass,
          ].join(' ')}
        >
          <div className="min-h-0 lg:col-span-4">
            <KpiCardsRowSkeleton count={6} layout="grid-3x2" className="h-full w-full" />
          </div>
          <div className="grid min-h-0 gap-4 sm:grid-cols-2 lg:col-span-8">
            <DashCardSkeleton className="h-full min-h-0" bodyClassName="min-h-0 flex-1 p-1.5">
              <Skeleton className="h-full w-full rounded-lg" />
            </DashCardSkeleton>
            <DashCardSkeleton className="h-full min-h-0" bodyClassName="min-h-0 flex-1 p-1.5">
              <Skeleton className="h-full w-full rounded-lg" />
            </DashCardSkeleton>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <DashCardSkeleton bodyClassName="h-36">
            <Skeleton className="h-full w-full rounded-lg" />
          </DashCardSkeleton>
          <DashCardSkeleton bodyClassName="h-36">
            <Skeleton className="h-full w-full rounded-lg" />
          </DashCardSkeleton>
          <DashCardSkeleton bodyClassName="h-36">
            <Skeleton className="h-full w-full rounded-lg" />
          </DashCardSkeleton>
        </div>

        <div className="min-w-0 xl:col-span-12">
          <DashCardSkeleton bodyClassName="h-64">
            <Skeleton className="h-full w-full rounded-lg" />
          </DashCardSkeleton>
        </div>
      </div>
    </div>
  )
}
