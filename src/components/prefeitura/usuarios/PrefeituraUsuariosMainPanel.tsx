import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
  ShieldAlert,
  UserCheck,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { usePrefeituraAuth } from '../../../contexts/PrefeituraAuthContext'
import {
  createPrefeituraPacienteAnotacao,
  createPrefeituraPacienteRegistroContato,
  fetchPrefeituraPacienteAnotacoes,
  fetchPrefeituraPacienteContatosRegistrados,
} from '../../../lib/services/prefeitura/pacientes'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { Toast, type ToastVariant } from '../../ui/Toast'
import {
  buildEditChangeSummary,
  createActivityId,
  type ChangeLogEntry,
  type ContactChannel,
  type PatientContactLogEntry,
  type TeamContactRecord,
} from '../../../data/networkUserActivity'
import {
  type UserAnnotation,
  type UserProfileEdits,
} from '../../../data/networkUserLocalData'
import type { NetworkUser } from '../../../data/networkUsersMock'
import type { NetworkUserFullProfile } from '../../../data/networkUserProfiles'
import { getNetworkUserProfile } from '../../../data/networkUserProfiles'
import type { PatientContact } from '../../../types/attendance'
import type { PrefeituraMunicipalPatient } from '../../../data/prefeituraMunicipalPatientsMock'
import type { PrefeituraMunicipalPatientDetail } from '../../../types/prefeituraPacientes'
import {
  buildPrefeituraPatientExtraContext,
  mapPrefeituraPacienteDetailToProfile,
} from '../../../utils/prefeituraPacientesDetail'
import { userEditsToUpdatePayload } from '../../../utils/adminPacientesEdits'
import type { UpdatePacientePayload } from '../../../lib/services/admin/pacientes'
import type { PrefeituraPacientesSummaryResponse } from '../../../lib/mockServices/prefeitura/pacientes'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'
import { getLoggedOperatorName } from '../../../utils/sessionUser'
import { EditUnlockModal } from '../../users/EditUnlockModal'
import { LgpdUnlockModal } from '../../users/LgpdUnlockModal'
import { UserDetailDrawer } from '../../users/UserDetailDrawer'
import {
  countActivePrefeituraMunicipalPatientFilters,
  defaultPrefeituraMunicipalPatientsFilters,
  type PrefeituraMunicipalPatientsFilters,
} from '../../../utils/prefeituraMunicipalPatientsFilters'
import { PrefeituraUsuariosFiltersMenu } from './PrefeituraUsuariosFiltersMenu'
import { usePrefeituraAuthorizationPinVerify } from '../../../hooks/usePrefeituraAuthorizationPinVerify'
import { NetworkUserAvatar } from '../../ui/NetworkUserAvatar'

const prefeituraLgpdUnlockDescription =
  'Telefone, CPF e endereço ficam ocultos na lista. Informe seu PIN de autorização de gestor (6 dígitos) para visualizar os dados completos.'

const prefeituraEditUnlockDescription =
  'Para alterar telefone, e-mail, endereço e demais dados do paciente, informe seu PIN de autorização de gestor (6 dígitos). As alterações ficam registradas na auditoria municipal.'

