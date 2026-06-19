import { CalendarClock, DoorOpen, Eye, MoreVertical, RefreshCw, Trash2, UserX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AppointmentStatus, DayAppointment } from '../../data/agendaMock'
import { SequentialDots } from './AgendaUpdatingIndicator'

type AgendaAppointmentActionsMenuProps = {
  appointment: DayAppointment
  isUpdating?: boolean
  open: boolean
  onToggle: () => void
  onClose: () => void
  onViewDetails: () => void
  onReschedule: () => void
  onCancel: () => void
  onMarkNoShow: () => void
  onConfirmArrival: () => void
  onChangeStatus: () => void
}

const menuItemClass =
  'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'

const MENU_MIN_WIDTH_PX = 220
const MENU_ESTIMATED_HEIGHT_PX = 280
const MENU_GAP_PX = 6

type MenuPosition = {
  top: number
  left: number
  width: number
}

function canModifyAppointment(status: AppointmentStatus) {
  return status === 'agendado' || status === 'aguardando'
}

function canMarkNoShow(status: AppointmentStatus) {
  return status === 'agendado' || status === 'aguardando'
}

function canConfirmArrival(status: AppointmentStatus) {
  return status === 'agendado'
}

export function AgendaAppointmentActionsMenu({
  appointment,
  isUpdating = false,
  open,
  onToggle,
  onClose,
  onViewDetails,
  onReschedule,
  onCancel,
  onMarkNoShow,
  onConfirmArrival,
  onChangeStatus,
}: AgendaAppointmentActionsMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const canModify = canModifyAppointment(appointment.status)
  const canMarkAbsent = canMarkNoShow(appointment.status)
  const canArrival = canConfirmArrival(appointment.status)

  function updateMenuPosition() {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP_PX
    const openAbove =
      spaceBelow < MENU_ESTIMATED_HEIGHT_PX &&
      rect.top > window.innerHeight - rect.bottom

    const top = openAbove
      ? Math.max(MENU_GAP_PX, rect.top - MENU_GAP_PX - MENU_ESTIMATED_HEIGHT_PX)
      : rect.bottom + MENU_GAP_PX

    const left = Math.min(
      Math.max(MENU_GAP_PX, rect.right - MENU_MIN_WIDTH_PX),
      window.innerWidth - MENU_MIN_WIDTH_PX - MENU_GAP_PX,
    )

    setMenuPosition({
      top,
      left,
      width: MENU_MIN_WIDTH_PX,
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

  useEffect(() => {
    if (!isUpdating) return
    onClose()
  }, [isUpdating, onClose])

  const menuPortal =
    open && menuPosition && !isUpdating
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Ações para ${appointment.patientName}`}
            style={{
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              zIndex: 10000,
            }}
            className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_12px_32px_rgba(0,0,0,0.16)]"
          >
            <button type="button" role="menuitem" className={menuItemClass} onClick={onViewDetails}>
              <Eye className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
              Ver detalhes
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={onChangeStatus}
            >
              <RefreshCw className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
              Alterar situação
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-[var(--brand-primary)] hover:bg-[var(--brand-primary-muted)]`}
              onClick={onConfirmArrival}
              disabled={!canArrival}
              title={
                canArrival
                  ? undefined
                  : 'Somente consultas ainda agendadas podem ser recepcionadas'
              }
            >
              <DoorOpen className="h-4 w-4 shrink-0" strokeWidth={2} />
              Confirmar chegada
            </button>
            <button
              type="button"
              role="menuitem"
              className={menuItemClass}
              onClick={onReschedule}
              disabled={!canModify}
              title={
                canModify
                  ? undefined
                  : 'Somente consultas agendadas ou aguardando podem ser reagendadas'
              }
            >
              <CalendarClock className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
              Reagendar consulta
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-amber-800 hover:bg-amber-50`}
              onClick={onMarkNoShow}
              disabled={!canMarkAbsent}
              title={
                canMarkAbsent
                  ? undefined
                  : 'Somente consultas agendadas ou aguardando podem ser marcadas como falta'
              }
            >
              <UserX className="h-4 w-4 shrink-0" strokeWidth={2} />
              Marcar falta
            </button>
            <button
              type="button"
              role="menuitem"
              className={`${menuItemClass} text-red-600 hover:bg-red-50`}
              onClick={onCancel}
              disabled={!canModify}
              title={
                canModify
                  ? undefined
                  : 'Somente consultas agendadas ou aguardando podem ser desmarcadas'
              }
            >
              <Trash2 className="h-4 w-4 shrink-0" strokeWidth={2} />
              Desmarcar consulta
            </button>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div ref={containerRef} className="inline-flex justify-center">
        <button
          ref={triggerRef}
          type="button"
          onClick={onToggle}
          disabled={isUpdating}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-busy={isUpdating}
          aria-label={
            isUpdating
              ? `Atualizando situação de ${appointment.patientName}`
              : `Ações para ${appointment.patientName}`
          }
          className={[
            'inline-flex h-8 w-8 items-center justify-center rounded-lg transition',
            isUpdating
              ? 'cursor-default text-gray-400'
              : open
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
          ].join(' ')}
        >
          {isUpdating ? (
            <SequentialDots layout="vertical" dotClassName="h-1 w-1 rounded-full bg-gray-400" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </button>
      </div>
      {menuPortal}
    </>
  )
}
