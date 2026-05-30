import { useCallback, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminNotificacoesComposeDrawer } from '../components/admin/notificacoes/AdminNotificacoesComposeDrawer'
import { AdminNotificacoesMainPanel } from '../components/admin/notificacoes/AdminNotificacoesMainPanel'
import { AdminNotificacoesSidebarPanel } from '../components/admin/notificacoes/AdminNotificacoesSidebarPanel'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import {
  adminBroadcastsInitial,
  adminNotificacoesKpiCards,
  type AdminBroadcast,
} from '../data/adminNotificacoesMock'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

export function AdminNotificacoesPage() {
  const isLoading = usePageSkeletonLoading(1200)
  const [broadcasts, setBroadcasts] = useState<AdminBroadcast[]>(adminBroadcastsInitial)
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

  const handleSent = useCallback(
    (broadcast: AdminBroadcast) => {
      setBroadcasts((current) => [broadcast, ...current])
      showToast(
        `Comunicado enviado para ${broadcast.recipientCount} destinatário${broadcast.recipientCount === 1 ? '' : 's'}.`,
        'success',
      )
    },
    [showToast],
  )

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Notificações" aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          <AdminPageHeader
            sectionLabel="Plataforma"
            title="Notificações"
            description="Envie comunicados para prefeituras, UBTs ou toda a rede. Escolha uma, várias ou todos os destinatários de cada canal."
          />
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-5',
          ].join(' ')}
        >
          {!isLoading ? (
            <KpiStatCards
              items={adminNotificacoesKpiCards}
              className="shrink-0 sm:grid-cols-2 xl:grid-cols-4"
            />
          ) : null}

          <section
            className={[
              dashboardTwoColumnLayoutClass,
              'min-h-0 flex-1 overflow-hidden',
            ].join(' ')}
          >
            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              {!isLoading ? <AdminNotificacoesMainPanel broadcasts={broadcasts} /> : null}
            </div>

            <div className="flex h-full min-h-0 min-w-0 flex-col max-xl:min-h-0">
              {!isLoading ? (
                <AdminNotificacoesSidebarPanel broadcasts={broadcasts} onCompose={openCompose} />
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <AdminNotificacoesComposeDrawer
        open={composeOpen}
        closing={composeClosing}
        onClose={closeCompose}
        onTransitionEnd={handleComposeTransitionEnd}
        onSent={handleSent}
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
