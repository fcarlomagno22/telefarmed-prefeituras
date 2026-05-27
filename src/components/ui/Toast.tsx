import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ToastVariant = 'success' | 'warning' | 'error'

type ToastProps = {
  message: string
  visible: boolean
  onClose: () => void
  durationMs?: number
  variant?: ToastVariant
  actionLabel?: string
  onAction?: () => void
  /** Render inside a positioned parent (e.g. drawer) instead of portaling to document.body */
  anchored?: boolean
}

const toastVariantClass: Record<ToastVariant, string> = {
  success: 'bg-emerald-600 shadow-[0_8px_24px_rgba(5,150,105,0.45)]',
  warning: 'bg-amber-500 shadow-[0_8px_24px_rgba(245,158,11,0.45)]',
  error: 'bg-red-600 shadow-[0_8px_24px_rgba(220,38,38,0.45)]',
}

const EXIT_MS = 320

export function Toast({
  message,
  visible,
  onClose,
  durationMs = 3000,
  variant = 'success',
  actionLabel,
  onAction,
  anchored = false,
}: ToastProps) {
  const [render, setRender] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!visible) {
      setActive(false)
      if (!render) return
      const timer = window.setTimeout(() => setRender(false), EXIT_MS)
      return () => window.clearTimeout(timer)
    }

    setRender(true)
    const enterFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setActive(true))
    })

    const hideTimer = window.setTimeout(() => setActive(false), durationMs)
    const closeTimer = window.setTimeout(onClose, durationMs + EXIT_MS)

    return () => {
      cancelAnimationFrame(enterFrame)
      window.clearTimeout(hideTimer)
      window.clearTimeout(closeTimer)
    }
  }, [visible, durationMs, onClose])

  if (!render) return null

  const positionClass = anchored
    ? 'absolute bottom-28 right-5 z-50 max-w-[min(100%,20rem)] sm:right-6'
    : 'fixed bottom-6 right-6 z-[10001] max-w-sm'

  const toast = (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out motion-reduce:transition-none ${positionClass} ${toastVariantClass[variant]} ${
        active ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 leading-snug">{message}</span>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition hover:bg-white/20"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  )

  if (anchored) return toast

  return createPortal(toast, document.body)
}
