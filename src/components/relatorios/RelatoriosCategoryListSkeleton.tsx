import { Skeleton } from '../ui/Skeleton'
import {
  relatoriosCategoryListClass,
  REPORT_CATEGORY_CARD_COUNT,
} from './relatoriosPageLayout'

const TITLE_WIDTHS = ['w-40', 'w-28', 'w-36', 'w-44', 'w-40', 'w-32'] as const

export function RelatoriosCategoryListSkeleton() {
  return (
    <div
      className={relatoriosCategoryListClass}
      aria-busy="true"
      aria-label="Carregando categorias de relatórios"
    >
      {Array.from({ length: REPORT_CATEGORY_CARD_COUNT }).map((_, index) => (
        <div
          key={index}
          className="flex min-h-[4.25rem] flex-1 items-center gap-4 border-b border-gray-100 px-4 py-3.5 last:border-b-0 sm:gap-5 sm:px-5 sm:py-4"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={`h-4 sm:h-5 ${TITLE_WIDTHS[index]}`} />
            <Skeleton className="h-3 w-full max-w-md" />
          </div>
          <Skeleton className="h-5 w-5 shrink-0 rounded" />
        </div>
      ))}
    </div>
  )
}
