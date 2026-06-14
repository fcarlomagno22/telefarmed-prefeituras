import { Navigate, useParams } from 'react-router-dom'
import { RelatoriosCategoryPanel } from '../components/relatorios/RelatoriosCategoryPanel'
import { RelatoriosQuickGuideSidebar } from '../components/relatorios/RelatoriosQuickGuideSidebar'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageContentStackClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { getReportCategory } from '../config/reportsCategories'
import type { RelatoriosPortal } from '../types/relatorios'
import { useBrandTheme } from '../hooks/useBrandTheme'

type RelatoriosCategoryPageProps = {
  portal?: RelatoriosPortal
  backPath: string
  invalidRedirectPath: string
  unitLabel?: string
}

export function RelatoriosCategoryPage({
  portal = 'ubt',
  backPath,
  invalidRedirectPath,
  unitLabel,
}: RelatoriosCategoryPageProps) {
  useBrandTheme()
  const { categoryId } = useParams<{ categoryId: string }>()
  const category = getReportCategory(categoryId)

  if (!category) {
    return <Navigate to={invalidRedirectPath} replace />
  }

  const Icon = category.icon

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          <DashboardPageHeader title={category.title} subtitle={category.pageSubtitle} />
        </div>

        <div className={dashboardPageScrollAreaClass}>
          <div
            className={[
              dashboardPageScrollPaddingClass,
              dashboardPageContentStackClass,
              'mt-4',
            ].join(' ')}
          >
            <section className={dashboardTwoColumnLayoutClass}>
              <div className="flex shrink-0 flex-col">
                <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span>
                    Relatórios / <span className="font-medium text-gray-800">{category.title}</span>
                  </span>
                </div>
                <RelatoriosCategoryPanel
                  category={category}
                  portal={portal}
                  backPath={backPath}
                  unitLabel={unitLabel}
                />
              </div>
              <RelatoriosQuickGuideSidebar />
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
