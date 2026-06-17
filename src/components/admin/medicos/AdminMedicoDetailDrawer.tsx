import { Building2, FileText, Loader2, MapPin, Phone, Shield, Star, User2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import type { AdminDoctor } from '../../../types/adminMedicos'
import { maskCpfForDisplay } from '../../../utils/lgpdDisplay'
import { ExportFormatMenu, type ExportFormat } from '../../ui/ExportFormatMenu'
import { Toast } from '../../ui/Toast'
import { formatAdminDoctorContractingEntity } from './adminMedicoUi'
import { AdminDoctorAvatar } from './AdminDoctorAvatar'
import { SupportChatImageLightbox } from '../../suporte/SupportChatImageLightbox'

export type AdminMedicoDrawerMode = 'view' | 'edit'

type AdminMedicoDetailDrawerProps = {
  doctor: AdminDoctor | null
  mode: AdminMedicoDrawerMode
  open: boolean
  closing: boolean
  detailLoading?: boolean
  onClose: () => void
  onTransitionEnd: () => void
  onSave?: (doctor: AdminDoctor) => void
}

type DrawerTab = 'cadastro' | 'atendimentos' | 'avaliacoes'

const viewDrawerTabs: { id: DrawerTab; label: string }[] = [
  { id: 'cadastro', label: 'Dados cadastrais' },
  { id: 'atendimentos', label: 'Atendimentos' },
  { id: 'avaliacoes', label: 'Avaliação e comentários' },
]

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

export function AdminMedicoDetailDrawer({
  doctor,
  mode,
  open,
  closing,
  detailLoading = false,
  onClose,
  onTransitionEnd,
  onSave,
}: AdminMedicoDetailDrawerProps) {
  const isEditMode = mode === 'edit'
  const [activeTab, setActiveTab] = useState<DrawerTab>('cadastro')
  const [openAttendanceDocsId, setOpenAttendanceDocsId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [onCallLabel, setOnCallLabel] = useState('')
  const [photoPreview, setPhotoPreview] = useState<{ url: string; name: string } | null>(null)
  const isActive = open || closing

  useEffect(() => {
    if (!open || !doctor) return
    setActiveTab('cadastro')
    setOpenAttendanceDocsId(null)
    setToastMessage(null)
    setPhone(doctor.phone)
    setSpecialty(doctor.specialty)
    setOnCallLabel(doctor.onCallLabel)
    setPhotoPreview(null)
  }, [open, doctor])

  useEffect(() => {
    if (activeTab !== 'atendimentos' || !openAttendanceDocsId) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (
        target.closest('[data-attendance-doc-trigger]') ||
        target.closest('[data-attendance-doc-popover]')
      ) {
        return
      }
      setOpenAttendanceDocsId(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [activeTab, openAttendanceDocsId])

  if (!doctor || !isActive) return null

  const panelVisible = open && !closing
  const contractingEntity = formatAdminDoctorContractingEntity(doctor)

  function handleEditSubmit(event: FormEvent) {
    event.preventDefault()
    if (!doctor || !onSave) return
    onSave({
      ...doctor,
      phone: phone.trim() || doctor.phone,
      specialty: specialty.trim() || doctor.specialty,
      onCallLabel: onCallLabel.trim() || doctor.onCallLabel,
    })
  }
  const avgAttendanceMinutes =
    doctor.attendances.reduce((sum, attendance) => sum + attendance.durationMinutes, 0) /
    Math.max(1, doctor.attendances.length)
  const totalDocsFromAttendances = doctor.attendances.reduce(
    (sum, attendance) => sum + attendance.documents.length,
    0,
  )
  const averageReview =
    doctor.reviews.length > 0
      ? doctor.reviews.reduce((sum, review) => sum + review.rating, 0) / doctor.reviews.length
      : doctor.averageRating
  const confirmedShifts = doctor.confirmedShifts ?? []
  const completionRate = doctor.completionRate ?? 0
  const totalConsultations = doctor.totalConsultations ?? doctor.attendances.length
  const showReviewsTab = doctor.totalReviews > 0 || doctor.reviews.length > 0
  const visibleTabs = showReviewsTab
    ? viewDrawerTabs
    : viewDrawerTabs.filter((tab) => tab.id !== 'avaliacoes')

  function handleExport(format: ExportFormat) {
    setToastMessage(
      format === 'pdf'
        ? `Relatório completo de ${doctor.name} exportado em PDF.`
        : `Relatório completo de ${doctor.name} exportado em Excel.`,
    )
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar detalhes do profissional"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-medico-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[95vh] max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="flex items-start gap-3 border-b border-gray-200 bg-white px-5 pb-3 pt-4 sm:px-6">
          <div className="shrink-0">
            <AdminDoctorAvatar
              avatarUrl={doctor.avatarUrl}
              name={doctor.name}
              size="md"
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
          </div>
          <div className="min-w-0 flex-1 pr-8">
            <h2 id="admin-medico-drawer-title" className="text-lg font-bold text-gray-900">
              {isEditMode ? 'Editar profissional' : doctor.name}
            </h2>
            {isEditMode ? (
              <p className="mt-0.5 text-sm font-semibold text-gray-700">{doctor.name}</p>
            ) : null}
            <p className="mt-0.5 text-sm text-gray-600">
              {doctor.specialty} · CRM {doctor.crm} ({doctor.ufCrm})
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {doctor.city}/{doctor.state} ·{' '}
              {doctor.allocation === 'nacional' ? 'Alocação nacional' : 'Alocação por contrato'}
            </p>
            <p className="mt-1.5 text-xs font-medium text-gray-600">
              <span className="font-semibold text-gray-800">{contractingEntity.title}:</span>{' '}
              {contractingEntity.primary}
              {contractingEntity.secondary ? ` · ${contractingEntity.secondary}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
                <Star className="h-3 w-3" />
                Nota {doctor.averageRating.toFixed(1)} ({doctor.totalReviews} avaliações)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700 ring-1 ring-sky-200">
                <Shield className="h-3 w-3" />
                Cadastro verificado
              </span>
            </div>
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-2">
            {!isEditMode ? (
              <ExportFormatMenu
                resultCount={doctor.attendances.length}
                itemSingular="atendimento"
                itemPlural="atendimentos"
                triggerLabel="Exportar relatório"
                resultScopeLabel="do profissional selecionado"
                onSelect={handleExport}
              />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {!isEditMode ? (
        <nav className="flex shrink-0 gap-0 border-b border-gray-200 bg-white px-4 sm:px-6">
          {visibleTabs.map((tab) => {
            const isActiveTab = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'relative shrink-0 px-4 py-3 text-sm font-semibold transition',
                  isActiveTab ? 'text-[var(--brand-primary)]' : 'text-gray-500 hover:text-gray-800',
                ].join(' ')}
              >
                {tab.label}
                <span
                  className={[
                    'pointer-events-none absolute inset-x-3 bottom-0 h-[3px] rounded-full transition-all duration-200',
                    isActiveTab
                      ? 'bg-gradient-to-r from-[var(--brand-primary)] via-orange-500 to-amber-400 opacity-100 shadow-[0_2px_10px_rgba(255,107,0,0.45)]'
                      : 'scale-x-0 opacity-0',
                  ].join(' ')}
                  aria-hidden
                />
              </button>
            )
          })}
        </nav>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          {isEditMode ? (
            <form id="admin-medico-edit-form" onSubmit={handleEditSubmit} className="space-y-4">
              <section className="rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/60 to-white p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                  <Building2 className="h-3.5 w-3.5" />
                  {contractingEntity.title}
                </h3>
                <p className="text-sm font-bold text-gray-900">{contractingEntity.primary}</p>
                {contractingEntity.secondary ? (
                  <p className="mt-0.5 text-xs text-gray-600">{contractingEntity.secondary}</p>
                ) : null}
                <p className="mt-2 text-[11px] text-gray-500">
                  O vínculo com a entidade contratante não pode ser alterado nesta tela.
                </p>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-bold text-gray-900">Dados editáveis</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={doctor.name}
                      readOnly
                      disabled
                      className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-600`}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">CPF</label>
                    <input
                      type="text"
                      value={maskCpfForDisplay(doctor.cpf)}
                      readOnly
                      disabled
                      className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-600`}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Especialidade principal
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(event) => setSpecialty(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                      Escala / plantão
                    </label>
                    <input
                      type="text"
                      value={onCallLabel}
                      onChange={(event) => setOnCallLabel(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>
            </form>
          ) : null}

          {!isEditMode && activeTab === 'cadastro' ? (
            <>
              <section className="mb-4 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/60 to-white p-4">
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                  <Building2 className="h-3.5 w-3.5" />
                  {contractingEntity.title}
                </h3>
                <p className="text-sm font-bold text-gray-900">{contractingEntity.primary}</p>
                {contractingEntity.secondary ? (
                  <p className="mt-0.5 text-xs text-gray-600">{contractingEntity.secondary}</p>
                ) : null}
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <User2 className="h-3.5 w-3.5" />
                    Dados cadastrais
                  </h3>
                  <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200/80 bg-white px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        CPF
                      </dt>
                      <dd className="mt-0.5 font-semibold text-gray-900">
                        {maskCpfForDisplay(doctor.cpf)}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200/80 bg-white px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        RG
                      </dt>
                      <dd className="mt-0.5 font-semibold text-gray-900">{doctor.rg}</dd>
                    </div>
                    <div className="rounded-lg border border-gray-200/80 bg-white px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        CRM / UF
                      </dt>
                      <dd className="mt-0.5 font-semibold text-gray-900">
                        {doctor.crm} · {doctor.ufCrm}
                      </dd>
                    </div>
                    <div className="rounded-lg border border-gray-200/80 bg-white px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        Especialidade principal
                      </dt>
                      <dd className="mt-0.5 font-semibold text-gray-900">{doctor.specialty}</dd>
                    </div>
                  </dl>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-gradient-to-b from-sky-50/40 to-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Localização / contato
                  </h3>
                  <dl className="mt-3 divide-y divide-gray-200/70 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        Cidade / UF
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        {doctor.city} · {doctor.state}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        Entidade contratante
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        {contractingEntity.primary}
                        {contractingEntity.secondary ? (
                          <span className="mt-0.5 block text-xs font-medium text-gray-500">
                            {contractingEntity.secondary}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        Alocação
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        {doctor.allocation === 'nacional'
                          ? 'Escala nacional de plantões'
                          : 'Vínculo por contrato municipal'}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[120px_1fr] gap-3 py-2.5">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500/90">
                        Escala / plantão
                      </dt>
                      <dd className="font-semibold text-gray-900">{doctor.onCallLabel}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              {confirmedShifts.length > 0 ? (
                <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Plantões confirmados
                  </h3>
                  <ul className="space-y-2">
                    {confirmedShifts.map((shift) => (
                      <li
                        key={shift.id}
                        className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2.5 text-sm"
                      >
                        <p className="font-semibold text-gray-900">
                          {shift.dateLabel} · {shift.timeLabel}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {shift.specialty} · {shift.city}
                          {shift.unitName !== '—' ? ` · ${shift.unitName}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <Phone className="h-3.5 w-3.5" />
                  Atividade recente
                </h3>
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Pacientes no mês
                    </p>
                    <p className="mt-0.5 text-base font-bold text-gray-900">
                      {doctor.totalPatientsThisMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Último login
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900">{doctor.lastLoginAt}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Última saída
                    </p>
                    <p className="mt-0.5 text-sm text-gray-900">
                      {doctor.lastLogoutAt ?? 'Plantão em andamento'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FileText className="h-3.5 w-3.5" />
                  Documentos enviados
                </h3>
                {doctor.documents.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum documento anexado ao cadastro.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {doctor.documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-800">{doc.label}</p>
                          <p className="truncate text-xs text-gray-500">{doc.fileName}</p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-[var(--brand-primary)] transition hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary-light)]/40"
                        >
                          Ver
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : null}

          {!isEditMode && activeTab === 'atendimentos' ? (
            <>
              {detailLoading ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" aria-hidden />
                  Carregando atendimentos…
                </div>
              ) : (
                <>
              <section className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-200/80 bg-white px-3 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Atendimentos
                  </p>
                  <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900">
                    {totalConsultations}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white px-3 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Taxa de conclusão
                  </p>
                  <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900">
                    {completionRate}%
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white px-3 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Tempo médio
                  </p>
                  <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900">
                    {Math.round(avgAttendanceMinutes)} min
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200/80 bg-white px-3 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    PDFs emitidos
                  </p>
                  <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-gray-900">
                    {totalDocsFromAttendances}
                  </p>
                </div>
              </section>

              <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Histórico de atendimentos
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        <th className="px-2 py-2.5">Data e hora</th>
                        <th className="px-2 py-2.5 text-center">Cidade contratante</th>
                        <th className="px-2 py-2.5 text-center">Paciente</th>
                        <th className="px-2 py-2.5 text-center">Tempo de atendimento</th>
                        <th className="px-2 py-2.5 text-center">Documentos</th>
                      </tr>
                    </thead>
                <tbody>
                  {doctor.attendances.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-8 text-center text-sm text-gray-500">
                        Nenhum atendimento registrado para este profissional.
                      </td>
                    </tr>
                  ) : (
                    doctor.attendances.map((attendance) => (
                      <tr key={attendance.id} className="border-b border-gray-200 text-sm text-gray-700">
                        <td className="px-2 py-3 font-medium text-gray-900">{attendance.dateTimeLabel}</td>
                        <td className="px-2 py-3 text-center">{attendance.contractCity}</td>
                        <td className="px-2 py-3 text-center">{attendance.patientName}</td>
                        <td className="px-2 py-3 text-center">{attendance.durationMinutes} min</td>
                        <td className="px-2 py-3 text-center">
                          <div className="relative inline-block">
                            <button
                              type="button"
                              data-attendance-doc-trigger
                              onClick={() =>
                                setOpenAttendanceDocsId((current) =>
                                  current === attendance.id ? null : attendance.id,
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)]"
                              aria-label="Ver documentos do atendimento"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            {openAttendanceDocsId === attendance.id ? (
                              <div
                                data-attendance-doc-popover
                                className="absolute right-0 top-9 z-10 w-60 rounded-lg border border-gray-200 bg-white p-2 text-left shadow-lg"
                              >
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                  Documentos (PDF)
                                </p>
                                {attendance.documents.length === 0 ? (
                                  <p className="px-2 py-1 text-xs text-gray-500">Sem documentos emitidos.</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {attendance.documents.map((doc) => (
                                      <li key={doc.id} className="text-xs text-gray-700">
                                        <button
                                          type="button"
                                          className="w-full truncate rounded-md px-2 py-1 text-left transition hover:bg-gray-100 hover:text-[var(--brand-primary)]"
                                        >
                                          {doc.label}
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                  </table>
                </div>
              </section>
                </>
              )}
            </>
          ) : null}

          {!isEditMode && activeTab === 'avaliacoes' && showReviewsTab ? (
            <>
              {detailLoading ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" aria-hidden />
                  Carregando avaliações…
                </div>
              ) : (
                <>
              <section className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Nota média
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const filled = idx < Math.round(averageReview)
                      return (
                        <Star
                          key={idx}
                          className={`h-6 w-6 ${
                            filled
                              ? 'fill-amber-400 text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.45)]'
                              : 'fill-gray-100 text-gray-300'
                          }`}
                        />
                      )
                    })}
                  </div>
                  <p className="text-lg font-bold text-gray-900">{averageReview.toFixed(1)} / 5</p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {doctor.reviews.length > 0
                    ? `${doctor.reviews.length} comentário(s) recente(s)`
                    : doctor.totalReviews > 0
                      ? `${doctor.totalReviews} avaliação(ões) no total`
                      : 'Nenhuma avaliação registrada'}
                </p>
              </section>

              <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Comentários dos pacientes
                </h3>
                {doctor.reviews.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhum comentário detalhado disponível no momento.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {doctor.reviews.map((review) => (
                      <li
                        key={review.id}
                        className="rounded-lg border border-gray-200 bg-gray-50/70 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-gray-600">{review.author}</p>
                          <p className="text-[11px] text-gray-400">{review.createdAtLabel}</p>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`h-4 w-4 ${
                                idx < review.rating
                                  ? 'fill-amber-400 text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.45)]'
                                  : 'fill-gray-100 text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
                </>
              )}
            </>
          ) : null}
        </div>

        {isEditMode ? (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="admin-medico-edit-form"
              className="btn-brand-gradient rounded-lg px-4 py-2 text-sm font-semibold"
            >
              Salvar alterações
            </button>
          </footer>
        ) : null}
      </aside>

      <Toast
        message={toastMessage ?? ''}
        visible={toastMessage !== null}
        onClose={() => setToastMessage(null)}
      />

      {photoPreview ? (
        <SupportChatImageLightbox
          url={photoPreview.url}
          name={photoPreview.name}
          onClose={() => setPhotoPreview(null)}
        />
      ) : null}
    </div>,
    document.body,
  )
}

