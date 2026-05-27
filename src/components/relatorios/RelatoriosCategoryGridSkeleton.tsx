import { Skeleton } from '../ui/Skeleton'
import {
  relatoriosCategoryGridClass,
  REPORT_CATEGORY_CARD_COUNT,
} from './relatoriosPageLayout'

const TITLE_WIDTHS = ['w-36', 'w-28', 'w-40', 'w-44', 'w-36', 'w-32'] as const

export function RelatoriosCategoryGridSkeleton() {
  return (
    <div
      className={relatoriosCategoryGridClass}
      aria-busy="true"
      aria-label="Carregando categorias de relatórios"
    >
      {Array.from({ length: REPORT_CATEGORY_CARD_COUNT }).map((_, index) => (
        <article
          key={index}
          className="flex h-full min-h-[9rem] flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] sm:min-h-[10rem] sm:p-6 xl:min-h-0 xl:p-7"
        >
          <div className="flex shrink-0 items-start justify-between gap-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14" />
            <Skeleton className="h-12 w-12 shrink-0 rounded-full sm:h-14 sm:w-14" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 pt-4 sm:gap-3 sm:pt-5">
            <Skeleton className={`h-5 sm:h-6 ${TITLE_WIDTHS[index]}`} />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-[88%]" />
            <Skeleton className="hidden h-3 w-2/3 sm:block" />
          </div>
        </article>
      ))}
    </div>
  )
}
