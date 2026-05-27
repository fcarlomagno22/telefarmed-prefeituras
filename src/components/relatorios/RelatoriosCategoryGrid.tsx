import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { reportCategories } from '../../config/reportsCategories'
import { relatoriosCategoryGridClass } from './relatoriosPageLayout'

export function RelatoriosCategoryGrid() {
  return (
    <div className={relatoriosCategoryGridClass}>
        {reportCategories.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.id}
              to={`/relatorios/${category.id}`}
              className="group flex h-full min-h-[9rem] flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)] transition hover:border-[var(--brand-primary)]/25 hover:shadow-[0_4px_20px_rgba(255,107,0,0.12)] sm:min-h-[10rem] sm:p-6 xl:min-h-0 xl:p-7"
            >
              <div className="flex shrink-0 items-start justify-between gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-light)] text-[var(--brand-primary)] sm:h-14 sm:w-14">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
                  <ChevronRight
                    className="h-5 w-5 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 pt-4 sm:gap-3 sm:pt-5">
                <h3 className="text-base font-bold leading-snug text-gray-900 transition group-hover:text-[var(--brand-primary)] sm:text-lg sm:leading-tight">
                  {category.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500 sm:text-[0.9375rem] sm:leading-7">
                  {category.description}
                </p>
              </div>
            </Link>
          )
        })}
    </div>
  )
}
