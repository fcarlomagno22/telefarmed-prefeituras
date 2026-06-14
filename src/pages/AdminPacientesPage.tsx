import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminPacientesAboutPanel } from '../components/admin/pacientes/AdminPacientesAboutPanel'
import { AdminPacientesMainPanel } from '../components/admin/pacientes/AdminPacientesMainPanel'
import {
  AdminPacientesAboutPanelSkeleton,
} from '../components/admin/pacientes/skeletons/AdminPacientesAboutPanelSkeleton'
import {
  AdminPacientesMainPanelSkeleton,
} from '../components/admin/pacientes/skeletons/AdminPacientesMainPanelSkeleton'
import {
  adminPacientesColumnScrollClass,
  adminPacientesColumnsGridClass,
  adminPacientesMainColumnWrapClass,
  adminPacientesSidebarColumnWrapClass,
} from '../components/admin/pacientes/adminPacientesPageLayout'
import { AdminPessoasAddButton } from '../components/admin/pessoas/AdminPessoasAddButton'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { useAdminPacientesPage } from '../hooks/useAdminPacientesPage'
import { useRef } from 'react'

const mainCardShellClass = [
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export function AdminPacientesPage() {
  const pacientesAddActionRef = useRef<(() => void) | null>(null)
  const {
    patients,
    cityScopedPatients,
    summary,
    contractingEntities,
    municipalityOptions,
    selectedMunicipality,
    setSelectedMunicipality,
    isLoading,
    loadError,
    reload,
    searchQuery,
    setSearchQuery,
    upsertPatient,
    loadDetail,
    savePatientEdits,
    lookupPatientByCpf,
    completePreCadastro,
    savePreCadastroDraft,
    concludePreCadastroById,
    cancelPreCadastro,
    createPatientDirect,
    inactivatePatient,
    exportPatientsCsv,
    isExporting,
  } = useAdminPacientesPage()

  return (
    <div className={dashboardPageShellClass} aria-label="Pacientes">
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Pessoas"
          title="Pacientes"
          description="Base consolidada de pacientes dos municípios contratantes."
          actions={
            <AdminPessoasAddButton
              label="Adicionar paciente"
              onClick={() => pacientesAddActionRef.current?.()}
            />
          }
        />
      </div>

      {loadError ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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

      <div
        className={[adminPacientesColumnsGridClass, dashboardPageScrollPaddingClass, 'mt-4 pb-5'].join(' ')}
      >
        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesMainColumnWrapClass}>
            <div className={mainCardShellClass}>
              {isLoading ? (
                <AdminPacientesMainPanelSkeleton />
              ) : (
                <AdminPacientesMainPanel
                  embedded
                  patients={patients}
                  summary={summary}
                  contractingEntities={contractingEntities}
                  selectedMunicipality={selectedMunicipality}
                  municipalityOptions={municipalityOptions}
                  onMunicipalityChange={setSelectedMunicipality}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onPatientUpsert={upsertPatient}
                  onLoadPatientDetail={loadDetail}
                  onSavePatientEdits={savePatientEdits}
                  onLookupPatientByCpf={lookupPatientByCpf}
                  onCompletePreCadastro={completePreCadastro}
                  onSavePreCadastroDraft={savePreCadastroDraft}
                  onConcludePreCadastroById={concludePreCadastroById}
                  onCancelPreCadastro={cancelPreCadastro}
                  onCreatePatientDirect={createPatientDirect}
                  onInactivatePatient={inactivatePatient}
                  onExportCsv={exportPatientsCsv}
                  isExporting={isExporting}
                  bindAddAction={(action) => {
                    pacientesAddActionRef.current = action
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesSidebarColumnWrapClass}>
            {isLoading ? (
              <AdminPacientesAboutPanelSkeleton />
            ) : (
              <AdminPacientesAboutPanel patients={cityScopedPatients} summary={summary} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
