import { useCallback, useMemo, useState } from 'react'
import { UbtNotificacoesComposeDrawer } from '../components/ubt/notificacoes/UbtNotificacoesComposeDrawer'
import { UbtNotificacoesMainPanel } from '../components/ubt/notificacoes/UbtNotificacoesMainPanel'
import { UbtNotificacoesSidebarPanel } from '../components/ubt/notificacoes/UbtNotificacoesSidebarPanel'
import { PrefeituraNotificacoesMainPanelSkeleton } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesMainPanelSkeleton'
import { PrefeituraNotificacoesSidebarPanelSkeleton } from '../components/prefeitura/notificacoes/PrefeituraNotificacoesSidebarPanelSkeleton'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { brand } from '../config/brand'
import { currentUbtUnit } from '../config/ubtSession'
import { computeUbtNotificacoesKpiCards } from '../data/ubtNotificacoesMock'
import type { PrefeituraNotification } from '../data/prefeituraNotificacoesMock'
import { useUbtNotificationsState } from '../contexts/UbtNotificacoesContext'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { KpiCardsRowSkeleton } from '../components/prefeitura/skeletons/prefeituraSkeletonUi'

const operatorSender = `${currentUbtUnit.name} · ${brand.operatorName}`

export function UbtNotificacoesPage() {
  useBrandTheme()
  const isLoading = usePageSkeletonLoading(1200)
  const [notifications, setNotifications] = useUbtNotificationsState()
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeClosing, setComposeClosing] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const kpiCards = useMemo(() => computeUbtNotificacoesKpiCards(notifications), [notifications])

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

  const handleSendToGestao = useCallback(
    (payload: { title: string; body: string; priority: 'normal' | 'important' }) => {
      const now = new Date().toISOString()
      const newNotification: PrefeituraNotification = {
        id: `ubt-sent-${Date.now()}`,
        direction: 'sent',
        origin: 'ubt',
        audience: 'contract_manager',
        title: payload.title,
        body: payload.body,
        sentAt: now,
        readAt: now,
        unitId: currentUbtUnit.id,
        unitName: currentUbtUnit.name,
        senderLabel: operatorSender,
        recipientLabel: 'Gestão do contrato municipal',
        priority: payload.priority,
      }

      setNotifications((prev) => [newNotification, ...prev])
      showToast('Notificação enviada para a gestão municipal.', 'success')
    },
    [setNotifications, showToast],
  )

  return (
    <>
      <DashboardLayout>
        <div className={dashboardPageShellClass} aria-busy={isLoading}>
          <div className={dashboardPageHeaderWrapClass}>
            {isLoading ? (
              <DashboardPageHeaderSkeleton />
            ) : (
              <DashboardPageHeader
                title="Notificações"
                subtitle="Leia comunicados da Telefarmed e da gestão municipal; envie mensagens apenas para a administração do contrato"
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
                items={kpiCards}
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
                  <UbtNotificacoesMainPanel
                    notifications={notifications}
                    onNotificationsChange={setNotifications}
                  />
                )}
              </div>

              <div className="flex h-full min-h-0 min-w-0 flex-col max-xl:min-h-0">
                {isLoading ? (
                  <PrefeituraNotificacoesSidebarPanelSkeleton />
                ) : (
                  <UbtNotificacoesSidebarPanel
                    notifications={notifications}
                    onCompose={openCompose}
                  />
                )}
              </div>
            </section>
          </div>
        </div>
      </DashboardLayout>

      <UbtNotificacoesComposeDrawer
        open={composeOpen}
        closing={composeClosing}
        onClose={closeCompose}
        onTransitionEnd={handleComposeTransitionEnd}
        onSend={handleSendToGestao}
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
