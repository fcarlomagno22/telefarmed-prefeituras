import { Download, Eye, FileText, MapPinned, Search, UserCheck, UserMinus, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  AdminMunicipalPatient,
  AdminMunicipalPatientDetail,
  AdminPatientContractingEntity,
} from '../../../types/adminPacientes'
import type {
  PacientesSummaryResponse,
  PreCadastroRegistrationPayload,
  UpdatePacientePayload,
} from '../../../lib/services/admin/pacientes'
import { fetchPacienteProntuario } from '../../../lib/services/admin/pacientes'
import { AdminAuthApiError, verifyAdminAuthorizationPin } from '../../../lib/services/admin/auth'
import type { PatientRegistration } from '../../../types/attendance'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminUserIsAdministrator } from '../../../config/adminPageAccess'
import { userEditsToUpdatePayload } from '../../../utils/adminPacientesEdits'
import type { NetworkUserFullProfile } from '../../../data/networkUserProfiles'
import {
  buildAdminPatientExtraContext,
  mapAdminPatientDetailToProfile,
} from '../../../utils/adminPacientesDetail'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import { SituationStatusBadge, type SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'
import { Toast, type ToastVariant } from '../../ui/Toast'
import { LgpdUnlockModal } from '../../users/LgpdUnlockModal'
import { EditUnlockModal } from '../../users/EditUnlockModal'
import { PinUnlockModal } from '../../users/PinUnlockModal'
import { UserDetailDrawer } from '../../users/UserDetailDrawer'
import { PatientMedicalRecordDrawer } from '../../users/PatientMedicalRecordDrawer'
import {
  adminPessoasPanelEmbeddedShellClass,
  adminPessoasPanelShellClass,
} from '../pessoas/adminPessoasMainPanelShell'
import { type UserProfileEdits } from '../../../data/networkUserLocalData'
import type { PatientContact } from '../../../types/attendance'
import { AdminPatientPreRegistrationDrawer } from './preRegistration/AdminPatientPreRegistrationDrawer'
import { registrationToPreCadastroPayload, registrationToUpdatePayload } from './preRegistration/adminPatientRegistrationMapper'

type AdminPacientesMainPanelProps = {
  patients: AdminMunicipalPatient[]
  summary?: PacientesSummaryResponse | null
  contractingEntities: AdminPatientContractingEntity[]
  municipalityOptions: string[]
  selectedMunicipality: string
  onMunicipalityChange: (value: string) => void
  onPatientUpsert?: (patient: AdminMunicipalPatient) => void
  onLoadPatientDetail?: (id: string) => Promise<AdminMunicipalPatientDetail | null>
  onLookupPatientByCpf?: (
    cpf: string,
    entidadeContratanteId: string,
  ) => Promise<AdminMunicipalPatient | null>
  onCompletePreCadastro?: (
    payload: PreCadastroRegistrationPayload,
  ) => Promise<AdminMunicipalPatient>
  onSavePreCadastroDraft?: (
    payload: PreCadastroRegistrationPayload,
  ) => Promise<{ preCadastroId: string }>
  onConcludePreCadastroById?: (preCadastroId: string) => Promise<AdminMunicipalPatient>
  onCancelPreCadastro?: (preCadastroId: string) => Promise<void>
  onCreatePatientDirect?: (
    payload: PreCadastroRegistrationPayload,
  ) => Promise<AdminMunicipalPatient>
  onInactivatePatient?: (id: string) => Promise<void>
  onSavePatientEdits?: (
    id: string,
    payload: UpdatePacientePayload,
  ) => Promise<AdminMunicipalPatientDetail>
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  onExportCsv?: () => Promise<void>
  isExporting?: boolean
  /** @deprecated use onPatientUpsert */
  onPatientsChange?: (patients: AdminMunicipalPatient[]) => void
  /** Registra ação do botão global da aba (barra superior). */
  bindAddAction?: (action: (() => void) | null) => void
  /** Sem borda/radius próprios — card pai inclui abas no topo. */
  embedded?: boolean
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
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

function AdminPatientAvatar({
  patient,
}: {
  patient: Pick<AdminMunicipalPatient, 'avatarUrl' | 'avatarClassName' | 'initials' | 'name'>
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const showPhoto = Boolean(patient.avatarUrl?.trim()) && !imageFailed

  if (!showPhoto) {
    return (
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${patient.avatarClassName}`}
      >
        {patient.initials}
      </span>
    )
  }

  return (
    <img
      src={patient.avatarUrl}
      alt=""
      loading="lazy"
      onError={() => setImageFailed(true)}
      className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
    />
  )
}

export function AdminPacientesMainPanel({
  patients,
  summary,
  contractingEntities,
  municipalityOptions,
  selectedMunicipality,
  onMunicipalityChange,
  onPatientUpsert,
  onLoadPatientDetail,
  onLookupPatientByCpf,
  onCompletePreCadastro,
  onSavePreCadastroDraft,
  onConcludePreCadastroById,
  onCancelPreCadastro,
  onCreatePatientDirect,
  onInactivatePatient,
  onSavePatientEdits,
  searchQuery = '',
  onSearchQueryChange,
  onExportCsv,
  isExporting = false,
  onPatientsChange,
  bindAddAction,
  embedded = false,
}: AdminPacientesMainPanelProps) {
  const { getAccessToken, user } = useAdminAuth()
  const canAccessProntuario = adminUserIsAdministrator(user)
  const prontuarioPinRef = useRef<string | null>(null)
  const [sensitiveDataUnlocked, setSensitiveDataUnlocked] = useState(false)
  const [unlockModalOpen, setUnlockModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editSessionKey, setEditSessionKey] = useState(0)
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null)
  const [drawerUser, setDrawerUser] = useState<AdminMunicipalPatient | null>(null)
  const [drawerDetail, setDrawerDetail] = useState<AdminMunicipalPatientDetail | null>(null)
  const [drawerProfileOverride, setDrawerProfileOverride] = useState<NetworkUserFullProfile | null>(
    null,
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [userEditsMap, setUserEditsMap] = useState<Record<string, UserProfileEdits>>({})
  const [lastReviewedMap, setLastReviewedMap] = useState<Record<string, string>>({})
  const [drawerSaving, setDrawerSaving] = useState(false)
  const [preRegistrationOpen, setPreRegistrationOpen] = useState(false)
  const [preRegistrationClosing, setPreRegistrationClosing] = useState(false)
  const [prontuarioPinOpen, setProntuarioPinOpen] = useState(false)
  const [medicalRecordOpen, setMedicalRecordOpen] = useState(false)
  const [medicalRecordClosing, setMedicalRecordClosing] = useState(false)

  const filtered = patients

  const loadMedicalRecord = useCallback(
    async (patientId: string) => {
      const pin = prontuarioPinRef.current
      if (!pin) {
        throw new Error('Informe sua senha de autorização para acessar o prontuário.')
      }

      const token = getAccessToken()
      if (!token) {
        throw new Error('Sessão expirada.')
      }

      return fetchPacienteProntuario(token, patientId, pin)
    },
    [getAccessToken],
  )

  const [preRegistrationSubmitting, setPreRegistrationSubmitting] = useState(false)

  const defaultContractingEntityId = useMemo(() => {
    if (selectedMunicipality === 'all') return undefined
    return contractingEntities.find((entity) => entity.municipality === selectedMunicipality)?.id
  }, [contractingEntities, selectedMunicipality])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast(null)
    requestAnimationFrame(() => setToast({ message, variant }))
  }, [])

  const showSuccessToast = useCallback(
    (message: string) => showToast(message, 'success'),
    [showToast],
  )

  const showErrorToast = useCallback((message: string) => showToast(message, 'error'), [showToast])

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

  async function handlePreRegistrationCompleted(patient: AdminMunicipalPatient, isUpdate: boolean) {
    void isUpdate
    onPatientUpsert?.(patient)
    if (onPatientsChange) {
      onPatientsChange(
        isUpdate
          ? patients.map((row) => (row.id === patient.id ? patient : row))
          : [patient, ...patients],
      )
    }
  }

  async function handleFinalizePreRegistration(
    registration: PatientRegistration,
    entity: AdminPatientContractingEntity,
  ) {
    if (!onCompletePreCadastro) {
      throw new Error('Pré-cadastro indisponível.')
    }
    setPreRegistrationSubmitting(true)
    try {
      const payload = registrationToPreCadastroPayload(registration, entity)
      return await onCompletePreCadastro(payload)
    } finally {
      setPreRegistrationSubmitting(false)
    }
  }

  async function handleSavePreCadastroDraft(
    registration: PatientRegistration,
    entity: AdminPatientContractingEntity,
  ) {
    if (!onSavePreCadastroDraft) {
      throw new Error('Salvar rascunho indisponível.')
    }
    const payload = registrationToPreCadastroPayload(registration, entity)
    return onSavePreCadastroDraft(payload)
  }

  async function handleCreatePatientDirect(
    registration: PatientRegistration,
    entity: AdminPatientContractingEntity,
  ) {
    if (!onCreatePatientDirect) {
      throw new Error('Cadastro direto indisponível.')
    }
    setPreRegistrationSubmitting(true)
    try {
      const payload = registrationToPreCadastroPayload(registration, entity)
      return await onCreatePatientDirect(payload)
    } finally {
      setPreRegistrationSubmitting(false)
    }
  }

  async function handleUpdateExistingPatient(
    patientId: string,
    registration: PatientRegistration,
  ) {
    if (!onSavePatientEdits) {
      throw new Error('Atualização indisponível.')
    }
    setPreRegistrationSubmitting(true)
    try {
      const updated = await onSavePatientEdits(patientId, registrationToUpdatePayload(registration))
      return updated
    } finally {
      setPreRegistrationSubmitting(false)
    }
  }

  function handleInactivatePatient() {
    if (!drawerUser || !onInactivatePatient) return

    void (async () => {
      try {
        await onInactivatePatient(drawerUser.id)
        closePatientDrawer()
        showSuccessToast('Cadastro inativado com sucesso.')
      } catch {
        showErrorToast('Não foi possível inativar o cadastro do paciente.')
      }
    })()
  }

  const dismissToast = useCallback(() => setToast(null), [])

  function openPatientDrawer(patient: AdminMunicipalPatient) {
    setDrawerClosing(false)
    setDrawerUser(patient)
    setDrawerDetail(null)
    setDrawerProfileOverride(null)
    setDrawerOpen(true)

    if (!onLoadPatientDetail) return

    void (async () => {
      try {
        const detail = await onLoadPatientDetail(patient.id)
        if (!detail) return
        setDrawerUser(detail)
        setDrawerDetail(detail)
        setDrawerProfileOverride(mapAdminPatientDetailToProfile(detail))
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

  function handleRequestMedicalRecord() {
    if (!canAccessProntuario) return
    prontuarioPinRef.current = null
    setProntuarioPinOpen(true)
  }

  function handleMedicalRecordTransitionEnd() {
    if (medicalRecordClosing) {
      setMedicalRecordOpen(false)
      setMedicalRecordClosing(false)
      prontuarioPinRef.current = null
    }
  }

  function closeMedicalRecordDrawer() {
    setMedicalRecordClosing(true)
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

  async function persistDrawerEdits(edits: UserProfileEdits) {
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
      setDrawerProfileOverride(mapAdminPatientDetailToProfile(updated))
      setUserEditsMap((prev) => {
        const next = { ...prev }
        delete next[drawerUser.id]
        return next
      })
      setLastReviewedMap((prev) => ({ ...prev, [drawerUser.id]: new Date().toISOString() }))
      onPatientUpsert?.(updated)
      showSuccessToast('Alterações salvas com sucesso.')
    } finally {
      setDrawerSaving(false)
    }
  }

  function handleSaveUserEdits(edits: UserProfileEdits, changedFields: string[]) {
    void changedFields
    if (!drawerUser) return
    void persistDrawerEdits(edits).catch(() => {
      showErrorToast('Não foi possível salvar as alterações.')
    })
  }

  function handleSaveUserContacts(contacts: PatientContact[]) {
    if (!drawerUser) return
    const profile = drawerProfileOverride
    const previous = userEditsMap[drawerUser.id]
    const merged: UserProfileEdits = {
      phone: previous?.phone ?? drawerUser.phone,
      email: previous?.email ?? profile?.email ?? '—',
      zipCode: previous?.zipCode ?? profile?.zipCode ?? '—',
      street: previous?.street ?? profile?.street ?? '—',
      number: previous?.number ?? profile?.number ?? '—',
      complement: previous?.complement ?? profile?.complement ?? '',
      neighborhood: previous?.neighborhood ?? profile?.neighborhood ?? drawerUser.bairro,
      city: previous?.city ?? profile?.city ?? drawerUser.municipality,
      state: previous?.state ?? profile?.state ?? '—',
      guardianName: previous?.guardianName ?? profile?.guardianName ?? '',
      guardianCpf: previous?.guardianCpf ?? profile?.guardianCpf ?? '',
      contacts,
    }
    void persistDrawerEdits(merged).catch(() => {
      showErrorToast('Não foi possível salvar os contatos.')
    })
  }

  const kpiCards = useMemo(() => {
    const total = summary?.totalPacientes ?? 0
    const novosMes = summary?.novosNoMesAtual ?? 0
    const ativo = summary?.contratoAtivo ?? 0
    const encerrado = summary?.contratoEncerrado ?? 0

    return [
      {
        label: 'Base consolidada',
        value: formatNumber(total),
        suffix: 'pacientes únicos',
        icon: UsersRound,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Novos cadastros',
        value: formatNumber(novosMes),
        suffix: 'no mês atual',
        icon: MapPinned,
        iconGradient: 'from-orange-500 via-amber-500 to-orange-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(249,115,22,0.35)]',
        iconRing: 'ring-orange-100/80',
        topBar: 'from-orange-400 to-amber-500',
      },
      {
        label: 'Contrato ativo',
        value: formatNumber(ativo),
        suffix: 'usuários na base ativa',
        icon: UserCheck,
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Contrato encerrado',
        value: formatNumber(encerrado),
        suffix: 'usuários em municípios encerrados',
        icon: UserMinus,
        iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-purple-500',
      },
    ]
  }, [summary])

  const drawerExtraContext = useMemo(() => {
    if (drawerDetail) return buildAdminPatientExtraContext(drawerDetail)
    if (!drawerUser) return []
    return [
      { label: 'Entidade contratante', value: drawerUser.contractingEntityRazaoSocial },
      { label: 'Contratante', value: drawerUser.municipality },
      {
        label: 'Status do contrato',
        value: drawerUser.contractStatus === 'ativo' ? 'Ativo' : 'Encerrado',
      },
    ]
  }, [drawerDetail, drawerUser])

  return (
    <>
      <section className={embedded ? adminPessoasPanelEmbeddedShellClass : adminPessoasPanelShellClass}>
      <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Pacientes</h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-4xl lg:justify-end">
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Contratante
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
                value={searchQuery}
                onChange={(event) => onSearchQueryChange?.(event.target.value)}
                placeholder="Buscar por nome ou CPF..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-sm placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15"
              />
            </label>
            {onExportCsv ? (
              <button
                type="button"
                onClick={() => void onExportCsv().catch(() => showErrorToast('Não foi possível exportar.'))}
                disabled={isExporting}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exportando…' : 'Exportar CSV'}
              </button>
            ) : null}
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
                    <AdminPatientAvatar patient={patient} />
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
                  {patient.totalAppointments > 0 ? `${patient.totalAppointments} consulta(s)` : '—'}
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
          Mostrando {formatNumber(filtered.length)} paciente(s) na base selecionada.
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
        annotations={[]}
        onClose={closePatientDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        onRequestUnlock={() => setUnlockModalOpen(true)}
        onRequestEditUnlock={() => setEditModalOpen(true)}
        lastReviewedAt={drawerUser ? lastReviewedMap[drawerUser.id] ?? null : null}
        contactLogs={[]}
        lastTeamContact={null}
        onSaveEdits={drawerSaving ? () => {} : handleSaveUserEdits}
        onSaveContacts={drawerSaving ? () => {} : handleSaveUserContacts}
        onRegisterContact={() => {}}
        onAddAnnotation={() => {}}
        canInactivate={Boolean(onInactivatePatient)}
        onInactivate={handleInactivatePatient}
        profileOverride={drawerProfileOverride}
        extraContextItems={drawerExtraContext}
        teamInteractionsEnabled={false}
        canAccessMedicalRecord={canAccessProntuario}
        onRequestMedicalRecord={handleRequestMedicalRecord}
      />

      <PinUnlockModal
        open={prontuarioPinOpen}
        onClose={() => setProntuarioPinOpen(false)}
        onSuccess={() => {
          setMedicalRecordOpen(true)
          setMedicalRecordClosing(false)
        }}
        verifyPin={async (pin) => {
          const token = getAccessToken()
          if (!token) return false
          try {
            await verifyAdminAuthorizationPin(token, pin)
            prontuarioPinRef.current = pin
            return true
          } catch (error) {
            if (error instanceof AdminAuthApiError && error.code === 'PIN_NOT_CONFIGURED') {
              showErrorToast(error.message)
            }
            return false
          }
        }}
        title="Acesso ao prontuário médico"
        titleId="admin-prontuario-pin-title"
        description="Somente administradores podem consultar prontuários. Informe sua senha de autorização de 6 dígitos para continuar."
        submitLabel="Acessar prontuário"
        pinCompleteHint="Senha completa. Toque em acessar prontuário."
        icon={FileText}
      />

      <PatientMedicalRecordDrawer
        open={medicalRecordOpen}
        closing={medicalRecordClosing}
        onClose={closeMedicalRecordDrawer}
        onTransitionEnd={handleMedicalRecordTransitionEnd}
        patientId={drawerUser?.id ?? null}
        patientName={drawerUser?.name ?? ''}
        patientPhotoUrl={drawerUser?.avatarUrl}
        birthDate={drawerUser?.birthDate ?? ''}
        age={drawerUser?.age ?? 0}
        city={drawerProfileOverride?.city ?? drawerUser?.municipality ?? ''}
        recordId={drawerUser?.municipalRecordId ?? ''}
        loadProntuario={canAccessProntuario ? loadMedicalRecord : undefined}
      />

      <AdminPatientPreRegistrationDrawer
        open={preRegistrationOpen}
        closing={preRegistrationClosing}
        contractingEntities={contractingEntities}
        defaultEntityId={defaultContractingEntityId}
        existingPatients={patients}
        submitting={preRegistrationSubmitting}
        onClose={closePreRegistrationDrawer}
        onTransitionEnd={handlePreRegistrationTransitionEnd}
        onFinalize={onCompletePreCadastro ? handleFinalizePreRegistration : undefined}
        onSaveDraft={onSavePreCadastroDraft ? handleSavePreCadastroDraft : undefined}
        onConcludeDraft={onConcludePreCadastroById}
        onCancelDraft={onCancelPreCadastro}
        onCreateDirect={onCreatePatientDirect ? handleCreatePatientDirect : undefined}
        onUpdateExisting={onSavePatientEdits ? handleUpdateExistingPatient : undefined}
        onLookupPatientByCpf={onLookupPatientByCpf}
        onDraftSaved={() => showSuccessToast('Rascunho salvo com sucesso.')}
        onCompleted={(patient, isUpdate) => {
          void handlePreRegistrationCompleted(patient, isUpdate)
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
