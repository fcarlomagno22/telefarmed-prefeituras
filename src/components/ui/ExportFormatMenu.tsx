import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const itemLabel = resultCount === 1 ? itemSingular : itemPlural

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
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

      {open ? (
        <div
          role="menu"
          aria-label="Formato de exportação"
          className="absolute right-0 top-[calc(100%+0.375rem)] z-[120] min-w-[13.5rem] overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
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
      ) : null}
    </div>
  )
}
