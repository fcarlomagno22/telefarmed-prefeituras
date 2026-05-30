import { Camera, CloudUpload, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ACCEPT_PROFISSIONAL_PERFIL_PHOTO,
  PROFISSIONAL_PERFIL_PHOTO_MAX_BYTES,
  PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE,
  isProfissionalPerfilPhotoFile,
  loadProfissionalPerfilPhotoDimensions,
  readProfissionalPerfilPhotoAsDataUrl,
} from '../../../utils/profissional/profissionalPerfilPhotoUpload'

type ProfissionalPerfilAlterarFotoModalProps = {
  open: boolean
  currentAvatarUrl: string
  onClose: () => void
  onSave: (file: File, previewDataUrl: string, onProgress: (progress: number) => void) => Promise<void>
}

export function ProfissionalPerfilAlterarFotoModal({
  open,
  currentAvatarUrl,
  onClose,
  onSave,
}: ProfissionalPerfilAlterarFotoModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null)
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
      setPreviewDataUrl(null)
      setFormError(null)
      setIsDragging(false)
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }, [open])

  async function applyFile(file: File | undefined) {
    if (!file) return

    if (!isProfissionalPerfilPhotoFile(file)) {
      setFormError('Use JPG, PNG ou WebP.')
      setSelectedFile(null)
      setPreviewDataUrl(null)
      return
    }

    if (file.size > PROFISSIONAL_PERFIL_PHOTO_MAX_BYTES) {
      setFormError('A imagem deve ter no máximo 5 MB.')
      setSelectedFile(null)
      setPreviewDataUrl(null)
      return
    }

    try {
      const { width, height } = await loadProfissionalPerfilPhotoDimensions(file)
      if (width < PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE || height < PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE) {
        setFormError(
          `A imagem deve ter pelo menos ${PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE}×${PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE} px.`,
        )
        setSelectedFile(null)
        setPreviewDataUrl(null)
        return
      }

      const dataUrl = await readProfissionalPerfilPhotoAsDataUrl(file)
      setFormError(null)
      setSelectedFile(file)
      setPreviewDataUrl(dataUrl)
    } catch {
      setFormError('Não foi possível processar a imagem selecionada.')
      setSelectedFile(null)
      setPreviewDataUrl(null)
    }
  }

  async function handleSubmit() {
    if (!selectedFile || !previewDataUrl || isSubmitting) return
    setIsSubmitting(true)
    setFormError(null)
    setUploadProgress(0)
    try {
      await onSave(selectedFile, previewDataUrl, setUploadProgress)
      onClose()
    } catch {
      setFormError('Não foi possível salvar a foto. Tente novamente.')
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  if (!open) return null

  const displayPreview = previewDataUrl ?? currentAvatarUrl

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar alteração de foto"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-alterar-foto-title"
        className="relative flex max-h-[min(92dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[var(--brand-primary-light)]/25 to-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 pr-10">
            <Camera className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden />
            <h2 id="perfil-alterar-foto-title" className="text-lg font-bold text-gray-900">
              Alterar foto
            </h2>
          </div>
          <p className="mt-1 pr-10 text-sm text-gray-600">
            Sua foto aparece na agenda, no prontuário e nas avaliações.
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-[var(--brand-primary)]" aria-hidden />
              <p className="mt-3 text-sm font-semibold text-gray-900">Salvando foto…</p>
              <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-medium text-gray-500">{uploadProgress}%</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div
                  className={[
                    'h-28 w-28 overflow-hidden rounded-full',
                    'bg-gradient-to-br from-[var(--brand-primary-light)]/50 to-white',
                    'shadow-[0_4px_16px_rgba(0,0,0,0.1)] ring-[3px] ring-white',
                    'outline outline-[3px] outline-orange-100/90',
                  ].join(' ')}
                >
                  <img src={displayPreview} alt="" className="h-full w-full object-cover" />
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_PROFISSIONAL_PERFIL_PHOTO}
                className="sr-only"
                onChange={(event) => {
                  void applyFile(event.target.files?.[0])
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
                  void applyFile(event.dataTransfer.files[0])
                }}
                className={[
                  'mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
                  isDragging
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/35'
                    : 'border-gray-200 bg-gray-50/50 hover:border-[var(--brand-primary)]/30',
                ].join(' ')}
              >
                <CloudUpload className="h-6 w-6 text-[var(--brand-primary)]" aria-hidden />
                <p className="mt-2 text-sm text-gray-700">
                  {selectedFile ? (
                    <span className="font-semibold text-gray-900">{selectedFile.name}</span>
                  ) : (
                    <>
                      Arraste uma imagem ou{' '}
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
                <p className="mt-1 text-[11px] text-gray-500">
                  JPG, PNG ou WebP · mín. {PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE}×
                  {PROFISSIONAL_PERFIL_PHOTO_MIN_SIZE} px · até 5 MB
                </p>
              </div>

              <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-gray-600">
                <li>Prefira rosto visível, fundo neutro e boa iluminação.</li>
                <li>Formato quadrado evita cortes na exibição circular.</li>
              </ul>

              {formError ? (
                <p className="mt-3 text-xs font-medium text-red-600" role="alert">
                  {formError}
                </p>
              ) : null}
            </>
          )}
        </div>

        {!isSubmitting ? (
          <footer className="flex shrink-0 gap-2 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedFile || !previewDataUrl}
              className="flex-1 rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Salvar foto
            </button>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
