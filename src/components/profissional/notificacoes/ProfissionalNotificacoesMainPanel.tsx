import { CheckCheck, Eye, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import { useProfissionalNotificacoesOptional } from '../../../contexts/ProfissionalNotificacoesContext'
import { dashboardMainPanelSurfaceClass } from '../../layout/dashboardPageLayout'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { Toast, type ToastVariant } from '../../ui/Toast'
import { PrefeituraNotificacoesDetailModal } from '../../prefeitura/notificacoes/PrefeituraNotificacoesDetailModal'
import {
  buildPrefeituraNotificationOriginBadge,
  formatPrefeituraNotificationDateCompact,
  isPrefeituraNotificationUnread,
} from '../../prefeitura/notificacoes/prefeituraNotificacoesUi'

const thClass = 'px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500'
const tdClass = 'px-2 py-3 text-center align-middle'

type StatusFilter = 'all' | 'unread' | 'read'
type OriginFilter = 'all' | 'telefarmed' | 'contract_manager' | 'profissional'

const statusOptions = [
  { value: 'all', label: 'Status: Todas' },
  { value: 'unread', label: 'Não lidas' },
  { value: 'read', label: 'Lidas' },
]

const originOptions = [
  { value: 'all', label: 'Origem: Todas' },
  { value: 'telefarmed', label: 'Telefarmed' },
  { value: 'contract_manager', label: 'Gestão municipal' },
  { value: 'profissional', label: 'Corpo clínico' },
]

const TABLE_COLUMN_COUNT = 8

function priorityLabel(priority: PrefeituraNotification['priority']) {
  return priority === 'important' ? 'Importante' : 'Normal'
}

type ProfissionalNotificacoesMainPanelProps = {
  notifications: PrefeituraNotification[]
  onNotificationsChange: (next: PrefeituraNotification[]) => void
}

export function ProfissionalNotificacoesMainPanel({
  notifications,
  onNotificationsChange,
}: ProfissionalNotificacoesMainPanelProps) {
  const notificacoesContext = useProfissionalNotificacoesOptional()
  const applyListFilters = notificacoesContext?.applyListFilters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailNotification, setDetailNotification] = useState<PrefeituraNotification | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const skipInitialFilters = useRef(true)

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (!applyListFilters) return

    if (skipInitialFilters.current) {
      skipInitialFilters.current = false
      return
    }

    const timer = window.setTimeout(
      () => {
        void applyListFilters({
          origin: originFilter === 'all' ? undefined : originFilter,
          read: statusFilter,
          search: search.trim() || undefined,
          page: 1,
          pageSize: 100,
        })
      },
      search.trim() ? 300 : 0,
    )

    return () => window.clearTimeout(timer)
  }, [search, statusFilter, originFilter, applyListFilters])

  const listTotal = notificacoesContext?.listTotal ?? notifications.length
  const isListLoading = notificacoesContext?.isListLoading ?? false
  const unreadInList = notifications.filter(isPrefeituraNotificationUnread).length

  function markAsRead(id: string) {
    if (notificacoesContext) {
      void notificacoesContext.markAsRead(id)
      return
    }
    onNotificationsChange(
      notifications.map((item) =>
        item.id === id && item.direction === 'inbox' && item.readAt === null
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    )
  }

  function markAllInboxRead() {
    const unreadCount = notificacoesContext?.kpis.unreadCount ?? unreadInList
    if (unreadCount === 0) {
      showToast('Não há mensagens não lidas na caixa de entrada.', 'warning')
      return
    }

    if (notificacoesContext) {
      void notificacoesContext.markAllInboxRead().then((count) => {
        showToast(
          `${count} notificação${count === 1 ? '' : 'ões'} marcada${count === 1 ? '' : 's'} como lida${count === 1 ? '' : 's'}.`,
          'success',
        )
      })
      return
    }

    const now = new Date().toISOString()
    onNotificationsChange(
      notifications.map((item) =>
        item.direction === 'inbox' && item.readAt === null ? { ...item, readAt: now } : item,
      ),
    )
    showToast(
      `${unreadCount} notificação${unreadCount === 1 ? '' : 'ões'} marcada${unreadCount === 1 ? '' : 's'} como lida${unreadCount === 1 ? '' : 's'}.`,
      'success',
    )
  }

  function openDetail(item: PrefeituraNotification) {
    setDetailNotification(item)
    setDetailOpen(true)
    if (isPrefeituraNotificationUnread(item)) {
      markAsRead(item.id)
    }
  }

  function closeDetail() {
    setDetailOpen(false)
    setDetailNotification(null)
  }

  const displayedDetail = useMemo(() => {
    if (!detailNotification) return null
    return notifications.find((n) => n.id === detailNotification.id) ?? detailNotification
  }, [notifications, detailNotification])

  return (
    <>
      <section
        className={[
          dashboardMainPanelSurfaceClass,
          'flex min-h-0 flex-1 flex-col !shrink',
        ].join(' ')}
      >
        <header className="shrink-0 border-b border-gray-100 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Central de notificações</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {listTotal} mensagem
                {listTotal === 1 ? ' recebida' : 's recebidas'}
                {unreadInList > 0 ? ` · ${unreadInList} não lida${unreadInList === 1 ? '' : 's'}` : ''}
                {isListLoading ? ' · atualizando…' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllInboxRead}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
              Marcar todas como lidas
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                strokeWidth={2}
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por título ou remetente..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)]/40 focus:shadow-[0_0_0_3px_rgba(255,107,0,0.12)]"
              />
            </div>
            <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:w-[min(100%,24rem)]">
              <CustomSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
                options={statusOptions}
              />
              <CustomSelect
                value={originFilter}
                onChange={(value) => setOriginFilter(value as OriginFilter)}
                options={originOptions}
              />
            </div>
          </div>
        </header>

        <div
          className={[
            'min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white transition-opacity',
            isListLoading ? 'pointer-events-none opacity-60' : '',
          ].join(' ')}
        >
          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col style={{ width: '8%' }} />
              <col style={{ width: '26%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '6%' }} />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
              <tr>
                <th className={thClass}>Leitura</th>
                <th className={thClass}>Assunto</th>
                <th className={thClass}>De</th>
                <th className={thClass}>Para</th>
                <th className={thClass}>Origem</th>
                <th className={thClass}>Prioridade</th>
                <th className={thClass}>Data</th>
                <th className={thClass}>Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {notifications.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_COLUMN_COUNT}
                    className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6"
                  >
                    {isListLoading
                      ? 'Carregando notificações…'
                      : 'Nenhuma notificação para os filtros aplicados.'}
                  </td>
                </tr>
              ) : (
                notifications.map((item) => {
                  const unread = isPrefeituraNotificationUnread(item)

                  return (
                    <tr
                      key={item.id}
                      className={[
                        'text-gray-800 transition hover:bg-slate-50/80',
                        unread ? 'bg-[var(--brand-primary-light)]/20' : '',
                      ].join(' ')}
                    >
                      <td className={tdClass}>
                        {unread ? (
                          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Nova
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-gray-400">Lida</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="mx-auto block w-full max-w-full truncate text-center"
                          title={item.title}
                        >
                          <span
                            className={[
                              'text-xs leading-snug',
                              unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800',
                            ].join(' ')}
                          >
                            {item.title}
                          </span>
                        </button>
                      </td>
                      <td className={tdClass}>
                        <p
                          className="mx-auto max-w-full truncate text-[11px] font-medium text-gray-800"
                          title={item.senderLabel}
                        >
                          {item.senderLabel}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <p
                          className="mx-auto max-w-full truncate text-[11px] font-medium text-gray-800"
                          title={item.recipientLabel}
                        >
                          {item.recipientLabel}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <div className="flex justify-center">
                          <SituationStatusBadge
                            config={buildPrefeituraNotificationOriginBadge(item.origin)}
                            widthClass="w-[4.75rem]"
                          />
                        </div>
                      </td>
                      <td className={tdClass}>
                        <span
                          className={[
                            'inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                            item.priority === 'important'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-gray-100 text-gray-600',
                          ].join(' ')}
                        >
                          {priorityLabel(item.priority)}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <p className="text-[10px] font-medium tabular-nums text-gray-600">
                          {formatPrefeituraNotificationDateCompact(item.sentAt)}
                        </p>
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                          aria-label={`Ver notificação: ${item.title}`}
                        >
                          <Eye className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <footer className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
          <p className="text-xs text-gray-500">
            {notifications.length === 0
              ? 'Nenhuma mensagem na lista filtrada'
              : `${notifications.length} notificação${notifications.length === 1 ? '' : 'ões'} exibida${notifications.length === 1 ? '' : 's'}`}
          </p>
        </footer>
      </section>

      <PrefeituraNotificacoesDetailModal
        open={detailOpen}
        notification={displayedDetail}
        onClose={closeDetail}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={dismissToast}
      />
    </>
  )
}
