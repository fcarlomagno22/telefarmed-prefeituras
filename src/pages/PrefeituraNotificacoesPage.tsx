import { useCallback, useState } from 'react'
import { usePrefeituraNotificationsState } from '../contexts/PrefeituraNotificacoesContext'
import { PrefeituraRedeBroadcastDrawer } from '../components/prefeitura/rede/PrefeituraRedeBroadcastDrawer'
import { PrefeituraNotificacoesMainPanel } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesMainPanel'
import { PrefeituraNotificacoesMainPanelSkeleton } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesMainPanelSkeleton'
import { PrefeituraNotificacoesSidebarPanel } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesSidebarPanel'
import { PrefeituraNotificacoesSidebarPanelSkeleton } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesSidebarPanelSkeleton'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { prefeituraNotificacoesKpiCards } from '../data/prefeituraNotificacoesMock'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import { KpiCardsRowSkeleton } from '../components/prefeitura/skeletons/prefeituraSkeletonUi'

export function PrefeituraNotificacoesPage() {
  const isLoading = usePageSkeletonLoading(1200)
  const [notifications, setNotifications] = usePrefeituraNotificationsState()
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeClosing, setComposeClosing] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const openCompose = useCallback(() => {
    setComposeClosing(false)
    setComposeOpen(true)
  }, [])

  const closeCompose = useCallback(() => {
    if (!composeOpen || composeClosing) return
    setComposeClosing(true)
  }, [composeOpen, composeClosing])

  const handleComposeTransitionEnd = useCallback(() => {
    if (!composeClosing) return
    setComposeOpen(false)
    setComposeClosing(false)
  }, [composeClosing])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  return (
    <>
      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Notificações"
              subtitle="Comunicação entre Telefarmed, gestão do contrato e unidades da rede"
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
            <KpiCardsRowSkeleton
              count={4}
              className="shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            />
          ) : (
            <KpiStatCards
              items={prefeituraNotificacoesKpiCards}
              className="shrink-0 sm:grid-cols-2 xl:grid-cols-4"
            />
          )}

          <section
            className={[
              dashboardTwoColumnLayoutClass,
              'min-h-0 flex-1 overflow-hidden',
            ].join(' ')}
          >
              <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                {isLoading ? (
                  <PrefeituraNotificacoesMainPanelSkeleton />
                ) : (
                  <PrefeituraNotificacoesMainPanel
                    notifications={notifications}
                    onNotificationsChange={setNotifications}
                  />
                )}
              </div>

              <div className="flex h-full min-h-0 min-w-0 flex-col max-xl:min-h-0">
                {isLoading ? (
                  <PrefeituraNotificacoesSidebarPanelSkeleton />
                ) : (
                  <PrefeituraNotificacoesSidebarPanel onCompose={openCompose} />
                )}
              </div>
          </section>
        </div>
      </div>

      <PrefeituraRedeBroadcastDrawer
        open={composeOpen}
        closing={composeClosing}
        onClose={closeCompose}
        onTransitionEnd={handleComposeTransitionEnd}
        onSent={(message) => showToast(message, 'success')}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  )
}
