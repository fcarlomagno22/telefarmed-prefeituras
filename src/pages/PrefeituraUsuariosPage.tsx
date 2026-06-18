import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { PrefeituraUsuariosAboutPanel } from '../components/prefeitura/usuarios/PrefeituraUsuariosAboutPanel'
import { PrefeituraUsuariosAboutPanelSkeleton } from '../components/prefeitura/usuarios/PrefeituraUsuariosAboutPanelSkeleton'
import { PrefeituraUsuariosMainPanel } from '../components/prefeitura/usuarios/PrefeituraUsuariosMainPanel'
import { PrefeituraUsuariosMainPanelSkeleton } from '../components/prefeitura/usuarios/PrefeituraUsuariosMainPanelSkeleton'
import {
  prefeituraUsuariosColumnScrollClass,
  prefeituraUsuariosColumnsGridClass,
  prefeituraUsuariosMainColumnWrapClass,
  prefeituraUsuariosSidebarColumnWrapClass,
} from '../components/prefeitura/usuarios/prefeituraUsuariosPageLayout'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { useEntidadeCopy } from '../hooks/useEntidadeCopy'
import { usePrefeituraPacientesPage } from '../hooks/usePrefeituraPacientesPage'

export function PrefeituraUsuariosPage() {
  const copy = useEntidadeCopy()
  const {
    patients,
    summary,
    about,
    pagination,
    search,
    setSearch,
    filters,
    setFilters,
    availableNeighborhoods,
    availableFirstUnits,
    isLoading,
    loadError,
    setPage,
    loadPatientDetail,
    savePatientEdits,
    upsertPatient,
  } = usePrefeituraPacientesPage()

  return (
    <div className={dashboardPageShellClass}>
      <div className={dashboardPageHeaderWrapClass}>
        <DashboardPageHeader
          title="Pacientes"
          subtitle={`Base única ${copy.daRede} — visão consolidada, LGPD e campanhas de retorno`}
        />
      </div>

      {loadError ? (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <div
        className={[
          prefeituraUsuariosColumnsGridClass,
          dashboardPageScrollPaddingClass,
          'mt-4 pb-5',
        ].join(' ')}
      >
        <div className={prefeituraUsuariosColumnScrollClass}>
          <div className={prefeituraUsuariosMainColumnWrapClass}>
            {isLoading ? (
              <PrefeituraUsuariosMainPanelSkeleton />
            ) : (
              <PrefeituraUsuariosMainPanel
                patients={patients}
                summary={summary}
                pagination={pagination}
                search={search}
                onSearchChange={setSearch}
                filters={filters}
                onFiltersChange={setFilters}
                availableNeighborhoods={availableNeighborhoods}
                availableFirstUnits={availableFirstUnits}
                onPageChange={setPage}
                onPatientUpsert={upsertPatient}
                onLoadPatientDetail={loadPatientDetail}
                onSavePatientEdits={savePatientEdits}
              />
            )}
          </div>
        </div>

        <div className={prefeituraUsuariosColumnScrollClass}>
          <div className={prefeituraUsuariosSidebarColumnWrapClass}>
            {isLoading ? (
              <PrefeituraUsuariosAboutPanelSkeleton />
            ) : (
              <PrefeituraUsuariosAboutPanel about={about} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
