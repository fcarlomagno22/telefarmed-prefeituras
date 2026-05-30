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
import { PrefeituraNotificacoesMainPanelSkeleton } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesMainPanelSkeleton'
import { PrefeituraNotificacoesSidebarPanelSkeleton } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesSidebarPanelSkeleton'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { findProfissionalNavByPathname } from '../config/profissionalSidebarNav'
import { useProfissionalNotificationsState } from '../contexts/ProfissionalNotificacoesContext'
import { computeProfissionalNotificacoesKpiCards } from '../data/profissionalNotificacoesMock'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import { KpiCardsRowSkeleton } from '../components/prefeitura/skeletons/prefeituraSkeletonUi'

export function ProfissionalNotificacoesPage() {
  const { pathname } = useLocation()
  const meta = findProfissionalNavByPathname(pathname)
  const isLoading = usePageSkeletonLoading(1200)
  const [notifications, setNotifications] = useProfissionalNotificationsState()

  const kpiCards = useMemo(() => computeProfissionalNotificacoesKpiCards(notifications), [notifications])

  return (
    <div className={dashboardPageShellClass} aria-busy={isLoading} aria-label="Notificações">
      <div className={dashboardPageHeaderWrapClass}>
        {isLoading ? (
          <ProfissionalPageHeaderSkeleton />
        ) : (
          <ProfissionalPageHeader
            title={meta?.title ?? 'Notificações'}
            description={
              meta?.description ??
              'Comunicados da Telefarmed, da gestão municipal e do corpo clínico — somente leitura.'
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
        {isLoading ? (
          <KpiCardsRowSkeleton count={4} className="shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4" />
        ) : (
          <KpiStatCards items={kpiCards} className="shrink-0 sm:grid-cols-2 xl:grid-cols-4" />
        )}

        <section
          className={[dashboardTwoColumnLayoutClass, 'min-h-0 flex-1 overflow-hidden'].join(' ')}
        >
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
            {isLoading ? (
              <PrefeituraNotificacoesMainPanelSkeleton />
            ) : (
              <ProfissionalNotificacoesMainPanel
                notifications={notifications}
                onNotificationsChange={setNotifications}
              />
            )}
          </div>

          <div className="flex h-full min-h-0 min-w-0 flex-col max-xl:min-h-0">
            {isLoading ? (
              <PrefeituraNotificacoesSidebarPanelSkeleton />
            ) : (
              <ProfissionalNotificacoesSidebarPanel notifications={notifications} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
