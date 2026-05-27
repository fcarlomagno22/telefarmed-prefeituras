import { Activity, Ban, Eye, MessageCircle, MoreVertical, Pencil, Search, Star, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { AdminDoctor } from '../../../data/adminMedicosMock'
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

type AdminMedicosMainPanelProps = {
  doctors: AdminDoctor[]
  onDoctorsChange?: (doctors: AdminDoctor[]) => void
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

function filterDoctors(query: string, doctors: AdminDoctor[], allocation: string) {
  const trimmed = query.trim().toLowerCase()
  return doctors.filter((doctor) => {
    if (allocation !== 'all' && doctor.allocation !== allocation) return false
    if (!trimmed) return true
    const haystack = `${doctor.name} ${doctor.crm} ${doctor.specialty} ${doctor.city} ${doctor.state}`.toLowerCase()
    return haystack.includes(trimmed)
  })
}

export function AdminMedicosMainPanel({
  doctors,
  onDoctorsChange,
  bindAddAction,
  embedded = false,
}: AdminMedicosMainPanelProps) {
  const [search, setSearch] = useState('')
  const [allocationFilter, setAllocationFilter] = useState<'all' | 'nacional' | 'por_contrato'>(
    'all',
  )
  const [professionFilter, setProfessionFilter] = useState<
    'all' | 'Médicos' | 'Psicólogos' | 'Nutricionistas' | 'Fonoaudiólogos'
  >('all')
  const [drawerDoctor, setDrawerDoctor] = useState<AdminDoctor | null>(null)
  const [drawerMode, setDrawerMode] = useState<AdminMedicoDrawerMode>('view')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerClosing, setDrawerClosing] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [createDrawerClosing, setCreateDrawerClosing] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [inactiveDoctorIds, setInactiveDoctorIds] = useState<string[]>([])
  const [actionsDoctorId, setActionsDoctorId] = useState<string | null>(null)
  const [actionsStyle, setActionsStyle] = useState<CSSProperties | null>(null)
  const [inactivateTargetDoctor, setInactivateTargetDoctor] = useState<AdminDoctor | null>(null)

  function getDoctorAccountStatus(doctor: AdminDoctor): 'ativo' | 'inativo' {
    if (inactiveDoctorIds.includes(doctor.id)) return 'inativo'
    return doctor.status
  }

  function isDoctorConnected(doctor: AdminDoctor) {
    return doctor.isOnlineNow && getDoctorAccountStatus(doctor) === 'ativo'
  }
  const actionButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const filtered = useMemo(() => {
    const base = filterDoctors(search, doctors, allocationFilter)
    if (professionFilter === 'all') return base
    return base.filter((doctor) => doctor.profession === professionFilter)
  }, [search, doctors, allocationFilter, professionFilter])

  const kpiCards = useMemo(
    () => [
      {
        label: 'Base de profissionais',
        value: formatNumber(doctors.length),
        suffix: 'profissionais cadastrados',
        icon: Users,
        iconGradient: 'from-sky-500 via-blue-500 to-indigo-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(59,130,246,0.35)]',
        iconRing: 'ring-blue-100/80',
        topBar: 'from-sky-400 to-blue-500',
      },
      {
        label: 'Online agora',
        value: formatNumber(doctors.filter((d) => d.isOnlineNow).length),
        suffix: 'em plantão / sessão',
        icon: Eye,
        iconGradient: 'from-emerald-500 via-teal-500 to-emerald-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(16,185,129,0.35)]',
        iconRing: 'ring-emerald-100/80',
        topBar: 'from-emerald-400 to-teal-500',
      },
      {
        label: 'Produtividade média',
        value: formatNumber(
          doctors.reduce((sum, d) => sum + d.totalPatientsThisMonth, 0) /
            Math.max(1, doctors.length),
        ),
        suffix: 'pacientes / mês',
        icon: Activity,
        iconGradient: 'from-amber-500 via-orange-500 to-amber-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(245,158,11,0.35)]',
        iconRing: 'ring-amber-100/80',
        topBar: 'from-amber-400 to-orange-500',
      },
      {
        label: 'Nota média',
        value: formatNumber(
          doctors.reduce((sum, d) => sum + d.averageRating, 0) / Math.max(1, doctors.length),
          1,
        ),
        suffix: 'avaliação dos pacientes',
        icon: Star,
        iconGradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
        iconShadow: 'shadow-[0_8px_20px_rgba(139,92,246,0.35)]',
        iconRing: 'ring-violet-100/80',
        topBar: 'from-violet-400 to-purple-500',
      },
    ],
    [doctors],
  )

  const openDrawer = useCallback((doctor: AdminDoctor, mode: AdminMedicoDrawerMode = 'view') => {
    setDrawerDoctor(doctor)
    setDrawerMode(mode)
    setDrawerClosing(false)
    setDrawerOpen(true)
  }, [])

  const openAddProfessional = useCallback(() => {
    setCreateDrawerClosing(false)
    setCreateDrawerOpen(true)
  }, [])

  useEffect(() => {
    bindAddAction?.(openAddProfessional)
    return () => bindAddAction?.(null)
  }, [bindAddAction, openAddProfessional])

  function handleSaveDoctor(updated: AdminDoctor) {
    onDoctorsChange?.(doctors.map((item) => (item.id === updated.id ? updated : item)))
    setToast({
      message: updated.name
        ? `${updated.name} atualizado com sucesso.`
        : 'Profissional atualizado com sucesso.',
    })
    closeDrawer()
  }

  function handleCreateProfessional(doctor: AdminDoctor) {
    onDoctorsChange?.([...doctors, doctor])
    setToast({
      message: doctor.name
        ? `${doctor.name} cadastrado com sucesso.`
        : 'Profissional cadastrado com sucesso.',
    })
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
              <p className="mt-1 text-sm text-gray-500">
                Cadastro de profissionais, escala, status online e produtividade por contrato ou base
                nacional.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-4xl lg:justify-end">
              <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Profissão
                <CustomSelect
                  value={professionFilter}
                  onChange={(value) =>
                    setProfessionFilter(
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
                    setAllocationFilter(value as 'all' | 'nacional' | 'por_contrato')
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
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                      <img
                        src={doctor.avatarUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover shadow-sm"
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
                    <span className="block truncate" title={doctor.specialty}>
                      {doctor.specialty}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center align-middle">
                    <SituationStatusBadge
                      config={
                        adminMedicoAccountStatusBadgeConfig[getDoctorAccountStatus(doctor)]
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
                {getDoctorAccountStatus(doctor) === 'ativo' ? (
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
      />

      <PinUnlockModal
        open={inactivateTargetDoctor !== null}
        onClose={() => setInactivateTargetDoctor(null)}
        onSuccess={() => {
          if (!inactivateTargetDoctor) return
          setInactiveDoctorIds((current) =>
            current.includes(inactivateTargetDoctor.id)
              ? current
              : [...current, inactivateTargetDoctor.id],
          )
          setToast({ message: `${inactivateTargetDoctor.name} inativado com sucesso.` })
          setInactivateTargetDoctor(null)
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
    </>
  )
}

