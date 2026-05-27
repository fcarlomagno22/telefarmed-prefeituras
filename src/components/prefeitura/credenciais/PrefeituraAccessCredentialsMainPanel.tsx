import { Building2, ChevronDown, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  groupPrefeituraCredentialsByUbt,
  prefeituraCredentialsRaFilterOptions,
  type PrefeituraAccessCredentialUser,
  type PrefeituraCredentialsUbtGroup,
} from '../../../data/prefeituraAccessCredentialsMock'
import { AccessCredentialActionsPopover } from '../../credenciais/AccessCredentialActionsPopover'
import { TransferCredentialUbtModal } from '../../credenciais/TransferCredentialUbtModal'
import { prefeituraCredentialsUbtOptions } from '../../../data/prefeituraAccessCredentialsMock'
import { AccessLevelBadge, CredentialStatusBadge } from '../../credenciais/accessCredentialBadges'
import { CustomSelect } from '../../ui/CustomSelect'
import { Toast } from '../../ui/Toast'
import type { usePrefeituraAccessCredentialUserDrawer } from '../../../hooks/usePrefeituraAccessCredentialUserDrawer'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function filterGroups(
  groups: PrefeituraCredentialsUbtGroup[],
  raFilter: string,
  search: string,
) {
  const query = search.trim().toLowerCase()

  return groups
    .filter((group) => {
      if (raFilter && group.raKey !== raFilter) return false
      if (!query) return true

      const haystack = [
        group.ubtName,
        group.raLabel,
        group.responsibleName,
        ...group.credentials.map(
          (user) => `${user.name} ${user.email} ${user.role} ${user.ubtName}`,
        ),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
    .map((group) => {
      if (!query) return group

      const matchingCredentials = group.credentials.filter((user) => {
        const haystack = `${user.name} ${user.email} ${user.role} ${user.ubtName}`.toLowerCase()
        return haystack.includes(query)
      })

      if (matchingCredentials.length === 0) return null

      return {
        ...group,
        credentials: matchingCredentials,
        totalCount: matchingCredentials.length,
        activeCount: matchingCredentials.filter((user) => user.status === 'ativo').length,
      }
    })
    .filter((group): group is PrefeituraCredentialsUbtGroup => group !== null)
}

type PrefeituraAccessCredentialsMainPanelProps = {
  userDrawer: Pick<
    ReturnType<typeof usePrefeituraAccessCredentialUserDrawer>,
    'openView' | 'requestPinAction' | 'users'
  >
}

export function PrefeituraAccessCredentialsMainPanel({
  userDrawer,
}: PrefeituraAccessCredentialsMainPanelProps) {
  const { openView, requestPinAction, users } = userDrawer
  const [search, setSearch] = useState('')
  const [raFilter, setRaFilter] = useState('')
  const [expandedUbtIds, setExpandedUbtIds] = useState<Set<string>>(new Set())
  const [menuUserId, setMenuUserId] = useState<string | null>(null)
  const [transferUser, setTransferUser] = useState<PrefeituraAccessCredentialUser | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message }))
  }, [])

  const closeMenu = useCallback(() => setMenuUserId(null), [])

  const allGroups = useMemo(() => groupPrefeituraCredentialsByUbt(users), [users])

  const filteredGroups = useMemo(
    () => filterGroups(allGroups, raFilter, search),
    [allGroups, raFilter, search],
  )

  const totalCredentials = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.totalCount, 0),
    [filteredGroups],
  )

  function toggleGroup(ubtId: string) {
    setExpandedUbtIds((current) => {
      const next = new Set(current)
      if (next.has(ubtId)) next.delete(ubtId)
      else next.add(ubtId)
      return next
    })
  }

  function requestDeactivateUser(user: PrefeituraAccessCredentialUser) {
    if (user.status === 'inativo') {
      closeMenu()
      showSuccessToast('Usuário já está desativado.')
      return
    }
    closeMenu()
    requestPinAction('deactivate', user)
  }

  function requestEditUser(user: PrefeituraAccessCredentialUser) {
    closeMenu()
    requestPinAction('edit', user)
  }

  function requestDeleteUser(user: PrefeituraAccessCredentialUser) {
    closeMenu()
    requestPinAction('delete', user)
  }

  function requestTransferUbt(user: PrefeituraAccessCredentialUser) {
    closeMenu()
    setTransferUser(user)
  }

  function confirmTransferUbt(targetUbtId: string, targetUbtName: string) {
    if (!transferUser) return
    const user = transferUser
    setTransferUser(null)
    requestPinAction('transfer_ubt', user, {
      transferTargetUbtId: targetUbtId,
      transferTargetUbtName: targetUbtName,
    })
  }

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
          <label className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por UBT, usuário ou função..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
            />
          </label>

          <CustomSelect
            value={raFilter}
            onChange={setRaFilter}
            options={[...prefeituraCredentialsRaFilterOptions]}
            className="w-full py-2 text-sm sm:w-52"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <p className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
              Nenhuma credencial encontrada com os filtros atuais.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredGroups.map((group) => {
                const expanded = expandedUbtIds.has(group.ubtId)
                const panelId = `pref-cred-ubt-panel-${group.ubtId}`

                return (
                  <li key={group.ubtId}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.ubtId)}
                      aria-expanded={expanded}
                      aria-controls={panelId}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-50/80 sm:px-6"
                    >
                      <span
                        className={[
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition',
                          expanded
                            ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                            : 'border-gray-200 bg-gray-50 text-gray-500',
                        ].join(' ')}
                      >
                        <Building2 className="h-4 w-4" strokeWidth={2} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{group.ubtName}</span>
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                            {group.raLabel}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          Responsável: {group.responsibleName} · {formatNumber(group.activeCount)} ativo
                          {group.activeCount === 1 ? '' : 's'} de {formatNumber(group.totalCount)} acesso
                          {group.totalCount === 1 ? '' : 's'}
                        </span>
                      </span>

                      <ChevronDown
                        className={[
                          'h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200',
                          expanded ? 'rotate-180' : '',
                        ].join(' ')}
                        strokeWidth={2}
                      />
                    </button>

                    {expanded ? (
                      <div id={panelId} className="border-t border-gray-100 bg-gray-50/40 px-3 pb-4 sm:px-4">
                        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                          <table className="w-full min-w-[720px] border-collapse text-left">
                            <thead className="bg-gray-50">
                              <tr className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                <th className="px-4 py-3">Usuário</th>
                                <th className="px-3 py-3 text-center">Função</th>
                                <th className="px-3 py-3 text-center">Nível de acesso</th>
                                <th className="px-3 py-3 text-center">Status</th>
                                <th className="px-3 py-3 text-center sm:px-4">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {group.credentials.map((user) => (
                                <tr
                                  key={user.id}
                                  className={[
                                    'text-sm text-gray-700',
                                    user.isUbtResponsible
                                      ? 'bg-amber-50/70'
                                      : 'bg-white hover:bg-gray-50/60',
                                  ].join(' ')}
                                >
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${user.avatarClassName}`}
                                      >
                                        {user.initials}
                                      </span>
                                      <span className="min-w-0">
                                        <span className="flex flex-wrap items-center gap-2">
                                          <span className="font-semibold text-gray-900">
                                            {user.name}
                                          </span>
                                          {user.isUbtResponsible ? (
                                            <span className="rounded-md border border-amber-200 bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                              Responsável UBT
                                            </span>
                                          ) : null}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-gray-500">
                                          {user.email}
                                        </span>
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3.5 text-center align-middle text-gray-700">
                                    {user.role}
                                  </td>
                                  <td className="px-3 py-3.5 align-middle">
                                    <div className="flex justify-center">
                                      <AccessLevelBadge level={user.accessLevel} />
                                    </div>
                                  </td>
                                  <td className="px-3 py-3.5 align-middle">
                                    <div className="flex justify-center">
                                      <CredentialStatusBadge status={user.status} />
                                    </div>
                                  </td>
                                  <td className="px-3 py-3.5 text-center align-middle sm:px-4">
                                    <AccessCredentialActionsPopover
                                      user={user}
                                      open={menuUserId === user.id}
                                      onToggle={() =>
                                        setMenuUserId((current) =>
                                          current === user.id ? null : user.id,
                                        )
                                      }
                                      onClose={closeMenu}
                                      onView={() => {
                                        closeMenu()
                                        openView(user)
                                      }}
                                      onEdit={() => requestEditUser(user)}
                                      onTransferUbt={() => requestTransferUbt(user)}
                                      onDeactivate={() => requestDeactivateUser(user)}
                                      onDelete={() => requestDeleteUser(user)}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="flex shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-xs text-gray-500">
            {filteredGroups.length === 0
              ? 'Nenhuma unidade na lista'
              : `${formatNumber(filteredGroups.length)} UBT${filteredGroups.length === 1 ? '' : 's'} · ${formatNumber(totalCredentials)} credencial${totalCredentials === 1 ? '' : 'is'} exibida${totalCredentials === 1 ? '' : 's'}`}
          </p>
        </footer>
      </section>

      <TransferCredentialUbtModal
        open={transferUser !== null}
        user={transferUser}
        ubtOptions={prefeituraCredentialsUbtOptions}
        onClose={() => setTransferUser(null)}
        onConfirm={confirmTransferUbt}
      />

      <Toast message={toast?.message ?? ''} visible={toast !== null} onClose={() => setToast(null)} />
    </>
  )
}
