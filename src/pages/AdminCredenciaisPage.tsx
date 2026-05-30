import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AdminCredenciaisInternoAboutPanel } from '../components/admin/credenciais/AdminCredenciaisInternoAboutPanel'
import { AdminCredenciaisInternoMainPanel } from '../components/admin/credenciais/AdminCredenciaisInternoMainPanel'
import {
  AdminCredenciaisTabs,
  type AdminCredenciaisTab,
} from '../components/admin/credenciais/AdminCredenciaisTabs'
import { AdminOperadoresAboutPanel } from '../components/admin/operadores/AdminOperadoresAboutPanel'
import { AdminOperadoresMainPanel } from '../components/admin/operadores/AdminOperadoresMainPanel'
import {
  adminPacientesColumnScrollClass,
  adminPacientesMainColumnWrapClass,
  adminPacientesSidebarColumnWrapClass,
} from '../components/admin/pacientes/adminPacientesPageLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
  dashboardTwoColumnLayoutClass,
} from '../components/layout/dashboardPageLayout'
import { AdminCredenciaisPageSkeleton } from '../components/admin/credenciais/skeletons/AdminCredenciaisPageSkeleton'
import { KpiStatCards } from '../components/ui/KpiStatCards'
import { filterOperatorRowsByScope } from '../data/adminCredenciaisMock'
import { useAdminCredenciaisPage } from '../hooks/useAdminCredenciaisPage'
import { useAdminPageAccess } from '../hooks/useAdminPageAccess'
import { useAdminInternoCredentialDrawer } from '../hooks/useAdminInternoCredentialDrawer'
import { useAdminOperatorUserDrawer } from '../hooks/useAdminOperatorUserDrawer'

const mainCardShellClass = [
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl',
  'border border-gray-200 bg-white',
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]',
].join(' ')

export function AdminCredenciaisPage() {
  const { pageAccess } = useAdminPageAccess('credenciais')
  const [activeTab, setActiveTab] = useState<AdminCredenciaisTab>('admin')
  const {
    internoRows,
    setInternoRows,
    operatorRows,
    setOperatorRows,
    ubtOptions,
    contractingEntityOptions,
    kpiCards,
    isLoading,
    loadError,
    reload,
    afterMutation,
    getAccessToken,
  } = useAdminCredenciaisPage()

  const internoDrawer = useAdminInternoCredentialDrawer(internoRows, setInternoRows, {
    getAccessToken,
    onDataChanged: afterMutation,
  })

  const defaultOperatorScope =
    activeTab === 'prefeitura' ? ('Prefeitura' as const) : ('UBT' as const)

  const operatorDrawer = useAdminOperatorUserDrawer(
    operatorRows,
    setOperatorRows,
    ubtOptions,
    {
      defaultScope: activeTab === 'admin' ? 'UBT' : defaultOperatorScope,
      skipPasswordOnCreate: false,
      getAccessToken,
      onDataChanged: afterMutation,
      contractingEntityOptionsFromApi: contractingEntityOptions,
      pinAudience: 'admin',
    },
  )

  const prefeituraRows = useMemo(
    () => filterOperatorRowsByScope(operatorRows, 'Prefeitura'),
    [operatorRows],
  )
  const ubtRows = useMemo(() => filterOperatorRowsByScope(operatorRows, 'UBT'), [operatorRows])

  const scopedOperatorRows =
    activeTab === 'prefeitura' ? prefeituraRows : activeTab === 'ubt' ? ubtRows : operatorRows

  const handleNewUser = useCallback(() => {
    if (activeTab === 'admin') {
      internoDrawer.openCreate()
      return
    }
    operatorDrawer.openCreate()
  }, [activeTab, internoDrawer, operatorDrawer])

  const newUserLabel =
    activeTab === 'admin'
      ? 'Novo acesso interno'
      : activeTab === 'prefeitura'
        ? 'Novo gestor prefeitura'
        : 'Novo operador UBT'

  if (isLoading) {
    return (
      <>
        <AdminCredenciaisPageSkeleton activeTab={activeTab} />
        {activeTab === 'admin' ? internoDrawer.drawerElement : operatorDrawer.drawerElement}
      </>
    )
  }

  return (
    <>
      <div className={dashboardPageShellClass} aria-label="Credenciais">
        <div className={dashboardPageHeaderWrapClass}>
          <AdminPageHeader
            sectionLabel="Governança"
            title="Credenciais de acesso"
            description="Gerencie quem acessa o painel administrativo Telefarmed, os portais das prefeituras e as unidades UBT. Crie, edite ou revogue credenciais por portal."
            actions={
              pageAccess.canInsert ? (
                <button
                  type="button"
                  onClick={handleNewUser}
                  className="btn-brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                  {newUserLabel}
                </button>
              ) : null
            }
          />
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-5',
          ].join(' ')}
        >
          {loadError ? (
            <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}{' '}
              <button
                type="button"
                onClick={() => void reload()}
                className="font-semibold underline"
              >
                Tentar novamente
              </button>
            </div>
          ) : null}

          {kpiCards.length > 0 ? (
            <KpiStatCards items={kpiCards} className="shrink-0 sm:grid-cols-2 xl:grid-cols-4" />
          ) : null}

          <section
            className={[dashboardTwoColumnLayoutClass, 'min-h-0 flex-1 overflow-hidden'].join(
              ' ',
            )}
          >
            <div className={adminPacientesColumnScrollClass}>
              <div className={adminPacientesMainColumnWrapClass}>
                <div className={mainCardShellClass}>
                  <AdminCredenciaisTabs activeTab={activeTab} onTabChange={setActiveTab} />

                  {activeTab === 'admin' ? (
                    <AdminCredenciaisInternoMainPanel
                      embedded
                      rows={internoRows}
                      userDrawer={internoDrawer}
                    />
                  ) : null}

                  {activeTab === 'prefeitura' ? (
                    <AdminOperadoresMainPanel
                      embedded
                      rows={operatorRows}
                      ubtOptions={ubtOptions}
                      userDrawer={operatorDrawer}
                      fixedScope="Prefeitura"
                      panelTitle="Gestores da prefeitura"
                      panelDescription="Usuários com acesso ao portal municipal (/prefeitura): dashboards, rede, contratos e gestão local."
                    />
                  ) : null}

                  {activeTab === 'ubt' ? (
                    <AdminOperadoresMainPanel
                      embedded
                      rows={operatorRows}
                      ubtOptions={ubtOptions}
                      userDrawer={operatorDrawer}
                      fixedScope="UBT"
                      panelTitle="Operadores de UBT"
                      panelDescription="Usuários das unidades com acesso ao terminal UBT (/ubt): triagem, agenda, consultas e operação diária."
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className={adminPacientesColumnScrollClass}>
              <div className={adminPacientesSidebarColumnWrapClass}>
                {activeTab === 'admin' ? (
                  <AdminCredenciaisInternoAboutPanel rows={internoRows} />
                ) : (
                  <AdminOperadoresAboutPanel rows={scopedOperatorRows} />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {activeTab === 'admin' ? internoDrawer.drawerElement : operatorDrawer.drawerElement}
    </>
  )
}
