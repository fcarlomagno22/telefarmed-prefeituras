import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminOperadoresAboutPanel } from '../components/admin/operadores/AdminOperadoresAboutPanel'
import { AdminOperadoresMainPanel } from '../components/admin/operadores/AdminOperadoresMainPanel'
import { AdminCredenciaisOperadoresAboutPanelSkeleton } from '../components/admin/credenciais/skeletons/AdminCredenciaisOperadoresAboutPanelSkeleton'
import { AdminCredenciaisOperadoresMainPanelSkeleton } from '../components/admin/credenciais/skeletons/AdminCredenciaisOperadoresMainPanelSkeleton'
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
import { useAdminOperadoresPage } from '../hooks/useAdminOperadoresPage'
import { useAdminOperatorUserDrawer } from '../hooks/useAdminOperatorUserDrawer'
import { useAdminPageAccess } from '../hooks/useAdminPageAccess'

const mainCardShellClass = [
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export function AdminOperadoresPage() {
  const { pageAccess } = useAdminPageAccess('credenciais')
  const {
    operatorRows,
    setOperatorRows,
    ubtOptions,
    contractingEntityOptions,
    searchQuery,
    setSearchQuery,
    profileFilter,
    setProfileFilter,
    isLoading,
    loadError,
    reload,
    afterMutation,
    getAccessToken,
  } = useAdminOperadoresPage()

  const operatorDrawer = useAdminOperatorUserDrawer(operatorRows, setOperatorRows, ubtOptions, {
    defaultScope: 'UBT',
    skipPasswordOnCreate: false,
    requireCpfOnCreate: true,
    getAccessToken,
    onDataChanged: afterMutation,
    contractingEntityOptionsFromApi: contractingEntityOptions,
    pinAudience: 'admin',
  })

  if (isLoading) {
    return (
      <div className={dashboardPageShellClass} aria-label="Operadores">
        <div className={dashboardPageHeaderWrapClass}>
          <AdminPageHeader
            sectionLabel="Pessoas"
            title="Operadores"
            description="Operadores UBT vinculados aos contratos municipais."
          />
        </div>
        <div
          className={[adminPacientesColumnsGridClass, dashboardPageScrollPaddingClass, 'mt-4 pb-5'].join(' ')}
        >
          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesMainColumnWrapClass}>
              <div className={mainCardShellClass}>
                <AdminCredenciaisOperadoresMainPanelSkeleton
                  fixedScope="UBT"
                  panelTitle="Operadores"
                />
              </div>
            </div>
          </div>
          <div className={adminPacientesColumnScrollClass}>
            <div className={adminPacientesSidebarColumnWrapClass}>
              <AdminCredenciaisOperadoresAboutPanelSkeleton />
            </div>
          </div>
        </div>
        {operatorDrawer.drawerElement}
      </div>
    )
  }

  return (
    <div className={dashboardPageShellClass} aria-label="Operadores">
      <div className={dashboardPageHeaderWrapClass}>
        <AdminPageHeader
          sectionLabel="Pessoas"
          title="Operadores"
          description="Operadores UBT vinculados aos contratos municipais."
          actions={
            pageAccess.canInsert ? (
              <AdminPessoasAddButton
                label="Adicionar operador"
                onClick={() => operatorDrawer.openCreate()}
              />
            ) : null
          }
        />
      </div>

      {loadError ? (
        <p className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}{' '}
          <button
            type="button"
            onClick={() => void reload()}
            className="font-semibold underline underline-offset-2"
          >
            Tentar novamente
          </button>
        </p>
      ) : null}

      <div className={[adminPacientesColumnsGridClass, dashboardPageScrollPaddingClass, 'mt-4 pb-5'].join(' ')}>
        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesMainColumnWrapClass}>
            <div className={mainCardShellClass}>
              <AdminOperadoresMainPanel
                embedded
                rows={operatorRows}
                ubtOptions={ubtOptions}
                userDrawer={operatorDrawer}
                fixedScope="UBT"
                panelTitle="Operadores"
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                profileFilter={profileFilter}
                onProfileFilterChange={setProfileFilter}
                canEdit={pageAccess.canEdit}
                canDelete={pageAccess.canDelete}
              />
            </div>
          </div>
        </div>

        <div className={adminPacientesColumnScrollClass}>
          <div className={adminPacientesSidebarColumnWrapClass}>
            <AdminOperadoresAboutPanel rows={operatorRows} />
          </div>
        </div>
      </div>

      {operatorDrawer.drawerElement}
    </div>
  )
}
