import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../../../config/brand'
import { MinhaCandidaturaDrawerContent } from './MinhaCandidaturaDrawerContent'

const drawerShellClass =
  'absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-gray-200/90 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none'

type MinhaCandidaturaDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
}

export function MinhaCandidaturaDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
}: MinhaCandidaturaDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setSessionKey((current) => current + 1)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
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
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Fechar"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="minha-candidatura-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === 'transform') {
            onTransitionEnd()
          }
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="minha-candidatura-drawer-title" className="text-lg font-bold text-gray-900">
              Corrigir cadastro
            </h2>
            <p className="text-xs text-gray-500">Corrija tudo e envie de uma vez</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {isActive ? <MinhaCandidaturaDrawerContent key={sessionKey} /> : null}

        <footer className="shrink-0 border-t border-gray-100 bg-white px-5 py-4">
          <div className="flex justify-center">
            <img
              src={brand.logoUrl}
              alt={brand.appName}
              className="h-9 w-auto max-w-[200px] object-contain"
            />
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  )
}
