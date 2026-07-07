import { Ban, Eye, MoreVertical, Pencil, PlayCircle } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { FLOATING_POPOVER_Z_INDEX } from '../../../config/overlayLayers'
import type {
  CrmPartnersParceiroAction,
  CrmPartnersParceiroRow,
} from '../../../types/crmPartnersParceiros'

type CrmPartnersParceiroActionsMenuProps = {
  parceiro: CrmPartnersParceiroRow
  open: boolean
  onToggle: () => void
  onClose: () => void
  onAction: (action: CrmPartnersParceiroAction) => void
}

const MENU_MIN_WIDTH_PX = 220
const MENU_GAP_PX = 8
const VIEWPORT_PADDING_PX = 12

type MenuItemProps = {
  icon: typeof Eye
  label: string
  onClick: () => void
  tone?: 'default' | 'warning' | 'success' | 'danger'
}

function MenuItem({ icon: Icon, label, onClick, tone = 'default' }: MenuItemProps) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-600 hover:bg-red-50'
      : tone === 'warning'
        ? 'text-amber-700 hover:bg-amber-50'
        : tone === 'success'
          ? 'font-semibold text-emerald-700 hover:bg-emerald-50'
          : 'text-gray-700 hover:bg-slate-50'

  const iconClass =
    tone === 'danger'
      ? 'text-red-500'
      : tone === 'warning'
        ? 'text-amber-500'
        : tone === 'success'
          ? 'text-emerald-600'
          : 'text-gray-400'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${toneClass}`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} strokeWidth={2} />
      {label}
    </button>
  )
}

export function CrmPartnersParceiroActionsMenu({
  parceiro,
  open,
  onToggle,
  onClose,
  onAction,
}: CrmPartnersParceiroActionsMenuProps) {
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
    const estimatedHeight = 180
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

  function handleAction(action: CrmPartnersParceiroAction) {
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
        aria-label={`Ações de ${parceiro.nome}`}
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
              <MenuItem
                icon={Eye}
                label="Ver detalhes"
                onClick={() => handleAction('view')}
              />
              <MenuItem
                icon={Pencil}
                label="Editar"
                onClick={() => handleAction('edit')}
              />
              {parceiro.status === 'ativo' ? (
                <MenuItem
                  icon={Ban}
                  label="Inativar"
                  tone="warning"
                  onClick={() => handleAction('inactivate')}
                />
              ) : (
                <MenuItem
                  icon={PlayCircle}
                  label="Reativar"
                  tone="success"
                  onClick={() => handleAction('activate')}
                />
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
