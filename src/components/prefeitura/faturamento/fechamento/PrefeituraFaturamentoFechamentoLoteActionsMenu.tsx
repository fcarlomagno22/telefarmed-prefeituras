import { Eye, MoreVertical, RotateCcw, Trash2, type LucideIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { FLOATING_POPOVER_Z_INDEX } from '../../../../config/overlayLayers'
import type { PrefeituraFaturamentoFechamentoLoteItem } from '../../../../types/prefeituraFaturamentoFechamento'

export type PrefeituraFaturamentoFechamentoLoteMenuAction = 'view_consulta' | 'exclude' | 'restore'

type PrefeituraFaturamentoFechamentoLoteActionsMenuProps = {
  item: PrefeituraFaturamentoFechamentoLoteItem
  isClosed: boolean
  open: boolean
  onToggle: () => void
  onClose: () => void
  onAction: (action: PrefeituraFaturamentoFechamentoLoteMenuAction) => void
  align?: 'left' | 'center' | 'right'
}

const MENU_MIN_WIDTH_PX = 248
const MENU_GAP_PX = 8
const VIEWPORT_PADDING_PX = 12

type MenuItemProps = {
  icon: LucideIcon
  label: string
  onClick: () => void
  tone?: 'default' | 'primary' | 'warning'
}

function MenuItem({ icon: Icon, label, onClick, tone = 'default' }: MenuItemProps) {
  const toneClass =
    tone === 'primary'
      ? 'font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]'
      : tone === 'warning'
        ? 'text-amber-700 hover:bg-amber-50'
        : 'text-gray-700 hover:bg-slate-50'

  const iconClass =
    tone === 'primary'
      ? 'text-[var(--brand-primary)]'
      : tone === 'warning'
        ? 'text-amber-500'
        : 'text-gray-400'

  return (
    <button
      type="button"
      role="menuitem"
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${toneClass}`}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClick()
      }}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm ring-1 ring-gray-100">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </button>
  )
}

export function PrefeituraFaturamentoFechamentoLoteActionsMenu({
  item,
  isClosed,
  open,
  onToggle,
  onClose,
  onAction,
  align = 'center',
}: PrefeituraFaturamentoFechamentoLoteActionsMenuProps) {
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
      if (rect.width === 0 || rect.height === 0) {
        setMenuStyle(null)
        return false
      }

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
  }, [isClosed, item.excluded, open])

  useEffect(() => {
    if (!open || !menuStyle) return

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
  }, [menuStyle, onClose, open])

  function handleSelect(action: PrefeituraFaturamentoFechamentoLoteMenuAction) {
    onAction(action)
    onClose()
  }

  const alignClass =
    align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'

  return (
    <div
      className={`relative inline-flex ${alignClass}`}
      data-fechamento-lote-menu-root="true"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        title={`Ações — ${item.consultaId}`}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className={[
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
          open
            ? 'border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-sm'
            : 'border-gray-200 text-gray-500 hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]',
        ].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Ações da consulta ${item.consultaId}`}
      >
        <MoreVertical className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={menuStyle}
              className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] ring-1 ring-black/[0.04]"
              role="menu"
              aria-label={`Ações da consulta ${item.consultaId}`}
            >
              <div className="border-b border-gray-100 bg-gradient-to-br from-slate-50 via-white to-[var(--brand-primary-light)]/40 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                  Ações
                </p>
                <p className="mt-1 text-sm font-bold text-gray-900">{item.consultaId}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{item.patientName}</p>
              </div>

              <div className="py-1.5">
                <MenuItem
                  icon={Eye}
                  label="Ver consulta"
                  tone="primary"
                  onClick={() => handleSelect('view_consulta')}
                />
                {!isClosed && item.excluded ? (
                  <MenuItem
                    icon={RotateCcw}
                    label="Restaurar no lote"
                    onClick={() => handleSelect('restore')}
                  />
                ) : null}
                {!isClosed && !item.excluded ? (
                  <MenuItem
                    icon={Trash2}
                    label="Excluir do lote"
                    tone="warning"
                    onClick={() => handleSelect('exclude')}
                  />
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
