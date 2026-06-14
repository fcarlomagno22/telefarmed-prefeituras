import { ImagePlus, Move, Trash2, X, ZoomIn } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  clampSquareCropPan,
  cropSquareImageToDataUrl,
  loadImageFromDataUrl,
  readImageFileAsDataUrl,
  type SquareCropParams,
} from '../../../../utils/image/cropSquareImage'

type EntidadeLogoCropCardProps = {
  value: string | null
  onChange: (dataUrl: string | null) => void
  entityName?: string
}

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600'
const EDITOR_VIEWPORT_PX = 168

export function EntidadeLogoCropCard({ value, onChange, entityName }: EntidadeLogoCropCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const [sourceDataUrl, setSourceDataUrl] = useState<string | null>(null)
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [crop, setCrop] = useState<SquareCropParams>({ zoom: 1, panX: 0, panY: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const applyCrop = useCallback(
    async (source: string, nextCrop: SquareCropParams, size: { width: number; height: number }) => {
      try {
        const image = await loadImageFromDataUrl(source)
        const clamped = clampSquareCropPan(
          size.width,
          size.height,
          nextCrop.zoom,
          nextCrop.panX,
          nextCrop.panY,
          EDITOR_VIEWPORT_PX,
        )
        const cropped = cropSquareImageToDataUrl(image, clamped, undefined, EDITOR_VIEWPORT_PX)
        onChange(cropped || null)
      } catch {
        setError('Não foi possível aplicar o recorte.')
      }
    },
    [onChange],
  )

  useEffect(() => {
    if (!cropOpen || !sourceDataUrl || !imageSize) return
    void applyCrop(sourceDataUrl, crop, imageSize)
  }, [cropOpen, sourceDataUrl, crop, imageSize, applyCrop])

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setError('Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5 MB.')
      return
    }

    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      const image = await loadImageFromDataUrl(dataUrl)
      const size = { width: image.naturalWidth, height: image.naturalHeight }
      const initialCrop = clampSquareCropPan(size.width, size.height, 1, 0, 0, EDITOR_VIEWPORT_PX)
      setSourceDataUrl(dataUrl)
      setImageSize(size)
      setCrop(initialCrop)
      setCropOpen(true)
    } catch {
      setError('Não foi possível carregar a imagem.')
    }
  }

  function updateCrop(next: SquareCropParams) {
    if (!imageSize) {
      setCrop(next)
      return
    }
    setCrop(
      clampSquareCropPan(
        imageSize.width,
        imageSize.height,
        next.zoom,
        next.panX,
        next.panY,
        EDITOR_VIEWPORT_PX,
      ),
    )
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!sourceDataUrl) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStartRef.current = { x: event.clientX, y: event.clientY, panX: crop.panX, panY: crop.panY }
    setIsDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current
    if (!start) return
    updateCrop({
      ...crop,
      panX: start.panX + (event.clientX - start.x),
      panY: start.panY + (event.clientY - start.y),
    })
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragStartRef.current = null
    setIsDragging(false)
  }

  function handleRemove() {
    setSourceDataUrl(null)
    setImageSize(null)
    setCrop({ zoom: 1, panX: 0, panY: 0 })
    setError(null)
    setCropOpen(false)
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openAdjust() {
    if (!sourceDataUrl && value) {
      void loadImageFromDataUrl(value).then((image) => {
        const size = { width: image.naturalWidth, height: image.naturalHeight }
        setSourceDataUrl(value)
        setImageSize(size)
        setCrop(clampSquareCropPan(size.width, size.height, 1, 0, 0, EDITOR_VIEWPORT_PX))
        setCropOpen(true)
      })
      return
    }
    if (sourceDataUrl) setCropOpen(true)
  }

  function closeCropModal() {
    setCropOpen(false)
    if (!value) {
      setSourceDataUrl(null)
      setImageSize(null)
      setCrop({ zoom: 1, panX: 0, panY: 0 })
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const previewUrl = value
  const hasEditor = Boolean(sourceDataUrl && imageSize)
  const baseScale =
    imageSize && sourceDataUrl
      ? Math.max(EDITOR_VIEWPORT_PX / imageSize.width, EDITOR_VIEWPORT_PX / imageSize.height)
      : 1
  const displayScale = baseScale * crop.zoom
  const displayW = imageSize ? imageSize.width * displayScale : 0
  const displayH = imageSize ? imageSize.height * displayScale : 0
  const drawX = (EDITOR_VIEWPORT_PX - displayW) / 2 + crop.panX
  const drawY = (EDITOR_VIEWPORT_PX - displayH) / 2 + crop.panY

  return (
    <>
      <div className="flex flex-wrap items-start gap-4">
        <button
          type="button"
          onClick={() => (previewUrl ? openAdjust() : fileInputRef.current?.click())}
          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 shadow-sm transition hover:border-[var(--brand-primary)]/40"
          aria-label={previewUrl ? 'Ajustar logo' : 'Enviar logo'}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={entityName ? `Logo ${entityName}` : 'Logo da entidade'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-gray-400 group-hover:text-[var(--brand-primary)]">
              <ImagePlus className="h-7 w-7" strokeWidth={1.75} />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className={labelClass}>Logo da entidade</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold text-[var(--brand-primary)] hover:underline"
            >
              {previewUrl ? 'Trocar foto' : 'Enviar foto'}
            </button>
            {previewUrl ? (
              <>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={openAdjust}
                  className="font-medium text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Ajustar recorte
                </button>
                <span className="text-gray-300">·</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              </>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-gray-400">Quadrado · JPG, PNG ou WebP · até 5 MB</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {cropOpen && hasEditor
        ? createPortal(
            <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
                onClick={closeCropModal}
                aria-label="Fechar ajuste de logo"
              />
              <div
                role="dialog"
                aria-labelledby="entidade-logo-crop-title"
                className="relative w-full max-w-[17rem] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p id="entidade-logo-crop-title" className="text-sm font-bold text-gray-900">
                      Ajustar logo
                    </p>
                    <p className="text-xs text-gray-500">Arraste e use o zoom.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCropModal}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div
                  className={[
                    'relative mx-auto overflow-hidden rounded-lg border border-gray-300 bg-gray-900 touch-none',
                    isDragging ? 'cursor-grabbing' : 'cursor-grab',
                  ].join(' ')}
                  style={{ width: EDITOR_VIEWPORT_PX, height: EDITOR_VIEWPORT_PX }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img
                    src={sourceDataUrl ?? undefined}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                      width: displayW,
                      height: displayH,
                      left: drawX,
                      top: drawY,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center gap-1 bg-gray-900/50 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                    <Move className="h-2.5 w-2.5" />
                    Arraste
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    <ZoomIn className="h-3 w-3" />
                    Zoom
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={crop.zoom}
                    onChange={(event) =>
                      updateCrop({ ...crop, zoom: Number(event.target.value) })
                    }
                    className="w-full accent-[var(--brand-primary)]"
                  />
                </label>

                <button
                  type="button"
                  onClick={closeCropModal}
                  className="btn-brand-gradient mt-4 w-full rounded-xl py-2 text-sm font-semibold"
                >
                  Concluir
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
