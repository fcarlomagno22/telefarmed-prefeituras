import { AccessCredentialsMainPanel } from '../components/credenciais/AccessCredentialsMainPanel'
import { AccessCredentialsMainPanelSkeleton } from '../components/credenciais/AccessCredentialsMainPanelSkeleton'
import { AccessCredentialsPageHeader } from '../components/credenciais/AccessCredentialsPageHeader'
import { AccessCredentialsPageHeaderSkeleton } from '../components/credenciais/AccessCredentialsPageHeaderSkeleton'
import { AccessCredentialsSidebarPanel } from '../components/credenciais/AccessCredentialsSidebarPanel'
import { AccessCredentialsSidebarPanelSkeleton } from '../components/credenciais/AccessCredentialsSidebarPanelSkeleton'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../components/layout/dashboardPageLayout'
import { useAccessLogsDrawer } from '../hooks/useAccessLogsDrawer'
import { useAdminOperatorUserDrawer } from '../hooks/useAdminOperatorUserDrawer'
import { useBrandTheme } from '../hooks/useBrandTheme'
import { useUbtAccessCredentialsPage } from '../hooks/useUbtAccessCredentialsPage'
import { useUbtPageAccess } from '../hooks/useUbtPageAccess'
import type { AdminOperatorRow } from '../data/adminOperadoresMock'
import { mapOperatorRowToAccessCredentialUser, type RecentAccessEntry } from '../data/accessCredentialsMock'
import { fetchUbtCredenciaisAccessLogs } from '../lib/services/ubt/credenciais'
import { mapAuditLogEntriesToAccessLogs } from '../utils/mapCredenciaisAccessLogs'
import { useCallback, useMemo } from 'react'
import { useTenantHost } from '../contexts/TenantHostContext'

function buildRecentAccessEntries(rows: AdminOperatorRow[]): RecentAccessEntry[] {
  return rows
    .filter(
      (row) =>
        row.lastAccessLabel &&
        row.lastAccessLabel !== 'Nunca' &&
        !row.lastAccessLabel.toLowerCase().includes('sem acesso'),
    )
    .slice(0, 5)
    .map((row) => ({
      userId: row.id,
      name: row.name,
      initials: row.initials,
      avatarClassName: row.avatarClassName,
      accessedAtLabel: row.lastAccessLabel,
    }))
}

export function AccessCredentialsPage() {
  useBrandTheme()
  const { pageAccess } = useUbtPageAccess('credenciais')
  const {
    operatorRows,
    setOperatorRows,
    ubtOptions,
    contractingEntityOptions,
    canManage,
    isLoading,
    loadError,
    filters,
    setFilters,
    profileOptions,
    afterMutation,
    getAccessToken,
  } = useUbtAccessCredentialsPage()

  const { slug: tenantSlug } = useTenantHost()

  const accessLogUsers = useMemo(
    () =>
      operatorRows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        initials: row.initials,
        avatarClassName: row.avatarClassName,
      })),
    [operatorRows],
  )

  const loadAccessLogs = useCallback(
    async (token: string) => {
      const { entries } = await fetchUbtCredenciaisAccessLogs(token, { limit: 100 })
      return mapAuditLogEntriesToAccessLogs(entries, accessLogUsers)
    },
    [accessLogUsers],
  )

  const accessLogsDrawer = useAccessLogsDrawer({
    getAccessToken,
    users: accessLogUsers,
    loadLogs: loadAccessLogs,
  })

  const userDrawer = useAdminOperatorUserDrawer(operatorRows, setOperatorRows, ubtOptions, {
    defaultScope: 'UBT',
    skipPasswordOnCreate: false,
    requireCpfOnCreate: true,
    getAccessToken,
    onDataChanged: afterMutation,
    contractingEntityOptionsFromApi: contractingEntityOptions,
    pinAudience: 'portal',
    credenciaisApiSource: 'ubt',
    defaultPortalSlug: tenantSlug,
  })

  const credentialUsers = useMemo(
    () => operatorRows.map(mapOperatorRowToAccessCredentialUser),
    [operatorRows],
  )

  const recentAccessEntries = useMemo(
    () => buildRecentAccessEntries(operatorRows),
    [operatorRows],
  )

  const canInsert = pageAccess.canInsert && canManage
  const canEdit = canManage && pageAccess.canEdit
  const canDelete = canManage && pageAccess.canDelete

  return (
    <DashboardLayout>
      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <AccessCredentialsPageHeaderSkeleton />
          ) : (
            <AccessCredentialsPageHeader
              onNewUser={canInsert ? userDrawer.openCreate : undefined}
            />
          )}
        </div>

        <div
          className={[
            dashboardPageScrollPaddingClass,
            'mt-4 flex min-h-0 flex-1 flex-col pb-5',
          ].join(' ')}
        >
          {loadError ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {loadError}
            </p>
          ) : null}

          {!isLoading && !canManage ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Somente o responsável pela UBT pode cadastrar ou alterar operadores. Você pode
              visualizar a lista abaixo.
            </p>
          ) : null}

          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <AccessCredentialsMainPanelSkeleton />
                <AccessCredentialsSidebarPanelSkeleton />
              </>
            ) : (
              <>
                <AccessCredentialsMainPanel
                  users={credentialUsers}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  filters={filters}
                  onFiltersChange={setFilters}
                  profileOptions={profileOptions}
                  userDrawer={userDrawer}
                />
                <AccessCredentialsSidebarPanel
                  users={credentialUsers}
                  recentAccessEntries={recentAccessEntries}
                  onOpenAllAccesses={accessLogsDrawer.openDrawer}
                />
              </>
            )}
          </section>
        </div>
      </div>

      {userDrawer.drawerElement}
      {accessLogsDrawer.drawerElement}
    </DashboardLayout>
  )
}
