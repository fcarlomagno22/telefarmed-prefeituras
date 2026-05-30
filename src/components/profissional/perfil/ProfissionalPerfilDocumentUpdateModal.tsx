import { CloudUpload, FileText, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ProfissionalPerfilDocument } from '../../../types/profissionalPerfil'
import {
  ACCEPT_PROFISSIONAL_PERFIL_DOCUMENT,
  isProfissionalPerfilDocumentFile,
} from '../../../utils/profissional/profissionalPerfilDocumentUpload'
import { profissionalPerfilDocumentKindHints } from './profissionalPerfilDocumentsUi'

type ProfissionalPerfilDocumentUpdateModalProps = {
  open: boolean
  document: ProfissionalPerfilDocument | null
  onClose: () => void
  onSubmit: (documentId: string, file: File, onProgress: (progress: number) => void) => Promise<void>
}

export function ProfissionalPerfilDocumentUpdateModal({
  open,
  document: perfilDocument,
  onClose,
  onSubmit,
}: ProfissionalPerfilDocumentUpdateModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, isSubmitting])

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setFormError(null)
      setIsDragging(false)
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }, [open])

  function applyFile(file: File | undefined) {
    if (!file) return
    if (!isProfissionalPerfilDocumentFile(file)) {
      setFormError('Envie PDF ou imagem (JPG, PNG ou WebP).')
      setSelectedFile(null)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFormError('O arquivo deve ter no máximo 10 MB.')
      setSelectedFile(null)
      return
    }
    setFormError(null)
    setSelectedFile(file)
  }

  async function handleSubmit() {
    if (!perfilDocument || !selectedFile || isSubmitting) return
    setIsSubmitting(true)
    setFormError(null)
    setUploadProgress(0)
    try {
      await onSubmit(perfilDocument.id, selectedFile, setUploadProgress)
    } catch {
      setFormError('Não foi possível enviar o documento. Tente novamente.')
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (!open || !perfilDocument) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar envio de documento"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-document-update-title"
        className="relative flex max-h-[min(92dvh,36rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 id="perfil-document-update-title" className="pr-10 text-lg font-bold text-gray-900">
            Atualizar documento
          </h2>
          <p className="mt-1 text-sm text-gray-600">{perfilDocument.label}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isSubmitting ? (
            <div className="rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary-light)]/15 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-gray-900">Enviando arquivo…</p>
              <p className="mt-1 text-xs text-gray-600">{selectedFile?.name}</p>
              <div className="mx-auto mt-4 h-2 max-w-xs overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-medium text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900">Arquivo atual</p>
                  <p className="mt-0.5 break-all text-[11px] text-gray-600">{perfilDocument.fileName}</p>
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-gray-600">
                {profissionalPerfilDocumentKindHints[perfilDocument.kind]}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_PROFISSIONAL_PERFIL_DOCUMENT}
                className="sr-only"
                onChange={(event) => {
                  applyFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />

              <div
                onDragEnter={(event) => {
                  event.preventDefault()
                  setIsDragging(true)
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  setIsDragging(false)
                  applyFile(event.dataTransfer.files[0])
                }}
                className={[
                  'mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
                  isDragging
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/35'
                    : 'border-gray-200 bg-gray-50/50 hover:border-[var(--brand-primary)]/30',
                ].join(' ')}
              >
                <CloudUpload className="h-7 w-7 text-[var(--brand-primary)]" aria-hidden />
                <p className="mt-2 text-sm text-gray-700">
                  {selectedFile ? (
                    <span className="font-semibold text-gray-900">{selectedFile.name}</span>
                  ) : (
                    <>
                      Arraste o arquivo ou{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-semibold text-[var(--brand-primary)] hover:underline"
                      >
                        selecione no computador
                      </button>
                    </>
                  )}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">PDF, JPG, PNG ou WebP · até 10 MB</p>
              </div>

              {formError ? (
                <p className="mt-3 text-xs font-medium text-red-600" role="alert">
                  {formError}
                </p>
              ) : null}
            </>
          )}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isSubmitting}
            className="rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar documento
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
