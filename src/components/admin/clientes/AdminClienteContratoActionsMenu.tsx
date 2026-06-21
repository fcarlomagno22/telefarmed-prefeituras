import { MoreVertical } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { AdminClienteContrato } from '../../../types/adminClientes'
import { FLOATING_POPOVER_Z_INDEX } from '../../../config/overlayLayers'
import {
  getContratoActionOptions,
  type AdminClienteContratoAction,
} from './adminClienteContratoActions'

type AdminClienteContratoActionsMenuProps = {
  contrato: AdminClienteContrato
  open: boolean
  canDelete: boolean
  onToggle: () => void
  onClose: () => void
  onSelectAction: (action: AdminClienteContratoAction) => void
  onDeleteContrato?: () => void
  onViewContrato?: () => void
  onEditContrato?: () => void
}

const menuItemClass =
  'flex w-full items-center px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50'

const deleteMenuItemClass =
  'flex w-full items-center px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50'

const MENU_MIN_WIDTH_PX = 180
const MENU_GAP_PX = 6
const VIEWPORT_PADDING_PX = 12

export function AdminClienteContratoActionsMenu({
  contrato,
  open,
  canDelete,
  onToggle,
  onClose,
  onSelectAction,
  onDeleteContrato,
  onViewContrato,
  onEditContrato,
}: AdminClienteContratoActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const options = getContratoActionOptions(contrato.status)

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return
    }

    function updatePosition() {
      const trigger = triggerRef.current
      if (!trigger) return false

      const rect = trigger.getBoundingClientRect()
      const menuHeight = menuRef.current?.offsetHeight ?? 0
      const menuWidth = Math.max(MENU_MIN_WIDTH_PX, menuRef.current?.offsetWidth ?? MENU_MIN_WIDTH_PX)

      let top = rect.bottom + MENU_GAP_PX
      if (menuHeight > 0 && top + menuHeight > window.innerHeight - VIEWPORT_PADDING_PX) {
        top = Math.max(VIEWPORT_PADDING_PX, rect.top - MENU_GAP_PX - menuHeight)
      }

      const left = Math.min(
        Math.max(VIEWPORT_PADDING_PX, rect.right - menuWidth),
        window.innerWidth - menuWidth - VIEWPORT_PADDING_PX,
      )

      setMenuStyle({
        position: 'fixed',
        top,
        left,
        minWidth: MENU_MIN_WIDTH_PX,
        zIndex: FLOATING_POPOVER_Z_INDEX,
      })
      return true
    }

    if (!updatePosition()) {
      const frame = requestAnimationFrame(() => updatePosition())
      return () => cancelAnimationFrame(frame)
    }

    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, options.length])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        title="Ações do contrato"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]"
              role="menu"
            >
              {onViewContrato ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                    onViewContrato()
                  }}
                >
                  Visualizar
                </button>
              ) : null}
              {onEditContrato ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                    onEditContrato()
                  }}
                >
                  Editar
                </button>
              ) : null}
              {onViewContrato || onEditContrato ? (
                <div className="my-1 h-px bg-gray-100" />
              ) : null}
              {options.map((option) => (
                <button
                  key={option.action}
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={(event) => {
                    event.stopPropagation()
                    onClose()
                    onSelectAction(option.action)
                  }}
                >
                  {option.label}
                </button>
              ))}
              {canDelete && onDeleteContrato ? (
                <>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    type="button"
                    role="menuitem"
                    className={deleteMenuItemClass}
                    onClick={(event) => {
                      event.stopPropagation()
                      onClose()
                      onDeleteContrato()
                    }}
                  >
                    Excluir contrato
                  </button>
                </>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
