import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Hand,
  ListOrdered,
  MousePointerClick,
  Sparkles,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PROFISSIONAL_TOUR_Z_INDEX,
  type ProfissionalAgendaTourPlacement,
} from '../../../config/profissionalAgendaTour'

type ProfissionalOnboardingTourProps = {
  open: boolean
  title: string
  body: string
  hint?: string
  stepIndex: number
  totalSteps: number
  placement?: ProfissionalAgendaTourPlacement
  targetRect: DOMRect | null
  advanceOn?: 'next' | 'target-click' | 'tab-fila' | 'next-or-target-click'
  isLastStep: boolean
  blockBackground?: boolean
  nextLabel?: string
  onNext: () => void
  onBack: () => void
}

const SPOTLIGHT_PADDING = 10
const CARD_MAX_WIDTH = 440
const CARD_GAP = 14
const VIEWPORT_MARGIN = 16
const CARD_ESTIMATED_HEIGHT = 380

type ResolvedCardPlacement = 'top' | 'bottom' | 'left' | 'right'

type TourCardLayout = {
  top: number
  left: number
  width: number
  placement: ResolvedCardPlacement
  tailOffset: number
}

type SpotlightBounds = {
  top: number
  left: number
  width: number
  height: number
  right: number
  bottom: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function fitsInViewport(
  top: number,
  left: number,
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return (
    top >= VIEWPORT_MARGIN &&
    left >= VIEWPORT_MARGIN &&
    top + height <= viewportHeight - VIEWPORT_MARGIN &&
    left + width <= viewportWidth - VIEWPORT_MARGIN
  )
}

function computeSideLayout(
  side: ResolvedCardPlacement,
  bounds: SpotlightBounds,
  cardWidth: number,
  cardHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): TourCardLayout | null {
  const targetCenterX = bounds.left + bounds.width / 2
  const targetCenterY = bounds.top + bounds.height / 2

  let top = 0
  let left = 0
  let tailOffset = 0

  switch (side) {
    case 'bottom':
      top = bounds.bottom + CARD_GAP
      left = clamp(
        targetCenterX - cardWidth / 2,
        VIEWPORT_MARGIN,
        viewportWidth - VIEWPORT_MARGIN - cardWidth,
      )
      tailOffset = clamp(targetCenterX - left, 28, cardWidth - 28)
      break
    case 'top':
      top = bounds.top - CARD_GAP - cardHeight
      left = clamp(
        targetCenterX - cardWidth / 2,
        VIEWPORT_MARGIN,
        viewportWidth - VIEWPORT_MARGIN - cardWidth,
      )
      tailOffset = clamp(targetCenterX - left, 28, cardWidth - 28)
      break
    case 'right':
      left = bounds.right + CARD_GAP
      top = clamp(
        targetCenterY - cardHeight / 2,
        VIEWPORT_MARGIN,
        viewportHeight - VIEWPORT_MARGIN - cardHeight,
      )
      tailOffset = clamp(targetCenterY - top, 28, cardHeight - 28)
      break
    case 'left':
      left = bounds.left - CARD_GAP - cardWidth
      top = clamp(
        targetCenterY - cardHeight / 2,
        VIEWPORT_MARGIN,
        viewportHeight - VIEWPORT_MARGIN - cardHeight,
      )
      tailOffset = clamp(targetCenterY - top, 28, cardHeight - 28)
      break
  }

  if (!fitsInViewport(top, left, cardWidth, cardHeight, viewportWidth, viewportHeight)) {
    return null
  }

  return { top, left, width: cardWidth, placement: side, tailOffset }
}

function computeTourCardLayout({
  bounds,
  cardWidth,
  cardHeight,
  viewportWidth,
  viewportHeight,
  preferredPlacement = 'bottom',
}: {
  bounds: SpotlightBounds
  cardWidth: number
  cardHeight: number
  viewportWidth: number
  viewportHeight: number
  preferredPlacement?: ProfissionalAgendaTourPlacement
}): TourCardLayout {
  const sides: ResolvedCardPlacement[] = ['bottom', 'top', 'right', 'left']
  const preferred =
    preferredPlacement === 'center' ? 'bottom' : (preferredPlacement as ResolvedCardPlacement)

  const orderedSides = [
    preferred,
    ...sides.filter((side) => side !== preferred),
  ] as ResolvedCardPlacement[]

  for (const side of orderedSides) {
    const layout = computeSideLayout(
      side,
      bounds,
      cardWidth,
      cardHeight,
      viewportWidth,
      viewportHeight,
    )
    if (layout) return layout
  }

  const fallbackSide = orderedSides[0]
  const targetCenterX = bounds.left + bounds.width / 2
  const targetCenterY = bounds.top + bounds.height / 2

  if (fallbackSide === 'bottom' || fallbackSide === 'top') {
    const top =
      fallbackSide === 'bottom'
        ? clamp(bounds.bottom + CARD_GAP, VIEWPORT_MARGIN, viewportHeight - VIEWPORT_MARGIN - cardHeight)
        : clamp(bounds.top - CARD_GAP - cardHeight, VIEWPORT_MARGIN, viewportHeight - VIEWPORT_MARGIN - cardHeight)
    const left = clamp(
      targetCenterX - cardWidth / 2,
      VIEWPORT_MARGIN,
      viewportWidth - VIEWPORT_MARGIN - cardWidth,
    )

    return {
      top,
      left,
      width: cardWidth,
      placement: fallbackSide,
      tailOffset: clamp(targetCenterX - left, 28, cardWidth - 28),
    }
  }

  const left =
    fallbackSide === 'right'
      ? clamp(bounds.right + CARD_GAP, VIEWPORT_MARGIN, viewportWidth - VIEWPORT_MARGIN - cardWidth)
      : clamp(bounds.left - CARD_GAP - cardWidth, VIEWPORT_MARGIN, viewportWidth - VIEWPORT_MARGIN - cardWidth)
  const top = clamp(
    targetCenterY - cardHeight / 2,
    VIEWPORT_MARGIN,
    viewportHeight - VIEWPORT_MARGIN - cardHeight,
  )

  return {
    top,
    left,
    width: cardWidth,
    placement: fallbackSide,
    tailOffset: clamp(targetCenterY - top, 28, cardHeight - 28),
  }
}

function TourBubbleTail({
  placement,
  offset,
}: {
  placement: ResolvedCardPlacement
  offset: number
}) {
  const shared =
    'pointer-events-none absolute h-4 w-4 rotate-45 border border-white/80 bg-white shadow-[2px_2px_6px_rgba(15,23,42,0.08)]'

  if (placement === 'bottom') {
    return (
      <span
        className={shared}
        style={{ top: -8, left: offset - 8 }}
        aria-hidden
      />
    )
  }

  if (placement === 'top') {
    return (
      <span
        className={shared}
        style={{ bottom: -8, left: offset - 8 }}
        aria-hidden
      />
    )
  }

  if (placement === 'right') {
    return (
      <span
        className={shared}
        style={{ left: -8, top: offset - 8 }}
        aria-hidden
      />
    )
  }

  return (
    <span
      className={shared}
      style={{ right: -8, top: offset - 8 }}
      aria-hidden
    />
  )
}

function getSpotlightBounds(targetRect: DOMRect): SpotlightBounds {
  const top = Math.max(0, targetRect.top - SPOTLIGHT_PADDING)
  const left = Math.max(0, targetRect.left - SPOTLIGHT_PADDING)
  const width = targetRect.width + SPOTLIGHT_PADDING * 2
  const height = targetRect.height + SPOTLIGHT_PADDING * 2

  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }
}

