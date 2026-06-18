import { ChevronDown, FileStack, History } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type {
  PrefeituraContratoOption,
  PrefeituraContratoStatus,
} from '../../../types/prefeituraContrato'

type PrefeituraContratoSelectorProps = {
  options: PrefeituraContratoOption[]
  selectedId: string
  onSelect: (contractId: string) => void
  /** Sidebar: largura total da coluna; header: compacto no topo da página. */
  variant?: 'header' | 'sidebar'
  className?: string
}

function statusBadgeClass(status: PrefeituraContratoStatus) {
  if (status === 'active') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200/80'
  }
  return 'bg-gray-100 text-gray-600 ring-gray-200/80'
}

function statusLabel(status: PrefeituraContratoStatus) {
  return status === 'active' ? 'Vigente' : 'Encerrado'
}

export function PrefeituraContratoSelector({
  options,
  selectedId,
  onSelect,
  variant = 'header',
  className = '',
}: PrefeituraContratoSelectorProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected =
    options.find((option) => option.id === selectedId) ??
    options[0]

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

  const isSidebar = variant === 'sidebar'

  return (
    <div
      ref={containerRef}
      className={['relative', isSidebar ? 'w-full' : 'shrink-0', className].join(' ')}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Selecionar contrato municipal"
        className={[
          'flex items-center gap-2.5 rounded-xl border bg-white px-3.5 py-2.5 text-left shadow-sm transition',
          isSidebar ? 'w-full' : 'inline-flex max-w-[min(100%,20rem)]',
          open
            ? 'border-[var(--brand-primary)]/40 shadow-[var(--brand-primary-focus-ring)]'
            : 'border-gray-200 hover:border-gray-300',
        ].join(' ')}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary-light)] text-[var(--brand-primary)]">
          <FileStack className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500">
            Contrato exibido
          </span>
          <span className="block truncate text-sm font-bold text-gray-900">
            {selected.title}
          </span>
          <span className="block truncate text-xs text-gray-500">{selected.subtitle}</span>
        </span>
        <ChevronDown
          className={['ml-1 h-4 w-4 shrink-0 text-gray-400 transition', open ? 'rotate-180' : ''].join(
            ' ',
          )}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Contratos municipais"
          className={[
            'absolute top-[calc(100%+0.375rem)] z-[120] overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]',
            isSidebar
              ? 'left-0 right-0 w-full'
              : 'right-0 w-[min(100vw-2.5rem,22rem)]',
          ].join(' ')}
        >
          <p className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <History className="h-3.5 w-3.5" strokeWidth={2} />
            Contratos anteriores
          </p>

          <ul className="max-h-[16rem] overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = option.id === selectedId

              return (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelect(option.id)
                      setOpen(false)
                    }}
                    className={[
                      'flex w-full items-start gap-3 px-3 py-3 text-left transition',
                      isSelected
                        ? 'bg-[var(--brand-primary-light)]/80'
                        : 'hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">{option.title}</span>
                        <span
                          className={[
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset',
                            statusBadgeClass(option.status),
                          ].join(' ')}
                        >
                          {statusLabel(option.status)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {option.contractNumber}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500">{option.subtitle}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
