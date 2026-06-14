import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { FLOATING_POPOVER_Z_INDEX } from '../../config/overlayLayers'
import { FloatingOverlayPortal } from './FloatingOverlayPortal'

export type CustomSelectOption = {
  value: string
  label: string
}

type CustomSelectSize = 'default' | 'compact'

type CustomSelectProps = {
  value: string
  onChange: (value: string) => void
  options: CustomSelectOption[]
  placeholder?: string
  required?: boolean
  className?: string
  /** Alinha altura com inputs de formulário (`py-2 px-3`, `rounded-lg`). */
  size?: CustomSelectSize
  /** Largura mínima do painel (px). O menu usa o maior valor entre o botão e este mínimo. */
  menuMinWidthPx?: number
}

const triggerBaseClass =
  'flex w-full items-center justify-between gap-2 border border-gray-200/80 bg-white text-left text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const triggerSizeClass: Record<CustomSelectSize, string> = {
  default: 'rounded-xl py-3 px-4',
  compact: 'rounded-lg py-2 px-3',
}

type MenuPosition = {
  top: number
  left: number
  width: number
  maxHeight: number
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  required = false,
  className = '',
  size = 'default',
  menuMinWidthPx = 208,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const selected = options.find((opt) => opt.value === value)
  const displayLabel = selected?.label ?? placeholder
  const isPlaceholder = !selected?.value

  function computeMenuPosition(): MenuPosition | null {
    if (!triggerRef.current) return null
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 6
    const menuMaxHeight = 224
    const estimatedMenuHeight = Math.min(menuMaxHeight, options.length * 40 + 8)
    const spaceBelow = window.innerHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const placeAbove = estimatedMenuHeight > spaceBelow && spaceAbove > spaceBelow
    const availableHeight = Math.max(120, placeAbove ? spaceAbove : spaceBelow)
    const maxHeight = Math.min(menuMaxHeight, availableHeight)
    const top = placeAbove
      ? Math.max(gap, rect.top - gap - maxHeight)
      : rect.bottom + gap

    return {
      top,
      left: rect.left,
      width: Math.max(rect.width, menuMinWidthPx),
      maxHeight,
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
  }, [open, options.length, menuMinWidthPx])

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

  function selectOption(optionValue: string) {
    onChange(optionValue)
    setOpen(false)
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
        <ul
          ref={menuRef}
          id={listboxId}
          role="listbox"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            maxHeight: menuPosition.maxHeight,
            zIndex: FLOATING_POPOVER_Z_INDEX,
            pointerEvents: 'auto',
          }}
            className="pointer-events-auto overflow-auto rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <li key={opt.value || '__empty'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectOption(opt.value)}
                  className={`flex w-full whitespace-nowrap px-4 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? 'bg-[var(--brand-primary-light)]/60 font-medium text-[var(--brand-primary)]'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      </FloatingOverlayPortal>
    ) : null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={handleTriggerClick}
        className={`${triggerBaseClass} ${triggerSizeClass[size]} ${open ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/15' : ''} ${className}`}
      >
        <span
          className={`min-w-0 truncate ${isPlaceholder ? 'text-gray-400' : 'text-gray-800'}`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {dropdownMenu}

      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          readOnly
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onChange={() => undefined}
        />
      )}
    </div>
  )
}