function TourSpotlightShade({
  bounds,
  viewportWidth,
  viewportHeight,
  blockBackground,
  layerStyle,
  onBackdropPointerDown,
}: {
  bounds: SpotlightBounds
  viewportWidth: number
  viewportHeight: number
  blockBackground: boolean
  layerStyle: React.CSSProperties
  onBackdropPointerDown: (event: React.PointerEvent) => void
}) {
  const panelClass = blockBackground
    ? 'pointer-events-auto fixed bg-slate-950/70 backdrop-blur-[3px]'
    : 'pointer-events-auto fixed bg-slate-950/45'

  const backdropHandlers = { onPointerDown: onBackdropPointerDown }

  return (
    <>
      <div
        className={panelClass}
        style={{ ...layerStyle, top: 0, left: 0, width: viewportWidth, height: bounds.top }}
        aria-hidden
        {...backdropHandlers}
      />
      <div
        className={panelClass}
        style={{
          ...layerStyle,
          top: bounds.bottom,
          left: 0,
          width: viewportWidth,
          height: Math.max(0, viewportHeight - bounds.bottom),
        }}
        aria-hidden
        {...backdropHandlers}
      />
      <div
        className={panelClass}
        style={{
          ...layerStyle,
          top: bounds.top,
          left: 0,
          width: bounds.left,
          height: bounds.height,
        }}
        aria-hidden
        {...backdropHandlers}
      />
      <div
        className={panelClass}
        style={{
          ...layerStyle,
          top: bounds.top,
          left: bounds.right,
          width: Math.max(0, viewportWidth - bounds.right),
          height: bounds.height,
        }}
        aria-hidden
        {...backdropHandlers}
      />
      <div
        className="pointer-events-none fixed animate-pulse rounded-2xl ring-4 ring-[var(--brand-primary)] ring-offset-2 ring-offset-transparent"
        style={{
          ...layerStyle,
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
        }}
        aria-hidden
      />
    </>
  )
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={[
            'h-1.5 rounded-full transition-all duration-300',
            index === current
              ? 'w-6 bg-[var(--brand-primary)]'
              : index < current
                ? 'w-1.5 bg-orange-300'
                : 'w-1.5 bg-gray-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

function stepIcon(stepIndex: number, isLastStep: boolean) {
  if (stepIndex === 0) return Sparkles
  if (isLastStep) return Hand
  if (stepIndex <= 2) return CalendarDays
  return ListOrdered
}

export function ProfissionalOnboardingTour({
  open,
  title,
  body,
  hint,
  stepIndex,
  totalSteps,
  placement = 'bottom',
  targetRect,
  advanceOn = 'next',
  isLastStep,
  blockBackground = true,
  nextLabel,
  onNext,
  onBack,
}: ProfissionalOnboardingTourProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [cardHeight, setCardHeight] = useState(CARD_ESTIMATED_HEIGHT)
  const [cardLayout, setCardLayout] = useState<TourCardLayout | null>(null)
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const isCentered = !targetRect
  const StepIcon = stepIcon(stepIndex, isLastStep)
  const spotlightBounds = targetRect ? getSpotlightBounds(targetRect) : null
  const cardWidth = Math.min(CARD_MAX_WIDTH, viewport.width - VIEWPORT_MARGIN * 2)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    function syncViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('resize', syncViewport)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open || isCentered || !spotlightBounds) {
      setCardLayout(null)
      return
    }

    const measuredHeight = cardRef.current?.offsetHeight
    const height = measuredHeight && measuredHeight > 0 ? measuredHeight : cardHeight

    setCardLayout(
      computeTourCardLayout({
        bounds: spotlightBounds,
        cardWidth,
        cardHeight: height,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        preferredPlacement: placement,
      }),
    )

    if (measuredHeight && Math.abs(measuredHeight - cardHeight) > 6) {
      setCardHeight(measuredHeight)
    }
  }, [
    open,
    isCentered,
    targetRect,
    cardWidth,
    cardHeight,
    viewport.width,
    viewport.height,
    placement,
    stepIndex,
    title,
    body,
    hint,
    isLastStep,
    advanceOn,
  ])

  if (!open || !mounted) return null

  const showNext =
    advanceOn === 'next' ||
    advanceOn === 'next-or-target-click' ||
    isCentered ||
    isLastStep
  const progress = Math.round(((stepIndex + 1) / totalSteps) * 100)
  const actionHint =
    hint ??
    (advanceOn === 'target-click' || advanceOn === 'next-or-target-click'
      ? 'Toque no botão destacado na tela'
      : undefined)
  const primaryActionLabel = isLastStep ? 'Começar a usar' : nextLabel ?? 'Continuar'

  function handleBackdropPointerDown(event: React.PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
  }

  const overlayStyle = { zIndex: PROFISSIONAL_TOUR_Z_INDEX }
  const layerStyle = { zIndex: PROFISSIONAL_TOUR_Z_INDEX + 1 }
  const cardStyle = { zIndex: PROFISSIONAL_TOUR_Z_INDEX + 2 }
  const anchoredLayout =
    !isCentered && cardLayout
      ? cardLayout
      : !isCentered && spotlightBounds
        ? computeTourCardLayout({
            bounds: spotlightBounds,
            cardWidth,
            cardHeight,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            preferredPlacement: placement,
          })
        : null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0"
      style={overlayStyle}
      role="presentation"
      aria-hidden={!open}
    >
      {spotlightBounds ? (
        <TourSpotlightShade
          bounds={spotlightBounds}
          viewportWidth={viewport.width}
          viewportHeight={viewport.height}
          blockBackground={blockBackground}
          layerStyle={layerStyle}
          onBackdropPointerDown={handleBackdropPointerDown}
        />
      ) : (
        <div
          className={
            blockBackground
              ? 'pointer-events-auto fixed inset-0 bg-slate-950/60 backdrop-blur-[3px]'
              : 'pointer-events-auto fixed inset-0 bg-slate-950/45'
          }
          style={layerStyle}
          aria-hidden
          onPointerDown={handleBackdropPointerDown}
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profissional-tour-title"
        aria-describedby="profissional-tour-body"
        className="pointer-events-auto fixed relative transition-[top,left,opacity] duration-300 ease-out"
        style={{
          ...cardStyle,
          width: isCentered ? cardWidth : anchoredLayout?.width,
          ...(isCentered
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            : anchoredLayout
              ? {
                  top: anchoredLayout.top,
                  left: anchoredLayout.left,
                  opacity: cardLayout ? 1 : 0,
                }
              : {}),
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {!isCentered && anchoredLayout ? (
          <TourBubbleTail placement={anchoredLayout.placement} offset={anchoredLayout.tailOffset} />
        ) : null}

        <div className="relative w-full overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.35),0_8px_24px_rgba(255,107,0,0.12)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary)] via-[#ff8c33] to-[#ffb347] px-5 pb-8 pt-5 text-white">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-6 left-1/3 h-24 w-24 rounded-full bg-white/10 blur-xl"
            aria-hidden
          />

          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-sm">
              <StepIcon className="h-5 w-5" strokeWidth={2.15} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                Passo {stepIndex + 1} de {totalSteps}
              </p>
              <h2
                id="profissional-tour-title"
                className="mt-0.5 text-lg font-bold leading-snug tracking-tight"
              >
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="relative -mt-4 rounded-t-3xl bg-white px-5 pb-5 pt-6">
          <p id="profissional-tour-body" className="text-[15px] leading-relaxed text-gray-600">
            {body}
          </p>

          {actionHint ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-[var(--brand-primary-light)]/40 px-3.5 py-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-orange-100">
                {advanceOn === 'target-click' ? (
                  <MousePointerClick className="h-4 w-4" strokeWidth={2.15} />
                ) : (
                  <Sparkles className="h-4 w-4" strokeWidth={2.15} />
                )}
              </span>
              <p className="text-sm font-semibold leading-snug text-gray-800">{actionHint}</p>
            </div>
          ) : null}

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-gray-400">
              <span>Progresso</span>
              <span className="tabular-nums text-[var(--brand-primary)]">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] via-orange-400 to-amber-300 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-3">
              <StepDots current={stepIndex} total={totalSteps} />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={onBack}
                className="mr-auto inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
                Voltar
              </button>
            ) : null}
            {showNext ? (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(255,107,0,0.35)] transition hover:bg-[var(--brand-primary-hover)]"
              >
                {primaryActionLabel}
                {!isLastStep ? (
                  <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                ) : null}
              </button>
            ) : null}
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
