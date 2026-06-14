import { useCallback } from 'react'
import { DashboardPageHeader } from '../components/users/DashboardPageHeader'
import { DashboardPageHeaderSkeleton } from '../components/users/DashboardPageHeaderSkeleton'
import { NetworkUsersAboutPanel } from '../components/users/NetworkUsersAboutPanel'
import { NetworkUsersAboutPanelSkeleton } from '../components/users/NetworkUsersAboutPanelSkeleton'
import { NetworkUsersMainPanel } from '../components/users/NetworkUsersMainPanel'
import { NetworkUsersMainPanelSkeleton } from '../components/users/NetworkUsersMainPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { useUbtPacientesPage } from '../hooks/useUbtPacientesPage'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useNetworkUserDrawer } from '../hooks/useNetworkUserDrawer'
import { useUbtPageAccess } from '../hooks/useUbtPageAccess'
import { useUbtAuth } from '../contexts/UbtAuthContext'
import {
  fetchUbtPacienteConsultas,
  fetchUbtPacienteDetail,
  fetchUbtPacienteRow,
} from '../lib/services/ubt/pacientes'
import { loadUbtPacienteDrawerData } from '../utils/ubtPacientesDetail'

export function NetworkUsersPage() {
  useBrandTheme()
  const { getAccessToken } = useUbtAuth()
  const { can } = useUbtPageAccess()
  const {
    users,
    summary,
    about,
    pagination,
    search,
    setSearch,
    filters,
    setFilters,
    availableNeighborhoods,
    availableRegistrationUnits,
    unitLabel,
    isLoading,
    loadError,
    reload,
    setPage,
  } = useUbtPacientesPage()

  const loadPacienteDetail = useCallback(
    async (pacienteId: string) => {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      return loadUbtPacienteDrawerData(
        (id) => fetchUbtPacienteRow(token, id),
        (id) => fetchUbtPacienteDetail(token, id),
        pacienteId,
        (id) => fetchUbtPacienteConsultas(token, id),
      )
    },
    [getAccessToken],
  )

  const networkUserDrawer = useNetworkUserDrawer({
    loadPacienteDetail,
    getAccessToken,
    canInactivate: can('usuarios', 'excluir'),
    onPatientInactivated: () => void reload(),
  })

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <DashboardPageHeaderSkeleton />
          ) : (
            <DashboardPageHeader
              title="Usuários da rede"
              subtitle={`${unitLabel} — Todos os pacientes atendidos`}
            />
          )}
        </div>

        {loadError ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col pb-5',
          ].join(' ')}
        >
          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <div className="flex h-full min-h-0 min-w-0 flex-col [&>section]:h-full [&>section]:min-h-0 [&>section]:flex-1">
                  <NetworkUsersMainPanelSkeleton />
                </div>
                <div className="flex h-full min-h-0 min-w-0 flex-col">
                  <NetworkUsersAboutPanelSkeleton />
                </div>
              </>
            ) : (
              <>
                <NetworkUsersMainPanel
                  users={users}
                  summary={summary}
                  pagination={pagination}
                  search={search}
                  onSearchChange={setSearch}
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableNeighborhoods={availableNeighborhoods}
                  availableRegistrationUnits={availableRegistrationUnits}
                  onPageChange={setPage}
                  networkUserDrawer={networkUserDrawer}
                />
                <NetworkUsersAboutPanel about={about} />
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
