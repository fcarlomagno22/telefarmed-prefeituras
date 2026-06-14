import { MoreVertical } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { FLOATING_POPOVER_Z_INDEX } from '../../../config/overlayLayers'

type AdminClienteEntidadeActionsMenuProps = {
  open: boolean
  canDelete: boolean
  onToggle: () => void
  onClose: () => void
  onView: () => void
  onViewUbts: () => void
  onAddContrato: () => void
  onChangeStatus: () => void
  onDelete: () => void
}

const menuItemClass =
  'block w-full px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50'

const MENU_MIN_WIDTH_PX = 200
const MENU_GAP_PX = 6
const VIEWPORT_PADDING_PX = 12

const deleteMenuItemClass =
  'block w-full px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50'

export function AdminClienteEntidadeActionsMenu({
  open,
  canDelete,
  onToggle,
  onClose,
  onView,
  onViewUbts,
  onAddContrato,
  onChangeStatus,
  onDelete,
}: AdminClienteEntidadeActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)

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
  }, [open])

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
    <div
      className="relative inline-flex"
      data-entity-menu-root="true"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        title="Ações da entidade"
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-[0_8px_30px_rgba(15,23,42,0.14)]"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={(event) => {
                  event.stopPropagation()
                  onClose()
                  onView()
                }}
              >
                Visualizar
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={(event) => {
                  event.stopPropagation()
                  onClose()
                  onViewUbts()
                }}
              >
                Ver UBTs
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={(event) => {
                  event.stopPropagation()
                  onClose()
                  onAddContrato()
                }}
              >
                Adicionar Contratos
              </button>
              <button
                type="button"
                role="menuitem"
                className={menuItemClass}
                onClick={(event) => {
                  event.stopPropagation()
                  onClose()
                  onChangeStatus()
                }}
              >
                Alterar status
              </button>
              {canDelete ? (
                <>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    type="button"
                    role="menuitem"
                    className={deleteMenuItemClass}
                    onClick={(event) => {
                      event.stopPropagation()
                      onClose()
                      onDelete()
                    }}
                  >
                    Excluir entidade
                  </button>
                </>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
