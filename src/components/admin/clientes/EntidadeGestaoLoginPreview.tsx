import { Eye, IdCard, Lock, Maximize2, Monitor, Smartphone, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { brand, buildEntityCopyright } from '../../../config/brand'
import { portals } from '../../../config/portals'
import { formatTenantPublicHost, getPublicRootDomain } from '../../../config/tenantHost'
import { buildBrandCssVariables } from '../../../utils/brandColor'
import { normalizeTenantSlugInput } from '../../../utils/tenantSlug'
import { PoweredByTelefarmed } from '../../brand/PoweredByTelefarmed'

type EntidadeGestaoLoginPreviewProps = {
  slug: string
  displayName: string
  logoUrl: string | null
  loginBackgroundUrl: string | null
  corPrimaria: string
  className?: string
}

type PreviewViewport = 'web' | 'mobile'

const prefeituraPortal = portals.prefeitura

const DEVICE_VIEWPORTS = {
  web: { width: 1280, height: 720 },
  mobile: { width: 390, height: 844 },
} as const

type GestaoLoginPreviewFrameProps = {
  displayName: string
  resolvedLogoUrl: string
  resolvedBackgroundUrl: string
  brandVars: Record<string, string>
  viewport: PreviewViewport
}

function GestaoLoginPreviewFrame({
  displayName,
  resolvedLogoUrl,
  resolvedBackgroundUrl,
  brandVars,
  viewport,
}: GestaoLoginPreviewFrameProps) {
  const isMobile = viewport === 'mobile'

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={brandVars as CSSProperties}
    >
      <img
        src={resolvedBackgroundUrl}
        alt=""
        className="absolute inset-0 h-full w-full scale-[1.03] object-cover"
      />

      <div className="absolute inset-0 bg-white/15" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-sky-400/25 via-white/10 to-indigo-400/20"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-white/5"
        aria-hidden
      />
      <div className="absolute inset-0 backdrop-blur-[1px] backdrop-saturate-105" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(15,23,42,0.12)_70%,rgba(30,58,138,0.22)_100%)]"
        aria-hidden
      />
      <div
        className="login-page-grain pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.08]"
        aria-hidden
      />

      <main
        className={[
          'relative z-10 flex w-full flex-col items-center',
          isMobile ? 'px-5 py-10' : 'max-w-lg px-8 py-10 sm:px-8',
        ].join(' ')}
      >
        <div
          className={[
            'w-full max-w-md rounded-3xl border px-8 py-9 ring-1 sm:px-10 sm:py-11',
            'border-white/25 bg-white/[0.94] shadow-[0_4px_24px_rgba(0,0,0,0.12),0_24px_64px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] ring-white/40 backdrop-blur-2xl',
          ].join(' ')}
        >
          <div className="mb-6 flex justify-center">
            <img
              src={resolvedLogoUrl}
              alt={displayName}
              className="h-14 w-auto max-w-[240px] object-contain"
            />
          </div>

          <header className="mb-7 text-center">
            <h2 className="text-sm font-semibold text-gray-800 sm:text-[15px]">
              {prefeituraPortal.welcomeTitle}
            </h2>
            <p className="mt-1.5 text-xs text-gray-500">{prefeituraPortal.welcomeSubtitle}</p>
          </header>

          <div className="space-y-4">
            <div className="relative flex items-center">
              <IdCard
                className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--brand-primary)]"
                strokeWidth={1.75}
              />
              <div className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-3.5 pl-12 pr-4 text-sm text-gray-400">
                CPF
              </div>
            </div>

            <div className="relative flex items-center">
              <Lock
                className="pointer-events-none absolute left-4 h-5 w-5 text-[var(--brand-primary)]"
                strokeWidth={1.75}
              />
              <div className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 py-3.5 pl-12 pr-12 text-sm text-gray-400">
                Senha
              </div>
              <Eye className="pointer-events-none absolute right-4 h-5 w-5 text-gray-400" />
            </div>

            <div className="btn-brand-gradient mt-2 w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white">
              Entrar
            </div>
          </div>

          <p className="mt-6 text-center text-sm font-medium text-[var(--brand-primary)]">
            Esqueceu sua senha?
          </p>

          <p className="mt-6 border-t border-gray-200/80 pt-5 text-center text-[11px] font-medium text-gray-400 sm:text-xs">
            {buildEntityCopyright(displayName)}
          </p>
        </div>
      </main>

      <footer className="pointer-events-none absolute bottom-4 right-4 z-20 sm:bottom-5 sm:right-6">
        <div className="flex items-center rounded-lg bg-white/60 px-3 py-2 shadow-sm backdrop-blur-md ring-1 ring-white/50">
          <PoweredByTelefarmed />
        </div>
      </footer>
    </div>
  )
}

