import {
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
} from '../../../layout/dashboardPageLayout'
import { adminClientesCardsRowClass, adminClientesPageStackClass } from '../adminClientesUi'
import { DashCardSkeleton } from '../../../prefeitura/skeletons/prefeituraSkeletonUi'
import { Skeleton } from '../../../ui/Skeleton'

export function AdminClientesMainPanelSkeleton() {
  return (
    <div className={[dashboardPageScrollAreaClass, 'min-w-0'].join(' ')}>
      <div
        className={[
          dashboardPageScrollPaddingClass,
          adminClientesPageStackClass,
          'pt-5 sm:pt-6',
        ].join(' ')}
      >
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
          <Skeleton className="h-8 w-36 rounded-full" />
        </header>

        <Skeleton className="h-36 w-full rounded-2xl" />

        <div className={adminClientesCardsRowClass}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 min-w-0 w-full rounded-2xl" />
          ))}
        </div>

        <Skeleton className="h-28 min-w-0 w-full rounded-2xl" />

        <DashCardSkeleton bodyClassName="h-80">
          <Skeleton className="h-full w-full rounded-lg" />
        </DashCardSkeleton>
      </div>
    </div>
  )
}
