import { PauseCircle, Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminEscalaShiftViewDrawer } from '../components/admin/escala/AdminEscalaShiftViewDrawer'
import { PinUnlockModal } from '../components/users/PinUnlockModal'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { verifyAdminAuthorizationPin } from '../lib/services/admin/auth'
import { isAdminEscalaApiError } from '../lib/services/admin/escala'
import type { AdminEscalaShift } from '../types/adminEscala'
import { formatProfissionalEscalaCardDate } from '../components/profissional/escala/profissionalEscalaUi'
import type { ToastVariant } from '../components/ui/Toast'

const SUSPEND_REASON = 'Suspenso pelo administrador.'

type PendingPin =
  | { kind: 'edit'; shift: AdminEscalaShift }
  | { kind: 'suspend'; shiftIds: string[]; label: string }
  | { kind: 'delete'; shiftIds: string[]; label: string }

function formatShiftLabel(shift: AdminEscalaShift) {
  const date = formatProfissionalEscalaCardDate(shift.startAt)
  return `${shift.specialty} · ${date.day}/${date.month}`
}

function resolveEditBatch(shift: AdminEscalaShift, allShifts: AdminEscalaShift[]) {
  if (shift.batchId) {
    return allShifts.filter((item) => item.batchId === shift.batchId)
  }
  return [shift]
}

type UseAdminEscalaListaActionsOptions = {
  visibleShifts: AdminEscalaShift[]
  allShifts: AdminEscalaShift[]
  canEdit: boolean
  canDelete: boolean
  onOpenEdit: (shifts: AdminEscalaShift[]) => void
  onSuspendShifts: (shiftIds: string[]) => Promise<void>
  onDeleteShifts: (shiftIds: string[]) => Promise<{ notifiedCount: number } | void>
  showToast: (message: string, variant?: ToastVariant) => void
}

