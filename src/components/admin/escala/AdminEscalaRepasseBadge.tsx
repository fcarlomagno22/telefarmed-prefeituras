import { Info } from 'lucide-react'
import { useCallback, useId, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import type { EscalaRepasseRule } from '../../../types/adminEscala'
import {
  buildRepasseTooltipLines,
  ensureRepasseRule,
  formatRepasseListLabel,
} from '../../../utils/adminEscala/repasseRule'

type TooltipPosition = {
  top: number
  left: number
}

type AdminEscalaRepasseBadgeProps = {
  repasseRule: EscalaRepasseRule
  amountCents?: number
  /** Ex.: "Repasse: Fixo" (padrão) ou rótulo customizado. */
  label?: string
  tooltipTitle?: string
  size?: 'sm' | 'md'
  className?: string
}

function RepasseTooltipContent({
  tooltipId,
  title,
  lines,
  arrowOnTop = false,
}: {
  tooltipId: string
  title: string
  lines: string[]
  arrowOnTop?: boolean
}) {
  return (
    <div
      id={tooltipId}
      role="tooltip"
      className="relative z-[10000] w-[17rem] rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-left text-[11px] leading-relaxed text-white shadow-xl"
    >
      {arrowOnTop ? (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-b-gray-900"
          aria-hidden
        />
      ) : (
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900"
          aria-hidden
        />
      )}
      <p className="text-xs font-semibold text-white">{title}</p>
      <ul className="mt-2 space-y-1 text-gray-200">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  )
}

export function AdminEscalaRepasseBadge({
  repasseRule,
  amountCents,
  label,
  tooltipTitle = 'Regra de repasse',
  size = 'sm',
  className = '',
}: AdminEscalaRepasseBadgeProps) {
  const tooltipId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hoverPosition, setHoverPosition] = useState<TooltipPosition | null>(null)
  const safeRule = ensureRepasseRule(repasseRule, amountCents)
  const displayLabel = label ?? formatRepasseListLabel(safeRule)
  const tooltipLines = buildRepasseTooltipLines(safeRule, amountCents)

  const showTooltip = useCallback((target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    setHoverPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const hideTooltip = useCallback(() => setHoverPosition(null), [])

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    showTooltip(event.currentTarget)
  }

  const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
    showTooltip(event.currentTarget)
  }

  const sizeClass =
    size === 'md'
      ? 'px-2.5 py-1 text-[11px]'
      : 'px-2 py-0.5 text-[10px]'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={[
          'inline-flex max-w-full items-center gap-1 rounded-md bg-orange-50 font-bold uppercase tracking-wide text-orange-800 ring-1 ring-orange-200 transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]',
          sizeClass,
          className,
        ].join(' ')}
        aria-describedby={hoverPosition ? tooltipId : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={hideTooltip}
        onFocus={handleFocus}
        onBlur={hideTooltip}
      >
        <span className="truncate">{displayLabel}</span>
        <Info className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
      </button>

      {hoverPosition
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999]"
              style={{
                top: hoverPosition.top - 8,
                left: hoverPosition.left,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <RepasseTooltipContent
                tooltipId={tooltipId}
                title={tooltipTitle}
                lines={tooltipLines}
                arrowOnTop={false}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
