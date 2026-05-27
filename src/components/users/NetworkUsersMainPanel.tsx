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
import { useCallback, useMemo, useState } from 'react'
import { KpiStatCards } from '../ui/KpiStatCards'
import { Toast } from '../ui/Toast'
import {
  networkUsers,
  networkUsersPagination,
  networkUsersSummary,
  type NetworkUser,
} from '../../data/networkUsersMock'
import {
  maskCpfForDisplay,
  maskPhoneForDisplay,
  onlyDigits,
} from '../../utils/lgpdDisplay'
import {
  buildEditChangeSummary,
  createActivityId,
  type ChangeLogEntry,
  type ContactChannel,
  type PatientContactLogEntry,
  type TeamContactRecord,
} from '../../data/networkUserActivity'
import {
  createAnnotationId,
  type UserAnnotation,
  type UserProfileEdits,
} from '../../data/networkUserLocalData'
import type { PatientContact } from '../../data/unitDashboardMock'
import { getNetworkUserProfile } from '../../data/networkUserProfiles'
import { getLoggedOperatorName } from '../../utils/sessionUser'
import {
  applyNetworkUsersFilters,
  countActiveNetworkUserFilters,
  defaultNetworkUsersFilters,
  getAvailableNeighborhoods,
  getAvailableRegistrationUnits,
  type NetworkUsersFilters,
} from '../../utils/networkUsersFilters'
import { EditUnlockModal } from './EditUnlockModal'
import { LgpdUnlockModal } from './LgpdUnlockModal'
import { NetworkUsersFiltersMenu } from './NetworkUsersFiltersMenu'
import { UserDetailDrawer } from './UserDetailDrawer'

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

const kpiCards = [
  {
    label: 'Total de usuários',
    value: formatNumber(networkUsersSummary.totalUsers),
    suffix: 'pacientes',
    icon: UsersRound,
    iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
    iconRing: 'ring-blue-100/80',
    topBar: 'from-sky-400 to-blue-500',
  },
  {
    label: 'Usuários novos',
    value: formatNumber(networkUsersSummary.newUsers),
    suffix: 'este mês',
    icon: UserPlus,
    iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
    iconRing: 'ring-orange-100/80',
    topBar: 'from-orange-400 to-amber-500',
  },
  {
    label: 'Total de atendimentos',
    value: formatNumber(networkUsersSummary.totalAppointments),
    suffix: 'consultas',
    icon: Stethoscope,
    iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
    iconRing: 'ring-violet-100/80',
    topBar: 'from-violet-400 to-purple-500',
  },
  {
    label: 'Atendidos este mês',
    value: formatNumber(networkUsersSummary.attendedThisMonth),
    suffix: 'pacientes',
    icon: UserCheck,
    iconGradient: 'from-emerald-500 via-green-500 to-teal-600',
    iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
    iconRing: 'ring-emerald-100/80',
    topBar: 'from-emerald-400 to-green-500',
  },
] as const

function filterUsers(query: string, users: NetworkUser[]) {
  const trimmed = query.trim()
  if (!trimmed) return users

  const normalized = trimmed.toLowerCase()
  const queryDigits = onlyDigits(trimmed)
  const isFullCpfSearch = queryDigits.length === 11

  return users.filter((user) => {
    if (isFullCpfSearch) {
      return onlyDigits(user.cpf) === queryDigits
    }

    const haystack =
      `${user.name} ${user.bairro} ${user.cpf} ${user.phone}`.toLowerCase()
    if (haystack.includes(normalized)) return true

    if (queryDigits.length > 0) {
      const digitHaystack = `${onlyDigits(user.cpf)} ${onlyDigits(user.phone)}`
      return digitHaystack.includes(queryDigits)
    }

    return false
  })
}

