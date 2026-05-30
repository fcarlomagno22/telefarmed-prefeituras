import { useCallback, useId, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'

type ProfissionalEscalaCityTooltipProps = {
  city: string
  locationName: string
  fullAddress: string
  tourPinned?: boolean
  /** Oculta interações e fecha o tooltip (ex.: outros passos do tour). */
  tourSuppress?: boolean
  dataTour?: string
}

type TooltipPosition = {
  top: number
  left: number
}

function TooltipContent({
  tooltipId,
  city,
  locationName,
  fullAddress,
  arrowOnTop = false,
  className = '',
}: {
  tooltipId: string
  city: string
  locationName: string
  fullAddress: string
  arrowOnTop?: boolean
  className?: string
}) {
  return (
    <div
      id={tooltipId}
      role="tooltip"
      className={[
        'relative w-[15rem] rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-left text-[11px] leading-relaxed text-white shadow-xl',
        className,
      ].join(' ')}
    >
      {arrowOnTop ? (
        <span
          className="absolute left-1/2 bottom-full -translate-x-1/2 border-[6px] border-transparent border-b-gray-900"
          aria-hidden
        />
      ) : (
        <span
          className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"
          aria-hidden
        />
      )}
      <p className="text-xs font-semibold text-white">{locationName}</p>
      <p className="mb-1 text-[11px] text-gray-300">{city}</p>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
        Endereço completo
      </p>
      {fullAddress}
    </div>
  )
}

export function ProfissionalEscalaCityTooltip({
  city,
  locationName,
  fullAddress,
  tourPinned = false,
  tourSuppress = false,
  dataTour,
}: ProfissionalEscalaCityTooltipProps) {
  const tooltipId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hoverPosition, setHoverPosition] = useState<TooltipPosition | null>(null)

  const showHoverTooltip = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    setHoverPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const hideHoverTooltip = useCallback(() => {
    setHoverPosition(null)
  }, [])

  const showTourTooltip = tourPinned && !tourSuppress
  const showPortalTooltip = hoverPosition !== null && !tourPinned

  const triggerHandlers = tourSuppress || tourPinned
    ? {}
    : {
        onMouseEnter: (event: MouseEvent<HTMLButtonElement>) => showHoverTooltip(event.currentTarget),
        onMouseLeave: hideHoverTooltip,
        onFocus: (event: FocusEvent<HTMLButtonElement>) => showHoverTooltip(event.currentTarget),
        onBlur: hideHoverTooltip,
      }

  return (
    <>
      <div data-tour={dataTour} className="inline-flex flex-col items-center">
        <button
          ref={buttonRef}
          type="button"
          className="inline border-b border-dotted border-gray-500 bg-transparent p-0 text-sm font-semibold text-gray-900 underline-offset-2 outline-none hover:text-[var(--brand-primary)] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
          aria-describedby={showTourTooltip || showPortalTooltip ? tooltipId : undefined}
          {...triggerHandlers}
        >
          {city}
        </button>

        {showTourTooltip ? (
          <TooltipContent
            tooltipId={tooltipId}
            city={city}
            locationName={locationName}
            fullAddress={fullAddress}
            arrowOnTop
            className="mt-3"
          />
        ) : null}
      </div>

      {showPortalTooltip
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                top: hoverPosition.top,
                left: hoverPosition.left,
                transform: 'translate(-50%, calc(-100% - 10px))',
                zIndex: 10000,
              }}
            >
              <TooltipContent
                tooltipId={tooltipId}
                city={city}
                locationName={locationName}
                fullAddress={fullAddress}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
