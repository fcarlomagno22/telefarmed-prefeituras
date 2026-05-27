import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraNotification } from '../../../data/prefeituraNotificacoesMock'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  buildPrefeituraNotificationOriginBadge,
  buildPrefeituraNotificationPriorityBadge,
  formatPrefeituraNotificationDate,
  getPrefeituraNotificationAudienceLabel,
  getPrefeituraNotificationOriginLabel,
} from './prefeituraNotificacoesUi'

type PrefeituraNotificacoesDetailModalProps = {
  open: boolean
  notification: PrefeituraNotification | null
  onClose: () => void
}

export function PrefeituraNotificacoesDetailModal({
  open,
  notification,
  onClose,
}: PrefeituraNotificacoesDetailModalProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open || !notification) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar notificação"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prefeitura-notificacao-detail-title"
        className="relative flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]"
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[var(--brand-primary-light)]/30 to-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>

          <h2
            id="prefeitura-notificacao-detail-title"
            className="pr-10 text-lg font-bold leading-snug text-gray-900 sm:text-xl"
          >
            {notification.title}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            {formatPrefeituraNotificationDate(notification.sentAt)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <SituationStatusBadge
              config={buildPrefeituraNotificationOriginBadge(notification.origin)}
              widthClass="w-[5.5rem]"
            />
            <SituationStatusBadge
              config={buildPrefeituraNotificationPriorityBadge(notification.priority)}
              widthClass="w-[5.5rem]"
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
          <dl className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">De</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">{notification.senderLabel}</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Para</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">
                {notification.recipientLabel}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Origem</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">
                {getPrefeituraNotificationOriginLabel(notification.origin)}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                Destinatário
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">
                {getPrefeituraNotificationAudienceLabel(notification.audience)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
            {notification.body}
          </p>

          {notification.unitName ? (
            <p className="mt-3 text-xs text-gray-500">
              Unidade relacionada:{' '}
              <span className="font-semibold text-gray-700">{notification.unitName}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
