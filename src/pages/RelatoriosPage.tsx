import { RelatoriosCategoryGrid } from '../components/relatorios/RelatoriosCategoryGrid'
import { RelatoriosCategoryGridSkeleton } from '../components/relatorios/RelatoriosCategoryGridSkeleton'
import { RelatoriosCategoryList } from '../components/relatorios/RelatoriosCategoryList'
import { RelatoriosCategoryListSkeleton } from '../components/relatorios/RelatoriosCategoryListSkeleton'
import { RelatoriosPageContentSkeleton } from '../components/relatorios/RelatoriosPageContentSkeleton'
import { RelatoriosQuickGuideSidebar } from '../components/relatorios/RelatoriosQuickGuideSidebar'
import { RelatoriosRealtimeBanner } from '../components/relatorios/RelatoriosRealtimeBanner'
import {
  relatoriosContentGridClass,
  relatoriosContentGridListClass,
  relatoriosPageBodyClass,
} from '../components/relatorios/relatoriosPageLayout'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageContentStackClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useRelatoriosHub } from '../hooks/useRelatoriosHub'
import type { RelatoriosPortal } from '../types/relatorios'

type RelatoriosPageProps = {
  portal?: RelatoriosPortal
  categoryPath: (categoryId: string) => string
  subtitle?: string
}

export function RelatoriosPage({
  portal = 'ubt',
  categoryPath,
  subtitle = 'Acompanhe indicadores, desempenho e dados da unidade em tempo real.',
}: RelatoriosPageProps) {
  useBrandTheme()
  const { categories, isLoading, loadError } = useRelatoriosHub(portal)
  const isListLayout = portal === 'ubt'

  const categoryPicker =
    categories.length === 0 ? (
      isListLayout ? (
        <RelatoriosCategoryListSkeleton />
      ) : (
        <RelatoriosCategoryGridSkeleton />
      )
    ) : isListLayout ? (
      <RelatoriosCategoryList categoryPath={categoryPath} categories={categories} />
    ) : (
      <RelatoriosCategoryGrid categoryPath={categoryPath} categories={categories} />
    )

  const pageContent = isLoading ? (
    <RelatoriosPageContentSkeleton layout={isListLayout ? 'list' : 'cards'} />
  ) : loadError ? (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      {loadError}
    </div>
  ) : isListLayout ? (
    <section className={relatoriosContentGridListClass}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        <div className="shrink-0">
          <h2 className="text-base font-bold text-gray-900">Escolha o tipo de relatório</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Selecione a categoria para visualizar os dados detalhados.
          </p>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{categoryPicker}</div>

        <div className="shrink-0">
          <RelatoriosRealtimeBanner />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-col self-stretch xl:h-full xl:overflow-hidden">
        <RelatoriosQuickGuideSidebar />
      </div>
    </section>
  ) : (
    <section className={relatoriosContentGridClass}>
      <div className="shrink-0 xl:col-start-1 xl:row-start-1">
        <h2 className="text-base font-bold text-gray-900">Escolha o tipo de relatório</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Selecione a categoria para visualizar os dados detalhados.
        </p>
      </div>

      <div className="min-w-0 xl:col-start-1 xl:row-start-2">{categoryPicker}</div>

      <div className="min-w-0 xl:col-start-1 xl:row-start-3">
        <RelatoriosRealtimeBanner />
      </div>

      <div className="flex min-h-0 min-w-0 flex-col xl:col-start-2 xl:row-start-2 xl:row-span-2">
        <RelatoriosQuickGuideSidebar />
      </div>
    </section>
  )

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader title="Relatórios" subtitle={subtitle} />
          )}
        </div>

        {isListLayout ? (
          <div className={[dashboardPageScrollPaddingClass, relatoriosPageBodyClass].join(' ')}>
            {pageContent}
          </div>
        ) : (
          <div className={dashboardPageScrollAreaClass}>
            <div
              className={[
                dashboardPageScrollPaddingClass,
                dashboardPageContentStackClass,
                'mt-4',
              ].join(' ')}
            >
              {pageContent}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
