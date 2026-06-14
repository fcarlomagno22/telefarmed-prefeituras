import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FLOATING_POPOVER_Z_INDEX } from '../../config/overlayLayers'
import { FloatingOverlayPortal } from './FloatingOverlayPortal'

export type ExportFormat = 'pdf' | 'excel'

type ExportFormatMenuProps = {
  resultCount: number
  itemSingular: string
  itemPlural: string
  onSelect: (format: ExportFormat) => void
  /** Texto do botão que abre o popover (padrão: Exportar). */
  triggerLabel?: string
  /** Texto após a contagem no popover (padrão: com os filtros atuais). */
  resultScopeLabel?: string
}

type MenuPosition = {
  top: number
  left: number
  width: number
}

function formatCount(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function ExportFormatMenu({
  resultCount,
  itemSingular,
  itemPlural,
  onSelect,
  triggerLabel = 'Exportar',
  resultScopeLabel = 'com os filtros atuais',
}: ExportFormatMenuProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const itemLabel = resultCount === 1 ? itemSingular : itemPlural

  function computeMenuPosition(): MenuPosition | null {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 6
    const menuWidth = 216
    const left = Math.min(
      Math.max(8, rect.right - menuWidth),
      window.innerWidth - menuWidth - 8,
    )

    return {
      top: rect.bottom + gap,
      left,
      width: menuWidth,
    }
  }

  function updateMenuPosition() {
    const next = computeMenuPosition()
    if (next) setMenuPosition(next)
  }

  useLayoutEffect(() => {
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
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
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

  function selectFormat(format: ExportFormat) {
    setOpen(false)
    onSelect(format)
  }

  function handleTriggerClick() {
    if (open) {
      setOpen(false)
      return
    }
    const position = computeMenuPosition()
    if (position) setMenuPosition(position)
    setOpen(true)
  }

  const dropdownMenu =
    open && menuPosition ? (
      <FloatingOverlayPortal>
        <div
          ref={menuRef}
          role="menu"
          aria-label="Formato de exportação"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            zIndex: FLOATING_POPOVER_Z_INDEX,
            pointerEvents: 'auto',
          }}
          className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
            <p className="border-b border-gray-200 px-3 py-2 text-[11px] leading-snug text-gray-500">
              <span className="font-semibold text-gray-700">
                {formatCount(resultCount)} {itemLabel}
              </span>{' '}
              {resultScopeLabel}
            </p>

            <button
              type="button"
              role="menuitem"
              onClick={() => selectFormat('pdf')}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-800 transition hover:bg-gray-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <FileText className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>
                <span className="block font-semibold">PDF</span>
                <span className="block text-xs text-gray-500">Relatório para impressão</span>
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => selectFormat('excel')}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-800 transition hover:bg-gray-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <FileSpreadsheet className="h-4 w-4" strokeWidth={2} />
              </span>
              <span>
                <span className="block font-semibold">Excel</span>
                <span className="block text-xs text-gray-500">Planilha (.csv)</span>
              </span>
          </button>
        </div>
      </FloatingOverlayPortal>
    ) : null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-expanded={open}
        aria-haspopup="menu"
        className={[
          'inline-flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-medium transition',
          open
            ? 'border-[var(--brand-primary)]/40 text-[var(--brand-primary)] shadow-[0_0_0_3px_rgba(255,107,0,0.12)]'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50',
        ].join(' ')}
      >
        <Download className="h-4 w-4 text-gray-500" strokeWidth={2} />
        {triggerLabel}
      </button>

      {dropdownMenu}
    </div>
  )
}