export function useAdminEscalaListaActions({
  visibleShifts,
  allShifts,
  canEdit,
  canDelete,
  onOpenEdit,
  onSuspendShifts,
  onDeleteShifts,
  showToast,
}: UseAdminEscalaListaActionsOptions) {
  const { getAccessToken } = useAdminAuth()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewShift, setViewShift] = useState<AdminEscalaShift | null>(null)
  const [viewClosing, setViewClosing] = useState(false)
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    const visible = new Set(visibleShifts.map((shift) => shift.id))
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => visible.has(id)))
      return next.size === current.size ? current : next
    })
  }, [visibleShifts])

  const selectedCount = selectedIds.size
  const allVisibleSelected =
    visibleShifts.length > 0 && visibleShifts.every((shift) => selectedIds.has(shift.id))

  const selectedShifts = useMemo(
    () => visibleShifts.filter((shift) => selectedIds.has(shift.id)),
    [visibleShifts, selectedIds],
  )

  const suspendableSelectedIds = useMemo(
    () => selectedShifts.filter((shift) => shift.status !== 'cancelada').map((shift) => shift.id),
    [selectedShifts],
  )

  const verifyAdminPin = useCallback(
    async (pin: string) => {
      const token = getAccessToken()
      if (!token) return false
      try {
        await verifyAdminAuthorizationPin(token, pin)
        return true
      } catch {
        return false
      }
    },
    [getAccessToken],
  )

  const toggleSelect = useCallback((shiftId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(shiftId)) next.delete(shiftId)
      else next.add(shiftId)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      if (allVisibleSelected) return new Set()
      return new Set(visibleShifts.map((shift) => shift.id))
    })
  }, [allVisibleSelected, visibleShifts])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const closeViewDrawer = useCallback(() => {
    if (!viewShift || viewClosing) return
    setViewClosing(true)
  }, [viewShift, viewClosing])

  const handleViewTransitionEnd = useCallback(() => {
    if (!viewClosing) return
    setViewShift(null)
    setViewClosing(false)
  }, [viewClosing])

  const executePendingPin = useCallback(async () => {
    if (!pendingPin) return
    setIsExecuting(true)
    try {
      if (pendingPin.kind === 'edit') {
        onOpenEdit(resolveEditBatch(pendingPin.shift, allShifts))
      } else if (pendingPin.kind === 'suspend') {
        await onSuspendShifts(pendingPin.shiftIds)
        showToast(
          pendingPin.shiftIds.length === 1
            ? `Plantão suspenso: ${pendingPin.label}.`
            : `${pendingPin.shiftIds.length} plantões suspensos.`,
        )
        clearSelection()
      } else {
        const result = await onDeleteShifts(pendingPin.shiftIds)
        const notifiedCount = result?.notifiedCount ?? 0
        const baseMessage =
          pendingPin.shiftIds.length === 1
            ? `Plantão excluído: ${pendingPin.label}.`
            : `${pendingPin.shiftIds.length} plantões excluídos.`
        showToast(
          notifiedCount > 0
            ? `${baseMessage} ${notifiedCount} profissional(is) notificado(s).`
            : baseMessage,
        )
        clearSelection()
      }
      setPendingPin(null)
    } catch (error) {
      const message = isAdminEscalaApiError(error)
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Não foi possível concluir a operação.'
      showToast(message, 'error')
    } finally {
      setIsExecuting(false)
    }
  }, [
    allShifts,
    clearSelection,
    onDeleteShifts,
    onOpenEdit,
    onSuspendShifts,
    pendingPin,
    showToast,
  ])

  const pinModalConfig = useMemo(() => {
    if (!pendingPin) return null
    if (pendingPin.kind === 'edit') {
      return {
        title: 'Editar plantão',
        titleId: 'escala-lista-edit-pin-title',
        description: `Para editar ${formatShiftLabel(pendingPin.shift)}, informe sua senha de autorização de 6 dígitos.`,
        submitLabel: 'Confirmar e editar',
        pinCompleteHint: 'Senha completa. Toque em confirmar e editar.',
        icon: Pencil,
      }
    }
    if (pendingPin.kind === 'suspend') {
      return {
        title: pendingPin.shiftIds.length === 1 ? 'Suspender plantão' : 'Suspender plantões',
        titleId: 'escala-lista-suspend-pin-title',
        description:
          pendingPin.shiftIds.length === 1
            ? `Para suspender ${pendingPin.label}, informe sua senha de autorização de 6 dígitos.`
            : `Para suspender ${pendingPin.shiftIds.length} plantões selecionados, informe sua senha de autorização de 6 dígitos.`,
        submitLabel: 'Confirmar suspensão',
        pinCompleteHint: 'Senha completa. Toque em confirmar suspensão.',
        icon: PauseCircle,
      }
    }
    return {
      title: pendingPin.shiftIds.length === 1 ? 'Excluir plantão' : 'Excluir plantões',
      titleId: 'escala-lista-delete-pin-title',
      description:
        pendingPin.shiftIds.length === 1
          ? `Para excluir ${pendingPin.label}, informe sua senha de autorização de 6 dígitos.`
          : `Para excluir ${pendingPin.shiftIds.length} plantões selecionados, informe sua senha de autorização de 6 dígitos.`,
      submitLabel: 'Confirmar exclusão',
      pinCompleteHint: 'Senha completa. Toque em confirmar exclusão.',
      icon: Trash2,
    }
  }, [pendingPin])

  const requestEdit = useCallback(
    (shift: AdminEscalaShift) => {
      if (!canEdit) return
      setPendingPin({ kind: 'edit', shift })
    },
    [canEdit],
  )

  const requestSuspend = useCallback(
    (shift: AdminEscalaShift) => {
      if (!canEdit || shift.status === 'cancelada') return
      setPendingPin({
        kind: 'suspend',
        shiftIds: [shift.id],
        label: formatShiftLabel(shift),
      })
    },
    [canEdit],
  )

  const requestDelete = useCallback(
    (shift: AdminEscalaShift) => {
      if (!canDelete) return
      setPendingPin({
        kind: 'delete',
        shiftIds: [shift.id],
        label: formatShiftLabel(shift),
      })
    },
    [canDelete],
  )

  const requestBulkSuspend = useCallback(() => {
    if (!canEdit || suspendableSelectedIds.length === 0) return
    setPendingPin({
      kind: 'suspend',
      shiftIds: suspendableSelectedIds,
      label: `${suspendableSelectedIds.length} plantões`,
    })
  }, [canEdit, suspendableSelectedIds])

  const deletableSelectedIds = useMemo(
    () => selectedShifts.map((shift) => shift.id),
    [selectedShifts],
  )

  const requestBulkDelete = useCallback(() => {
    if (!canDelete || deletableSelectedIds.length === 0) return
    setPendingPin({
      kind: 'delete',
      shiftIds: deletableSelectedIds,
      label: `${deletableSelectedIds.length} plantões`,
    })
  }, [canDelete, deletableSelectedIds])

  const modals = (
    <>
      <AdminEscalaShiftViewDrawer
        open={viewShift !== null}
        closing={viewClosing}
        shift={viewShift}
        onClose={closeViewDrawer}
        onTransitionEnd={handleViewTransitionEnd}
      />
      {pinModalConfig ? (
        <PinUnlockModal
          open={pendingPin !== null}
          onClose={() => {
            if (isExecuting) return
            setPendingPin(null)
          }}
          onSuccess={() => void executePendingPin()}
          verifyPin={verifyAdminPin}
          title={pinModalConfig.title}
          titleId={pinModalConfig.titleId}
          description={pinModalConfig.description}
          submitLabel={pinModalConfig.submitLabel}
          pinCompleteHint={pinModalConfig.pinCompleteHint}
          icon={pinModalConfig.icon}
        />
      ) : null}
    </>
  )

  return {
    selectedIds,
    selectedCount,
    suspendableSelectedCount: suspendableSelectedIds.length,
    allVisibleSelected,
    openMenuId,
    setOpenMenuId,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    requestView: (shift: AdminEscalaShift) => {
      setViewShift(shift)
      setViewClosing(false)
    },
    requestEdit,
    requestSuspend,
    requestDelete,
    requestBulkSuspend,
    requestBulkDelete,
    modals,
  }
}
