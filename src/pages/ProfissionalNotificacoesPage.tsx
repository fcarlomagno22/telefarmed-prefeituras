import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ProfissionalNotificacoesMainPanel } from '../components/profissional/notificacoes/ProfissionalNotificacoesMainPanel'
import { ProfissionalNotificacoesSidebarPanel } from '../components/profissional/notificacoes/ProfissionalNotificacoesSidebarPanel'
import { ProfissionalPageHeader } from '../components/profissional/ProfissionalPageHeader'
import { ProfissionalPageHeaderSkeleton } from '../components/profissional/ProfissionalPageHeaderSkeleton'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { ProfissionalNotificacoesMainPanelSkeleton } from '../components/profissional/skeletons/ProfissionalNotificacoesMainPanelSkeleton'
import { ProfissionalNotificacoesSidebarPanelSkeleton } from '../components/profissional/skeletons/ProfissionalNotificacoesSidebarPanelSkeleton'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import {
  useProfissionalNotificacoes,
  useProfissionalNotificationsState,
} from '../contexts/ProfissionalNotificacoesContext'
import { buildProfissionalNotificacoesKpiCards } from '../utils/notificacoes/portalNotificacoesKpiCards'
import { shouldShowPortalPageLoadingBlock } from '../utils/portal/portalPageLoading'
import { KpiCardsRowSkeleton } from '../components/prefeitura/skeletons/prefeituraSkeletonUi'

export function ProfissionalNotificacoesPage() {
  const { pathname } = useLocation()
  const meta = findProfissionalNavByPathname(pathname)
  const { kpis, isLoading, loadError } = useProfissionalNotificacoes()
  const [notifications, setNotifications] = useProfissionalNotificationsState()

  const kpiCards = useMemo(
    () => buildProfissionalNotificacoesKpiCards(kpis, notifications),
    [kpis, notifications],
  )
  const showLoadingBlock = shouldShowPortalPageLoadingBlock(
    isLoading,
    notifications.length > 0 || kpis.unreadCount > 0,
  )

  return (
    <div className={dashboardPageShellClass} aria-busy={showLoadingBlock} aria-label="Notificações">
      <div className={dashboardPageHeaderWrapClass}>
        {showLoadingBlock ? (
          <ProfissionalPageHeaderSkeleton />
        ) : (
          <ProfissionalPageHeader
            title={meta?.title ?? 'Notificações'}
            description={
              meta?.description ??
              'Comunicados da Telefarmed — somente leitura.'
            }
          />
        )}
      </div>

      <div
        className={[
          dashboardPageScrollPaddingClass,
          'mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-5',
        ].join(' ')}
      >
        {showLoadingBlock ? (
          <KpiCardsRowSkeleton count={4} className="shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4" />
        ) : (
          <KpiStatCards items={kpiCards} className="shrink-0 sm:grid-cols-2 xl:grid-cols-4" />
        )}

        {loadError ? (
          <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <section
          className={[dashboardTwoColumnLayoutClass, 'min-h-0 flex-1 overflow-hidden'].join(' ')}
        >
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {showLoadingBlock ? (
              <ProfissionalNotificacoesMainPanelSkeleton />
            ) : (
              <ProfissionalNotificacoesMainPanel
                notifications={notifications}
                onNotificationsChange={setNotifications}
              />
            )}
          </div>

          <div className="flex h-full min-h-0 min-w-0 flex-col max-xl:min-h-0">
            {showLoadingBlock ? (
              <ProfissionalNotificacoesSidebarPanelSkeleton />
            ) : (
              <ProfissionalNotificacoesSidebarPanel notifications={notifications} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
