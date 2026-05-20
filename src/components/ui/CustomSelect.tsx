import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type CustomSelectOption = {
  value: string
  label: string
}

type CustomSelectProps = {
  value: string
  onChange: (value: string) => void
  options: CustomSelectOption[]
  placeholder?: string
  required?: boolean
  className?: string
}

const triggerBaseClass =
  'flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-left text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

type MenuPosition = {
  top: number
  left: number
  width: number
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  required = false,
  className = '',
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

  function updateMenuPosition() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
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

  const dropdownMenu =
    open && menuPosition
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 9999,
            }}
            className="max-h-56 overflow-auto rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
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
                    className={`flex w-full px-4 py-2.5 text-left text-sm transition ${
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
          </ul>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={`${triggerBaseClass} ${open ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/15' : ''} ${className}`}
      >
        <span className={isPlaceholder ? 'text-gray-400' : 'text-gray-800'}>
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
