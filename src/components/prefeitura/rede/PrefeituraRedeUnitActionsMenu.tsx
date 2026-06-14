import {
  Ban,
  Bell,
  Eye,
  MoreVertical,
  Pencil,
  PlayCircle,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { FLOATING_POPOVER_Z_INDEX } from '../../../config/overlayLayers'
import type { PrefeituraRedeUnit, PrefeituraRedeUnitStatus } from '../../../data/prefeituraRedeMock'

export type PrefeituraRedeUnitAction =
  | 'view'
  | 'edit'
  | 'maintenance'
  | 'suspend'
  | 'reactivate'
  | 'notify'
  | 'delete'

type PrefeituraRedeUnitActionsMenuProps = {
  unit: PrefeituraRedeUnit
  open: boolean
  canEdit: boolean
  canDelete: boolean
  onToggle: () => void
  onClose: () => void
  onAction: (action: PrefeituraRedeUnitAction) => void
}

const MENU_MIN_WIDTH_PX = 248
const MENU_GAP_PX = 8
const VIEWPORT_PADDING_PX = 12

function canShowMaintenance(status: PrefeituraRedeUnitStatus) {
  return status === 'ativa'
}

function canShowSuspend(status: PrefeituraRedeUnitStatus) {
  return status !== 'inativa'
}

function canShowReactivate(status: PrefeituraRedeUnitStatus) {
  return status === 'inativa' || status === 'manutencao'
}

type MenuItemProps = {
  icon: LucideIcon
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
      role="menuitem"
      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition ${toneClass}`}
      onClick={onClick}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-sm ring-1 ring-gray-100">
        <Icon className={`h-3.5 w-3.5 ${iconClass}`} strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  )
}

function MenuSectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
      {children}
    </p>
  )
}

export function PrefeituraRedeUnitActionsMenu({
  unit,
  open,
  canEdit,
  canDelete,
  onToggle,
  onClose,
  onAction,
}: PrefeituraRedeUnitActionsMenuProps) {
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
  }, [open, canEdit, canDelete, unit.status])

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

  function handleSelect(action: PrefeituraRedeUnitAction) {
    onClose()
    onAction(action)
  }

  return (
    <div
      className="relative inline-flex"
      data-rede-unit-menu-root="true"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        title={`Ações de ${unit.name}`}
        onClick={(event) => {
          event.stopPropagation()
          onToggle()
        }}
        className={[
          'mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border transition',
          open
            ? 'border-[var(--brand-primary)]/25 bg-[var(--brand-primary-light)] text-[var(--brand-primary)] shadow-sm'
            : 'border-gray-200 text-gray-500 hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]',
        ].join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Ações de ${unit.name}`}
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
              aria-label={`Ações de ${unit.name}`}
            >
              <div className="border-b border-gray-100 bg-gradient-to-br from-slate-50 via-white to-[var(--brand-primary-light)]/40 px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                  Ações da unidade
                </p>
                <p className="mt-1 truncate text-sm font-bold text-gray-900">{unit.name}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{unit.region}</p>
              </div>

              <div className="py-1.5">
                <MenuSectionLabel>Consulta</MenuSectionLabel>
                <MenuItem icon={Eye} label="Visualizar" onClick={() => handleSelect('view')} />

                {canEdit ? (
                  <>
                    <div className="my-1.5 h-px bg-gray-100" />
                    <MenuSectionLabel>Gestão</MenuSectionLabel>
                    <MenuItem icon={Pencil} label="Editar" onClick={() => handleSelect('edit')} />
                    {canShowMaintenance(unit.status) ? (
                      <MenuItem
                        icon={Wrench}
                        label="Colocar em manutenção"
                        tone="warning"
                        onClick={() => handleSelect('maintenance')}
                      />
                    ) : null}
                    {canShowSuspend(unit.status) ? (
                      <MenuItem
                        icon={Ban}
                        label="Suspender UBT"
                        tone="warning"
                        onClick={() => handleSelect('suspend')}
                      />
                    ) : null}
                    {canShowReactivate(unit.status) ? (
                      <MenuItem
                        icon={PlayCircle}
                        label="Reativar UBT"
                        tone="success"
                        onClick={() => handleSelect('reactivate')}
                      />
                    ) : null}

                    <div className="my-1.5 h-px bg-gray-100" />
                    <MenuSectionLabel>Comunicação</MenuSectionLabel>
                    <MenuItem icon={Bell} label="Notificar UBT" onClick={() => handleSelect('notify')} />
                  </>
                ) : null}

                {canDelete ? (
                  <>
                    <div className="my-1.5 h-px bg-gray-100" />
                    <MenuSectionLabel>Zona crítica</MenuSectionLabel>
                    <MenuItem
                      icon={Trash2}
                      label="Excluir UBT"
                      tone="danger"
                      onClick={() => handleSelect('delete')}
                    />
                  </>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
