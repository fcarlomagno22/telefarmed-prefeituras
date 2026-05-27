import { ArrowRightLeft, Ban, Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { AccessCredentialUser } from '../../data/accessCredentialsMock'

type AccessCredentialActionsPopoverProps = {
  user: AccessCredentialUser
  open: boolean
  onToggle: () => void
  onClose: () => void
  onView: () => void
  onEdit: () => void
  onTransferUbt?: () => void
  onDeactivate: () => void
  onDelete: () => void
}

const menuItemClass =
  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50'

const MENU_MIN_WIDTH_PX = 216
const MENU_GAP_PX = 6
const VIEWPORT_PADDING_PX = 12

export function AccessCredentialActionsPopover({
  user,
  open,
  onToggle,
  onClose,
  onView,
  onEdit,
  onTransferUbt,
  onDeactivate,
  onDelete,
}: AccessCredentialActionsPopoverProps) {
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
  }, [open, onTransferUbt != null])

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
        aria-label={`Ações para ${user.name}`}
        style={menuStyle}
        className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      >
        <button type="button" role="menuitem" className={menuItemClass} onClick={onView}>
          <Eye className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
          Visualizar
        </button>
        <button type="button" role="menuitem" className={menuItemClass} onClick={onEdit}>
          <Pencil className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
          Editar
        </button>
        {onTransferUbt ? (
          <button type="button" role="menuitem" className={menuItemClass} onClick={onTransferUbt}>
            <ArrowRightLeft className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
            Alterar UBT
          </button>
        ) : null}
        <button
          type="button"
          role="menuitem"
          className={`${menuItemClass} disabled:cursor-not-allowed disabled:opacity-40`}
          onClick={onDeactivate}
          disabled={user.status === 'inativo'}
        >
          <Ban className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
          Desativar usuário
        </button>
        <button
          type="button"
          role="menuitem"
          className={`${menuItemClass} text-red-600 hover:bg-red-50`}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
          Excluir usuário
        </button>
      </div>
    ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Ações para ${user.name}`}
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
