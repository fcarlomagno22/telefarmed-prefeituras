import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastProps = {
  message: string
  visible: boolean
  onClose: () => void
  durationMs?: number
}

const EXIT_MS = 320

export function Toast({
  message,
  visible,
  onClose,
  durationMs = 3000,
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

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[10001] max-w-sm rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(5,150,105,0.45)] transition-all duration-300 ease-out motion-reduce:transition-none ${
        active ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {message}
    </div>,
    document.body,
  )
}
