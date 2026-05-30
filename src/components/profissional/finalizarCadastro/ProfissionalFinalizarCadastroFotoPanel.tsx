import { Camera, Check, UserRound } from 'lucide-react'
import { useState } from 'react'
import { FaceCaptureModal } from '../../dashboard/FaceCaptureModal'

type ProfissionalFinalizarCadastroFotoPanelProps = {
  photoDataUrl: string
  onPhotoCapture: (photoDataUrl: string) => void
  error?: string
}

export function ProfissionalFinalizarCadastroFotoPanel({
  photoDataUrl,
  onPhotoCapture,
  error,
}: ProfissionalFinalizarCadastroFotoPanelProps) {
  const [captureOpen, setCaptureOpen] = useState(false)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/90 px-3 py-2.5 text-xs leading-relaxed text-violet-950">
          <Camera className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Registre uma selfie para identificação no painel e nos atendimentos. Use boa iluminação
            e centralize o rosto na câmera.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 py-2">
          {photoDataUrl ? (
            <div className="relative shrink-0 pb-4">
              <div className="size-32 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-gray-100 sm:size-36">
                <img
                  src={photoDataUrl}
                  alt="Pré-visualização da sua selfie"
                  className="size-full object-cover"
                />
              </div>
              <span className="absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full border-2 border-white bg-emerald-500 px-3 py-1 text-[11px] font-semibold leading-none text-white shadow-[0_4px_12px_rgba(16,185,129,0.45)]">
                <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                Selfie capturada
              </span>
            </div>
          ) : (
            <div
              className="flex size-32 items-center justify-center rounded-full border-4 border-white bg-gray-100 shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-2 ring-gray-100 sm:size-36"
              aria-hidden
            >
              <UserRound className="h-14 w-14 text-gray-300" strokeWidth={1.5} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setCaptureOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.3)] transition hover:bg-[var(--brand-primary-hover)]"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {photoDataUrl ? 'Tirar outra selfie' : 'Tirar selfie'}
          </button>
        </div>

        {error ? (
          <p className="text-center text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <FaceCaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={(dataUrl) => {
          onPhotoCapture(dataUrl)
          setCaptureOpen(false)
        }}
      />
    </>
  )
}
