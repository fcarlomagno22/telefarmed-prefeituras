import { ArrowLeftRight, Eye, MoreVertical, Users } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { FLOATING_POPOVER_Z_INDEX } from '../../../config/overlayLayers'
import type {
  CrmPartnersClienteAction,
  CrmPartnersClienteRow,
} from '../../../types/crmPartnersClientes'

type CrmPartnersClienteActionsMenuProps = {
  cliente: CrmPartnersClienteRow
  open: boolean
  onToggle: () => void
  onClose: () => void
  onAction: (action: CrmPartnersClienteAction) => void
}

const MENU_MIN_WIDTH_PX = 232
const MENU_GAP_PX = 8
const VIEWPORT_PADDING_PX = 12

type MenuItemProps = {
  icon: typeof Eye
  label: string
  onClick: () => void
}

function MenuItem({ icon: Icon, label, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
      {label}
    </button>
  )
}

export function CrmPartnersClienteActionsMenu({
  cliente,
  open,
  onToggle,
  onClose,
  onAction,
}: CrmPartnersClienteActionsMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = Math.max(MENU_MIN_WIDTH_PX, rect.width)
    let left = rect.right - menuWidth
    left = Math.max(VIEWPORT_PADDING_PX, Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PADDING_PX))

    let top = rect.bottom + MENU_GAP_PX
    const estimatedHeight = 160
    if (top + estimatedHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
      top = Math.max(VIEWPORT_PADDING_PX, rect.top - estimatedHeight - MENU_GAP_PX)
    }

    setMenuStyle({
      position: 'fixed',
      top,
      left,
      width: menuWidth,
      zIndex: FLOATING_POPOVER_Z_INDEX,
    })
  }, [open])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return
      onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open, onClose])

  function handleAction(action: CrmPartnersClienteAction) {
    onClose()
    onAction(action)
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-slate-50 hover:text-gray-700"
        aria-label={`Ações de ${cliente.razaoSocial}`}
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2} />
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.14)]"
            >
              <MenuItem icon={Eye} label="Ver detalhes" onClick={() => handleAction('view')} />
              <MenuItem
                icon={Users}
                label="Definir participação"
                onClick={() => handleAction('define_participacao')}
              />
              <MenuItem
                icon={ArrowLeftRight}
                label="Trocar parceiro"
                onClick={() => handleAction('change_partner')}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
