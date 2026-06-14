import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AdminBroadcast } from '../../../data/adminNotificacoesMock'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import {
  buildAdminNotificationPriorityBadge,
  buildAdminTargetChannelBadge,
  formatAdminNotificationDate,
} from './adminNotificacoesUi'

type AdminNotificacoesDetailModalProps = {
  open: boolean
  broadcast: AdminBroadcast | null
  onClose: () => void
}

export function AdminNotificacoesDetailModal({
  open,
  broadcast,
  onClose,
}: AdminNotificacoesDetailModalProps) {
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

  if (!open || !broadcast) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar detalhes"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-broadcast-detail-title"
        className="relative flex max-h-[min(90dvh,42rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[var(--brand-primary-light)]/30 to-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="admin-broadcast-detail-title" className="pr-10 text-lg font-bold text-gray-900">
            {broadcast.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{formatAdminNotificationDate(broadcast.sentAt)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SituationStatusBadge
              config={buildAdminNotificationPriorityBadge(broadcast.priority)}
              widthClass="w-[5.5rem]"
            />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{broadcast.body}</p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Enviado por</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">{broadcast.sentBy}</dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Destinatários</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">
                {broadcast.recipientCount} no total
              </dd>
            </div>
          </dl>
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Canais</p>
            {broadcast.targets.map((target) => (
              <div
                key={`${target.channel}-${target.audienceScope ?? target.mode}`}
                className="rounded-xl border border-gray-100 bg-white px-3 py-3 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SituationStatusBadge
                    config={buildAdminTargetChannelBadge(target.channel)}
                    widthClass="w-[5.75rem]"
                  />
                  <span className="text-xs text-gray-500">
                    {target.channel === 'medico'
                      ? target.recipientLabels[0] ?? 'Profissionais'
                      : `${target.mode === 'all' ? 'Todas' : 'Selecionadas'} · ${target.count} destinatário${target.count === 1 ? '' : 's'}`}
                  </span>
                </div>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {target.recipientLabels.map((label) => (
                    <li
                      key={label}
                      className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
