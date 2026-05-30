import { CalendarPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminEscalaComposeDrawer } from '../components/admin/escala/AdminEscalaComposeDrawer'
import { AdminEscalaFiltersBar } from '../components/admin/escala/AdminEscalaFiltersBar'
import { AdminEscalaKpiRow } from '../components/admin/escala/AdminEscalaKpiRow'
import { AdminEscalaMainPanel } from '../components/admin/escala/AdminEscalaMainPanel'
import { AdminEscalaOpenShiftsTable } from '../components/admin/escala/AdminEscalaOpenShiftsTable'
import { AdminEscalaSidebarPanel } from '../components/admin/escala/AdminEscalaSidebarPanel'
import type { AdminEscalaTableRow } from '../components/admin/escala/adminEscalaUi'
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
import {
  getEscalaShifts,
  setEscalaShifts,
  subscribeEscalaShifts,
} from '../data/escalaSharedStore'
import type { AdminEscalaShift } from '../types/adminEscala'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'
import {
  defaultAdminEscalaOpenFilters,
  filterAdminEscalaShifts,
  type AdminEscalaOpenFilters,
} from '../utils/escala/filterAdminEscalaOpenShifts'
import { buildAdminEscalaKpiCards } from '../utils/escala/buildAdminEscalaKpiCards'
import { normalizeAdminEscalaShifts } from '../utils/escala/normalizeAdminEscalaShift'

type EscalaViewTab = 'marketplace' | 'gestao'

export function AdminEscalaPage() {
  const isLoading = usePageSkeletonLoading(1000)
  const [shifts, setShifts] = useState<AdminEscalaShift[]>(() => getEscalaShifts())
  const [viewTab, setViewTab] = useState<EscalaViewTab>('marketplace')
  const [draftFilters, setDraftFilters] = useState<AdminEscalaOpenFilters>(() =>
    defaultAdminEscalaOpenFilters(),
  )
  const [appliedFilters, setAppliedFilters] = useState<AdminEscalaOpenFilters>(() =>
    defaultAdminEscalaOpenFilters(),
  )
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeClosing, setComposeClosing] = useState(false)
  const [editingBatch, setEditingBatch] = useState<AdminEscalaShift[] | null>(null)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeEscalaShifts(() => {
      setShifts(getEscalaShifts())
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const kpiCards = useMemo(() => buildAdminEscalaKpiCards(shifts), [shifts])

  const filteredShifts = useMemo(
    () => filterAdminEscalaShifts(shifts, appliedFilters),
    [shifts, appliedFilters],
  )

  const openCompose = useCallback(() => {
    setEditingBatch(null)
    setComposeClosing(false)
    setComposeOpen(true)
  }, [])

  const openEditRow = useCallback(
    (row: AdminEscalaTableRow) => {
      if (row.kind === 'closed') {
        setEditingBatch(row.shifts)
      } else if (row.shift.batchId) {
        setEditingBatch(shifts.filter((s) => s.batchId === row.shift.batchId))
      } else {
        setEditingBatch([row.shift])
      }
      setComposeClosing(false)
      setComposeOpen(true)
    },
    [shifts],
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

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const handleSaved = useCallback(
    (
      newShifts: AdminEscalaShift[],
      options?: { replaceBatchId?: string; removeShiftIds?: string[] },
    ) => {
      setEscalaShifts(
        (() => {
          const current = getEscalaShifts()
          const removeIds = new Set(options?.removeShiftIds ?? [])
          let base = options?.replaceBatchId
            ? current.filter((s) => s.batchId !== options.replaceBatchId)
            : current
          if (removeIds.size > 0) {
            base = base.filter((s) => !removeIds.has(s.id))
          }
          const ids = new Set(newShifts.map((s) => s.id))
          const rest = base.filter((s) => !ids.has(s.id))
          return normalizeAdminEscalaShifts([...newShifts, ...rest])
        })(),
      )
      const published = newShifts[0]?.status === 'publicada'
      const days = new Set(newShifts.map((s) => s.startAt.slice(0, 10))).size
      const specs = new Set(newShifts.map((s) => s.specialty)).size
      const openCount = newShifts.filter((s) => s.assignmentMode === 'open').length
      showToast(
        published
          ? `Escala publicada: ${newShifts.length} plantões (${days} dias × ${specs} especialidades)${openCount > 0 ? ` · ${openCount} abertos no portal` : ''}.`
          : `Rascunho salvo (${newShifts.length} plantões).`,
      )
    },
    [showToast],
  )

  const handleSearch = useCallback(() => {
    setAppliedFilters(draftFilters)
  }, [draftFilters])

  const handleClearFilters = useCallback(() => {
    const defaults = defaultAdminEscalaOpenFilters()
    setDraftFilters(defaults)
    setAppliedFilters(defaults)
  }, [])

  const montarEscalaButton = (
    <button
      type="button"
      onClick={openCompose}
      className="btn-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
    >
      <CalendarPlus className="h-4 w-4" />
      Montar escala
    </button>
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

        <div className={dashboardPageFillScrollAreaClass}>
          <div
            className={[
              adminEscalaPageGridClass,
              dashboardPageScrollPaddingClass,
              'mt-4 flex-1 min-h-0 pb-5',
            ].join(' ')}
          >
            <div className={adminEscalaMainColumnClass}>
              <div className={adminEscalaToolbarSlotClass}>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
                  {(
                    [
                      { id: 'marketplace' as const, label: 'Plantões e marketplace' },
                      { id: 'gestao' as const, label: 'Gestão por escopo' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setViewTab(tab.id)}
                      className={[
                        'rounded-xl px-4 py-2 text-sm font-semibold transition',
                        viewTab === tab.id
                          ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {viewTab === 'marketplace' ? (
                <>
                  <AdminEscalaFiltersBar
                    draft={draftFilters}
                    onDraftChange={setDraftFilters}
                    onSearch={handleSearch}
                    onClear={handleClearFilters}
                    trailing={montarEscalaButton}
                  />
                  <div className={adminEscalaContentSlotClass}>
                    {!isLoading ? (
                      <AdminEscalaOpenShiftsTable shifts={filteredShifts} />
                    ) : null}
                  </div>
                </>
              ) : (
                <div className={adminEscalaContentSlotClass}>
                  {!isLoading ? (
                    <AdminEscalaMainPanel
                      shifts={shifts}
                      onNewShift={openCompose}
                      onEditRow={openEditRow}
                      onDeleteShifts={(shiftIds, label) => {
                        setEscalaShifts(
                          getEscalaShifts().filter((shift) => !shiftIds.includes(shift.id)),
                        )
                        showToast(`Escala excluída: ${label}.`, 'success')
                      }}
                    />
                  ) : null}
                </div>
              )}
            </div>

            <div className={adminEscalaSidebarColumnClass}>
              <div className={adminEscalaKpiSlotClass}>
                {!isLoading ? <AdminEscalaKpiRow items={kpiCards} /> : null}
              </div>
              <div className={adminEscalaSidebarPanelSlotClass}>
                {!isLoading ? <AdminEscalaSidebarPanel shifts={shifts} /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdminEscalaComposeDrawer
        open={composeOpen}
        closing={composeClosing}
        editingBatch={editingBatch}
        allShifts={shifts}
        onClose={closeCompose}
        onTransitionEnd={handleComposeTransitionEnd}
        onSaved={handleSaved}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
    </>
  )
}
