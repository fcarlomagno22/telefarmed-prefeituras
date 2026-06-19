import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Search,
  Stethoscope,
  UserCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { KpiStatCards } from '../ui/KpiStatCards'
import {
  type NetworkUser,
  type networkUsersSummary,
} from '../../data/networkUsersMock'
import {
  maskCpfForDisplay,
  maskPhoneForDisplay,
} from '../../utils/lgpdDisplay'
import type { useNetworkUserDrawer } from '../../hooks/useNetworkUserDrawer'
import {
  countActiveNetworkUserFilters,
  defaultNetworkUsersFilters,
  type NetworkUsersFilters,
} from '../../utils/networkUsersFilters'
import { NetworkUsersFiltersMenu } from './NetworkUsersFiltersMenu'

type NetworkUsersNetworkUserDrawer = Pick<
  ReturnType<typeof useNetworkUserDrawer>,
  | 'sensitiveDataUnlocked'
  | 'lockSensitiveData'
  | 'openUnlockModal'
  | 'openUserWithPacienteDetail'
  | 'drawerLayer'
>

type NetworkUsersMainPanelProps = {
  users: NetworkUser[]
  summary: typeof networkUsersSummary | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  search: string
  onSearchChange: (value: string) => void
  filters: NetworkUsersFilters
  onFiltersChange: (filters: NetworkUsersFilters) => void
  availableNeighborhoods: string[]
  availableRegistrationUnits?: string[]
  onPageChange: (page: number) => void
  networkUserDrawer: NetworkUsersNetworkUserDrawer
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function buildKpiCards(summary: typeof networkUsersSummary) {
  return [
    {
      label: 'Total de usuários',
      value: formatNumber(summary.totalUsers),
      suffix: 'pacientes',
      icon: UsersRound,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Usuários novos',
      value: formatNumber(summary.newUsers),
      suffix: 'este mês',
      icon: UserPlus,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-[var(--brand-primary-border)]/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Total de atendimentos',
      value: formatNumber(summary.totalAppointments),
      suffix: 'consultas',
      icon: Stethoscope,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
    {
      label: 'Atendidos este mês',
      value: formatNumber(summary.attendedThisMonth),
      suffix: 'pacientes',
      icon: UserCheck,
      iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
      iconRing: 'ring-emerald-100/80',
      topBar: 'from-emerald-400 to-green-500',
    },
  ] as const
}

export function NetworkUsersMainPanel({
  users,
  summary,
  pagination,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  availableNeighborhoods,
  availableRegistrationUnits = [],
  onPageChange,
  networkUserDrawer,
}: NetworkUsersMainPanelProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const {
    sensitiveDataUnlocked,
    lockSensitiveData,
    openUnlockModal,
    openUserWithPacienteDetail,
    drawerLayer,
  } = networkUserDrawer

  const kpiCards = summary ? buildKpiCards(summary) : []
  const activeFilterCount = useMemo(() => countActiveNetworkUserFilters(filters), [filters])

  const { page, pageSize, total: totalFiltered, totalPages } = pagination
  const showingFrom = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, totalFiltered)

  function displayPhone(phone: string) {
    return sensitiveDataUnlocked ? phone : maskPhoneForDisplay(phone)
  }

  function displayCpf(cpf: string) {
    return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
  }

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Todos os usuários</h2>
              <p className="mt-1 text-sm text-gray-500">
                Visualize e gerencie os pacientes que já passaram pela rede de atendimento.
              </p>
            </div>

            <div className="relative flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar por nome, CPF ou telefone..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
              <button
                id="network-users-filter-trigger"
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-haspopup="dialog"
                className={[
                  'relative inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition',
                  filtersOpen || activeFilterCount > 0
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                ].join(' ')}
              >
                <Filter className="h-4 w-4" strokeWidth={2} />
                Filtros
                {activeFilterCount > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              <NetworkUsersFiltersMenu
                open={filtersOpen}
                filters={filters}
                neighborhoods={availableNeighborhoods}
                registrationUnits={availableRegistrationUnits}
                resultCount={users.length}
                onClose={() => setFiltersOpen(false)}
                onChange={onFiltersChange}
                onClear={() => onFiltersChange(defaultNetworkUsersFilters)}
              />
            </div>
          </div>

          {summary ? <KpiStatCards items={[...kpiCards]} className="mt-5" /> : null}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-2 sm:px-6">
          {!sensitiveDataUnlocked ? (
            <>
              <span className="mr-auto text-xs text-gray-500">
                CPF e telefone mascarados conforme a LGPD.
              </span>
              <button
                type="button"
                onClick={() => openUnlockModal()}
                className="text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
              >
                Ver dados
              </button>
            </>
          ) : (
            <>
              <span className="mr-auto text-xs font-medium text-emerald-600">
                Dados pessoais visíveis
              </span>
              <button
                type="button"
                onClick={() => lockSensitiveData()}
                className="text-sm font-semibold text-gray-600 underline-offset-2 transition hover:text-gray-900 hover:underline"
              >
                Ocultar dados
              </button>
            </>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[8%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3.5 text-left sm:px-6">Paciente</th>
                <th className="px-3 py-3.5 text-center">Bairro</th>
                <th className="px-3 py-3.5 text-center">CPF</th>
                <th className="px-3 py-3.5 text-center">Data de nasc.</th>
                <th className="px-3 py-3.5 text-center">Último atendimento</th>
                <th className="px-3 py-3.5 text-center">Total de atendimentos</th>
                <th className="px-3 py-3.5 text-center sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                    Nenhum paciente encontrado com os filtros e a busca atuais.
                  </td>
                </tr>
              ) : null}
              {users.map((user) => (
                <tr key={user.id} className="align-middle text-sm text-gray-700 hover:bg-gray-50/80">
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
                        <span className="block font-semibold text-gray-900">{user.name}</span>
                        <span
                          className={`mt-0.5 block text-xs font-medium ${
                            sensitiveDataUnlocked ? 'text-sky-600' : 'text-gray-500'
                          }`}
                        >
                          {displayPhone(user.phone)}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">{user.bairro}</td>
                  <td className="px-3 py-4 text-center align-middle tabular-nums">
                    {displayCpf(user.cpf)}
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <span className="block text-gray-700">{user.birthDate}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{user.age} anos</span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <span className="block text-gray-700">{user.lastAppointmentDate}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {user.lastAppointmentRelative}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    {user.totalAppointments} atendimentos
                  </td>
                  <td className="px-3 py-4 text-center align-middle sm:px-6">
                    <button
                      type="button"
                      onClick={() => openUserWithPacienteDetail(user.id, user)}
                      className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                      aria-label={`Ver perfil de ${user.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-gray-500">
            {totalFiltered === 0
              ? 'Nenhum usuário na lista filtrada'
              : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} usuário${totalFiltered === 1 ? '' : 's'}`}
            {activeFilterCount > 0 || search.trim()
              ? summary
                ? ` (de ${formatNumber(summary.totalUsers)} na rede)`
                : ''
              : ''}
          </p>
          <nav className="flex items-center gap-1" aria-label="Paginação">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </footer>
      </section>

      {drawerLayer}
    </>
  )
}
