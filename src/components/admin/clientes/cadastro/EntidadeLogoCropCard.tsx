import { Crop, ImagePlus, Move, RotateCcw, Trash2, X, ZoomIn } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  clampCropPan,
  computeCropDisplayMetrics,
  computeCropZoomBounds,
  cropImageToDataUrl,
  detectImageFormat,
  loadImageFromDataUrl,
  readImageFileAsDataUrl,
  resolveEditorCropViewport,
  resolveLogoCropViewport,
  SQUARE_CROP_OUTPUT_PX,
  SQUARE_CROP_VIEWPORT_PX,
  type CropZoomBounds,
  type DetectedImageFormat,
  type LogoCropViewport,
  type SquareCropParams,
} from '../../../../utils/image/cropSquareImage'

type EntidadeLogoCropCardProps = {
  value: string | null
  onChange: (dataUrl: string | null) => void
  entityName?: string
  variant?: 'logo' | 'loginBackground' | 'favicon'
  iconOnlyActions?: boolean
  layout?: 'inline' | 'isolated'
}

const VARIANT_CONFIG = {
  logo: {
    previewMaxLongEdge: 168,
    editorMaxLongEdge: SQUARE_CROP_VIEWPORT_PX,
    outputMaxEdge: SQUARE_CROP_OUTPUT_PX,
    label: 'Logo da entidade',
    emptyFrame: { width: 168, height: 168 },
  },
  loginBackground: {
    previewMaxLongEdge: 240,
    editorMaxLongEdge: 320,
    outputMaxEdge: 1280,
    label: 'Fundo do login',
    emptyFrame: { width: 240, height: 135 },
  },
  favicon: {
    previewMaxLongEdge: 64,
    editorMaxLongEdge: 128,
    outputMaxEdge: 64,
    label: 'Favicon',
    emptyFrame: { width: 64, height: 64 },
  },
} as const

const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-gray-600'
const iconActionClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900'
const iconActionDangerClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600'

function orientationBadgeClass(orientation: DetectedImageFormat['orientation']): string {
  if (orientation === 'square') return 'bg-violet-50 text-violet-800 ring-violet-200'
  if (orientation === 'landscape') return 'bg-sky-50 text-sky-800 ring-sky-200'
  return 'bg-amber-50 text-amber-900 ring-amber-200'
}

function buildInitialCrop(
  imageWidth: number,
  imageHeight: number,
  viewport: LogoCropViewport,
  bounds: CropZoomBounds,
): SquareCropParams {
  return clampCropPan(
    imageWidth,
    imageHeight,
    bounds.defaultZoom,
    0,
    0,
    viewport.viewportWidth,
    viewport.viewportHeight,
    bounds,
  )
}

