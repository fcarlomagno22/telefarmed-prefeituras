import { Download, ExternalLink, FileText, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ProfissionalPerfilDocument } from '../../../types/profissionalPerfil'
import {
  formatProfissionalPerfilDocumentDateTime,
  getProfissionalPerfilDocumentExtension,
  isProfissionalPerfilDocumentPreviewable,
  profissionalPerfilDocumentKindHints,
} from './profissionalPerfilDocumentsUi'
import { profissionalPerfilDocumentStatusConfig } from './profissionalPerfilUi'

type ProfissionalPerfilDocumentViewModalProps = {
  open: boolean
  document: ProfissionalPerfilDocument | null
  previewUrl?: string | null
  onClose: () => void
  onRequestUpdate?: (document: ProfissionalPerfilDocument) => void
}

export function ProfissionalPerfilDocumentViewModal({
  open,
  document: perfilDocument,
  previewUrl,
  onClose,
  onRequestUpdate,
}: ProfissionalPerfilDocumentViewModalProps) {
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

  if (!open || !perfilDocument) return null

  const status = profissionalPerfilDocumentStatusConfig[perfilDocument.status]
  const extension = getProfissionalPerfilDocumentExtension(perfilDocument.fileName)
  const canPreview =
    Boolean(previewUrl) || isProfissionalPerfilDocumentPreviewable(perfilDocument.fileName)
  const canReplace = perfilDocument.status === 'aprovado' || perfilDocument.status === 'vencido'
  const canDownload = Boolean(previewUrl)

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar visualização"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-document-view-title"
        className="relative flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[var(--brand-primary-light)]/25 to-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="perfil-document-view-title" className="pr-10 text-lg font-bold text-gray-900">
            {perfilDocument.label}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={[
                'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold',
                status.className,
              ].join(' ')}
            >
              {status.label}
            </span>
            <span className="text-xs text-gray-500">{extension}</span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div
            className={[
              'flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center',
              previewUrl ? 'p-2' : '',
            ].join(' ')}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Pré-visualização de ${perfilDocument.fileName}`}
                className="max-h-[16rem] w-full rounded-lg object-contain"
              />
            ) : canPreview ? (
              <>
                <FileText className="h-10 w-10 text-[var(--brand-primary)]" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-gray-900">{perfilDocument.fileName}</p>
                <p className="mt-1 max-w-xs text-xs text-gray-500">
                  Pré-visualização disponível após integração com o armazenamento. Use o download
                  para abrir o arquivo enviado.
                </p>
              </>
            ) : (
              <>
                <FileText className="h-10 w-10 text-gray-400" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-gray-900">{perfilDocument.fileName}</p>
                <p className="mt-1 text-xs text-gray-500">Formato sem pré-visualização embutida.</p>
              </>
            )}
          </div>

          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Arquivo</dt>
              <dd className="mt-0.5 break-all text-sm font-medium text-gray-800">
                {perfilDocument.fileName}
              </dd>
            </div>
            <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
              <dt className="text-[10px] font-bold uppercase text-gray-500">Enviado em</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-800">
                {formatProfissionalPerfilDocumentDateTime(perfilDocument.uploadedAt)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-xs leading-relaxed text-gray-600">
            {profissionalPerfilDocumentKindHints[perfilDocument.kind]}
          </p>
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          {canReplace && onRequestUpdate ? (
            <button
              type="button"
              onClick={() => onRequestUpdate(perfilDocument)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Substituir arquivo
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (!previewUrl) return
              const anchor = document.createElement('a')
              anchor.href = previewUrl
              anchor.download = perfilDocument.fileName
              anchor.click()
            }}
            disabled={!canDownload}
            title={
              canDownload
                ? undefined
                : 'Download disponível para arquivos enviados nesta sessão (imagens).'
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            Baixar arquivo
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
