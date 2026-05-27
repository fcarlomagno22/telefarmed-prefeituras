import { SuporteMainPanel } from './SuporteMainPanel'
import { SuporteMainPanelSkeleton } from './SuporteMainPanelSkeleton'
import { SuporteSidebarPanel } from './SuporteSidebarPanel'
import { SuporteSidebarPanelSkeleton } from './SuporteSidebarPanelSkeleton'
import { SupportPageHeaderSkeleton } from './SupportPageHeaderSkeleton'
import {
  suporteColumnFillClass,
  suporteColumnScrollClass,
  suporteColumnsGridClass,
} from './suportePageLayout'
import { SupportPageHeader } from './SupportPageHeader'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../layout/dashboardPageLayout'
import {
  prefeituraSupportMonthlyTrend,
  prefeituraSupportPriorityDistribution,
  prefeituraSupportStatusSummary,
  prefeituraSupportTickets,
} from '../../data/prefeituraSuporteMock'
import { useNewSupportTicketDrawer } from '../../hooks/useNewSupportTicketDrawer'
import { usePageSkeletonLoading } from '../../hooks/usePageSkeletonLoading'

export function PrefeituraSuportePageContent() {
  const isLoading = usePageSkeletonLoading(1200)
  const newTicketDrawer = useNewSupportTicketDrawer()

  return (
    <>
      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <SupportPageHeaderSkeleton variant="prefeitura" />
          ) : (
            <SupportPageHeader
              variant="prefeitura"
              onOpenNewTicket={newTicketDrawer.openDrawer}
            />
          )}
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
                <SuporteMainPanel
                  tickets={prefeituraSupportTickets}
                  showUbtColumn
                  readOnlyChat
                  defaultOpenOnly
                />
              )}
            </div>
          </div>

          <div className={suporteColumnScrollClass}>
            <div className={suporteColumnFillClass}>
              {isLoading ? (
                <SuporteSidebarPanelSkeleton />
              ) : (
                <SuporteSidebarPanel
                  statusSummary={prefeituraSupportStatusSummary}
                  priorityDistribution={prefeituraSupportPriorityDistribution}
                  monthlyTrend={prefeituraSupportMonthlyTrend}
                  monthlyTotal={prefeituraSupportTickets.length}
                  summaryTitle="Chamados da rede municipal"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {newTicketDrawer.drawerElement}
    </>
  )
}
