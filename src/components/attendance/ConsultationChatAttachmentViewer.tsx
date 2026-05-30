import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FileText, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import type { ConsultationChatAttachment } from './consultationChatTypes'

const IMAGE_ZOOM_MIN = 0.5
const IMAGE_ZOOM_MAX = 4
const IMAGE_ZOOM_STEP = 0.25
const PDF_ZOOM_MIN = 0.75
const PDF_ZOOM_MAX = 2.5
const PDF_ZOOM_STEP = 0.25

type ConsultationChatAttachmentViewerProps = {
  attachment: ConsultationChatAttachment
  onClose: () => void
  tourTargetId?: string
}

export function ConsultationChatAttachmentViewer({
  attachment,
  onClose,
  tourTargetId,
}: ConsultationChatAttachmentViewerProps) {
  const isImage = attachment.type === 'image'
  const [imageZoom, setImageZoom] = useState(1)
  const [pdfZoom, setPdfZoom] = useState(1)
  const viewportRef = useRef<HTMLDivElement>(null)

  const clampImageZoom = useCallback((value: number) => {
    return Math.min(IMAGE_ZOOM_MAX, Math.max(IMAGE_ZOOM_MIN, value))
  }, [])

  const clampPdfZoom = useCallback((value: number) => {
    return Math.min(PDF_ZOOM_MAX, Math.max(PDF_ZOOM_MIN, value))
  }, [])

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

  useEffect(() => {
    const node = viewportRef.current
    if (!node) return

    function handleWheel(event: WheelEvent) {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      if (isImage) {
        setImageZoom((current) =>
          clampImageZoom(current + (event.deltaY < 0 ? IMAGE_ZOOM_STEP : -IMAGE_ZOOM_STEP)),
        )
      } else {
        setPdfZoom((current) =>
          clampPdfZoom(current + (event.deltaY < 0 ? PDF_ZOOM_STEP : -PDF_ZOOM_STEP)),
        )
      }
    }

    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [isImage, clampImageZoom, clampPdfZoom])

  return createPortal(
    <div
      data-tour={tourTargetId}
      className="fixed inset-0 z-[10000] flex flex-col bg-gray-950/95"
    >
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-sm font-medium text-white">{attachment.name}</p>

        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 p-1">
            <button
              type="button"
              onClick={() =>
                isImage
                  ? setImageZoom((z) => clampImageZoom(z - IMAGE_ZOOM_STEP))
                  : setPdfZoom((z) => clampPdfZoom(z - PDF_ZOOM_STEP))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/15"
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" strokeWidth={2} />
            </button>
            <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-white/90">
              {Math.round((isImage ? imageZoom : pdfZoom) * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                isImage
                  ? setImageZoom((z) => clampImageZoom(z + IMAGE_ZOOM_STEP))
                  : setPdfZoom((z) => clampPdfZoom(z + PDF_ZOOM_STEP))
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/15"
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => (isImage ? setImageZoom(1) : setPdfZoom(1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition hover:bg-white/15"
              aria-label="Redefinir zoom"
            >
              <RotateCcw className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
      </header>

      {isImage ? (
        <div
          ref={viewportRef}
          className="relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-8"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            draggable={false}
            style={{ transform: `scale(${imageZoom})` }}
            className="max-h-none max-w-none origin-center object-contain transition-transform duration-150"
          />
        </div>
      ) : (
        <div
          ref={viewportRef}
          className="relative z-10 min-h-0 flex-1 overflow-auto bg-gray-900 p-4 sm:p-6"
        >
          <div
            className="mx-auto origin-top transition-transform duration-150"
            style={{ transform: `scale(${pdfZoom})` }}
          >
            <iframe
              src={`${attachment.url}#toolbar=0&navpanes=0`}
              title={attachment.name}
              className="h-[calc(100dvh-6.5rem)] w-full min-w-[min(100%,920px)] rounded-lg border border-white/10 bg-white shadow-2xl"
            />
          </div>
        </div>
      )}

      {!isImage ? (
        <p className="relative z-10 shrink-0 border-t border-white/10 px-4 py-2 text-center text-[11px] text-white/60">
          Use os botões de zoom ou Ctrl + scroll para ajustar a visualização do PDF.
        </p>
      ) : (
        <p className="relative z-10 shrink-0 border-t border-white/10 px-4 py-2 text-center text-[11px] text-white/60">
          Ctrl + scroll ou os botões para ampliar e reduzir a imagem.
        </p>
      )}
    </div>,
    document.body,
  )
}

type ConsultationChatAttachmentPreviewProps = {
  attachment: ConsultationChatAttachment
  align: 'start' | 'end'
}

export function ConsultationChatAttachmentPreview({
  attachment,
  align,
}: ConsultationChatAttachmentPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false)

  if (attachment.type === 'image') {
    return (
      <>
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="block overflow-hidden rounded-xl border border-gray-200/90 transition hover:ring-2 hover:ring-[var(--brand-primary)]/25"
          aria-label={`Abrir imagem ${attachment.name}`}
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-h-40 max-w-[220px] object-cover sm:max-h-44 sm:max-w-[260px]"
          />
        </button>
        {viewerOpen ? (
          <ConsultationChatAttachmentViewer
            attachment={attachment}
            onClose={() => setViewerOpen(false)}
          />
        ) : null}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        className={[
          'flex max-w-[260px] items-center gap-3 rounded-xl border border-gray-200/90 px-3 py-2.5 text-left transition hover:border-[var(--brand-primary)]/30 hover:bg-white/80',
          align === 'end' ? 'bg-white/70' : 'bg-gray-50/90',
        ].join(' ')}
        aria-label={`Abrir PDF ${attachment.name}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <FileText className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-900">{attachment.name}</span>
          <span className="text-[11px] text-gray-500">PDF · Toque para visualizar</span>
        </span>
      </button>
      {viewerOpen ? (
        <ConsultationChatAttachmentViewer
          attachment={attachment}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  )
}
