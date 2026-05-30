import { Send, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminBroadcast } from '../../../data/adminNotificacoesMock'
import { AdminNotificacoesComposeDrawerContent } from './AdminNotificacoesComposeDrawerContent'

type AdminNotificacoesComposeDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSent: (broadcast: AdminBroadcast) => void
}

export function AdminNotificacoesComposeDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
  onSent,
}: AdminNotificacoesComposeDrawerProps) {
  const [entered, setEntered] = useState(false)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar envio de notificação"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-notificacoes-compose-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[94vh] max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/35 to-white px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm">
                <Send className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <h2
                  id="admin-notificacoes-compose-title"
                  className="text-lg font-bold text-gray-900"
                >
                  Novo comunicado
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Envie para prefeituras, UBTs ou ambos — uma, várias ou todas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 sm:px-6 lg:px-8">
          <AdminNotificacoesComposeDrawerContent
            onSent={(broadcast) => {
              onSent(broadcast)
              onClose()
            }}
          />
        </div>
      </aside>
    </div>,
    document.body,
  )
}
