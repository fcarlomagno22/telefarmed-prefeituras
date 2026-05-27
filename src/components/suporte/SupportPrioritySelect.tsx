import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SupportTicketPriority } from '../../data/suporteMock'
import { getSupportPriorityOption, supportPriorityOptions } from './supportPriorityConfig'

type SupportPrioritySelectProps = {
  value: SupportTicketPriority
  onChange: (value: SupportTicketPriority) => void
  className?: string
}

const triggerBaseClass =
  'flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200/80 bg-white py-3 px-4 text-left text-sm outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

function PriorityOptionContent({
  label,
  textClass,
  icon: Icon,
}: {
  label: string
  textClass: string
  icon: (typeof supportPriorityOptions)[number]['icon']
}) {
  return (
    <span className={`inline-flex items-center gap-2 font-medium ${textClass}`}>
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      {label}
    </span>
  )
}

export function SupportPrioritySelect({
  value,
  onChange,
  className = '',
}: SupportPrioritySelectProps) {
  const [open, setOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listboxId = useId()

  const selected = getSupportPriorityOption(value)

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
            {supportPriorityOptions.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={`flex w-full px-4 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? 'bg-[var(--brand-primary-light)]/60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <PriorityOptionContent
                      label={option.label}
                      textClass={option.textClass}
                      icon={option.icon}
                    />
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
        aria-label="Prioridade do chamado"
        onClick={() => setOpen((prev) => !prev)}
        className={`${triggerBaseClass} ${open ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/15' : ''} ${className}`}
      >
        <PriorityOptionContent
          label={selected.label}
          textClass={selected.textClass}
          icon={selected.icon}
        />
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>
      {dropdownMenu}
    </div>
  )
}
