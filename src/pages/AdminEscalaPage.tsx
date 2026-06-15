import { CalendarPlus, Filter } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminEscalaPageSkeleton } from '../components/admin/escala/skeletons/AdminEscalaPageSkeleton'
import { AdminEscalaConflictsModal } from '../components/admin/escala/AdminEscalaConflictsModal'
import { AdminEscalaComposeDrawer } from '../components/admin/escala/AdminEscalaComposeDrawer'
import {
  ADMIN_ESCALA_FILTERS_TRIGGER_ID,
  AdminEscalaFiltersMegamenu,
} from '../components/admin/escala/AdminEscalaFiltersMegamenu'
import { AdminEscalaKpiRow } from '../components/admin/escala/AdminEscalaKpiRow'
import { AdminEscalaMainPanel } from '../components/admin/escala/AdminEscalaMainPanel'
import { AdminEscalaOpenShiftsTable } from '../components/admin/escala/AdminEscalaOpenShiftsTable'
import { AdminEscalaPendingInscriptionsPanel } from '../components/admin/escala/AdminEscalaPendingInscriptionsPanel'
import { AdminEscalaSidebarPanel } from '../components/admin/escala/AdminEscalaSidebarPanel'
import type { AdminEscalaTableRow } from '../components/admin/escala/adminEscalaUi'
import { getAdminEscalaShiftsMutationFlags } from '../components/admin/escala/adminEscalaUi'
import {
  adminEscalaContentSlotClass,
  adminEscalaKpiSlotClass,
  adminEscalaMainColumnClass,
  adminEscalaPageGridClass,
  adminEscalaSidebarColumnClass,
  adminEscalaSidebarPanelSlotClass,
  adminEscalaToolbarSlotClass,
} from '../components/admin/escala/adminEscalaPageLayout'
import {
  dashboardPageFillScrollAreaClass,
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import type { AdminEscalaShift } from '../types/adminEscala'
import { useAdminEscalaPage } from '../hooks/useAdminEscalaPage'
import { useAdminEscalaListaActions } from '../hooks/useAdminEscalaListaActions'
import {
  countActiveAdminEscalaFilters,
  defaultAdminEscalaOpenFilters,
  type AdminEscalaOpenFilters,
} from '../utils/escala/filterAdminEscalaOpenShifts'
import { buildAdminEscalaKpiCardsFromSummary } from '../utils/escala/buildAdminEscalaKpiCards'
import { checkAdminEscalaConflicts, isAdminEscalaApiError } from '../lib/services/admin/escala'
import { isUuid } from '../utils/adminEscala/preserveShiftIdsOnEdit'
import { resolveAdminEscalaSpecialtyId } from '../utils/adminEscala/resolveAdminEscalaSpecialtyId'

type EscalaGroupingMode = 'lista' | 'escopo'

type PendingEscalaSave = {
  newShifts: AdminEscalaShift[]
  options?: { replaceBatchId?: string; removeShiftIds?: string[] }
  conflicts: string[]
}

export function AdminEscalaPage() {
  const { getAccessToken } = useAdminAuth()
  const {
    shifts,
    marketplaceShifts,
    pendingInscricoes,
    summary,
    isLoading,
    isMarketplaceLoading,
    loadError,
    reload,
    loadMarketplaceShifts,
    saveBatch,
    deleteShifts,
    suspendShifts,
    acceptInscricao,
    rejectInscricao,
    specialtyFilterOptions,
    canInsert,
    canEdit,
    canDelete,
  } = useAdminEscalaPage()

  const [groupingMode, setGroupingMode] = useState<EscalaGroupingMode>('lista')
  const [draftFilters, setDraftFilters] = useState<AdminEscalaOpenFilters>(() =>
    defaultAdminEscalaOpenFilters(),
  )
  const [appliedFilters, setAppliedFilters] = useState<AdminEscalaOpenFilters>(() =>
    defaultAdminEscalaOpenFilters(),
  )
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeClosing, setComposeClosing] = useState(false)
  const [editingBatch, setEditingBatch] = useState<AdminEscalaShift[] | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingConflictSave, setPendingConflictSave] = useState<PendingEscalaSave | null>(null)

  const kpiCards = useMemo(
    () => (summary ? buildAdminEscalaKpiCardsFromSummary(summary) : []),
    [summary],
  )

  const activeFilterCount = useMemo(
    () => countActiveAdminEscalaFilters(appliedFilters),
    [appliedFilters],
  )

  useEffect(() => {
    if (!filtersOpen) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      const trigger = document.getElementById(ADMIN_ESCALA_FILTERS_TRIGGER_ID)
      const panel = document.getElementById('admin-escala-filters-megamenu')
      if (trigger?.contains(target) || panel?.contains(target)) return
      setFiltersOpen(false)
      setDraftFilters(appliedFilters)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [appliedFilters, filtersOpen])

  useEffect(() => {
    if (isLoading || groupingMode !== 'lista') return
    void loadMarketplaceShifts(appliedFilters)
  }, [appliedFilters, groupingMode, isLoading, loadMarketplaceShifts])

  const filteredShifts = marketplaceShifts

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const openCompose = useCallback(() => {
    if (!canInsert) return
    setEditingBatch(null)
    setComposeClosing(false)
    setComposeOpen(true)
  }, [canInsert])

  const openEditShifts = useCallback(
    (batch: AdminEscalaShift[]) => {
      if (!canEdit || batch.length === 0) return
      if (!getAdminEscalaShiftsMutationFlags(batch).canEdit) {
        showToast(
          'Plantões em andamento ou já realizados não podem ser editados.',
          'error',
        )
        return
      }
      setEditingBatch(batch)
      setComposeClosing(false)
      setComposeOpen(true)
    },
    [canEdit, showToast],
  )

  const listaActions = useAdminEscalaListaActions({
    visibleShifts: filteredShifts,
    allShifts: shifts,
    canEdit,
    canDelete,
    onOpenEdit: openEditShifts,
    onSuspendShifts: async (shiftIds) => {
      await suspendShifts(shiftIds)
      if (groupingMode === 'lista') {
        await loadMarketplaceShifts(appliedFilters)
      }
    },
    onDeleteShifts: async (shiftIds) => {
      const result = await deleteShifts(shiftIds)
      if (groupingMode === 'lista') {
        await loadMarketplaceShifts(appliedFilters)
      }
      return result
    },
    showToast,
  })

  const openEditRow = useCallback(
    (row: AdminEscalaTableRow) => {
      if (!canEdit) return
      const batch =
        row.kind === 'closed'
          ? row.shifts
          : row.shift.batchId
            ? shifts.filter((s) => s.batchId === row.shift.batchId)
            : [row.shift]
      if (!getAdminEscalaShiftsMutationFlags(batch).canEdit) {
        showToast(
          'Plantões em andamento ou já realizados não podem ser editados.',
          'error',
        )
        return
      }
      setEditingBatch(batch)
      setComposeClosing(false)
      setComposeOpen(true)
    },
    [canEdit, shifts, showToast],
  )

  const closeCompose = useCallback(() => {
    if (!composeOpen || composeClosing) return
    setComposeClosing(true)
  }, [composeOpen, composeClosing])

  const handleComposeTransitionEnd = useCallback(() => {
    if (!composeClosing) return
    setComposeOpen(false)
    setComposeClosing(false)
    setEditingBatch(null)
  }, [composeClosing])

  const performSave = useCallback(
    async (
      newShifts: AdminEscalaShift[],
      options?: { replaceBatchId?: string; removeShiftIds?: string[] },
    ) => {
      const isEditing = editingBatch !== null && editingBatch.length > 0
      if (isEditing ? !canEdit : !canInsert) return false

      const batchId = newShifts[0]?.batchId ?? `esc-batch-${Date.now()}`
      const status = newShifts[0]?.status === 'publicada' ? 'publicada' : 'rascunho'
      const first = newShifts[0]

      setIsSaving(true)
      try {
        await saveBatch({
          batchId,
          replaceBatchId: options?.replaceBatchId,
          removeShiftIds: options?.removeShiftIds,
          status,
          contratoEntidadeId: first.contratoEntidadeId ?? undefined,
          prefeituraScope: first.prefeituraScope,
          ubtScope: first.ubtScope,
          shifts: newShifts.map((shift) => ({
            id: isUuid(shift.id) ? shift.id : undefined,
            specialtyId: resolveAdminEscalaSpecialtyId(shift),
            specialty: shift.specialty,
            startAt: shift.startAt,
            endAt: shift.endAt,
            assignmentMode: shift.assignmentMode,
            primaryDoctorId: shift.primaryDoctorId || undefined,
            backupDoctorIds: shift.backupDoctorIds,
            modality: shift.modality,
            vacancies: shift.vacancies,
            totalVacancies: shift.totalVacancies,
            amountCents: shift.amountCents,
            repasseRule: shift.repasseRule,
            unitName: shift.unitName,
            city: shift.city,
            cityUf: shift.cityUf,
            fullAddress: shift.fullAddress,
            notes: shift.notes,
          })),
        })

        if (groupingMode === 'lista') {
          await loadMarketplaceShifts(appliedFilters)
        }

        const published = status === 'publicada'
        const days = new Set(newShifts.map((s) => s.startAt.slice(0, 10))).size
        const specs = new Set(newShifts.map((s) => s.specialty)).size
        const openCount = newShifts.filter((s) => s.assignmentMode === 'open').length
        showToast(
          published
            ? `Escala publicada: ${newShifts.length} plantões (${days} dias × ${specs} especialidades)${openCount > 0 ? ` · ${openCount} abertos no portal` : ''}.`
            : `Rascunho salvo (${newShifts.length} plantões).`,
        )
        return true
      } catch (error) {
        const message = isAdminEscalaApiError(error)
          ? error.message
          : 'Não foi possível salvar a escala.'
        showToast(message, 'error')
        return false
      } finally {
        setIsSaving(false)
      }
    },
    [canInsert, canEdit, editingBatch, saveBatch, showToast, groupingMode, loadMarketplaceShifts, appliedFilters],
  )

  const handleSaved = useCallback(
    async (
      newShifts: AdminEscalaShift[],
      options?: { replaceBatchId?: string; removeShiftIds?: string[] },
    ) => {
      const token = getAccessToken()
      if (!token) {
        showToast('Sessão expirada.', 'error')
        return false
      }

      const doctorIds = [
        ...new Set(
          newShifts.flatMap((shift) =>
            [shift.primaryDoctorId, ...(shift.backupDoctorIds ?? [])].filter(
              (id): id is string => Boolean(id),
            ),
          ),
        ),
      ]

      const replaceBatchId = options?.replaceBatchId ?? editingBatch?.[0]?.batchId

      try {
        const conflictResult = await checkAdminEscalaConflicts(token, {
          doctorIds,
          excludeBatchId: replaceBatchId,
          shifts: newShifts.map((shift) => ({
            id: shift.id,
            batchId: shift.batchId,
            startAt: shift.startAt,
            endAt: shift.endAt,
            status: shift.status,
            primaryDoctorId: shift.primaryDoctorId || undefined,
            backupDoctorIds: shift.backupDoctorIds,
          })),
        })

        if (conflictResult.hasConflict) {
          setPendingConflictSave({ newShifts, options, conflicts: conflictResult.conflicts })
          return false
        }
      } catch (error) {
        const message = isAdminEscalaApiError(error)
          ? error.message
          : 'Não foi possível verificar conflitos de escala.'
        showToast(message, 'error')
        return false
      }

      return performSave(newShifts, options)
    },
    [editingBatch, getAccessToken, performSave, showToast],
  )

  const handleConfirmConflictSave = useCallback(async () => {
    if (!pendingConflictSave) return
    const ok = await performSave(pendingConflictSave.newShifts, pendingConflictSave.options)
    setPendingConflictSave(null)
    if (ok) closeCompose()
  }, [closeCompose, pendingConflictSave, performSave])

  const handleSearch = useCallback(() => {
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  const handleClearFilters = useCallback(() => {
    const defaults = defaultAdminEscalaOpenFilters()
    setDraftFilters(defaults)
    setAppliedFilters(defaults)
    setFiltersOpen(false)
  }, [])

  const montarEscalaButton = canInsert ? (
    <button
      type="button"
      onClick={openCompose}
      disabled={isSaving}
      className="btn-brand-gradient inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
    >
      <CalendarPlus className="h-4 w-4" />
      Montar escala
    </button>
  ) : null

  const listaHeaderActions = (
    <>
      <button
        id={ADMIN_ESCALA_FILTERS_TRIGGER_ID}
        type="button"
        aria-expanded={filtersOpen}
        aria-controls="admin-escala-filters-megamenu"
        onClick={() => setFiltersOpen((open) => !open)}
        className={[
          'inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition',
          filtersOpen || activeFilterCount > 0
            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
        ].join(' ')}
      >
        <Filter className="h-4 w-4 shrink-0" strokeWidth={2} />
        Filtro
        {activeFilterCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-bold text-white tabular-nums">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
      {montarEscalaButton}
    </>
  )

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Gestão de Escala" aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          <AdminPageHeader
            sectionLabel="Gestão"
            title="Gestão de Escala"
            description="Publique plantões abertos para o portal do profissional ou defina titular e fila de reserva por prefeitura e UBT."
          />
        </div>

        {loadError ? (
          <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}{' '}
            <button
              type="button"
              onClick={() => void reload()}
              className="font-semibold underline underline-offset-2"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <div className={dashboardPageFillScrollAreaClass}>
          {isLoading ? (
            <AdminEscalaPageSkeleton groupingMode={groupingMode} />
          ) : (
          <div
            className={[
              adminEscalaPageGridClass,
              dashboardPageScrollPaddingClass,
              'mt-4 flex-1 min-h-0 pb-5',
            ].join(' ')}
          >
            <div className={adminEscalaMainColumnClass}>
              <div className={adminEscalaToolbarSlotClass}>
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Agrupamento
                  </p>
                  <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
                    {(
                      [
                        { id: 'lista' as const, label: 'Lista' },
                        { id: 'escopo' as const, label: 'Por escopo' },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setGroupingMode(option.id)}
                        className={[
                          'rounded-lg px-4 py-2 text-sm font-semibold transition',
                          groupingMode === option.id
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900',
                        ].join(' ')}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {groupingMode === 'lista' ? (
                <>
                  {filtersOpen ? (
                    <AdminEscalaFiltersMegamenu
                      open={filtersOpen}
                      filters={draftFilters}
                      specialtyOptions={specialtyFilterOptions}
                      onChange={setDraftFilters}
                      onApply={() => {
                        handleSearch()
                        setFiltersOpen(false)
                      }}
                      onCancel={() => {
                        setDraftFilters(appliedFilters)
                        setFiltersOpen(false)
                      }}
                      onClear={handleClearFilters}
                    />
                  ) : null}
                  <div
                    className={adminEscalaContentSlotClass}
                    aria-busy={isMarketplaceLoading}
                  >
                    <AdminEscalaOpenShiftsTable
                      shifts={filteredShifts}
                      headerActions={listaHeaderActions}
                      selectedIds={listaActions.selectedIds}
                      allVisibleSelected={listaActions.allVisibleSelected}
                      selectedCount={listaActions.selectedCount}
                      suspendableSelectedCount={listaActions.suspendableSelectedCount}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      openMenuId={listaActions.openMenuId}
                      onToggleSelect={listaActions.toggleSelect}
                      onToggleSelectAll={listaActions.toggleSelectAll}
                      onToggleMenu={listaActions.setOpenMenuId}
                      onView={listaActions.requestView}
                      onEdit={listaActions.requestEdit}
                      onSuspend={listaActions.requestSuspend}
                      onDelete={listaActions.requestDelete}
                      onBulkSuspend={listaActions.requestBulkSuspend}
                      onBulkDelete={listaActions.requestBulkDelete}
                    />
                  </div>
                </>
              ) : (
                <div className={adminEscalaContentSlotClass}>
                    <AdminEscalaMainPanel
                      shifts={shifts}
                      onNewShift={openCompose}
                      onEditRow={openEditRow}
                      canInsert={canInsert}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onDeleteShifts={async (shiftIds, label) => {
                        if (!canDelete) return
                        try {
                          const result = await deleteShifts(shiftIds)
                          const notifiedSuffix =
                            result.notifiedCount > 0
                              ? ` ${result.notifiedCount} profissional(is) notificado(s).`
                              : ''
                          showToast(`Escala excluída: ${label}.${notifiedSuffix}`, 'success')
                        } catch (error) {
                          const message = isAdminEscalaApiError(error)
                            ? error.message
                            : 'Não foi possível excluir a escala.'
                          showToast(message, 'error')
                        }
                      }}
                    />
                </div>
              )}
            </div>

            <div className={adminEscalaSidebarColumnClass}>
              <div className={adminEscalaKpiSlotClass}>
                <AdminEscalaKpiRow items={kpiCards} />
              </div>
              <div className={[adminEscalaSidebarPanelSlotClass, 'space-y-4'].join(' ')}>
                <AdminEscalaSidebarPanel shifts={shifts} summary={summary} />
                <AdminEscalaPendingInscriptionsPanel
                  rows={pendingInscricoes}
                  canEdit={canEdit}
                  onAccept={async (id) => {
                    try {
                      await acceptInscricao(id)
                      showToast('Inscrição aceita.')
                    } catch (error) {
                      const message = isAdminEscalaApiError(error)
                        ? error.message
                        : 'Não foi possível aceitar a inscrição.'
                      showToast(message, 'error')
                    }
                  }}
                  onReject={async (id, motivo) => {
                    try {
                      await rejectInscricao(id, motivo)
                      showToast('Inscrição rejeitada.')
                    } catch (error) {
                      const message = isAdminEscalaApiError(error)
                        ? error.message
                        : 'Não foi possível rejeitar a inscrição.'
                      showToast(message, 'error')
                    }
                  }}
                />
              </div>
            </div>
          </div>
          )}
        </div>
      </div>

      <AdminEscalaComposeDrawer
        open={composeOpen}
        closing={composeClosing}
        editingBatch={editingBatch}
        allShifts={shifts}
        isSaving={isSaving}
        onClose={closeCompose}
        onTransitionEnd={handleComposeTransitionEnd}
        onSaved={handleSaved}
      />

      <AdminEscalaConflictsModal
        open={pendingConflictSave !== null}
        conflicts={pendingConflictSave?.conflicts ?? []}
        isSaving={isSaving}
        onConfirm={() => void handleConfirmConflictSave()}
        onCancel={() => setPendingConflictSave(null)}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />

      {listaActions.modals}
    </>
  )
}
