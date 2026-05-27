import { RelatoriosCategoryGrid } from '../components/relatorios/RelatoriosCategoryGrid'
import { RelatoriosPageContentSkeleton } from '../components/relatorios/RelatoriosPageContentSkeleton'
import { RelatoriosQuickGuideSidebar } from '../components/relatorios/RelatoriosQuickGuideSidebar'
import { RelatoriosRealtimeBanner } from '../components/relatorios/RelatoriosRealtimeBanner'
import { relatoriosContentGridClass } from '../components/relatorios/relatoriosPageLayout'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageContentStackClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollAreaClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function RelatoriosPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(1200)

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Relatórios"
              subtitle="Acompanhe indicadores, desempenho e dados da unidade em tempo real."
            />
          )}
        </div>

        <div className={dashboardPageScrollAreaClass}>
          <div
            className={[
              dashboardPageScrollPaddingClass,
              dashboardPageContentStackClass,
              'mt-4',
            ].join(' ')}
          >
            {isLoading ? (
              <RelatoriosPageContentSkeleton />
            ) : (
              <section className={relatoriosContentGridClass}>
                <div className="shrink-0 xl:col-start-1 xl:row-start-1">
                  <h2 className="text-base font-bold text-gray-900">Escolha o tipo de relatório</h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Selecione a categoria para visualizar os dados detalhados.
                  </p>
                </div>

                <div className="min-w-0 xl:col-start-1 xl:row-start-2">
                  <RelatoriosCategoryGrid />
                </div>

                <div className="min-w-0 xl:col-start-1 xl:row-start-3">
                  <RelatoriosRealtimeBanner />
                </div>

                <div className="flex min-h-0 min-w-0 flex-col xl:col-start-2 xl:row-start-2 xl:row-span-2">
                  <RelatoriosQuickGuideSidebar />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
