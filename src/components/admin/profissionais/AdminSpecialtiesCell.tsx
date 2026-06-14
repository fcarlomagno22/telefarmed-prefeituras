import { useCallback, useId, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Eye } from 'lucide-react'

export type AdminRegisteredSpecialty = {
  name: string
  rqe?: string
}

type TooltipPosition = {
  top: number
  left: number
}

type AdminSpecialtiesCellProps = {
  specialty: string
  specialties?: AdminRegisteredSpecialty[]
  className?: string
}

function normalizeSpecialties(
  specialty: string,
  specialties?: AdminRegisteredSpecialty[],
): AdminRegisteredSpecialty[] {
  if (specialties && specialties.length > 0) {
    return specialties
  }

  const trimmed = specialty.trim()
  return trimmed ? [{ name: trimmed }] : []
}

function SpecialtiesTooltipContent({
  tooltipId,
  items,
  arrowOnTop = false,
}: {
  tooltipId: string
  items: AdminRegisteredSpecialty[]
  arrowOnTop?: boolean
}) {
  return (
    <div
      id={tooltipId}
      role="tooltip"
      className="relative w-[15.5rem] overflow-hidden rounded-xl border border-orange-200/20 bg-gray-900 px-3.5 py-3 text-left shadow-2xl shadow-orange-500/10"
    >
      {arrowOnTop ? (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-b-gray-900"
          aria-hidden
        />
      ) : (
        <span
          className="absolute top-full left-1/2 -translate-x-1/2 border-[7px] border-transparent border-t-gray-900"
          aria-hidden
        />
      )}

      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
          <Eye className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200/90">
            Especialidades
          </p>
          <p className="text-[10px] text-gray-400">
            {items.length} registrada{items.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className="rounded-lg border border-white/5 bg-white/[0.04] px-2.5 py-2"
          >
            <p className="text-xs font-medium text-white">{item.name}</p>
            {item.rqe ? (
              <p className="mt-0.5 text-[10px] tabular-nums text-gray-400">RQE {item.rqe}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminSpecialtiesCell({
  specialty,
  specialties,
  className = '',
}: AdminSpecialtiesCellProps) {
  const tooltipId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [hoverPosition, setHoverPosition] = useState<TooltipPosition | null>(null)

  const items = normalizeSpecialties(specialty, specialties)
  const primary = items[0]?.name ?? specialty
  const hasMultiple = items.length > 1

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

  if (!primary) {
    return <span className={`text-xs text-gray-500 ${className}`.trim()}>—</span>
  }

  return (
    <>
      <div className={`inline-flex max-w-full items-center justify-center gap-1 ${className}`.trim()}>
        <span className="truncate text-xs text-gray-700" title={primary}>
          {primary}
        </span>
        {hasMultiple ? (
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex shrink-0 items-center justify-center p-0 text-gray-400 transition hover:text-[var(--brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            aria-label={`Ver ${items.length} especialidades registradas`}
            aria-describedby={hoverPosition ? tooltipId : undefined}
            onMouseEnter={(event: MouseEvent<HTMLButtonElement>) =>
              showHoverTooltip(event.currentTarget)
            }
            onMouseLeave={hideHoverTooltip}
            onFocus={(event: FocusEvent<HTMLButtonElement>) => showHoverTooltip(event.currentTarget)}
            onBlur={hideHoverTooltip}
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>

      {hasMultiple && hoverPosition
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                top: hoverPosition.top,
                left: hoverPosition.left,
                transform: 'translate(-50%, calc(-100% - 12px))',
                zIndex: 10000,
              }}
            >
              <SpecialtiesTooltipContent tooltipId={tooltipId} items={items} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