type PrefeituraUsuariosMainPanelProps = {
  patients: PrefeituraMunicipalPatient[]
  summary: PrefeituraPacientesSummaryResponse | null
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  search: string
  onSearchChange: (value: string) => void
  filters: PrefeituraMunicipalPatientsFilters
  onFiltersChange: (filters: PrefeituraMunicipalPatientsFilters) => void
  availableNeighborhoods: string[]
  availableFirstUnits: string[]
  onPageChange: (page: number) => void
  onPatientUpsert?: (patient: PrefeituraMunicipalPatient) => void
  onLoadPatientDetail?: (id: string) => Promise<PrefeituraMunicipalPatientDetail | null>
  onSavePatientEdits?: (
    id: string,
    payload: UpdatePacientePayload,
  ) => Promise<PrefeituraMunicipalPatientDetail>
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function buildKpiCards(summary: PrefeituraPacientesSummaryResponse | null) {
  return [
    {
      label: 'Base municipal única',
      value: formatNumber(summary?.totalPatients ?? 0),
      suffix: 'pacientes · 1 CPF',
      icon: UsersRound,
      iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
      iconRing: 'ring-blue-100/80',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Novos cadastros',
      value: formatNumber(summary?.newThisMonth ?? 0),
      suffix: 'este mês',
      icon: UserPlus,
      iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
      iconRing: 'ring-orange-100/80',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Cadastros incompletos',
      value: formatNumber(summary?.incompleteRecords ?? 0),
      suffix: 'pendências',
      icon: ShieldAlert,
      iconGradient: 'from-rose-500 via-red-500 to-orange-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(244,63,94,0.35)]',
      iconRing: 'ring-rose-100/80',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Campanha de retorno',
      value: formatNumber(summary?.inactiveSixMonths ?? 0),
      suffix: 'sem consulta 6+ meses',
      icon: UserCheck,
      iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
      iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
      iconRing: 'ring-violet-100/80',
      topBar: 'from-violet-400 to-purple-500',
    },
  ] as const
}

export function PrefeituraUsuariosMainPanel({
  patients,
  summary,
  pagination,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  availableNeighborhoods,
  availableFirstUnits,
  onPageChange,
  onPatientUpsert,
  onLoadPatientDetail,
  onSavePatientEdits,
}: PrefeituraUsuariosMainPanelProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const [drawerUser, setDrawerUser] = useState<NetworkUser | null>(null)
  const [drawerDetail, setDrawerDetail] = useState<PrefeituraMunicipalPatientDetail | null>(null)
  const [drawerProfileOverride, setDrawerProfileOverride] = useState<NetworkUserFullProfile | null>(
    null,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [drawerSaving, setDrawerSaving] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [userEditsMap, setUserEditsMap] = useState<Record<string, UserProfileEdits>>({})
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, UserAnnotation[]>>({})
  const [lastReviewedMap, setLastReviewedMap] = useState<Record<string, string>>({})
  const [changeLogsMap, setChangeLogsMap] = useState<Record<string, ChangeLogEntry[]>>({})
  const [contactLogsMap, setContactLogsMap] = useState<Record<string, PatientContactLogEntry[]>>({})

  const { getAccessToken } = usePrefeituraAuth()

  const loggedOperatorName = getLoggedOperatorName()

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const showSuccessToast = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast],
  )

  const showErrorToast = useCallback((message: string) => showToast(message, 'error'), [showToast])

  const verifyAuthorizationPin = usePrefeituraAuthorizationPinVerify({
    onPinNotConfigured: (message) => {
      setUnlockModalOpen(false)
      setEditModalOpen(false)
      showErrorToast(message)
    },
  })

  const dismissToast = useCallback(() => setToast(null), [])

  const loadPacienteActivity = useCallback(
    async (pacienteId: string, userId: string) => {
      const token = getAccessToken()
      if (!token) return

      try {
        const [annotations, contactLogs] = await Promise.all([
          fetchPrefeituraPacienteAnotacoes(token, pacienteId),
          fetchPrefeituraPacienteContatosRegistrados(token, pacienteId),
        ])

        setAnnotationsMap((prev) => ({
          ...prev,
          [userId]: annotations.map((item) => ({
            id: item.id,
            text: item.text,
            createdAt: item.createdAt,
            authorLabel: item.authorLabel,
          })),
        }))

        setContactLogsMap((prev) => ({
          ...prev,
          [userId]: contactLogs.map((item) => ({
            id: item.id,
            at: item.at,
            channel: item.channel,
            phone: item.phone,
            note: item.note,
            authorLabel: item.authorLabel,
          })),
        }))
      } catch {
        showErrorToast('Não foi possível carregar anotações e contatos do paciente.')
      }
    },
    [getAccessToken, showErrorToast],
  )

  function openPatientDrawer(patient: PrefeituraMunicipalPatient) {
    setDrawerClosing(false)
    setDrawerUser(patient)
    setDrawerDetail(null)
    setDrawerProfileOverride(null)
    setDrawerOpen(true)
    void loadPacienteActivity(patient.id, patient.id)

    if (!onLoadPatientDetail) return

    void (async () => {
      try {
        const detail = await onLoadPatientDetail(patient.id)
        if (!detail) return
        setDrawerUser(detail)
        setDrawerDetail(detail)
        setDrawerProfileOverride(mapPrefeituraPacienteDetailToProfile(detail))
        await loadPacienteActivity(detail.id, detail.id)
      } catch {
        // Mantém dados da listagem se o detalhe falhar.
      }
    })()
  }

  function closePatientDrawer() {
    setDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    if (drawerClosing) {
      setDrawerOpen(false)
      setDrawerUser(null)
      setDrawerDetail(null)
      setDrawerProfileOverride(null)
      setDrawerClosing(false)
      setEditSessionKey(0)
    }
  }

  function bairroForPatient(patient: PrefeituraMunicipalPatient) {
    return userEditsMap[patient.id]?.neighborhood ?? patient.bairro
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

  function resolveDetailForEdits() {
    if (drawerDetail) return drawerDetail
    if (!drawerUser) return null
    return {
      birthDate: drawerUser.birthDate,
      profile: drawerProfileOverride
        ? { genderLabel: drawerProfileOverride.genderLabel }
        : undefined,
    }
  }

  async function persistDrawerEdits(edits: UserProfileEdits, changedFields: string[]) {
    if (!drawerUser || !onSavePatientEdits) {
      throw new Error('Não foi possível salvar as alterações.')
    }

    const detailSource = resolveDetailForEdits()
    if (!detailSource) {
      throw new Error('Aguarde o carregamento do paciente e tente novamente.')
    }

    setDrawerSaving(true)
    try {
      const payload = userEditsToUpdatePayload(detailSource, edits)
      const updated = await onSavePatientEdits(drawerUser.id, payload)
      setDrawerUser(updated)
      setDrawerDetail(updated)
      setDrawerProfileOverride(mapPrefeituraPacienteDetailToProfile(updated))
      setUserEditsMap((prev) => {
        const next = { ...prev }
        delete next[drawerUser.id]
        return next
      })
      setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
      appendChangeLog(drawerUser.id, buildEditChangeSummary(changedFields))
      onPatientUpsert?.(updated)
      showSuccessToast('Alterações salvas com sucesso.')
    } finally {
      setDrawerSaving(false)
    }
  }

  function handleSaveUserEdits(edits: UserProfileEdits, changedFields: string[]) {
    if (!drawerUser) return
    void persistDrawerEdits(edits, changedFields).catch(() => {
      showErrorToast('Não foi possível salvar as alterações.')
    })
  }

  function handleSaveUserContacts(contacts: PatientContact[]) {
    if (!drawerUser) return
    const previous = userEditsMap[drawerUser.id]
    const profile = drawerProfileOverride ?? getNetworkUserProfile(drawerUser)
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
    void persistDrawerEdits(merged, ['Contatos de emergência']).catch(() => {
      showErrorToast('Não foi possível salvar os contatos.')
    })
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

    void (async () => {
      const token = getAccessToken()
      if (!token) {
        showErrorToast('Sessão expirada.')
        return
      }

      try {
        const contactLog = await createPrefeituraPacienteRegistroContato(token, drawerUser.id, {
          channel,
          phone,
          note: note.trim(),
        })
        setContactLogsMap((prev) => ({
          ...prev,
          [drawerUser.id]: [
            {
              id: contactLog.id,
              at: contactLog.at,
              channel: contactLog.channel,
              phone: contactLog.phone,
              note: contactLog.note,
              authorLabel: contactLog.authorLabel,
            },
            ...(prev[drawerUser.id] ?? []),
          ],
        }))
        showSuccessToast('Contato registrado com sucesso.')
      } catch {
        showErrorToast('Não foi possível registrar o contato.')
      }
    })()
  }

  function handleAddAnnotation(text: string) {
    if (!drawerUser) return

    void (async () => {
      const token = getAccessToken()
      if (!token) {
        showErrorToast('Sessão expirada.')
        return
      }

      try {
        const annotation = await createPrefeituraPacienteAnotacao(token, drawerUser.id, text)
        setAnnotationsMap((prev) => ({
          ...prev,
          [drawerUser.id]: [
            {
              id: annotation.id,
              text: annotation.text,
              createdAt: annotation.createdAt,
              authorLabel: annotation.authorLabel,
            },
            ...(prev[drawerUser.id] ?? []),
          ],
        }))
        showSuccessToast('Anotação criada com sucesso.')
      } catch {
        showErrorToast('Não foi possível criar a anotação.')
      }
    })()
  }

  const kpiCards = useMemo(() => buildKpiCards(summary), [summary])

  const filteredPatients = patients

  const activeFilterCount = useMemo(
    () => countActivePrefeituraMunicipalPatientFilters(filters),
    [filters],
  )

  const { page, pageSize, total: totalFiltered, totalPages } = pagination
  const showingFrom = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const showingTo = Math.min(page * pageSize, totalFiltered)

  return (
    <>
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pacientes</h2>
              <p className="mt-1 text-sm text-gray-500">
                Busca global por CPF ou nome. Visão consolidada — sem edição operacional neste
                painel.
              </p>
            </div>

            <div className="relative flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar por nome ou CPF..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
                />
              </label>
              <button
                id="prefeitura-usuarios-filter-trigger"
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

              <PrefeituraUsuariosFiltersMenu
                open={filtersOpen}
                filters={filters}
                neighborhoods={availableNeighborhoods}
                firstAttendanceUnits={availableFirstUnits}
                resultCount={filteredPatients.length}
                onClose={() => setFiltersOpen(false)}
                onChange={onFiltersChange}
                onClear={() => onFiltersChange(defaultPrefeituraMunicipalPatientsFilters)}
              />
            </div>
          </div>

          <KpiStatCards items={[...kpiCards]} className="mt-5" />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-2 sm:px-6">
          {!sensitiveDataUnlocked ? (
            <>
              <span className="mr-auto text-xs text-gray-500">
                CPF e telefone mascarados · desbloqueio registrado na auditoria (LGPD).
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
                Dados pessoais visíveis · acesso auditado
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
              <col className="w-[26%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3.5 text-left sm:px-6">Paciente</th>
                <th className="px-3 py-3.5 text-center">CPF</th>
                <th className="px-3 py-3.5 text-center">Data de nasc.</th>
                <th className="px-3 py-3.5 text-center">Bairro</th>
                <th className="px-3 py-3.5 text-center">Última consulta</th>
                <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                    Nenhum paciente encontrado com os filtros e a busca atuais.
                  </td>
                </tr>
              ) : null}
              {filteredPatients.map((patient) => (
                <tr
                  key={patient.id}
                  className="align-middle text-sm text-gray-700 hover:bg-gray-50/80"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <NetworkUserAvatar user={patient} size="sm" />
                      <span className="min-w-0 flex-1 truncate font-semibold text-gray-900">
                        {patient.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-xs tabular-nums text-gray-700">
                    {displayCpf(patient.cpf)}
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <span className="block text-gray-700">{patient.birthDate}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{patient.age} anos</span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    <span className="block truncate" title={bairroForPatient(patient)}>
                      {bairroForPatient(patient)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <span className="block text-gray-700">{patient.lastAppointmentDate}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {patient.lastAppointmentRelative}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center align-middle sm:px-6">
                    <button
                      type="button"
                      onClick={() => openPatientDrawer(patient)}
                      className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                      aria-label={`Ver ficha de ${patient.name}`}
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
              ? 'Nenhum paciente na lista filtrada'
              : `Mostrando ${showingFrom} a ${showingTo} de ${formatNumber(totalFiltered)} paciente${totalFiltered === 1 ? '' : 's'}`}
            {activeFilterCount > 0 || search.trim()
              ? ` (de ${formatNumber(summary?.totalPatients ?? totalFiltered)} na base municipal)`
              : ''}
          </p>
          <nav className="flex items-center gap-1" aria-label="Paginação">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {[1, 2, 3]
              .filter((pageNumber) => pageNumber <= totalPages)
              .map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium ${
                  pageNumber === page
                    ? 'border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)]'
                    : 'border border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            {totalPages > 3 ? (
              <>
                <span className="px-1 text-sm text-gray-400">…</span>
                <button
                  type="button"
                  onClick={() => onPageChange(totalPages)}
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  {totalPages}
                </button>
              </>
            ) : null}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
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
          showSuccessToast('Dados liberados. Acesso registrado na auditoria municipal.')
        }}
        verifyPin={verifyAuthorizationPin}
        description={prefeituraLgpdUnlockDescription}
      />

      <EditUnlockModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => {
          setSensitiveDataUnlocked(true)
          setEditSessionKey((key) => key + 1)
          showSuccessToast('Edição liberada com sucesso.')
        }}
        verifyPin={verifyAuthorizationPin}
        description={prefeituraEditUnlockDescription}
      />

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        variant={toast?.variant ?? 'success'}
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
        onClose={closePatientDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        onRequestUnlock={() => setUnlockModalOpen(true)}
        onRequestEditUnlock={() => setEditModalOpen(true)}
        lastReviewedAt={drawerUser ? lastReviewedMap[drawerUser.id] ?? null : null}
        contactLogs={drawerUser ? contactLogsMap[drawerUser.id] ?? [] : []}
        lastTeamContact={drawerUser ? lastTeamContactForUser(drawerUser.id) : null}
        onSaveEdits={drawerSaving ? () => {} : handleSaveUserEdits}
        onSaveContacts={drawerSaving ? () => {} : handleSaveUserContacts}
        onRegisterContact={handleRegisterContact}
        onAddAnnotation={handleAddAnnotation}
        profileOverride={drawerProfileOverride}
        extraContextItems={drawerDetail ? buildPrefeituraPatientExtraContext(drawerDetail) : []}
        medicalRecordId={drawerDetail?.municipalRecordId ?? drawerUser?.municipalRecordId ?? null}
      />
    </>
  )
}