export function EntidadeLogoCropCard({
  value,
  onChange,
  entityName,
  variant = 'logo',
  iconOnlyActions = false,
  layout = 'inline',
}: EntidadeLogoCropCardProps) {
  const config = VARIANT_CONFIG[variant]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const [originalSourceDataUrl, setOriginalSourceDataUrl] = useState<string | null>(null)
  const [editorSourceDataUrl, setEditorSourceDataUrl] = useState<string | null>(null)
  const [detectedFormat, setDetectedFormat] = useState<DetectedImageFormat | null>(null)
  const [previewViewport, setPreviewViewport] = useState<LogoCropViewport | null>(null)
  const [editorViewport, setEditorViewport] = useState<LogoCropViewport | null>(null)
  const [zoomBounds, setZoomBounds] = useState<CropZoomBounds | null>(null)
  const [crop, setCrop] = useState<SquareCropParams>({ zoom: 1, panX: 0, panY: 0 })
  const [draftPreview, setDraftPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const formatHint = detectedFormat?.summary ?? previewViewport?.detected.summary ?? 'Aguardando imagem'

  useEffect(() => {
    if (!value) {
      setPreviewViewport(null)
      setDetectedFormat(null)
      return
    }

    let cancelled = false
    void loadImageFromDataUrl(value)
      .then((image) => {
        if (cancelled) return
        const viewport = resolveLogoCropViewport(
          image.naturalWidth,
          image.naturalHeight,
          config.previewMaxLongEdge,
        )
        setPreviewViewport(viewport)
        setDetectedFormat(viewport.detected)
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewViewport(null)
          setDetectedFormat(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [value, config.previewMaxLongEdge])

  const refreshDraftPreview = useCallback(
    async (source: string, nextCrop: SquareCropParams, viewport: LogoCropViewport) => {
      try {
        const image = await loadImageFromDataUrl(source)
        const cropped = cropImageToDataUrl(
          image,
          nextCrop,
          viewport.viewportWidth,
          viewport.viewportHeight,
          config.outputMaxEdge,
        )
        setDraftPreview(cropped || null)
      } catch {
        setDraftPreview(null)
      }
    },
    [config.outputMaxEdge],
  )

  useEffect(() => {
    if (!cropOpen || !editorSourceDataUrl || !editorViewport || !zoomBounds) return
    const timer = window.setTimeout(() => {
      void refreshDraftPreview(editorSourceDataUrl, crop, editorViewport)
    }, 80)
    return () => window.clearTimeout(timer)
  }, [cropOpen, editorSourceDataUrl, crop, editorViewport, zoomBounds, refreshDraftPreview])

  function bootstrapEditor(dataUrl: string, image: HTMLImageElement, openModal: boolean) {
    const size = { width: image.naturalWidth, height: image.naturalHeight }
    const detected = detectImageFormat(size.width, size.height)
    const viewport = resolveEditorCropViewport(
      size.width,
      size.height,
      config.editorMaxLongEdge,
      variant,
    )
    const bounds = computeCropZoomBounds(
      viewport.viewportWidth,
      viewport.viewportHeight,
      size.width,
      size.height,
    )
    const initialCrop = buildInitialCrop(size.width, size.height, viewport, bounds)

    setOriginalSourceDataUrl(dataUrl)
    setEditorSourceDataUrl(dataUrl)
    setDetectedFormat(detected)
    setPreviewViewport(resolveLogoCropViewport(size.width, size.height, config.previewMaxLongEdge))
    setEditorViewport(viewport)
    setZoomBounds(bounds)
    setCrop(initialCrop)
    setDraftPreview(null)
    if (openModal) setCropOpen(true)
  }

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
      bootstrapEditor(dataUrl, image, true)
    } catch {
      setError('Não foi possível carregar a imagem.')
    }
  }

  function updateCrop(next: SquareCropParams) {
    if (!editorViewport || !zoomBounds) {
      setCrop(next)
      return
    }
    setCrop(
      clampCropPan(
        editorViewport.detected.width,
        editorViewport.detected.height,
        next.zoom,
        next.panX,
        next.panY,
        editorViewport.viewportWidth,
        editorViewport.viewportHeight,
        zoomBounds,
      ),
    )
  }

  function resetCrop() {
    if (!editorViewport || !zoomBounds) return
    setCrop(
      buildInitialCrop(
        editorViewport.detected.width,
        editorViewport.detected.height,
        editorViewport,
        zoomBounds,
      ),
    )
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
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
    setOriginalSourceDataUrl(null)
    setEditorSourceDataUrl(null)
    setDetectedFormat(null)
    setPreviewViewport(null)
    setEditorViewport(null)
    setZoomBounds(null)
    setCrop({ zoom: 1, panX: 0, panY: 0 })
    setDraftPreview(null)
    setError(null)
    setCropOpen(false)
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openAdjust() {
    const source = originalSourceDataUrl ?? value
    if (!source) return

    void loadImageFromDataUrl(source).then((image) => {
      bootstrapEditor(source, image, true)
    })
  }

  async function confirmCrop() {
    if (!editorSourceDataUrl || !editorViewport) return
    try {
      const image = await loadImageFromDataUrl(editorSourceDataUrl)
      const cropped = cropImageToDataUrl(
        image,
        crop,
        editorViewport.viewportWidth,
        editorViewport.viewportHeight,
        config.outputMaxEdge,
      )
      if (!cropped) {
        setError('Não foi possível aplicar o recorte.')
        return
      }
      onChange(cropped)
      setCropOpen(false)
      setError(null)
    } catch {
      setError('Não foi possível aplicar o recorte.')
    }
  }

  function closeCropModal() {
    setCropOpen(false)
    setDraftPreview(null)
  }

  const previewUrl = value
  const activeFormat = editorViewport?.detected ?? detectedFormat

  const editorMetrics = useMemo(() => {
    if (!editorViewport) {
      return { displayW: 0, displayH: 0, drawX: 0, drawY: 0 }
    }
    const { displayW, displayH, drawX, drawY } = computeCropDisplayMetrics(
      editorViewport.detected.width,
      editorViewport.detected.height,
      editorViewport.viewportWidth,
      editorViewport.viewportHeight,
      crop,
    )
    return { displayW, displayH, drawX, drawY }
  }, [crop, editorViewport])

  const previewFrameStyle = previewViewport
    ? {
        width: previewViewport.viewportWidth,
        height: previewViewport.viewportHeight,
        maxWidth: '100%',
      }
    : config.emptyFrame

  const zoomLabel =
    zoomBounds && zoomBounds.maxZoom > zoomBounds.minZoom
      ? Math.round(
          ((crop.zoom - zoomBounds.minZoom) / (zoomBounds.maxZoom - zoomBounds.minZoom)) * 100,
        )
      : 0

  const actionButtons = iconOnlyActions ? (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => fileInputRef.current?.click()} className={iconActionClass} title="Enviar foto" aria-label="Enviar foto">
        <ImagePlus className="h-4 w-4" strokeWidth={2} />
      </button>
      {previewUrl ? (
        <>
          <button type="button" onClick={openAdjust} className={iconActionClass} title="Recortar" aria-label="Recortar">
            <Crop className="h-4 w-4" strokeWidth={2} />
          </button>
          <button type="button" onClick={handleRemove} className={iconActionDangerClass} title="Remover" aria-label="Remover">
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </button>
        </>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <button type="button" onClick={() => fileInputRef.current?.click()} className="font-semibold text-[var(--brand-primary)] hover:underline">
        {previewUrl ? 'Trocar foto' : 'Enviar foto'}
      </button>
      {previewUrl ? (
        <>
          <span className="text-gray-300">·</span>
          <button type="button" onClick={openAdjust} className="font-medium text-gray-600 hover:text-gray-900 hover:underline">
            Recortar
          </button>
          <span className="text-gray-300">·</span>
          <button type="button" onClick={handleRemove} className="inline-flex items-center gap-1 font-medium text-gray-500 hover:text-red-600">
            <Trash2 className="h-3.5 w-3.5" />
            Remover
          </button>
        </>
      ) : null}
    </div>
  )

  const previewButton = (
    <button
      type="button"
      onClick={() => (previewUrl ? openAdjust() : fileInputRef.current?.click())}
      style={previewFrameStyle}
      className={
        layout === 'isolated'
          ? 'group relative mx-auto flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-[var(--brand-primary)]/40'
          : 'group relative shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 shadow-sm transition hover:border-[var(--brand-primary)]/40'
      }
      aria-label={previewUrl ? 'Recortar imagem' : 'Enviar imagem'}
    >
      {previewUrl ? (
        <img src={previewUrl} alt={entityName ? `Logo ${entityName}` : 'Logo'} className="h-full w-full object-contain" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-gray-400 group-hover:text-[var(--brand-primary)]">
          <ImagePlus className="h-7 w-7" strokeWidth={1.75} />
        </span>
      )}
    </button>
  )

  return (
    <>
      {layout === 'isolated' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-slate-50/80 px-4 py-6 sm:px-6">
            <div className="flex min-h-[9rem] items-center justify-center">{previewButton}</div>
            {activeFormat ? (
              <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {activeFormat.summary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-center gap-2">
            {actionButtons}
            <p className="text-center text-xs text-gray-400">{formatHint} · JPG, PNG ou WebP · até 5 MB</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start gap-4">
          {previewButton}
          <div className="min-w-0 flex-1">
            <p className={labelClass}>{config.label}</p>
            {activeFormat ? (
              <p
                className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${orientationBadgeClass(activeFormat.orientation)}`}
              >
                {activeFormat.summary}
              </p>
            ) : null}
            {actionButtons}
            <p className="mt-0.5 text-xs text-gray-400">{formatHint} · JPG, PNG ou WebP · até 5 MB</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0])} />

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      {cropOpen && editorViewport && zoomBounds && editorSourceDataUrl
        ? createPortal(
            <div className="fixed inset-0 z-[10020] flex items-center justify-center p-4">
              <button type="button" className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={closeCropModal} aria-label="Fechar" />
              <div role="dialog" aria-modal="true" className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="border-b border-gray-100 px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-gray-900">Recortar imagem</p>
                      <p className="mt-1 text-xs text-gray-500">Arraste para enquadrar. Aumente o zoom para cortar.</p>
                    </div>
                    <button type="button" onClick={closeCropModal} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${orientationBadgeClass(editorViewport.detected.orientation)}`}>
                    {editorViewport.detected.summary}
                  </div>
                </div>

                <div className="space-y-4 px-5 py-4">
                  <div className="flex justify-center rounded-xl bg-gray-950 p-4">
                    <div
                      className={['relative overflow-hidden rounded-lg ring-2 ring-[var(--brand-primary)] touch-none', isDragging ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
                      style={{ width: editorViewport.viewportWidth, height: editorViewport.viewportHeight }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      <img
                        src={editorSourceDataUrl}
                        alt=""
                        draggable={false}
                        className="pointer-events-none absolute max-w-none select-none"
                        style={{
                          width: editorMetrics.displayW,
                          height: editorMetrics.displayH,
                          left: editorMetrics.drawX,
                          top: editorMetrics.drawY,
                        }}
                      />
                      <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="border border-white/20" />
                        ))}
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/50 py-1 text-[9px] font-semibold uppercase tracking-wide text-white">
                        <Move className="h-2.5 w-2.5" />
                        Área de corte
                      </div>
                    </div>
                  </div>

                  {draftPreview ? (
                    <div className="rounded-xl border border-gray-100 bg-slate-50 px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Prévia do recorte</p>
                      <img src={draftPreview} alt="" className="mt-2 max-h-16 w-auto object-contain" />
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <ZoomIn className="h-3 w-3" />
                        Zoom
                      </span>
                      <span>{zoomLabel}% crop</span>
                    </div>
                    <input
                      type="range"
                      min={zoomBounds.minZoom}
                      max={zoomBounds.maxZoom}
                      step={0.005}
                      value={crop.zoom}
                      onChange={(e) => updateCrop({ ...crop, zoom: Number(e.target.value) })}
                      className="w-full accent-[var(--brand-primary)]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                      <span>Imagem inteira</span>
                      <span>Corte máximo</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
                  <button type="button" onClick={resetCrop} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <RotateCcw className="h-4 w-4" />
                    Redefinir
                  </button>
                  <button type="button" onClick={() => void confirmCrop()} className="btn-brand-gradient flex-[2] rounded-xl py-2.5 text-sm font-semibold">
                    Aplicar recorte
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export function EntidadeLoginBackgroundCropCard(props: Omit<EntidadeLogoCropCardProps, 'variant'>) {
  return <EntidadeLogoCropCard {...props} variant="loginBackground" />
}

export function EntidadeFaviconCropCard(props: Omit<EntidadeLogoCropCardProps, 'variant'>) {
  return <EntidadeLogoCropCard {...props} variant="favicon" />
}
