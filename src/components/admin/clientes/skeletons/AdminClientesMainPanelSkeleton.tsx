import {
  dashboardPageFillScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../../layout/dashboardPageLayout'
import {
  adminClientesCardsRowClass,
  adminClientesPageStackClass,
  adminClientesTableSlotClass,
} from '../adminClientesUi'
import { DashCardSkeleton } from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../../../ui/Skeleton'

export function AdminClientesMainPanelSkeleton() {
  return (
    <div className={[dashboardPageFillScrollAreaClass, 'min-w-0'].join(' ')}>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          adminClientesPageStackClass,
          'pb-3 sm:pb-4 pt-5 sm:pt-6',
        ].join(' ')}
      >
        <header className="flex shrink-0 flex-wrap items-start gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </header>

        <Skeleton className="h-36 w-full shrink-0 rounded-2xl" />

        <div className={[adminClientesCardsRowClass, 'shrink-0'].join(' ')}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 min-w-0 w-full rounded-2xl" />
          ))}
        </div>

        <div className={adminClientesTableSlotClass}>
          <DashCardSkeleton
            className="h-full min-h-0 flex-1"
            bodyClassName="flex min-h-0 flex-1 flex-col p-0"
          >
            <Skeleton className="h-14 shrink-0 w-full rounded-none" />
            <Skeleton className="min-h-0 flex-1 w-full rounded-none" />
          </DashCardSkeleton>
        </div>
      </div>
    </div>
  )
}
