import { useCallback, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminNotificacoesComposeDrawer } from '../components/admin/notificacoes/AdminNotificacoesComposeDrawer'
import { AdminNotificacoesMainPanel } from '../components/admin/notificacoes/AdminNotificacoesMainPanel'
import { AdminNotificacoesSidebarPanel } from '../components/admin/notificacoes/AdminNotificacoesSidebarPanel'
import { AdminNotificacoesMainPanelSkeleton } from '../components/admin/notificacoes/skeletons/AdminNotificacoesMainPanelSkeleton'
import { AdminNotificacoesSidebarPanelSkeleton } from '../components/admin/notificacoes/skeletons/AdminNotificacoesSidebarPanelSkeleton'
import { AdminNotificacoesPageHeaderSkeleton } from '../components/admin/notificacoes/skeletons/adminNotificacoesSkeletonUi'
import { KpiCardsRowSkeleton } from '../components/prefeitura/skeletons/prefeituraSkeletonUi'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import type { AdminBroadcast } from '../data/adminNotificacoesMock'
import { useAdminNotificacoesPage } from '../hooks/useAdminNotificacoesPage'
import { useAdminNotificacoesRecipients } from '../hooks/useAdminNotificacoesRecipients'
import { useAdminPageAccess } from '../hooks/useAdminPageAccess'

export function AdminNotificacoesPage() {
  const { pageAccess } = useAdminPageAccess('notificacoes')
  const { canInsert } = pageAccess
  const { broadcasts, kpiCards, isLoading, loadError, reload, sendBroadcast, profissionaisStats } =
    useAdminNotificacoesPage()
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeClosing, setComposeClosing] = useState(false)
  const recipients = useAdminNotificacoesRecipients(composeOpen)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  const showSkeleton = isLoading

  const openCompose = useCallback(() => {
    if (!canInsert) return
    setComposeClosing(false)
    setComposeOpen(true)
  }, [canInsert])

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
    async (broadcast: AdminBroadcast) => {
      showToast(
        `Comunicado enviado para ${broadcast.recipientCount} destinatário${broadcast.recipientCount === 1 ? '' : 's'}.`,
        'success',
      )
    },
    [showToast],
  )

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Notificações" aria-busy={showSkeleton}>
        <div className={dashboardPageHeaderWrapClass}>
          {showSkeleton ? (
            <AdminNotificacoesPageHeaderSkeleton />
          ) : (
            <AdminPageHeader
              sectionLabel="Plataforma"
              title="Notificações"
              description="Envie comunicados para prefeituras, UBTs ou toda a rede. Escolha uma, várias ou todos os destinatários de cada canal."
            />
          )}
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-5',
          ].join(' ')}
        >
          {showSkeleton ? (
            <KpiCardsRowSkeleton
              count={4}
              className="shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            />
          ) : (
            <>
              {loadError ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p>{loadError}</p>
                  <button
                    type="button"
                    onClick={() => void reload()}
                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : null}
              <KpiStatCards
                items={kpiCards}
                className="shrink-0 sm:grid-cols-2 xl:grid-cols-4"
              />
            </>
          )}

          <section
            className={[
              dashboardTwoColumnLayoutClass,
              'min-h-0 flex-1 overflow-hidden',
            ].join(' ')}
          >
            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
              {showSkeleton ? (
                <AdminNotificacoesMainPanelSkeleton />
              ) : (
                <AdminNotificacoesMainPanel broadcasts={broadcasts} />
              )}
            </div>

            <div className="flex h-full min-h-0 min-w-0 flex-col max-xl:min-h-0">
              {showSkeleton ? (
                <AdminNotificacoesSidebarPanelSkeleton />
              ) : (
                <AdminNotificacoesSidebarPanel
                  broadcasts={broadcasts}
                  onCompose={openCompose}
                  canInsert={canInsert}
                />
              )}
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
        sendBroadcast={sendBroadcast}
        profissionaisStats={profissionaisStats}
        profissionais={recipients.profissionais}
        prefeituras={recipients.prefeituras}
        ubts={recipients.ubts}
        prefeituraUsers={recipients.prefeituraUsers}
        ubtUsers={recipients.ubtUsers}
        recipientsLoading={recipients.isLoading}
        recipientsError={recipients.loadError}
        onRetryRecipients={recipients.reload}
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
