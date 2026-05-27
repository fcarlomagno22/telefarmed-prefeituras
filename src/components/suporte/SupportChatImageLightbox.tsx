import { Download, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type SupportChatImageLightboxProps = {
  url: string
  name: string
  onClose: () => void
}

export function SupportChatImageLightbox({ url, name, onClose }: SupportChatImageLightboxProps) {
  useEffect(() => {
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
  }, [onClose])

  function handleDownload() {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.rel = 'noopener'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex flex-col bg-gray-950/95">
      <button
        type="button"
        aria-label="Fechar visualização"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-sm font-medium text-white">{name}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            <Download className="h-4 w-4" />
            Baixar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div
        className="relative z-10 flex min-h-0 flex-1 items-center justify-center p-4 sm:p-8"
        onClick={onClose}
        role="presentation"
      >
        <img
          src={url}
          alt={name}
          onClick={(event) => event.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>,
    document.body,
  )
}
