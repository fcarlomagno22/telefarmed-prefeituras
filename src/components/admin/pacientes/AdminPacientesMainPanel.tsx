import { Eye, MapPinned, Search, UserCheck, UserMinus, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AdminMunicipalPatient } from '../../../data/adminPacientesMock'
import { getAdminPatientContractingEntities } from '../../../data/adminPacientesMock'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge, type SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import { maskCpfForDisplay, onlyDigits } from '../../../utils/lgpdDisplay'
import { Toast } from '../../ui/Toast'
import { LgpdUnlockModal } from '../../users/LgpdUnlockModal'
import { EditUnlockModal } from '../../users/EditUnlockModal'
import { UserDetailDrawer } from '../../users/UserDetailDrawer'
import type { NetworkUser } from '../../../data/networkUsersMock'
import {
  createActivityId,
  type ContactChannel,
  type PatientContactLogEntry,
  type TeamContactRecord,
} from '../../../data/networkUserActivity'
import {
  adminPessoasPanelEmbeddedShellClass,
  adminPessoasPanelShellClass,
} from '../pessoas/adminPessoasMainPanelShell'
import {
  createAnnotationId,
  type UserAnnotation,
  type UserProfileEdits,
} from '../../../data/networkUserLocalData'
import type { PatientContact } from '../../../data/unitDashboardMock'
import { getNetworkUserProfile } from '../../../data/networkUserProfiles'
import { getLoggedOperatorName } from '../../../utils/sessionUser'
import { AdminPatientPreRegistrationDrawer } from './preRegistration/AdminPatientPreRegistrationDrawer'

