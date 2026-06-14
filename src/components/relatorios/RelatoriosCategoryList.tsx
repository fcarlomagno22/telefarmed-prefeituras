import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getReportCategoryIcon } from '../../config/reportsCategories'
import type { RelatorioCategoryApi } from '../../types/relatorios'
import { relatoriosCategoryListClass } from './relatoriosPageLayout'

type RelatoriosCategoryListProps = {
  categoryPath: (categoryId: string) => string
  categories: RelatorioCategoryApi[]
}

export function RelatoriosCategoryList({ categoryPath, categories }: RelatoriosCategoryListProps) {
  return (
    <div className={relatoriosCategoryListClass}>
      {categories.map((category) => {
        const Icon = getReportCategoryIcon(category.id)
        return (
          <Link
            key={category.id}
            to={categoryPath(category.id)}
            className="group flex min-h-[4.25rem] flex-1 items-center gap-4 border-b border-gray-100 px-4 py-3.5 transition last:border-b-0 hover:bg-orange-50/60 sm:gap-5 sm:px-5 sm:py-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] sm:h-11 sm:w-11">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>

            <span className="min-w-0 flex-1 text-left">
              <h3 className="text-sm font-bold text-gray-900 transition group-hover:text-[var(--brand-primary)] sm:text-base">
                {category.title}
              </h3>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 sm:text-sm">
                {category.description}
              </p>
            </span>

            <ChevronRight
              className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
        )
      })}
    </div>
  )
}
