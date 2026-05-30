import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminSuporteMainPanel } from '../components/admin/suporte/AdminSuporteMainPanel'
import { SuporteMainPanelSkeleton } from '../components/suporte/SuporteMainPanelSkeleton'
import { SuporteSidebarPanel } from '../components/suporte/SuporteSidebarPanel'
import { SuporteSidebarPanelSkeleton } from '../components/suporte/SuporteSidebarPanelSkeleton'
import {
  suporteColumnFillClass,
  suporteColumnScrollClass,
  suporteColumnsGridClass,
} from '../components/suporte/suportePageLayout'
import {
  adminSupportMonthlyTrend,
  adminSupportPriorityDistribution,
  adminSupportStatusSummary,
  adminSupportTickets,
} from '../data/adminSuporteMock'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function AdminSuportePage() {
  const isLoading = usePageSkeletonLoading(1200)

  return (
    <div className={dashboardPageShellClass} aria-label="Suporte" aria-busy={isLoading}>
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Plataforma"
          title="Suporte"
          description="Central de chamados das prefeituras e UBTs com a equipe Telefarmed. Responda solicitações abertas em /ubt/suporte e /prefeitura/suporte."
        />
      </div>

      <div
        className={[
          suporteColumnsGridClass,
          dashboardPageScrollPaddingClass,
          'mt-4 pb-5',
        ].join(' ')}
      >
        <div className={suporteColumnScrollClass}>
          <div className={suporteColumnFillClass}>
            {isLoading ? (
              <SuporteMainPanelSkeleton showUbtColumn />
            ) : (
              <AdminSuporteMainPanel />
            )}
          </div>
        </div>

        <div className={suporteColumnScrollClass}>
          <div className={suporteColumnFillClass}>
            {isLoading ? (
              <SuporteSidebarPanelSkeleton />
            ) : (
              <SuporteSidebarPanel
                statusSummary={adminSupportStatusSummary}
                priorityDistribution={adminSupportPriorityDistribution}
                monthlyTrend={adminSupportMonthlyTrend}
                monthlyTotal={adminSupportTickets.length}
                summaryTitle="Chamados da plataforma"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