type AdminPacientesMainPanelProps = {
  patients: AdminMunicipalPatient[]
  municipalityOptions: string[]
  selectedMunicipality: string
  onMunicipalityChange: (value: string) => void
  onPatientsChange?: (patients: AdminMunicipalPatient[]) => void
  /** Registra ação do botão global da aba (barra superior). */
  bindAddAction?: (action: (() => void) | null) => void
  /** Sem borda/radius próprios — card pai inclui abas no topo. */
  embedded?: boolean
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function filterPatients(query: string, patients: AdminMunicipalPatient[]) {
  const trimmed = query.trim()
  if (!trimmed) return patients
  const normalized = trimmed.toLowerCase()
  const queryDigits = onlyDigits(trimmed)

  return patients.filter((patient) => {
    const haystack =
      `${patient.name} ${patient.bairro} ${patient.municipality} ${patient.cpf} ${patient.phone}`.toLowerCase()
    if (haystack.includes(normalized)) return true
    if (!queryDigits) return false
    return `${onlyDigits(patient.cpf)} ${onlyDigits(patient.phone)}`.includes(queryDigits)
  })
}

const ADMIN_PACIENTE_STATUS_BADGE_WIDTH = 'w-[8.5rem]'

const adminPacienteContratoStatusBadgeConfig: Record<
  AdminMunicipalPatient['contractStatus'],
  SituationStatusBadgeStyle
> = {
  ativo: {
    label: 'Ativo',
    text: 'text-emerald-700',
    accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
  },
  encerrado: {
    label: 'Encerrado',
    text: 'text-gray-600',
    accent: 'bg-gradient-to-r from-gray-300 via-gray-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_8px_rgba(100,116,139,0.4)]',
  },
}

export function AdminPacientesMainPanel({
  patients,
  municipalityOptions,
  selectedMunicipality,
  onMunicipalityChange,
  onPatientsChange,
  bindAddAction,
  embedded = false,
}: AdminPacientesMainPanelProps) {
  const [search, setSearch] = useState('')
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [drawerUser, setDrawerUser] = useState<NetworkUser | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [userEditsMap, setUserEditsMap] = useState<Record<string, UserProfileEdits>>({})
  const [annotationsMap, setAnnotationsMap] = useState<Record<string, UserAnnotation[]>>({})
  const [lastReviewedMap, setLastReviewedMap] = useState<Record<string, string>>({})
  const [contactLogsMap, setContactLogsMap] = useState<Record<string, PatientContactLogEntry[]>>({})
  const [preRegistrationOpen, setPreRegistrationOpen] = useState(false)
  const [preRegistrationClosing, setPreRegistrationClosing] = useState(false)

  const municipalityScopedPatients = useMemo(() => {
    if (selectedMunicipality === 'all') return patients
    return patients.filter((patient) => patient.municipality === selectedMunicipality)
  }, [patients, selectedMunicipality])

  const filtered = useMemo(
    () => filterPatients(search, municipalityScopedPatients),
    [search, municipalityScopedPatients],
  )
  const loggedOperatorName = getLoggedOperatorName()

  const contractingEntities = useMemo(() => getAdminPatientContractingEntities(), [])

  const defaultContractingEntityId = useMemo(() => {
    if (selectedMunicipality === 'all') return undefined
    return contractingEntities.find((entity) => entity.municipality === selectedMunicipality)?.id
  }, [contractingEntities, selectedMunicipality])

  const showSuccessToast = useCallback((message: string) => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message }))
  }, [])

  const openAddPatient = useCallback(() => {
    setPreRegistrationClosing(false)
    setPreRegistrationOpen(true)
  }, [])

  useEffect(() => {
    bindAddAction?.(openAddPatient)
    return () => bindAddAction?.(null)
  }, [bindAddAction, openAddPatient])

  function closePreRegistrationDrawer() {
    setPreRegistrationClosing(true)
  }

  function handlePreRegistrationTransitionEnd() {
    if (!preRegistrationClosing) return
    setPreRegistrationOpen(false)
    setPreRegistrationClosing(false)
  }

  function handlePreRegistrationCompleted(patient: AdminMunicipalPatient, isUpdate: boolean) {
    if (!onPatientsChange) return

    onPatientsChange(
      isUpdate
        ? patients.map((row) => (row.id === patient.id ? patient : row))
        : [patient, ...patients],
    )
  }

  const dismissToast = useCallback(() => setToast(null), [])

  function openPatientDrawer(patient: AdminMunicipalPatient) {
    setDrawerClosing(false)
    setDrawerUser(patient)
    setDrawerOpen(true)
    seedAnnotationsIfNeeded(patient)
  }

  function closePatientDrawer() {
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

  function handleSaveUserEdits(edits: UserProfileEdits, changedFields: string[]) {
    void changedFields
    if (!drawerUser) return
    setUserEditsMap((prev) => ({ ...prev, [drawerUser.id]: edits }))
    setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
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

  const kpiCards = useMemo(
    () => [
      {
        label: 'Base consolidada',
        value: formatNumber(municipalityScopedPatients.length),
        suffix: 'pacientes únicos',
        icon: UsersRound,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Novos cadastros',
        value: formatNumber(
          municipalityScopedPatients.filter((patient) => patient.registrationMonthLabel === 'Mai')
            .length,
        ),
        suffix: 'no mês atual',
        icon: MapPinned,
        iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
        iconRing: 'ring-orange-100/80',
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        label: 'Contrato ativo',
        value: formatNumber(
          municipalityScopedPatients.filter((patient) => patient.contractStatus === 'ativo').length,
        ),
        suffix: 'usuários na base ativa',
        icon: UserCheck,
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Contrato encerrado',
        value: formatNumber(
          municipalityScopedPatients.filter((patient) => patient.contractStatus === 'encerrado')
            .length,
        ),
        suffix: 'usuários em municípios encerrados',
        icon: UserMinus,
        iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-purple-500',
      },
    ],
    [municipalityScopedPatients],
  )

  const drawerUserAdmin = useMemo(
    () => (drawerUser ? patients.find((patient) => patient.id === drawerUser.id) ?? null : null),
    [drawerUser, patients],
  )

  return (
    <>
      <section className={embedded ? adminPessoasPanelEmbeddedShellClass : adminPessoasPanelShellClass}>
      <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pacientes</h2>
            <p className="mt-1 text-sm text-gray-500">
              Visão consolidada de pacientes de municípios com contrato ativo ou encerrado.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-4xl lg:justify-end">
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cidade contratante
              <CustomSelect
                value={selectedMunicipality}
                onChange={(value) => onMunicipalityChange(value)}
                options={[
                  { value: 'all', label: 'Todas as cidades' },
                  ...municipalityOptions.map((city) => ({ value: city, label: city })),
                ]}
                className="min-w-[220px] text-left normal-case"
              />
            </label>
            <label className="relative min-w-0 flex-1 lg:min-w-[22rem] lg:max-w-2xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nome ou CPF..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-sm placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
            </label>
          </div>
        </div>
        <KpiStatCards items={kpiCards} className="mt-5" />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-b border-gray-200 bg-gray-50/60 px-5 py-2 sm:px-6">
        {!sensitiveDataUnlocked ? (
          <>
            <span className="mr-auto text-xs text-gray-500">CPF mascarado para visualização LGPD.</span>
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
            <span className="mr-auto text-xs font-medium text-emerald-600">Dados visíveis</span>
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
            <col className="w-[19%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[17%]" />
            <col className="w-[12%]" />
            <col className="w-[11%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-50">
            <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3.5 text-left sm:px-6">Paciente</th>
              <th className="px-3 py-3.5 text-center">Entidade contratante</th>
              <th className="px-3 py-3.5 text-center">CPF</th>
              <th className="px-3 py-3.5 text-center">Bairro</th>
              <th className="px-3 py-3.5 text-center">Especialidade (última)</th>
              <th className="px-3 py-3.5 text-center">Última consulta</th>
              <th className="px-3 py-3.5 text-center">Status contratual</th>
              <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                  Nenhum paciente encontrado para os filtros atuais.
                </td>
              </tr>
            ) : null}
            {filtered.map((patient) => (
              <tr key={patient.id} className="align-middle text-sm text-gray-700 hover:bg-gray-50/80">
                <td className="px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    {patient.avatarUrl ? (
                      <img
                        src={patient.avatarUrl}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
                      />
                    ) : (
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${patient.avatarClassName}`}
                      >
                        {patient.initials}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{patient.name}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{patient.bairro}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 text-center align-middle text-gray-700">
                  <span className="block truncate font-medium text-gray-900" title={patient.contractingEntityRazaoSocial}>
                    {patient.municipality}
                  </span>
                  <span
                    className="mt-0.5 block truncate text-[11px] text-gray-500"
                    title={patient.contractingEntityRazaoSocial}
                  >
                    {patient.contractingEntityRazaoSocial}
                  </span>
                </td>
                <td className="px-3 py-4 text-center align-middle text-xs tabular-nums text-gray-700">
                  {sensitiveDataUnlocked ? patient.cpf : maskCpfForDisplay(patient.cpf)}
                </td>
                <td className="px-3 py-4 text-center align-middle text-gray-700">{patient.bairro}</td>
                <td className="px-3 py-4 text-center align-middle text-gray-700">
                  {getNetworkUserProfile(patient).lastConsultationSpecialty || '—'}
                </td>
                <td className="px-3 py-4 text-center align-middle">
                  <span className="block text-gray-700">{patient.lastAppointmentDate}</span>
                  <span className="mt-0.5 block text-xs text-gray-500">
                    {patient.lastAppointmentRelative}
                  </span>
                </td>
                <td className="px-3 py-4 text-center align-middle">
                  <SituationStatusBadge
                    config={adminPacienteContratoStatusBadgeConfig[patient.contractStatus]}
                    widthClass={ADMIN_PACIENTE_STATUS_BADGE_WIDTH}
                  />
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

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
        <p className="text-xs text-gray-500">
          Mostrando {formatNumber(filtered.length)} de{' '}
          {formatNumber(municipalityScopedPatients.length)} pacientes da
          base selecionada.
        </p>
      </footer>
      </section>

      <LgpdUnlockModal
        open={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        onSuccess={() => {
          setSensitiveDataUnlocked(true)
          showSuccessToast('Dados liberados. Acesso registrado na auditoria administrativa.')
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

      <Toast message={toast?.message ?? ''} visible={toast !== null} onClose={dismissToast} />

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
        onSaveEdits={handleSaveUserEdits}
        onSaveContacts={handleSaveUserContacts}
        onRegisterContact={handleRegisterContact}
        onAddAnnotation={handleAddAnnotation}
        extraContextItems={
          drawerUserAdmin
            ? [
                { label: 'Entidade contratante', value: drawerUserAdmin.contractingEntityRazaoSocial },
                { label: 'Cidade contratante', value: drawerUserAdmin.municipality },
                {
                  label: 'Status do contrato',
                  value: drawerUserAdmin.contractStatus === 'ativo' ? 'Ativo' : 'Encerrado',
                },
              ]
            : []
        }
      />

      <AdminPatientPreRegistrationDrawer
        open={preRegistrationOpen}
        closing={preRegistrationClosing}
        contractingEntities={contractingEntities}
        defaultEntityId={defaultContractingEntityId}
        existingPatients={patients}
        onClose={closePreRegistrationDrawer}
        onTransitionEnd={handlePreRegistrationTransitionEnd}
        onCompleted={(patient, isUpdate) => {
          handlePreRegistrationCompleted(patient, isUpdate)
          showSuccessToast(
            isUpdate
              ? `${patient.name} atualizado com sucesso.`
              : `${patient.name} pré-cadastrado com sucesso.`,
          )
        }}
      />
    </>
  )
}
