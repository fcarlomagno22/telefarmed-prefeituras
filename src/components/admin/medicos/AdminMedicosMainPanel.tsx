import { Activity, Ban, Eye, MessageCircle, MoreVertical, Pencil, Search, Star, UserCheck, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { AdminDoctor } from '../../../types/adminMedicos'
import { KpiStatCards } from '../../ui/KpiStatCards'
import { CustomSelect } from '../../ui/CustomSelect'
import { Toast } from '../../ui/Toast'
import { SituationStatusBadge, type SituationStatusBadgeStyle } from '../../ui/SituationStatusBadge'
import {
  AdminMedicoDetailDrawer,
  type AdminMedicoDrawerMode,
} from './AdminMedicoDetailDrawer'
import {
  adminPessoasPanelEmbeddedShellClass,
  adminPessoasPanelShellClass,
} from '../pessoas/adminPessoasMainPanelShell'
import { PinUnlockModal } from '../../users/PinUnlockModal'
import { AdminProfessionalCreateDrawer } from './create/AdminProfessionalCreateDrawer'
import { AdminDoctorAvatar } from './AdminDoctorAvatar'
import { AdminSpecialtiesCell } from '../profissionais/AdminSpecialtiesCell'
import type { AtivosSummaryResponse } from '../../../lib/mockServices/admin/profissionaisAtivos'
import { SupportChatImageLightbox } from '../../suporte/SupportChatImageLightbox'

type AdminMedicosMainPanelProps = {
  doctors: AdminDoctor[]
  ativosSummary?: AtivosSummaryResponse | null
  onSaveDoctor?: (doctor: AdminDoctor) => Promise<AdminDoctor>
  onInactivateDoctor?: (id: string) => Promise<AdminDoctor>
  onReactivateDoctor?: (id: string) => Promise<AdminDoctor>
  onLoadDoctorDetail?: (id: string) => Promise<AdminDoctor | null>
  onCreateDoctor?: (payload: Record<string, unknown>) => Promise<AdminDoctor>
  searchQuery?: string
  onSearchQueryChange?: (value: string) => void
  allocationFilter?: 'all' | 'nacional' | 'por_contrato'
  onAllocationFilterChange?: (value: 'all' | 'nacional' | 'por_contrato') => void
  professionFilter?: 'all' | 'Médicos' | 'Psicólogos' | 'Nutricionistas' | 'Fonoaudiólogos'
  onProfessionFilterChange?: (
    value: 'all' | 'Médicos' | 'Psicólogos' | 'Nutricionistas' | 'Fonoaudiólogos',
  ) => void
  canEdit?: boolean
  canInsert?: boolean
  /** Registra ação do botão global da aba (barra superior). */
  bindAddAction?: (action: (() => void) | null) => void
  /** Sem borda/radius próprios — card pai inclui abas no topo. */
  embedded?: boolean
}

const ADMIN_MEDICO_BADGE_WIDTH = 'w-[6.75rem]'

const adminMedicoAccountStatusBadgeConfig: Record<'ativo' | 'inativo', SituationStatusBadgeStyle> =
  {
    ativo: {
      label: 'Ativo',
      text: 'text-emerald-700',
      accent: 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500',
      lineGlow: 'shadow-[0_2px_10px_rgba(16,185,129,0.55)]',
    },
    inativo: {
      label: 'Inativo',
      text: 'text-red-700',
      accent: 'bg-gradient-to-r from-red-400 via-rose-500 to-orange-500',
      lineGlow: 'shadow-[0_2px_10px_rgba(248,113,113,0.55)]',
    },
  }

const adminMedicoConnectionBadgeConfig: Record<'online' | 'offline', SituationStatusBadgeStyle> = {
  online: {
    label: 'Online',
    text: 'text-sky-700',
    accent: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(59,130,246,0.55)]',
  },
  offline: {
    label: 'Offline',
    text: 'text-slate-600',
    accent: 'bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500',
    lineGlow: 'shadow-[0_2px_10px_rgba(100,116,139,0.45)]',
  },
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function AdminMedicosMainPanel({
  doctors,
  ativosSummary,
  onSaveDoctor,
  onInactivateDoctor,
  onReactivateDoctor,
  onLoadDoctorDetail,
  onCreateDoctor,
  searchQuery = '',
  onSearchQueryChange,
  allocationFilter = 'all',
  onAllocationFilterChange,
  professionFilter = 'all',
  onProfessionFilterChange,
  canEdit = true,
  canInsert = true,
  bindAddAction,
  embedded = false,
}: AdminMedicosMainPanelProps) {
  const [drawerDoctor, setDrawerDoctor] = useState<AdminDoctor | null>(null)
  const [drawerMode, setDrawerMode] = useState<AdminMedicoDrawerMode>('view')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createDrawerClosing, setCreateDrawerClosing] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [actionsDoctorId, setActionsDoctorId] = useState<string | null>(null)
  const [actionsStyle, setActionsStyle] = useState<CSSProperties | null>(null)
  const [inactivateTargetDoctor, setInactivateTargetDoctor] = useState<AdminDoctor | null>(null)
  const [reactivateTargetDoctor, setReactivateTargetDoctor] = useState<AdminDoctor | null>(null)
  const [photoPreview, setPhotoPreview] = useState<{ url: string; name: string } | null>(null)

  function isDoctorConnected(doctor: AdminDoctor) {
    return doctor.isOnlineNow && doctor.status === 'ativo'
  }
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const filtered = doctors

  const kpiCards = useMemo(
    () => [
      {
        label: 'Base de profissionais',
        value: formatNumber(ativosSummary?.ativos ?? 0),
        suffix: 'profissionais ativos',
        icon: Users,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Online agora',
        value: formatNumber(ativosSummary?.online ?? 0),
        suffix: `${formatNumber(ativosSummary?.emPlantao ?? 0)} em plantão`,
        icon: Eye,
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Produtividade média',
        value: formatNumber(ativosSummary?.avgPatientsMonth ?? 0),
        suffix: 'pacientes / mês',
        icon: Activity,
        iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
        iconRing: 'ring-amber-100/80',
        topBar: 'from-amber-400 to-orange-500',
      },
      {
        label: 'Nota média',
        value: formatNumber(ativosSummary?.averageRating ?? 0, 1),
        suffix: 'avaliação dos pacientes',
        icon: Star,
        iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-purple-500',
      },
    ],
    [ativosSummary],
  )

  const openDrawer = useCallback(
    (doctor: AdminDoctor, mode: AdminMedicoDrawerMode = 'view') => {
      setDrawerDoctor(doctor)
      setDrawerMode(mode)
      setDrawerClosing(false)
      setDrawerOpen(true)

      if (!onLoadDoctorDetail) return

      void (async () => {
        try {
          const detail = await onLoadDoctorDetail(doctor.id)
          if (detail) setDrawerDoctor(detail)
        } catch {
          // Mantém dados da listagem se o detalhe falhar.
        }
      })()
    },
    [onLoadDoctorDetail],
  )

  const openAddProfessional = useCallback(() => {
    setCreateDrawerClosing(false)
    setCreateDrawerOpen(true)
  }, [])

  useEffect(() => {
    bindAddAction?.(canInsert ? openAddProfessional : null)
    return () => bindAddAction?.(null)
  }, [bindAddAction, canInsert, openAddProfessional])

  function handleSaveDoctor(updated: AdminDoctor) {
    void (async () => {
      try {
        const saved = onSaveDoctor ? await onSaveDoctor(updated) : updated
        setToast({
          message: saved.name
            ? `${saved.name} atualizado com sucesso.`
            : 'Profissional atualizado com sucesso.',
        })
        closeDrawer()
      } catch {
        setToast({ message: 'Não foi possível salvar o profissional.' })
      }
    })()
  }

  function handleCreateProfessional(doctor: AdminDoctor) {
    setToast({
      message: doctor.name
        ? `${doctor.name} cadastrado com sucesso.`
        : 'Profissional cadastrado com sucesso.',
    })
    closeCreateDrawer()
  }

  function closeCreateDrawer() {
    setCreateDrawerClosing(true)
  }

  function handleCreateDrawerTransitionEnd() {
    if (!createDrawerClosing) return
    setCreateDrawerOpen(false)
    setCreateDrawerClosing(false)
  }

  function openActionsMenu(doctorId: string) {
    const button = actionButtonRefs.current[doctorId]
    if (!button) return
    const rect = button.getBoundingClientRect()
    const menuWidth = 216
    const left = Math.min(
      Math.max(12, rect.right - menuWidth),
      window.innerWidth - menuWidth - 12,
    )
    setActionsStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left,
      minWidth: menuWidth,
      zIndex: 220,
    })
    setActionsDoctorId((current) => (current === doctorId ? null : doctorId))
  }

  useEffect(() => {
    if (!actionsDoctorId) return
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (target.closest('[data-doctor-actions-menu]')) return
      if (target.closest('[data-doctor-actions-trigger]')) return
      setActionsDoctorId(null)
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActionsDoctorId(null)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [actionsDoctorId])

  function closeDrawer() {
    setDrawerClosing(true)
  }

  function handleDrawerTransitionEnd() {
    if (!drawerClosing) return
    setDrawerOpen(false)
    setDrawerDoctor(null)
    setDrawerMode('view')
    setDrawerClosing(false)
  }

  return (
    <>
      <section
        className={embedded ? adminPessoasPanelEmbeddedShellClass : adminPessoasPanelShellClass}
      >
        <div className="shrink-0 border-b border-gray-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Profissionais</h2>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-4xl lg:justify-end">
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Profissão
                <CustomSelect
                  value={professionFilter}
                  onChange={(value) =>
                    onProfessionFilterChange?.(
                      value as 'all' | 'Médicos' | 'Psicólogos' | 'Nutricionistas' | 'Fonoaudiólogos',
                    )
                  }
                  options={[
                    { value: 'all', label: 'Todas' },
                    { value: 'Médicos', label: 'Médicos' },
                    { value: 'Psicólogos', label: 'Psicólogos' },
                    { value: 'Nutricionistas', label: 'Nutricionistas' },
                    { value: 'Fonoaudiólogos', label: 'Fonoaudiólogos' },
                  ]}
                  className="min-w-[190px] text-left normal-case"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Alocação
                <CustomSelect
                  value={allocationFilter}
                  onChange={(value) =>
                    onAllocationFilterChange?.(value as 'all' | 'nacional' | 'por_contrato')
                  }
                  options={[
                    { value: 'all', label: 'Todos' },
                    { value: 'nacional', label: 'Nacional' },
                    { value: 'por_contrato', label: 'Por contrato' },
                  ]}
                  className="min-w-[180px] text-left normal-case"
                />
              </label>
              <label className="relative min-w-0 flex-1 lg:min-w-[22rem] lg:max-w-2xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => onSearchQueryChange?.(event.target.value)}
                  placeholder="Buscar por nome, CRM, profissão ou especialidade..."
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
              <col className="w-[22%]" />
              <col className="w-[11%]" />
              <col className="w-[14%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3.5 text-left sm:px-6">Profissional</th>
                <th className="px-3 py-3.5 text-center">CRM</th>
                <th className="px-3 py-3.5 text-center">Profissão</th>
                <th className="px-3 py-3.5 text-center">Especialidade</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-3 py-3.5 text-center">Conectado</th>
                <th className="px-3 py-3.5 text-center">Produtividade</th>
                <th className="px-5 py-3.5 text-center sm:px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-gray-500 sm:px-6">
                    Nenhum profissional encontrado para os filtros atuais.
                  </td>
                </tr>
              ) : null}
              {filtered.map((doctor) => (
                <tr
                  key={doctor.id}
                  className="align-middle text-sm text-gray-700 hover:bg-gray-50/80"
                >
                  <td className="px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <AdminDoctorAvatar
                        avatarUrl={doctor.avatarUrl}
                        name={doctor.name}
                        onPhotoClick={
                          doctor.avatarUrl?.trim()
                            ? () =>
                                setPhotoPreview({
                                  url: doctor.avatarUrl,
                                  name: doctor.name,
                                })
                            : undefined
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900">{doctor.name}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {doctor.city}/{doctor.state}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-xs tabular-nums text-gray-700">
                    {doctor.crm} · {doctor.ufCrm}
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    {doctor.profession}
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-gray-700">
                    <AdminSpecialtiesCell specialty={doctor.specialty} specialties={doctor.specialties} />
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <SituationStatusBadge
                      config={
                        adminMedicoAccountStatusBadgeConfig[doctor.status]
                      }
                      widthClass={ADMIN_MEDICO_BADGE_WIDTH}
                    />
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <SituationStatusBadge
                      config={
                        isDoctorConnected(doctor)
                          ? adminMedicoConnectionBadgeConfig.online
                          : adminMedicoConnectionBadgeConfig.offline
                      }
                      widthClass={ADMIN_MEDICO_BADGE_WIDTH}
                    />
                  </td>
                  <td className="px-3 py-4 text-center align-middle text-xs text-gray-700">
                    <p className="font-semibold text-gray-900">
                      {doctor.totalPatientsThisMonth} pacientes
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      Nota {doctor.averageRating.toFixed(1)} · {doctor.totalReviews} avaliações
                    </p>
                  </td>
                  <td className="px-5 py-4 text-center align-middle sm:px-6">
                    <button
                      ref={(element) => {
                        actionButtonRefs.current[doctor.id] = element
                      }}
                      type="button"
                      data-doctor-actions-trigger
                      onClick={() => openActionsMenu(doctor.id)}
                      className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[var(--brand-primary-light)] hover:text-[var(--brand-primary)]"
                      aria-label={`Ações para ${doctor.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
          <p className="text-xs text-gray-500">
            Mostrando {formatNumber(filtered.length)} de {formatNumber(doctors.length)} profissionais
            cadastrados.
          </p>
        </footer>
      </section>

      <Toast
        message={toast?.message ?? ''}
        visible={toast !== null}
        onClose={() => setToast(null)}
      />

      {actionsDoctorId && actionsStyle ? (
        <div
          data-doctor-actions-menu
          style={actionsStyle}
          className="overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          role="menu"
          aria-label="Ações do profissional"
        >
          {(() => {
            const doctor = doctors.find((item) => item.id === actionsDoctorId)
            if (!doctor) return null
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsDoctorId(null)
                    openDrawer(doctor, 'view')
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4 shrink-0 text-gray-500" />
                  Visualizar
                </button>
                {canEdit ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionsDoctorId(null)
                      openDrawer(doctor, 'edit')
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <Pencil className="h-4 w-4 shrink-0 text-gray-500" />
                    Editar
                  </button>
                ) : null}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setActionsDoctorId(null)
                    const phoneDigits = doctor.phone.replace(/\D/g, '')
                    if (!phoneDigits) {
                      setToast({ message: 'Telefone não disponível para contato.' })
                      return
                    }
                    window.open(`https://wa.me/55${phoneDigits}`, '_blank', 'noopener,noreferrer')
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-gray-500" />
                  Contatar
                </button>
                {canEdit && doctor.status === 'ativo' ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionsDoctorId(null)
                      setInactivateTargetDoctor(doctor)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <Ban className="h-4 w-4 shrink-0" />
                    Inativar
                  </button>
                ) : null}
                {canEdit && doctor.status === 'inativo' ? (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setActionsDoctorId(null)
                      setReactivateTargetDoctor(doctor)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-emerald-700 transition hover:bg-emerald-50"
                  >
                    <UserCheck className="h-4 w-4 shrink-0" />
                    Reativar
                  </button>
                ) : null}
              </>
            )
          })()}
        </div>
      ) : null}

      <AdminMedicoDetailDrawer
        doctor={drawerDoctor}
        mode={drawerMode}
        open={drawerOpen}
        closing={drawerClosing}
        onClose={closeDrawer}
        onTransitionEnd={handleDrawerTransitionEnd}
        onSave={handleSaveDoctor}
      />

      <AdminProfessionalCreateDrawer
        open={createDrawerOpen}
        closing={createDrawerClosing}
        onClose={closeCreateDrawer}
        onTransitionEnd={handleCreateDrawerTransitionEnd}
        onCompleted={handleCreateProfessional}
        onCreate={onCreateDoctor}
      />

      <PinUnlockModal
        open={inactivateTargetDoctor !== null}
        onClose={() => setInactivateTargetDoctor(null)}
        onSuccess={() => {
          if (!inactivateTargetDoctor) return
          void (async () => {
            try {
              if (!onInactivateDoctor) {
                throw new Error('Inativação indisponível.')
              }
              await onInactivateDoctor(inactivateTargetDoctor.id)
              setToast({ message: `${inactivateTargetDoctor.name} inativado com sucesso.` })
            } catch {
              setToast({ message: 'Não foi possível inativar o profissional.' })
            } finally {
              setInactivateTargetDoctor(null)
            }
          })()
        }}
        title="Inativar profissional"
        titleId="inactivate-professional-pin-title"
        description={
          inactivateTargetDoctor
            ? `Para inativar o acesso de ${inactivateTargetDoctor.name}, informe a senha de 6 dígitos.`
            : 'Informe a senha de 6 dígitos para confirmar a inativação.'
        }
        submitLabel="Confirmar inativação"
        pinCompleteHint="Senha completa. Toque em confirmar inativação."
        icon={Ban}
      />

      <PinUnlockModal
        open={reactivateTargetDoctor !== null}
        onClose={() => setReactivateTargetDoctor(null)}
        onSuccess={() => {
          if (!reactivateTargetDoctor) return
          void (async () => {
            try {
              if (!onReactivateDoctor) {
                throw new Error('Reativação indisponível.')
              }
              await onReactivateDoctor(reactivateTargetDoctor.id)
              setToast({ message: `${reactivateTargetDoctor.name} reativado com sucesso.` })
            } catch {
              setToast({ message: 'Não foi possível reativar o profissional.' })
            } finally {
              setReactivateTargetDoctor(null)
            }
          })()
        }}
        title="Reativar profissional"
        titleId="reactivate-professional-pin-title"
        description={
          reactivateTargetDoctor
            ? `Para reativar o acesso de ${reactivateTargetDoctor.name}, informe a senha de 6 dígitos.`
            : 'Informe a senha de 6 dígitos para confirmar a reativação.'
        }
        submitLabel="Confirmar reativação"
        pinCompleteHint="Senha completa. Toque em confirmar reativação."
        icon={UserCheck}
      />

      {photoPreview ? (
        <SupportChatImageLightbox
          url={photoPreview.url}
          name={photoPreview.name}
          onClose={() => setPhotoPreview(null)}
        />
      ) : null}
    </>
  )
}

