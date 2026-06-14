import { Skeleton } from '../ui/Skeleton'
import {
  relatoriosContentGridClass,
  relatoriosContentGridListClass,
} from './relatoriosPageLayout'
import { RelatoriosCategoryGridSkeleton } from './RelatoriosCategoryGridSkeleton'
import { RelatoriosCategoryListSkeleton } from './RelatoriosCategoryListSkeleton'
import { RelatoriosQuickGuideSidebarSkeleton } from './RelatoriosQuickGuideSidebarSkeleton'
import { RelatoriosRealtimeBannerSkeleton } from './RelatoriosRealtimeBannerSkeleton'

type RelatoriosPageContentSkeletonProps = {
  layout?: 'cards' | 'list'
}

export function RelatoriosPageContentSkeleton({
  layout = 'cards',
}: RelatoriosPageContentSkeletonProps) {
  if (layout === 'list') {
    return (
      <section className={relatoriosContentGridListClass} aria-busy="true">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="shrink-0">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-1 h-4 w-full max-w-md" />
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <RelatoriosCategoryListSkeleton />
          </div>

          <div className="shrink-0">
            <RelatoriosRealtimeBannerSkeleton />
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col self-stretch xl:h-full xl:overflow-hidden">
          <RelatoriosQuickGuideSidebarSkeleton />
        </div>
      </section>
    )
  }

  return (
    <section className={relatoriosContentGridClass} aria-busy="true">
      <div className="shrink-0 xl:col-start-1 xl:row-start-1">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-1 h-4 w-full max-w-md" />
      </div>

      <div className="min-w-0 xl:col-start-1 xl:row-start-2">
        <RelatoriosCategoryGridSkeleton />
      </div>

      <div className="min-w-0 xl:col-start-1 xl:row-start-3">
        <RelatoriosRealtimeBannerSkeleton />
      </div>

      <div className="flex min-h-0 min-w-0 flex-col xl:col-start-2 xl:row-start-2 xl:row-span-2">
        <RelatoriosQuickGuideSidebarSkeleton />
      </div>
    </section>
  )
}
