import { MoreVertical, Pencil, Search, ShieldCheck, UserCheck, Users } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PrefeituraCredentialUser } from '../../../config/prefeituraCredenciaisConfig'
import type { useAdminPrefeituraCredentialDrawer } from '../../../hooks/useAdminPrefeituraCredentialDrawer'
import { adminUserCan } from '../../../config/adminPageAccess'
import { useOptionalAdminAuth } from '../../../contexts/AdminAuthContext'
import {
  AccessLevelBadge,
  CredentialStatusBadge,
} from '../../credenciais/accessCredentialBadges'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import {
  adminPessoasPanelEmbeddedShellClass,
  adminPessoasPanelShellClass,
} from '../pessoas/adminPessoasMainPanelShell'

type AdminPrefeituraCredentialMainPanelProps = {
  rows: PrefeituraCredentialUser[]
  userDrawer: Pick<
    ReturnType<typeof useAdminPrefeituraCredentialDrawer>,
    'openView' | 'requestPinAction'
  >
  embedded?: boolean
  hideEntityFilter?: boolean
  pageAccessOverride?: {
    canEdit: boolean
    canDelete: boolean
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function AdminPrefeituraCredentialMainPanel({
  rows,
  userDrawer,
  embedded = false,
  hideEntityFilter = false,
  pageAccessOverride,
}: AdminPrefeituraCredentialMainPanelProps) {
  const adminAuth = useOptionalAdminAuth()
  const defaultPageAccess = useMemo(
    () => ({
      canView: adminUserCan(adminAuth?.user, 'credenciais', 'visualizar'),
      canInsert: adminUserCan(adminAuth?.user, 'credenciais', 'inserir'),
      canEdit: adminUserCan(adminAuth?.user, 'credenciais', 'editar'),
      canDelete: adminUserCan(adminAuth?.user, 'credenciais', 'excluir'),
    }),
    [adminAuth?.user],
  )
  const pageAccess = pageAccessOverride ?? defaultPageAccess
  const { openView, requestPinAction } = userDrawer
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [menuUserId, setMenuUserId] = useState<string | null>(null)
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const entityOptions = useMemo(() => {
    const map = new Map<string, string>()
    rows.forEach((row) => {
      map.set(row.contractingEntityId, row.contractingEntity.razaoSocial)
    })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [rows])

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    return rows.filter((row) => {
      if (entityFilter && row.contractingEntityId !== entityFilter) return false
      if (!normalized) return true
      const haystack =
        `${row.name} ${row.email} ${row.role} ${row.cpf} ${row.contractingEntity.razaoSocial} ${row.contractingEntity.municipality}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [entityFilter, rows, search])

  const kpiCards = useMemo(
    () => [
      {
        label: 'Gestores da entidade',
        value: formatNumber(rows.length),
        suffix: 'acessos ao portal',
        icon: Users,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Ativos',
        value: formatNumber(rows.filter((row) => row.status === 'ativo').length),
        suffix: 'com login liberado',
        icon: UserCheck,
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Administradores',
        value: formatNumber(rows.filter((row) => row.accessLevel === 'administrador').length),
        suffix: 'acesso total ao portal',
        icon: ShieldCheck,
        iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-purple-500',
      },
      {
        label: 'Acessos hoje',
        value: formatNumber(
          rows.filter((row) => row.lastAccessLabel.toLowerCase().includes('hoje')).length,
        ),
        suffix: 'último login registrado',
        icon: ShieldCheck,
        iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
        iconRing: 'ring-amber-100/80',
        topBar: 'from-amber-400 to-orange-500',
      },
    ],
    [rows],
  )

  const closeMenu = useCallback(() => {
    setMenuUserId(null)
    setMenuStyle(null)
    triggerRef.current = null
  }, [])

  const openMenu = useCallback((userId: string, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect()
    triggerRef.current = button
    setMenuUserId(userId)
    setMenuStyle({
      top: rect.bottom + 6,
      left: Math.max(12, rect.right - 200),
    })
  }, [])

  const menuUser = menuUserId ? rows.find((row) => row.id === menuUserId) : null

  return (
    <>
      <section
        className={embedded ? adminPessoasPanelEmbeddedShellClass : adminPessoasPanelShellClass}
      >
        <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Gestores da entidade</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-3xl lg:justify-end">
              {!hideEntityFilter ? (
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Entidade
                  <CustomSelect
                    value={entityFilter}
                    onChange={setEntityFilter}
                    options={[{ value: '', label: 'Todas' }, ...entityOptions]}
                    className="min-w-[160px] text-left normal-case"
                  />
                </label>
              ) : null}
              <label className="relative min-w-0 flex-1 lg:min-w-[20rem]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, e-mail, CPF ou localidade..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
            </div>
          </div>
          <KpiStatCards items={kpiCards} className="mt-5" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3.5 sm:px-6">Gestor</th>
                <th className="px-3 py-3.5 text-center">Localidade</th>
                <th className="px-3 py-3.5 text-center">Função</th>
                <th className="px-3 py-3.5 text-center">Nível</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-3 py-3.5 text-center">Último acesso</th>
                <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                    Nenhum gestor encontrado.
                  </td>
                </tr>
              ) : null}
              {filteredRows.map((row) => (
                <tr key={row.id} className="text-sm text-gray-700 hover:bg-gray-50/80">
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${row.avatarClassName}`}
                      >
                        {row.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{row.name}</p>
                        <p className="truncate text-xs text-gray-500">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center text-gray-700">
                    {row.contractingEntity.municipality}/{row.contractingEntity.uf}
                  </td>
                  <td className="px-3 py-4 text-center text-gray-700">{row.role}</td>
                  <td className="px-3 py-4 text-center">
                    <AccessLevelBadge level={row.accessLevel} />
                  </td>
                  <td className="px-3 py-4 text-center">
                    <CredentialStatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-4 text-center text-gray-700">{row.lastAccessLabel}</td>
                  <td className="px-5 py-4 text-center sm:px-6">
                    <button
                      type="button"
                      onClick={(event) =>
                        menuUserId === row.id
                          ? closeMenu()
                          : openMenu(row.id, event.currentTarget)
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                      aria-label="Ações"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 border-t border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-xs text-gray-500">
            Mostrando {formatNumber(filteredRows.length)} de {formatNumber(rows.length)} gestores.
          </p>
        </footer>
      </section>

      {menuUser && menuStyle
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[9990]"
                aria-label="Fechar menu"
                onClick={closeMenu}
              />
              <div
                className="fixed z-[9991] min-w-[12rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
                style={{ top: menuStyle.top, left: menuStyle.left }}
              >
                <button
                  type="button"
                  className="flex w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    closeMenu()
                    openView(menuUser)
                  }}
                >
                  Visualizar
                </button>
                {pageAccess.canEdit ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      closeMenu()
                      requestPinAction('edit', menuUser)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                ) : null}
                {pageAccess.canEdit && menuUser.status === 'inativo' ? (
                  <button
                    type="button"
                    className="flex w-full px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                    onClick={() => {
                      closeMenu()
                      requestPinAction('reactivate', menuUser)
                    }}
                  >
                    Desbloquear
                  </button>
                ) : null}
                {pageAccess.canEdit && menuUser.status === 'ativo' ? (
                  <button
                    type="button"
                    className="flex w-full px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      closeMenu()
                      requestPinAction('deactivate', menuUser)
                    }}
                  >
                    Bloquear
                  </button>
                ) : null}
                {pageAccess.canDelete ? (
                  <button
                    type="button"
                    className="flex w-full px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                    onClick={() => {
                      closeMenu()
                      requestPinAction('delete', menuUser)
                    }}
                  >
                    Excluir
                  </button>
                ) : null}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}
