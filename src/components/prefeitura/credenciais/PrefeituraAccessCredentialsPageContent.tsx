import { AccessCredentialsSidebarPanel } from '../../credenciais/AccessCredentialsSidebarPanel'
import { AccessCredentialsSidebarPanelSkeleton } from '../../credenciais/AccessCredentialsSidebarPanelSkeleton'
import { AdminPrefeituraCredentialMainPanel } from '../../admin/credenciais/AdminPrefeituraCredentialMainPanel'
import {
  dashboardPageHeaderWrapClass,
  dashboardPageScrollPaddingClass,
  dashboardPageShellClass,
} from '../../layout/dashboardPageLayout'
import { useAdminOperatorUserDrawer } from '../../../hooks/useAdminOperatorUserDrawer'
import { useAccessLogsDrawer } from '../../../hooks/useAccessLogsDrawer'
import { usePrefeituraAccessCredentialsPage } from '../../../hooks/usePrefeituraAccessCredentialsPage'
import { usePrefeituraGestorCredentialDrawer } from '../../../hooks/usePrefeituraGestorCredentialDrawer'
import { usePrefeituraPageAccess } from '../../../hooks/usePrefeituraPageAccess'
import {
  buildPrefeituraCredentialsRaFilterOptions,
  mapOperatorRowToPrefeituraAccessCredentialUser,
} from '../../../data/prefeituraAccessCredentialsMock'
import { PrefeituraAccessCredentialsMainPanel } from './PrefeituraAccessCredentialsMainPanel'
import { PrefeituraAccessCredentialsMainPanelSkeleton } from './PrefeituraAccessCredentialsMainPanelSkeleton'
import { PrefeituraAccessCredentialsPageHeader } from './PrefeituraAccessCredentialsPageHeader'
import { PrefeituraAccessCredentialsPageHeaderSkeleton } from './PrefeituraAccessCredentialsPageHeaderSkeleton'
import {
  PrefeituraAccessCredentialsTabs,
  type PrefeituraAccessCredentialsTab,
} from './PrefeituraAccessCredentialsTabs'
import { fetchPrefeituraCredenciaisAccessLogs } from '../../../lib/services/prefeitura/credenciais'
import { mapAuditLogEntriesToAccessLogs } from '../../../utils/mapCredenciaisAccessLogs'
import { useCallback, useMemo, useState } from 'react'

export function PrefeituraAccessCredentialsPageContent() {
  const { pageAccess } = usePrefeituraPageAccess('credenciais')
  const [activeTab, setActiveTab] = useState<PrefeituraAccessCredentialsTab>('portal')
  const {
    operatorRows,
    setOperatorRows,
    gestorRows,
    setGestorRows,
    ubtOptions,
    contractingEntityOptions,
    isLoading,
    loadError,
    afterMutation,
    getAccessToken,
  } = usePrefeituraAccessCredentialsPage()

  const ubtUserDrawer = useAdminOperatorUserDrawer(operatorRows, setOperatorRows, ubtOptions, {
    defaultScope: 'UBT',
    skipPasswordOnCreate: false,
    requireCpfOnCreate: true,
    getAccessToken,
    onDataChanged: afterMutation,
    contractingEntityOptionsFromApi: contractingEntityOptions,
    pinAudience: 'admin',
    credenciaisApiSource: 'prefeitura',
  })

  const gestorDrawer = usePrefeituraGestorCredentialDrawer(gestorRows, setGestorRows, {
    getAccessToken,
    onDataChanged: afterMutation,
    contractingEntityOptions,
  })

  const accessLogUsers = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; email: string; initials: string; avatarClassName: string }
    >()

    for (const row of gestorRows) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        email: row.email,
        initials: row.initials,
        avatarClassName: row.avatarClassName,
      })
    }

    for (const row of operatorRows) {
      map.set(row.id, {
        id: row.id,
        name: row.name,
        email: row.email,
        initials: row.initials,
        avatarClassName: row.avatarClassName,
      })
    }

    return Array.from(map.values())
  }, [gestorRows, operatorRows])

  const loadAccessLogs = useCallback(
    async (token: string) => {
      const { entries } = await fetchPrefeituraCredenciaisAccessLogs(token, { limit: 100 })
      return mapAuditLogEntriesToAccessLogs(entries, accessLogUsers)
    },
    [accessLogUsers],
  )

  const accessLogsDrawer = useAccessLogsDrawer({
    getAccessToken,
    users: accessLogUsers,
    loadLogs: loadAccessLogs,
  })

  const credentialUsers = useMemo(
    () => operatorRows.map(mapOperatorRowToPrefeituraAccessCredentialUser),
    [operatorRows],
  )

  const raFilterOptions = useMemo(
    () => buildPrefeituraCredentialsRaFilterOptions(ubtOptions),
    [ubtOptions],
  )

  const sidebarUsers = activeTab === 'portal' ? gestorRows : credentialUsers

  const handleNewUser =
    activeTab === 'portal'
      ? pageAccess.canInsert
        ? gestorDrawer.openCreate
        : undefined
      : pageAccess.canInsert
        ? ubtUserDrawer.openCreate
        : undefined

  return (
    <>
      <div className={dashboardPageShellClass} aria-busy={isLoading}>
        <div className={dashboardPageHeaderWrapClass}>
          {isLoading ? (
            <PrefeituraAccessCredentialsPageHeaderSkeleton />
          ) : (
            <PrefeituraAccessCredentialsPageHeader
              activeTab={activeTab}
              onNewUser={handleNewUser}
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

          <section
            className={[
              'grid min-h-0 flex-1 gap-4',
              'xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:grid-rows-1 xl:items-stretch',
            ].join(' ')}
          >
            {isLoading ? (
              <>
                <PrefeituraAccessCredentialsMainPanelSkeleton />
                <AccessCredentialsSidebarPanelSkeleton />
              </>
            ) : (
              <>
                <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
                  <PrefeituraAccessCredentialsTabs activeTab={activeTab} onTabChange={setActiveTab} />
                  {activeTab === 'portal' ? (
                    <AdminPrefeituraCredentialMainPanel
                      embedded
                      rows={gestorRows}
                      userDrawer={gestorDrawer}
                      hideEntityFilter
                      pageAccessOverride={{
                        canEdit: pageAccess.canEdit,
                        canDelete: pageAccess.canDelete,
                      }}
                    />
                  ) : (
                    <PrefeituraAccessCredentialsMainPanel
                      users={credentialUsers}
                      ubtOptions={ubtOptions}
                      raFilterOptions={raFilterOptions}
                      userDrawer={ubtUserDrawer}
                      embedded
                    />
                  )}
                </div>
                <AccessCredentialsSidebarPanel
                  users={sidebarUsers}
                  onOpenAllAccesses={accessLogsDrawer.openDrawer}
                />
              </>
            )}
          </section>
        </div>
      </div>

      {activeTab === 'portal' ? gestorDrawer.drawerElement : ubtUserDrawer.drawerElement}
      {accessLogsDrawer.drawerElement}
    </>
  )
}
