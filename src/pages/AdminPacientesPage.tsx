import { useCallback, useMemo, useRef, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminPacientesAboutPanel } from '../components/admin/pacientes/AdminPacientesAboutPanel'
import { AdminPacientesMainPanel } from '../components/admin/pacientes/AdminPacientesMainPanel'
import { AdminMedicosAboutPanel } from '../components/admin/medicos/AdminMedicosAboutPanel'
import { AdminMedicosMainPanel } from '../components/admin/medicos/AdminMedicosMainPanel'
import { AdminOperadoresAboutPanel } from '../components/admin/operadores/AdminOperadoresAboutPanel'
import { AdminOperadoresMainPanel } from '../components/admin/operadores/AdminOperadoresMainPanel'
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
import {
  AdminPessoasTabs,
  type AdminPessoasTab,
} from '../components/admin/pessoas/AdminPessoasTabs'
import { AdminPessoasAddButton } from '../components/admin/pessoas/AdminPessoasAddButton'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { adminMunicipalPatients, getAdminMunicipalityOptions } from '../data/adminPacientesMock'
import { adminDoctors } from '../data/adminMedicosMock'
import {
  adminOperatorUbtOptions,
  adminOperatorsInitialRows,
} from '../data/adminOperadoresMock'
import { useAdminOperatorUserDrawer } from '../hooks/useAdminOperatorUserDrawer'
import { usePageSkeletonLoading } from '../hooks/usePageSkeletonLoading'

const peopleMainCardShellClass = [
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export function AdminPacientesPage() {
  const isLoading = usePageSkeletonLoading(1200)
  const [selectedMunicipality, setSelectedMunicipality] = useState('all')
  const [activeTab, setActiveTab] = useState<AdminPessoasTab>('pacientes')
  const [doctorRows, setDoctorRows] = useState(adminDoctors)
  const [patientRows, setPatientRows] = useState(adminMunicipalPatients)
  const [operatorRows, setOperatorRows] = useState(adminOperatorsInitialRows)
  const operatorDrawer = useAdminOperatorUserDrawer(
    operatorRows,
    setOperatorRows,
    adminOperatorUbtOptions,
  )
  const pacientesAddActionRef = useRef<(() => void) | null>(null)
  const medicosAddActionRef = useRef<(() => void) | null>(null)

  const handlePessoasAdd = useCallback(() => {
    if (activeTab === 'operadores') {
      operatorDrawer.openCreate()
      return
    }
    if (activeTab === 'pacientes') {
      pacientesAddActionRef.current?.()
      return
    }
    medicosAddActionRef.current?.()
  }, [activeTab, operatorDrawer])

  const municipalityOptions = useMemo(
    () => getAdminMunicipalityOptions(patientRows),
    [patientRows],
  )

  const cityScopedPatients = useMemo(
    () =>
      selectedMunicipality === 'all'
        ? patientRows
        : patientRows.filter(
            (patient) => patient.municipality === selectedMunicipality,
          ),
    [selectedMunicipality, patientRows],
  )

  const gridClass = adminPacientesColumnsGridClass

  return (
    <div className={dashboardPageShellClass} aria-label="Pessoas">
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Plataforma"
          title="Pessoas"
          description="Base consolidada de pacientes, médicos e operadores dos municípios contratantes."
          actions={
            <AdminPessoasAddButton activeTab={activeTab} onClick={handlePessoasAdd} />
          }
        />
      </div>

      <div
        className={[gridClass, dashboardPageScrollPaddingClass, 'mt-4 pb-5'].join(' ')}
      >
        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesMainColumnWrapClass}>
            <div className={peopleMainCardShellClass}>
              <AdminPessoasTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'pacientes' ? (
                isLoading ? (
                  <AdminPacientesMainPanelSkeleton />
                ) : (
                  <AdminPacientesMainPanel
                    embedded
                    patients={patientRows}
                    selectedMunicipality={selectedMunicipality}
                    municipalityOptions={municipalityOptions}
                    onMunicipalityChange={setSelectedMunicipality}
                    onPatientsChange={setPatientRows}
                    bindAddAction={(action) => {
                      pacientesAddActionRef.current = action
                    }}
                  />
                )
              ) : activeTab === 'medicos' ? (
                <AdminMedicosMainPanel
                  embedded
                  doctors={doctorRows}
                  onDoctorsChange={setDoctorRows}
                  bindAddAction={(action) => {
                    medicosAddActionRef.current = action
                  }}
                />
              ) : (
                <AdminOperadoresMainPanel
                  embedded
                  rows={operatorRows}
                  ubtOptions={adminOperatorUbtOptions}
                  userDrawer={operatorDrawer}
                />
              )}
            </div>
          </div>
        </div>

        {activeTab === 'pacientes' ? (
          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesSidebarColumnWrapClass}>
              {isLoading ? (
                <AdminPacientesAboutPanelSkeleton />
              ) : (
                <AdminPacientesAboutPanel patients={cityScopedPatients} />
              )}
            </div>
          </div>
        ) : activeTab === 'medicos' ? (
          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesSidebarColumnWrapClass}>
              <AdminMedicosAboutPanel />
            </div>
          </div>
        ) : (
          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesSidebarColumnWrapClass}>
              <AdminOperadoresAboutPanel rows={operatorRows} />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'operadores' ? operatorDrawer.drawerElement : null}
    </div>
  )
}
