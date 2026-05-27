import { Building2, Search, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import type { AdminOperatorRow } from '../../../data/adminOperadoresMock'
import type { PrefeituraCredentialUbtOption } from '../../../data/prefeituraAccessCredentialsMock'
import { AccessCredentialActionsPopover } from '../../credenciais/AccessCredentialActionsPopover'
import { TransferCredentialUbtModal } from '../../credenciais/TransferCredentialUbtModal'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import { Toast } from '../../ui/Toast'
import type { useAdminOperatorUserDrawer } from '../../../hooks/useAdminOperatorUserDrawer'
import {
  adminPessoasPanelEmbeddedShellClass,
  adminPessoasPanelShellClass,
} from '../pessoas/adminPessoasMainPanelShell'

type AdminOperadoresMainPanelProps = {
  rows: AdminOperatorRow[]
  ubtOptions: PrefeituraCredentialUbtOption[]
  userDrawer: Pick<
    ReturnType<typeof useAdminOperatorUserDrawer>,
    'openView' | 'requestPinAction'
  >
  /** Sem borda/radius próprios — card pai inclui abas no topo. */
  embedded?: boolean
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function filterRows(
  rows: AdminOperatorRow[],
  query: string,
  scopeFilter: 'all' | 'UBT' | 'Prefeitura',
  profileFilter: string,
) {
  const normalized = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (scopeFilter !== 'all' && row.scope !== scopeFilter) return false
    if (profileFilter && row.profileLabel !== profileFilter) return false
    if (!normalized) return true
    const haystack =
      `${row.name} ${row.email} ${row.unitName} ${row.profileLabel} ${row.contractingEntity.razaoSocial} ${row.contractingEntity.municipality}`.toLowerCase()
    return haystack.includes(normalized)
  })
}

export function AdminOperadoresMainPanel({
  rows,
  ubtOptions,
  userDrawer,
  embedded = false,
}: AdminOperadoresMainPanelProps) {
  const { openView, requestPinAction } = userDrawer
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'all' | 'UBT' | 'Prefeitura'>('all')
  const [profileFilter, setProfileFilter] = useState('')
  const [menuUserId, setMenuUserId] = useState<string | null>(null)
  const [transferUser, setTransferUser] = useState<AdminOperatorRow | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const closeMenu = useCallback(() => setMenuUserId(null), [])

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast(message))
  }, [])

  const profileOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.profileLabel)))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .map((profile) => ({ value: profile, label: profile })),
    [rows],
  )

  const filteredRows = useMemo(
    () => filterRows(rows, search, scopeFilter, profileFilter),
    [rows, search, scopeFilter, profileFilter],
  )

  const kpiCards = useMemo(
    () => [
      {
        label: 'Operadores totais',
        value: formatNumber(rows.length),
        suffix: 'UBT + prefeitura',
        icon: Users,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Ativos',
        value: formatNumber(rows.filter((row) => row.status === 'ativo').length),
        suffix: 'com acesso liberado',
        icon: UserCheck,
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'UBTs vinculadas',
        value: formatNumber(new Set(rows.map((row) => row.ubtId)).size),
        suffix: 'com usuários ativos/inativos',
        icon: Building2,
        iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
        iconRing: 'ring-amber-100/80',
        topBar: 'from-amber-400 to-orange-500',
      },
      {
        label: 'Acessos hoje',
        value: formatNumber(
          rows.filter((row) => row.lastAccessLabel.toLowerCase().includes('hoje')).length,
        ),
        suffix: 'último acesso registrado',
        icon: ShieldCheck,
        iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-purple-500',
      },
    ],
    [rows],
  )

  function requestDeactivateUser(user: AdminOperatorRow) {
    if (user.status === 'inativo') {
      closeMenu()
      showSuccessToast('Usuário já está desativado.')
      return
    }
    closeMenu()
    requestPinAction('deactivate', user)
  }

  function requestEditUser(user: AdminOperatorRow) {
    closeMenu()
    requestPinAction('edit', user)
  }

  function requestDeleteUser(user: AdminOperatorRow) {
    closeMenu()
    requestPinAction('delete', user)
  }

  function requestTransferUbt(user: AdminOperatorRow) {
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
      <section
        className={embedded ? adminPessoasPanelEmbeddedShellClass : adminPessoasPanelShellClass}
      >
        <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Operadores</h2>
              <p className="mt-1 text-sm text-gray-500">
                Usuários UBT/prefeitura agregados com último acesso, unidade e perfil operacional.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-4xl lg:justify-end">
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Escopo
                <CustomSelect
                  value={scopeFilter}
                  onChange={(value) => setScopeFilter(value as 'all' | 'UBT' | 'Prefeitura')}
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'UBT', label: 'UBT' },
                    { value: 'Prefeitura', label: 'Prefeitura' },
                  ]}
                  className="min-w-[140px] text-left normal-case"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Perfil
                <CustomSelect
                  value={profileFilter}
                  onChange={setProfileFilter}
                  options={[{ value: '', label: 'Todos' }, ...profileOptions]}
                  className="min-w-[190px] text-left normal-case"
                />
              </label>
              <label className="relative min-w-0 flex-1 lg:min-w-[22rem] lg:max-w-2xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, e-mail, unidade, entidade ou perfil..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-sm placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
            </div>
          </div>
          <KpiStatCards items={kpiCards} className="mt-5" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[9%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3.5 text-left sm:px-6">Usuário</th>
                <th className="px-3 py-3.5 text-center">Escopo</th>
                <th className="px-3 py-3.5 text-center">Unidade</th>
                <th className="px-3 py-3.5 text-center">Unidade contratante</th>
                <th className="px-3 py-3.5 text-center">Perfil</th>
                <th className="px-3 py-3.5 text-center">Último acesso</th>
                <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                    Nenhum operador encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : null}
              {filteredRows.map((row) => (
                <tr key={row.id} className="align-middle text-sm text-gray-700 hover:bg-gray-50/80">
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${row.avatarClassName}`}
                      >
                        {row.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{row.name}</p>
                        <p className="truncate text-xs text-gray-500">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                      {row.scope}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    <span className="block truncate" title={row.unitName}>
                      {row.unitName}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    <span className="block truncate font-medium text-gray-900" title={row.contractingEntity.razaoSocial}>
                      {row.contractingEntity.municipality}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-gray-500" title={row.contractingEntity.razaoSocial}>
                      {row.contractingEntity.razaoSocial}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">{row.profileLabel}</td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">{row.lastAccessLabel}</td>
                  <td className="px-5 py-4 text-center align-middle sm:px-6">
                    <div className="flex justify-center">
                      <AccessCredentialActionsPopover
                        user={row}
                        open={menuUserId === row.id}
                        onToggle={() =>
                          setMenuUserId((current) => (current === row.id ? null : row.id))
                        }
                        onClose={closeMenu}
                        onView={() => {
                          closeMenu()
                          openView(row)
                        }}
                        onEdit={() => requestEditUser(row)}
                        onTransferUbt={() => requestTransferUbt(row)}
                        onDeactivate={() => requestDeactivateUser(row)}
                        onDelete={() => requestDeleteUser(row)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-xs text-gray-500">
            Mostrando {formatNumber(filteredRows.length)} de {formatNumber(rows.length)} operadores.
          </p>
        </footer>
      </section>

      <TransferCredentialUbtModal
        open={transferUser !== null}
        user={transferUser}
        ubtOptions={ubtOptions}
        onClose={() => setTransferUser(null)}
        onConfirm={confirmTransferUbt}
      />

      <Toast message={toast ?? ''} visible={toast !== null} onClose={() => setToast(null)} />
    </>
  )
}