function ScaledDeviceViewport({
  width,
  height,
  children,
  interactive = false,
  maxHeight,
}: {
  width: number
  height: number
  children: ReactNode
  interactive?: boolean
  maxHeight?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateScale = () => {
      const widthScale = element.clientWidth / width
      const heightScale = maxHeight ? maxHeight / height : widthScale
      const nextScale = maxHeight
        ? Math.min(widthScale, heightScale)
        : widthScale > 0
          ? widthScale
          : 1
      const scaledWidth = width * nextScale
      setScale(nextScale)
      setOffsetX(Math.max(0, (element.clientWidth - scaledWidth) / 2))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(element)
    return () => observer.disconnect()
  }, [width, height, maxHeight])

  const scaledHeight = height * scale

  return (
    <div ref={containerRef} className="w-full overflow-hidden" style={{ height: scaledHeight }}>
      <div
        className={interactive ? '' : 'pointer-events-none select-none'}
        style={{
          width,
          height,
          transform: `translateX(${offsetX}px) scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

type ViewportToggleProps = {
  viewport: PreviewViewport
  onChange: (viewport: PreviewViewport) => void
  size?: 'compact' | 'regular'
}

function ViewportToggle({ viewport, onChange, size = 'compact' }: ViewportToggleProps) {
  const buttonClass =
    size === 'compact'
      ? 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition'
      : 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition'

  return (
    <div
      className={
        size === 'compact'
          ? 'inline-flex rounded-lg border border-gray-200 bg-slate-50/90 p-0.5'
          : 'inline-flex rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-sm'
      }
      role="tablist"
      aria-label="Visualização do preview"
    >
      <button
        type="button"
        role="tab"
        aria-selected={viewport === 'web'}
        onClick={() => onChange('web')}
        className={[
          buttonClass,
          viewport === 'web'
            ? size === 'compact'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'bg-white text-gray-900 shadow-sm'
            : size === 'compact'
              ? 'text-gray-500 hover:text-gray-700'
              : 'text-white/80 hover:text-white',
        ].join(' ')}
      >
        <Monitor className={size === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
        Web
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={viewport === 'mobile'}
        onClick={() => onChange('mobile')}
        className={[
          buttonClass,
          viewport === 'mobile'
            ? size === 'compact'
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'bg-white text-gray-900 shadow-sm'
            : size === 'compact'
              ? 'text-gray-500 hover:text-gray-700'
              : 'text-white/80 hover:text-white',
        ].join(' ')}
      >
        <Smartphone className={size === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden />
        Mobile
      </button>
    </div>
  )
}

type PreviewDeviceShellProps = {
  viewport: PreviewViewport
  previewHost: string
  previewPath: string
  frame: ReactNode
  maxWidthClass?: string
  compact?: boolean
}

function PreviewDeviceShell({
  viewport,
  previewHost,
  previewPath,
  frame,
  maxWidthClass = 'w-full',
  compact = false,
}: PreviewDeviceShellProps) {
  const device = DEVICE_VIEWPORTS[viewport]
  const mobileMaxHeight = compact ? 250 : undefined
  const mobileShellClass = compact ? 'mx-auto w-full max-w-[9.25rem]' : maxWidthClass

  if (viewport === 'web') {
    return (
      <div
        className={[
          'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/[0.04]',
          maxWidthClass,
        ].join(' ')}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 bg-slate-50/90 px-3 py-2">
          <div className="flex items-center gap-1" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <div className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-2.5 py-1">
            <p className="truncate text-center font-mono text-[10px] text-gray-600 sm:text-xs">
              {previewHost}
              {previewPath}
            </p>
          </div>
        </div>

        <ScaledDeviceViewport width={device.width} height={device.height}>
          <div className="h-[720px] w-[1280px] overflow-hidden bg-slate-900">{frame}</div>
        </ScaledDeviceViewport>
      </div>
    )
  }

  return (
    <div className={mobileShellClass}>
      <div className="overflow-hidden rounded-[1.35rem] border-[4px] border-gray-900 bg-gray-900 shadow-xl ring-1 ring-gray-900/10 sm:rounded-[1.75rem] sm:border-[5px]">
        <div
          className={[
            'flex items-center justify-center bg-gray-900',
            compact ? 'py-1' : 'py-2',
          ].join(' ')}
        >
          <div
            className={compact ? 'h-1 w-10 rounded-full bg-gray-700' : 'h-1.5 w-14 rounded-full bg-gray-700'}
            aria-hidden
          />
        </div>

        <div className="border-t border-gray-800 bg-white">
          <ScaledDeviceViewport
            width={device.width}
            height={device.height}
            maxHeight={mobileMaxHeight}
          >
            <div className="h-[844px] w-[390px] overflow-hidden bg-slate-900">{frame}</div>
          </ScaledDeviceViewport>
        </div>

        <div
          className={[
            'flex justify-center bg-gray-900',
            compact ? 'py-1' : 'py-2',
          ].join(' ')}
          aria-hidden
        >
          <div
            className={compact ? 'h-0.5 w-10 rounded-full bg-gray-700' : 'h-1 w-16 rounded-full bg-gray-700'}
          />
        </div>
      </div>
    </div>
  )
}

export function EntidadeGestaoLoginPreview({
  slug,
  displayName,
  logoUrl,
  loginBackgroundUrl,
  corPrimaria,
  className = '',
}: EntidadeGestaoLoginPreviewProps) {
  const [viewport, setViewport] = useState<PreviewViewport>('web')
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  const resolvedLogoUrl = logoUrl?.trim() || brand.logoUrl
  const resolvedBackgroundUrl = loginBackgroundUrl?.trim() || brand.prefeituraBackgroundImageUrl
  const resolvedPrimaryColor = /^#[0-9A-Fa-f]{6}$/.test(corPrimaria.trim())
    ? corPrimaria.trim()
    : brand.primaryColor

  const brandVars = useMemo(
    () => buildBrandCssVariables(resolvedPrimaryColor),
    [resolvedPrimaryColor],
  )

  const previewHost = useMemo(() => {
    const normalized = normalizeTenantSlugInput(slug)
    if (normalized) return formatTenantPublicHost(normalized)
    return `seu-cliente.${getPublicRootDomain()}`
  }, [slug])

  const previewPath = '/login'

  const frame = (
    <GestaoLoginPreviewFrame
      viewport={viewport}
      displayName={displayName}
      resolvedLogoUrl={resolvedLogoUrl}
      resolvedBackgroundUrl={resolvedBackgroundUrl}
      brandVars={brandVars}
    />
  )

  useEffect(() => {
    if (!fullscreenOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setFullscreenOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenOpen])

  const fullscreenModal = fullscreenOpen
    ? createPortal(
        <div className="fixed inset-0 z-[10050] flex flex-col bg-slate-950/92 backdrop-blur-md">
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                Preview do login
              </p>
              <p className="truncate font-mono text-xs text-white/90 sm:text-sm">
                {previewHost}
                {previewPath}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ViewportToggle viewport={viewport} onChange={setViewport} size="regular" />
              <button
                type="button"
                onClick={() => setFullscreenOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Fechar preview em tela cheia"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
            <PreviewDeviceShell
              viewport={viewport}
              previewHost={previewHost}
              previewPath={previewPath}
              frame={frame}
              maxWidthClass={
                viewport === 'web'
                  ? 'w-full max-w-[min(1280px,96vw)]'
                  : 'w-full max-w-[min(390px,92vw)]'
              }
            />
          </div>

          <footer className="shrink-0 border-t border-white/10 px-4 py-3 text-center text-xs text-white/60 sm:px-6">
            {viewport === 'web' ? '1280×720' : '390×844'} · Pressione Esc para fechar
          </footer>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <div className={['flex min-w-0 flex-col', className].filter(Boolean).join(' ')}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Preview do login
          </p>
          <ViewportToggle viewport={viewport} onChange={setViewport} />
        </div>

        <button
          type="button"
          onClick={() => setFullscreenOpen(true)}
          className="group relative w-full rounded-2xl text-left transition hover:ring-2 hover:ring-[var(--brand-primary)]/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/40"
          aria-label="Abrir preview do login em tela cheia"
        >
          <PreviewDeviceShell
            viewport={viewport}
            previewHost={previewHost}
            previewPath={previewPath}
            frame={frame}
            compact
          />

          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-900/0 transition group-hover:bg-gray-900/20">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-gray-800 opacity-0 shadow-lg ring-1 ring-gray-200 transition group-hover:opacity-100">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              Ver em tela cheia
            </span>
          </span>
        </button>

        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          Clique para ampliar. Web 1280×720 · Mobile 390×844.
        </p>
      </div>

      {fullscreenModal}
    </>
  )
}
