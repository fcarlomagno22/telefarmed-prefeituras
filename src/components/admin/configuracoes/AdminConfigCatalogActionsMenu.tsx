import { Ban, MoreVertical, Pencil, Trash2, UserCheck } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

type AdminConfigCatalogActionsMenuProps = {
  label: string
  active: boolean
  canDelete?: boolean
  open: boolean
  onToggle: () => void
  onClose: () => void
  onEdit: () => void
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
}

const menuItemClass =
  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50'

const MENU_MIN_WIDTH_PX = 180
const MENU_GAP_PX = 6
const VIEWPORT_PADDING_PX = 12

export function AdminConfigCatalogActionsMenu({
  label,
  active,
  canDelete = true,
  open,
  onToggle,
  onClose,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
}: AdminConfigCatalogActionsMenuProps) {
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
        zIndex: 200,
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
  }, [open, active])

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

  const menu =
    open && menuStyle ? (
      <div
        ref={menuRef}
        role="menu"
        aria-label={`Ações para ${label}`}
        style={menuStyle}
        className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      >
        <button
          type="button"
          role="menuitem"
          className={menuItemClass}
          onClick={(event) => {
            event.stopPropagation()
            onClose()
            onEdit()
          }}
        >
          <Pencil className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
          Editar
        </button>
        {active ? (
          <button
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={(event) => {
              event.stopPropagation()
              onClose()
              onDeactivate()
            }}
          >
            <Ban className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
            Inativar
          </button>
        ) : (
          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} font-semibold text-emerald-700 hover:bg-emerald-50`}
            onClick={(event) => {
              event.stopPropagation()
              onClose()
              onActivate()
            }}
          >
            <UserCheck className="h-4 w-4 shrink-0" strokeWidth={2} />
            Ativar
          </button>
        )}
        {canDelete ? (
          <button
            type="button"
            role="menuitem"
            className={`${menuItemClass} text-red-600 hover:bg-red-50`}
            onClick={(event) => {
              event.stopPropagation()
              onClose()
              onDelete()
            }}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
            Excluir
          </button>
        ) : null}
      </div>
    ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Ações para ${label}`}
        className={[
          'inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition',
          open ? 'bg-gray-100 text-gray-700' : 'hover:bg-gray-100 hover:text-gray-700',
        ].join(' ')}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </>
  )
}
