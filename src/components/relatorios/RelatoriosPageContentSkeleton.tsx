import { Skeleton } from '../ui/Skeleton'
import { relatoriosContentGridClass } from './relatoriosPageLayout'
import { RelatoriosCategoryGridSkeleton } from './RelatoriosCategoryGridSkeleton'
import { RelatoriosQuickGuideSidebarSkeleton } from './RelatoriosQuickGuideSidebarSkeleton'
import { RelatoriosRealtimeBannerSkeleton } from './RelatoriosRealtimeBannerSkeleton'

export function RelatoriosPageContentSkeleton() {
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
