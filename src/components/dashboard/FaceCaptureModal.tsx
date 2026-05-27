import { Camera, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFaceDetector } from '../../hooks/useFaceDetector'
import { captureMirroredOvalFrame, getOvalGuide } from '../../utils/faceAlignment'

type FaceCaptureModalProps = {
  open: boolean
  onClose: () => void
  onCapture: (photoDataUrl: string) => void
}

export function FaceCaptureModal({ open, onClose, onCapture }: FaceCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { isReady, isAligned, useFallback } = useFaceDetector({
    videoRef,
    active: open && !previewUrl,
  })

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      stopCamera()
      setCameraError(null)
      setIsStartingCamera(false)
      setPreviewUrl(null)
      return
    }

    let cancelled = false

    async function startCamera() {
      setIsStartingCamera(true)
      setCameraError(null)

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {
        if (!cancelled) {
          setCameraError('Não foi possível acessar a câmera. Verifique as permissões.')
        }
      } finally {
        if (!cancelled) setIsStartingCamera(false)
      }
    }

    startCamera()

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open, stopCamera])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  function handleCapture() {
    const video = videoRef.current
    if (!video || !isAligned) return

    const guide = getOvalGuide(video.videoWidth, video.videoHeight)
    const dataUrl = captureMirroredOvalFrame(video, guide)
    if (!dataUrl) return

    setPreviewUrl(dataUrl)
  }

  function handleConfirmPreview() {
    if (!previewUrl) return
    onCapture(previewUrl)
    setPreviewUrl(null)
    onClose()
  }

  function handleRetake() {
    setPreviewUrl(null)
  }

  if (!open) return null

  const hasCameraError = Boolean(cameraError)
  const isLoading = isStartingCamera || !isReady
  const isPreview = Boolean(previewUrl)

  const statusMessage = isPreview
    ? 'Revise a foto ou tire outra se precisar.'
    : cameraError
      ? cameraError
      : isLoading
        ? 'Abrindo a câmera...'
        : isAligned
          ? 'Rosto enquadrado. Pode tirar a foto.'
          : useFallback
            ? 'Centralize o rosto no contorno oval.'
            : 'Centralize o rosto dentro do contorno oval.'

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="face-capture-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-gray-200 px-5 pb-3 pt-5 text-center">
          <h2 id="face-capture-title" className="text-base font-bold text-gray-900">
            Foto de cadastro
          </h2>
          <p
            className={`mt-1.5 text-sm transition-colors ${
              isPreview || isAligned
                ? 'text-emerald-600'
                : hasCameraError
                  ? 'text-red-600'
                  : 'text-gray-500'
            }`}
          >
            {statusMessage}
          </p>
        </div>

        <div
          className={`relative mx-auto w-full bg-gray-100 ${
            isPreview
              ? 'aspect-square max-h-[min(50vh,360px)]'
              : 'aspect-[3/4] max-h-[min(52vh,420px)]'
          }`}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${
              isPreview ? 'invisible' : ''
            }`}
          />

          {isPreview && previewUrl ? (
            <img
              src={previewUrl}
              alt="Pré-visualização da foto"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            <>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_52%_68%_at_50%_44%,transparent_58%,rgba(243,244,246,0.92)_100%)]"
            aria-hidden
          />

          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <ellipse
              cx="50"
              cy="44"
              rx="20"
              ry="27"
              fill="none"
              strokeWidth="0.6"
              className={`face-capture-oval-ring transition-all duration-300 ${
                isAligned ? 'face-capture-oval-ring--aligned' : ''
              }`}
            />
          </svg>
            </>
          )}

          {isLoading && !hasCameraError && !isPreview ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--brand-primary)]" />
            </div>
          ) : null}
        </div>

        <div className="space-y-3 px-5 py-4">
          {isPreview ? (
            <>
              <button
                type="button"
                onClick={handleConfirmPreview}
                className="btn-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold"
              >
                Usar esta foto
              </button>
              <button
                type="button"
                onClick={handleRetake}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--brand-primary)]/30 bg-[var(--brand-primary-light)]/40 py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)]/70"
              >
                <Camera className="h-4 w-4" />
                Tirar outra foto
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              disabled={!isAligned || hasCameraError || isLoading}
              className="btn-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold disabled:cursor-not-allowed"
            >
              <Camera className="h-4 w-4" />
              Tirar foto
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
