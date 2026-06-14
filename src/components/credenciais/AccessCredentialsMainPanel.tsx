import { RotateCcw, Search } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { AccessCredentialUser } from '../../data/accessCredentialsMock'
import type { UbtCredentialsListFilters } from '../../hooks/useUbtAccessCredentialsPage'
import { Toast } from '../ui/Toast'
import { CustomSelect } from '../ui/CustomSelect'
import { AccessCredentialActionsPopover } from './AccessCredentialActionsPopover'
import { AccessLevelBadge, CredentialStatusBadge } from './accessCredentialBadges'
import type { useAdminOperatorUserDrawer } from '../../hooks/useAdminOperatorUserDrawer'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export type AccessCredentialsMainPanelProps = {
  users: AccessCredentialUser[]
  canEdit: boolean
  canDelete: boolean
  filters?: UbtCredentialsListFilters
  onFiltersChange?: (filters: UbtCredentialsListFilters) => void
  profileOptions?: Array<{ value: string; label: string }>
  userDrawer: Pick<
    ReturnType<typeof useAdminOperatorUserDrawer>,
    'openView' | 'requestPinAction'
  >
}

const statusFilterOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
]

export function AccessCredentialsMainPanel({
  users,
  canEdit,
  canDelete,
  filters,
  onFiltersChange,
  profileOptions = [{ value: '', label: 'Todas as funções' }],
  userDrawer,
}: AccessCredentialsMainPanelProps) {
  const { openView, requestPinAction } = userDrawer
  const [menuUserId, setMenuUserId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message }))
  }, [])

  const closeMenu = useCallback(() => setMenuUserId(null), [])

  const totalUsers = users.length

  function requestDeactivateUser(user: AccessCredentialUser) {
    if (user.status === 'inativo') {
      closeMenu()
      showSuccessToast('Usuário já está bloqueado.')
      return
    }
    closeMenu()
    requestPinAction('deactivate', user as Parameters<typeof requestPinAction>[1])
  }

  function requestReactivateUser(user: AccessCredentialUser) {
    closeMenu()
    requestPinAction('reactivate', user as Parameters<typeof requestPinAction>[1])
  }

  function requestEditUser(user: AccessCredentialUser) {
    closeMenu()
    requestPinAction('edit', user as Parameters<typeof requestPinAction>[1])
  }

  function requestDeleteUser(user: AccessCredentialUser) {
    closeMenu()
    requestPinAction('delete', user as Parameters<typeof requestPinAction>[1])
  }

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [users],
  )

  function canEditUser(user: AccessCredentialUser) {
    return canEdit && !user.isUbtResponsible
  }

  function canDeleteUser(user: AccessCredentialUser) {
    return canDelete && !user.isUbtResponsible
  }

  const hasActiveFilters = Boolean(
    filters && (filters.search.trim() || filters.profile || filters.status),
  )

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {filters && onFiltersChange ? (
            <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
              <label className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={filters.search}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, search: e.target.value })
                  }
                  placeholder="Buscar por nome, e-mail, função ou CPF..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>

              <CustomSelect
                value={filters.profile}
                onChange={(value) => onFiltersChange({ ...filters, profile: value })}
                options={profileOptions}
                className="w-full py-2 text-sm sm:w-52"
              />

              <CustomSelect
                value={filters.status}
                onChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    status: value as UbtCredentialsListFilters['status'],
                  })
                }
                options={statusFilterOptions}
                className="w-full py-2 text-sm sm:w-44"
              />

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() =>
                    onFiltersChange({
                      search: '',
                      profile: '',
                      status: '',
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] transition hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar filtros
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3.5 text-left sm:px-6">Usuário</th>
                  <th className="px-3 py-3.5 text-center">Função</th>
                  <th className="px-3 py-3.5 text-center">Nível de acesso</th>
                  <th className="px-3 py-3.5 text-center">Status</th>
                  <th className="px-3 py-3.5 text-center sm:px-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sortedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm text-gray-500 sm:px-6">
                      {hasActiveFilters
                        ? 'Nenhum usuário encontrado com os filtros atuais.'
                        : 'Nenhum usuário cadastrado. Clique em "Novo usuário" para começar.'}
                    </td>
                  </tr>
                ) : null}
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={[
                      'align-middle text-sm text-gray-700 hover:bg-gray-50/80',
                      user.isUbtResponsible ? 'bg-amber-50/60' : '',
                    ].join(' ')}
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt=""
                            loading="lazy"
                            className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
                          />
                        ) : (
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${user.avatarClassName}`}
                          >
                            {user.initials}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="block font-semibold text-gray-900">{user.name}</span>
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
                    <td className="px-3 py-4 text-center align-middle text-gray-700">
                      {user.role}
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex justify-center">
                        <AccessLevelBadge level={user.accessLevel} />
                      </div>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <div className="flex justify-center">
                        <CredentialStatusBadge status={user.status} />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center align-middle sm:px-6">
                      <AccessCredentialActionsPopover
                        user={user}
                        open={menuUserId === user.id}
                        onToggle={() =>
                          setMenuUserId((current) => (current === user.id ? null : user.id))
                        }
                        onClose={closeMenu}
                        onView={() => {
                          closeMenu()
                          openView(user as Parameters<typeof openView>[0])
                        }}
                        onEdit={canEditUser(user) ? () => requestEditUser(user) : undefined}
                        onDeactivate={
                          canEditUser(user) ? () => requestDeactivateUser(user) : undefined
                        }
                        onReactivate={
                          canEditUser(user) ? () => requestReactivateUser(user) : undefined
                        }
                        onDelete={canDeleteUser(user) ? () => requestDeleteUser(user) : undefined}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
            <p className="text-xs text-gray-500">
              {totalUsers === 0
                ? 'Nenhum usuário cadastrado'
                : `Mostrando 1 a ${formatNumber(totalUsers)} de ${formatNumber(totalUsers)} usuário${totalUsers === 1 ? '' : 's'}`}
            </p>
          </footer>
        </div>
      </section>

      <Toast message={toast?.message ?? ''} visible={toast !== null} onClose={() => setToast(null)} />
    </>
  )
}
