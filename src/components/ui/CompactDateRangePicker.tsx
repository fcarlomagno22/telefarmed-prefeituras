import { Calendar } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CompactDatePicker } from './CompactDatePicker'
import { formatDatePtBr } from '../../utils/calendar'

type CompactDateRangePickerProps = {
  start: string
  end: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  className?: string
  /** Altura alinhada a inputs de toolbar (~42px). */
  compact?: boolean
}

type MenuPosition = {
  top: number
  left: number
  width: number
}

const MENU_MIN_WIDTH_PX = 448
const MENU_Z_INDEX = 9999

function formatRangeLabel(start: string, end: string) {
  const startLabel = formatDatePtBr(start)
  const endLabel = formatDatePtBr(end)
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`
  if (startLabel) return startLabel
  if (endLabel) return endLabel
  return 'Selecione o período'
}

export function CompactDateRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  className = '',
  compact = false,
}: CompactDateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const displayValue = formatRangeLabel(start, end)

  function updateMenuPosition() {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const width = Math.min(
      Math.max(rect.width, MENU_MIN_WIDTH_PX),
      window.innerWidth - 32,
    )
    let left = rect.left
    const maxLeft = window.innerWidth - width - 16
    if (left > maxLeft) left = Math.max(16, maxLeft)

    setMenuPosition({
      top: rect.bottom + 6,
      left,
      width,
    })
  }

  useEffect(() => {
    if (!open) {
      setMenuPosition(null)
      return
    }

    updateMenuPosition()

    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)

    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const dropdownPanel =
    open && menuPosition
      ? createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Selecionar período de atendimento"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: MENU_Z_INDEX,
            }}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Data inicial
                </label>
                <CompactDatePicker value={start} onChange={onStartChange} placeholder="Início" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Data final
                </label>
                <CompactDatePicker value={end} onChange={onEndChange} placeholder="Fim" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)]"
            >
              Confirmar período
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <div
        ref={triggerRef}
        className={[
          'flex w-full items-center rounded-xl border bg-white pr-1.5 transition focus-within:ring-2',
          'border-gray-200/80 focus-within:border-[var(--brand-primary)] focus-within:ring-[var(--brand-primary)]/15',
          open ? 'ring-2 border-[var(--brand-primary)] ring-[var(--brand-primary)]/15' : '',
        ].join(' ')}
      >
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={[
            'min-w-0 flex-1 text-left text-sm text-gray-800 outline-none',
            compact ? 'px-3 py-2.5' : 'px-4 py-3',
          ].join(' ')}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? panelId : undefined}
        >
          {displayValue}
        </button>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-label="Abrir seletor de período"
          className={[
            'inline-flex shrink-0 items-center justify-center rounded-lg border transition',
            compact ? 'mr-1 h-7 w-7' : 'h-8 w-8',
            open
              ? 'border-[var(--brand-primary)]/40 bg-orange-50 text-[var(--brand-primary)]'
              : 'border-transparent text-gray-500 hover:bg-orange-50 hover:text-[var(--brand-primary)]',
          ].join(' ')}
        >
          <Calendar className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {dropdownPanel}
    </div>
  )
}
