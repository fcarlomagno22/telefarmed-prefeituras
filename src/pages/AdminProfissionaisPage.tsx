import { useCallback, useMemo, useRef, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminMedicosAboutPanel } from '../components/admin/medicos/AdminMedicosAboutPanel'
import { AdminMedicosMainPanel } from '../components/admin/medicos/AdminMedicosMainPanel'
import {
  adminPacientesColumnScrollClass,
  adminPacientesColumnsGridClass,
  adminPacientesMainColumnWrapClass,
  adminPacientesSidebarColumnWrapClass,
} from '../components/admin/pacientes/adminPacientesPageLayout'
import { AdminProfissionaisAboutPanelSkeleton } from '../components/admin/profissionais/skeletons/AdminProfissionaisAboutPanelSkeleton'
import { AdminProfissionaisMainPanelSkeleton } from '../components/admin/profissionais/skeletons/AdminProfissionaisMainPanelSkeleton'
import { AdminProfissionaisCandidaturasAboutPanel } from '../components/admin/profissionais/AdminProfissionaisCandidaturasAboutPanel'
import { AdminProfissionaisCandidaturasMainPanel } from '../components/admin/profissionais/AdminProfissionaisCandidaturasMainPanel'
import { AdminProfissionaisTabs } from '../components/admin/profissionais/AdminProfissionaisTabs'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { Toast, type ToastVariant } from '../components/ui/Toast'
import { useAdminPageAccess } from '../hooks/useAdminPageAccess'
import { useAdminProfissionaisPage } from '../hooks/useAdminProfissionaisPage'
import { useAdminProfissionaisAtivosPage } from '../hooks/useAdminProfissionaisAtivosPage'
import type { AdminProfissionaisTab } from '../types/adminProfissionais'
import { Plus } from 'lucide-react'

const mainCardShellClass = [
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export function AdminProfissionaisPage() {
  const { pageAccess } = useAdminPageAccess('profissionais')
  const {
    rows: candidaturas,
    summary: candidaturasSummary,
    isLoading,
    loadError,
    reload: reloadCandidaturas,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loadDetail,
    reviewDocument,
    approve,
    reject,
    requestCorrection,
    candidaturasPendentes,
  } = useAdminProfissionaisPage()

  const {
    doctors: doctorRows,
    summary: ativosSummary,
    isLoading: isAtivosLoading,
    loadError: ativosLoadError,
    reload: reloadAtivos,
    searchQuery: ativosSearchQuery,
    setSearchQuery: setAtivosSearchQuery,
    allocationFilter,
    setAllocationFilter,
    professionFilter,
    setProfessionFilter,
    saveDoctor,
    inactivateDoctor,
    reactivateDoctor,
    loadDetail: loadDoctorDetail,
    createDoctor,
  } = useAdminProfissionaisAtivosPage()

  const [activeTab, setActiveTab] = useState<AdminProfissionaisTab>('candidaturas')
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const ativosAddActionRef = useRef<(() => void) | null>(null)

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ message, variant })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const candidaturaActions = useMemo(
    () => ({
      loadDetail,
      reviewDocument,
      approve,
      reject,
      requestCorrection,
    }),
    [loadDetail, reviewDocument, approve, reject, requestCorrection],
  )

  const gridClass = adminPacientesColumnsGridClass
  const isMainLoading = activeTab === 'candidaturas' ? isLoading : isAtivosLoading
  const mainLoadError = activeTab === 'candidaturas' ? loadError : ativosLoadError

  return (
    <div className={dashboardPageShellClass} aria-label="Profissionais" aria-busy={isMainLoading}>
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Pessoas"
          title="Profissionais"
          description="Analise candidaturas do portal e gerencie profissionais aprovados na plataforma."
          actions={
            activeTab === 'ativos' && pageAccess.canInsert ? (
              <button
                type="button"
                onClick={() => ativosAddActionRef.current?.()}
                className="btn-brand-gradient inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Cadastro direto
              </button>
            ) : null
          }
        />
      </div>

      <div className={[gridClass, dashboardPageScrollPaddingClass, 'mt-4 pb-5'].join(' ')}>
        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesMainColumnWrapClass}>
            <div className={mainCardShellClass}>
              <AdminProfissionaisTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                candidaturasPendentes={candidaturasPendentes}
              />

              {isMainLoading ? (
                <AdminProfissionaisMainPanelSkeleton />
              ) : mainLoadError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-sm text-red-600">
                  <p>{mainLoadError}</p>
                  <button
                    type="button"
                    onClick={() =>
                      void (activeTab === 'candidaturas' ? reloadCandidaturas() : reloadAtivos())
                    }
                    className="font-semibold text-red-700 underline underline-offset-2"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : activeTab === 'candidaturas' ? (
                <AdminProfissionaisCandidaturasMainPanel
                  embedded
                  rows={candidaturas}
                  summary={candidaturasSummary}
                  canApprove={pageAccess.canEdit}
                  onToast={(message) => showToast(message)}
                  search={search}
                  statusFilter={statusFilter}
                  onSearchChange={setSearch}
                  onStatusFilterChange={setStatusFilter}
                  actions={candidaturaActions}
                />
              ) : (
                <AdminMedicosMainPanel
                  embedded
                  doctors={doctorRows}
                  ativosSummary={ativosSummary}
                  searchQuery={ativosSearchQuery}
                  onSearchQueryChange={setAtivosSearchQuery}
                  allocationFilter={allocationFilter}
                  onAllocationFilterChange={setAllocationFilter}
                  professionFilter={professionFilter}
                  onProfessionFilterChange={setProfessionFilter}
                  canEdit={pageAccess.canEdit}
                  canInsert={pageAccess.canInsert}
                  onSaveDoctor={saveDoctor}
                  onInactivateDoctor={inactivateDoctor}
                  onReactivateDoctor={reactivateDoctor}
                  onLoadDoctorDetail={loadDoctorDetail}
                  onCreateDoctor={createDoctor}
                  bindAddAction={(action) => {
                    ativosAddActionRef.current = action
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesSidebarColumnWrapClass}>
            {isMainLoading ? (
              <AdminProfissionaisAboutPanelSkeleton />
            ) : activeTab === 'candidaturas' ? (
              <AdminProfissionaisCandidaturasAboutPanel
                candidaturas={candidaturas}
                candidaturasSummary={candidaturasSummary}
                ativosSummary={ativosSummary}
              />
            ) : (
              <AdminMedicosAboutPanel doctors={doctorRows} ativosSummary={ativosSummary} />
            )}
          </div>
        </div>
      </div>

      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      ) : null}
    </div>
  )
}