export function NetworkUsersMainPanel() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<NetworkUsersFilters>(defaultNetworkUsersFilters)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [drawerUser, setDrawerUser] = useState<NetworkUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [userEditsMap, setUserEditsMap] = useState<Record<string, UserProfileEdits>>({})
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, UserAnnotation[]>>({})
  const [lastReviewedMap, setLastReviewedMap] = useState<Record<string, string>>({})
  const [changeLogsMap, setChangeLogsMap] = useState<Record<string, ChangeLogEntry[]>>({})
  const [contactLogsMap, setContactLogsMap] = useState<Record<string, PatientContactLogEntry[]>>({
    '1': [
      {
        id: 'contact-seed-1',
        at: new Date(Date.now() - 86400000 * 3).toISOString(),
        channel: 'whatsapp',
        phone: '(11) 98604-5105',
        note: 'Confirmação de retorno agendado',
        authorLabel: getLoggedOperatorName(),
      },
    ],
  })

  const loggedOperatorName = getLoggedOperatorName()

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message }))
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  function openUserDrawer(user: NetworkUser) {
    setDrawerClosing(false)
    setDrawerUser(user)
    setDrawerOpen(true)
    seedAnnotationsIfNeeded(user)
  }

  function closeUserDrawer() {
    setDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerUser(null)
      setDrawerClosing(false)
      setEditSessionKey(0)
    }
  }

  const filterContext = useMemo(
    () => ({
      userEditsMap,
      annotationsMap,
      lastReviewedMap,
      contactLogsMap,
      changeLogsMap,
    }),
    [userEditsMap, annotationsMap, lastReviewedMap, contactLogsMap, changeLogsMap],
  )

  const searchedUsers = useMemo(() => filterUsers(search, networkUsers), [search])

  const filteredUsers = useMemo(
    () => applyNetworkUsersFilters(searchedUsers, filters, filterContext),
    [searchedUsers, filters, filterContext],
  )

  const availableNeighborhoods = useMemo(
    () => getAvailableNeighborhoods(networkUsers),
    [],
  )

  const availableRegistrationUnits = useMemo(
    () => getAvailableRegistrationUnits(networkUsers),
    [],
  )

  const activeFilterCount = useMemo(() => countActiveNetworkUserFilters(filters), [filters])

  const { page, pageSize } = networkUsersPagination
  const totalFiltered = filteredUsers.length
  const showingFrom = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, totalFiltered)

  function phoneForUser(user: NetworkUser) {
    return userEditsMap[user.id]?.phone ?? user.phone
  }

  function bairroForUser(user: NetworkUser) {
    return userEditsMap[user.id]?.neighborhood ?? user.bairro
  }

  function displayPhone(phone: string) {
    return sensitiveDataUnlocked ? phone : maskPhoneForDisplay(phone)
  }

  function displayCpf(cpf: string) {
    return sensitiveDataUnlocked ? cpf : maskCpfForDisplay(cpf)
  }

  function appendChangeLog(userId: string, summary: string, details?: string) {
    const entry: ChangeLogEntry = {
      id: createActivityId('chg'),
      at: new Date().toISOString(),
      authorLabel: loggedOperatorName,
      summary,
      details,
    }
    setChangeLogsMap((prev) => ({
      ...prev,
      [userId]: [entry, ...(prev[userId] ?? [])],
    }))
  }

  function handleSaveUserEdits(edits: UserProfileEdits, changedFields: string[]) {
    if (!drawerUser) return
    setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: edits }))
    setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
    appendChangeLog(drawerUser.id, buildEditChangeSummary(changedFields))
    showSuccessToast('Alterações salvas com sucesso.')
  }

  function handleSaveUserContacts(contacts: PatientContact[]) {
    if (!drawerUser) return
    const previous = userEditsMap[drawerUser.id]
    const profile = getNetworkUserProfile(drawerUser)
    const merged: UserProfileEdits = {
      phone: previous?.phone ?? drawerUser.phone,
      email: previous?.email ?? profile.email,
      zipCode: previous?.zipCode ?? profile.zipCode,
      street: previous?.street ?? profile.street,
      number: previous?.number ?? profile.number,
      complement: previous?.complement ?? profile.complement,
      neighborhood: previous?.neighborhood ?? profile.neighborhood,
      city: previous?.city ?? profile.city,
      state: previous?.state ?? profile.state,
      guardianName: previous?.guardianName ?? profile.guardianName,
      guardianCpf: previous?.guardianCpf ?? profile.guardianCpf,
      contacts,
    }
    setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: merged }))
    appendChangeLog(drawerUser.id, 'Contatos de emergência atualizados')
    showSuccessToast('Alterações salvas com sucesso.')
  }

  function lastTeamContactForUser(userId: string): TeamContactRecord | null {
    const logs = contactLogsMap[userId] ?? []
    if (!logs.length) return null
    const latest = logs[0]
    return {
      at: latest.at,
      channel: latest.channel,
      note: latest.note,
      authorLabel: latest.authorLabel,
    }
  }

  function handleRegisterContact(channel: ContactChannel, phone: string, note: string) {
    if (!drawerUser) return
    const entry: PatientContactLogEntry = {
      id: createActivityId('contact'),
      at: new Date().toISOString(),
      channel,
      phone,
      note: note.trim(),
      authorLabel: loggedOperatorName,
    }
    setContactLogsMap((prev) => ({
      ...prev,
      [drawerUser.id]: [entry, ...(prev[drawerUser.id] ?? [])],
    }))
    showSuccessToast('Contato registrado com sucesso.')
  }

  function handleAddAnnotation(text: string) {
    if (!drawerUser) return
    const annotation: UserAnnotation = {
      id: createAnnotationId(),
      text,
      createdAt: new Date().toISOString(),
      authorLabel: loggedOperatorName,
    }
    setAnnotationsMap((prev) => ({
      ...prev,
      [drawerUser.id]: [annotation, ...(prev[drawerUser.id] ?? [])],
    }))
    showSuccessToast('Anotação criada com sucesso.')
  }

  function seedAnnotationsIfNeeded(user: NetworkUser) {
    const profile = getNetworkUserProfile(user)
    if (!profile.notes) return
    setAnnotationsMap((prev) => {
      if (prev[user.id]?.length) return prev
      return {
        ...prev,
        [user.id]: [
          {
            id: createAnnotationId(),
            text: profile.notes,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            authorLabel: 'Cadastro inicial',
          },
        ],
      }
    })
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
                  onChange={(e) => setSearch(e.target.value)}
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
                resultCount={filteredUsers.length}
                onClose={() => setFiltersOpen(false)}
                onChange={setFilters}
                onClear={() => setFilters(defaultNetworkUsersFilters)}
              />
            </div>
          </div>

          <KpiStatCards items={[...kpiCards]} className="mt-5" />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-2 sm:px-6">
          {!sensitiveDataUnlocked ? (
            <>
              <span className="mr-auto text-xs text-gray-500">
                CPF e telefone mascarados conforme a LGPD.
              </span>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(true)}
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
                onClick={() => setSensitiveDataUnlocked(false)}
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
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                    Nenhum paciente encontrado com os filtros e a busca atuais.
                  </td>
                </tr>
              ) : null}
              {filteredUsers.map((user) => (
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
                          {displayPhone(phoneForUser(user))}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {bairroForUser(user)}
                  </td>
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
                      onClick={() => openUserDrawer(user)}
                      className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                      aria-label={`Ver ${user.name}`}
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
              ? ` (de ${formatNumber(networkUsersSummary.totalUsers)} na rede)`
              : ''}
          </p>
          <nav className="flex items-center gap-1" aria-label="Paginação">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[1, 2, 3].map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                  pageNumber === page
                    ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <span className="px-1 text-sm text-gray-400">…</span>
            <button
              type="button"
              className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {networkUsersPagination.totalPages}
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </footer>
      </section>

      <LgpdUnlockModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onSuccess={() => {
          setSensitiveDataUnlocked(true)
          showSuccessToast('Dados liberados com sucesso.')
        }}
      />

      <EditUnlockModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setSensitiveDataUnlocked(true)
          setEditSessionKey((key) => key + 1)
          showSuccessToast('Edição liberada com sucesso.')
        }}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        onClose={dismissToast}
      />

      <UserDetailDrawer
        user={drawerUser}
        open={drawerOpen}
        closing={drawerClosing}
        sensitiveDataUnlocked={sensitiveDataUnlocked}
        editSessionKey={editSessionKey}
        userEdits={drawerUser ? userEditsMap[drawerUser.id] ?? null : null}
        annotations={drawerUser ? annotationsMap[drawerUser.id] ?? [] : []}
        onClose={closeUserDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        onRequestUnlock={() => setUnlockModalOpen(true)}
        onRequestEditUnlock={() => setEditModalOpen(true)}
        lastReviewedAt={drawerUser ? lastReviewedMap[drawerUser.id] ?? null : null}
        contactLogs={drawerUser ? contactLogsMap[drawerUser.id] ?? [] : []}
        lastTeamContact={drawerUser ? lastTeamContactForUser(drawerUser.id) : null}
        onSaveEdits={handleSaveUserEdits}
        onSaveContacts={handleSaveUserContacts}
        onRegisterContact={handleRegisterContact}
        onAddAnnotation={handleAddAnnotation}
      />
    </>
  )
}

