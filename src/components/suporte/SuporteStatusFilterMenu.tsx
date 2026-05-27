import { useEffect, useRef } from 'react'
import type { SupportTicketStatus } from '../../data/suporteMock'

const statusOptions: { value: SupportTicketStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os status' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'aguardando_resposta', label: 'Aguardando resposta' },
  { value: 'respondido', label: 'Respondido' },
  { value: 'encerrado', label: 'Encerrado' },
]

type SuporteStatusFilterMenuProps = {
  open: boolean
  value: SupportTicketStatus | ''
  onClose: () => void
  onChange: (value: SupportTicketStatus | '') => void
}

export function SuporteStatusFilterMenu({
  open,
  value,
  onClose,
  onChange,
}: SuporteStatusFilterMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const trigger = document.getElementById('suporte-status-filter-trigger')
      if (
        panelRef.current?.contains(target) ||
        trigger?.contains(target)
      ) {
        return
      }
      onClose()
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Filtrar por status"
      className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      {statusOptions.map((option) => (
        <button
          key={option.value || 'all'}
          type="button"
          onClick={() => {
            onChange(option.value)
            onClose()
          }}
          className={[
            'flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-gray-50',
            value === option.value
              ? 'font-semibold text-[var(--brand-primary)]'
              : 'font-medium text-gray-700',
          ].join(' ')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
