import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  History,
  Home,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Stethoscope,
  StickyNote,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  formatRelationship,
  getNetworkUserProfile,
  type ConsultationRecord,
} from '../../data/networkUserProfiles'
import { STALE_REGISTRATION_MONTHS } from '../../config/userDrawer'
import {
  contactChannelLabel,
  formatActivityDate,
  isRegistrationStale,
  teamContactChannelLabel,
  type ContactChannel,
  type PatientContactLogEntry,
  type TeamContactRecord,
} from '../../data/networkUserActivity'
import type { NetworkUser } from '../../data/networkUsersMock'
import { emptyPatientContact, type PatientContact } from '../../data/unitDashboardMock'
import {
  formatAnnotationDate,
  type UserAnnotation,
  type UserProfileEdits,
} from '../../data/networkUserLocalData'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { CustomSelect } from '../ui/CustomSelect'
import {
  maskAddressFieldForDisplay,
  maskCpfForDisplay,
  maskNeighborhoodForDisplay,
  maskPhoneForDisplay,
  maskStreetForDisplay,
  maskZipCodeForDisplay,
} from '../../utils/lgpdDisplay'
import { buildEditableData, drawerInputClass } from './userDetailDrawerTypes'

type DrawerTab =
  | 'resumo'
  | 'pessoais'
  | 'endereco'
  | 'contatos'
  | 'consultas'
  | 'cadastro'
  | 'anotacoes'
  | 'historico'

type UserDetailDrawerProps = {
  user: NetworkUser | null
  open: boolean
  closing: boolean
  sensitiveDataUnlocked: boolean
  editSessionKey: number
  userEdits: UserProfileEdits | null
  annotations: UserAnnotation[]
  lastReviewedAt: string | null
  contactLogs: PatientContactLogEntry[]
  lastTeamContact: TeamContactRecord | null
  onClose: () => void
  onTransitionEnd: () => void
  onRequestUnlock?: () => void
  onRequestEditUnlock?: () => void
  onSaveEdits: (edits: UserProfileEdits, changedFields: string[]) => void
  onSaveContacts: (contacts: PatientContact[]) => void
  onRegisterContact: (channel: ContactChannel, phone: string, note: string) => void
  onAddAnnotation: (text: string) => void
  extraContextItems?: { label: string; value: string }[]
}

const tabs: { id: DrawerTab; label: string; icon: typeof UserRound }[] = [
  { id: 'resumo', label: 'Resumo', icon: UserRound },
  { id: 'pessoais', label: 'Dados pessoais', icon: ClipboardList },
  { id: 'endereco', label: 'Endereço', icon: Home },
  { id: 'contatos', label: 'Contatos', icon: Users },
  { id: 'consultas', label: 'Consultas', icon: History },
  { id: 'cadastro', label: 'Cadastro', icon: Calendar },
  { id: 'anotacoes', label: 'Anotações', icon: StickyNote },
  { id: 'historico', label: 'Hist. contatos', icon: Phone },
]

const searchableTabs: DrawerTab[] = ['consultas', 'anotacoes', 'historico']

const contactChannelOptions: { value: ContactChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'telefone', label: 'Telefone' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'outro', label: 'Outro' },
]

const fieldLabels: Record<Exclude<keyof UserProfileEdits, 'contacts'>, string> = {
  phone: 'Celular',
  email: 'E-mail',
  zipCode: 'CEP',
  street: 'Logradouro',
  number: 'Número',
  complement: 'Complemento',
  neighborhood: 'Bairro',
  city: 'Cidade',
  state: 'UF',
  guardianName: 'Responsável',
  guardianCpf: 'CPF do responsável',
}

function detectChangedFields(before: UserProfileEdits, after: UserProfileEdits) {
  const changed: string[] = []
  ;(Object.keys(fieldLabels) as (keyof typeof fieldLabels)[]).forEach((key) => {
    if (before[key] !== after[key]) changed.push(fieldLabels[key])
  })
  return changed
}

function onlyDigitsPhone(value: string) {
  return value.replace(/\D/g, '')
}

const relationshipOptions = [
  { value: 'pai', label: 'Pai' },
  { value: 'mae', label: 'Mãe' },
  { value: 'conjuge', label: 'Cônjuge / Companheiro(a)' },
  { value: 'filho', label: 'Filho(a)' },
  { value: 'irmao', label: 'Irmão(ã)' },
  { value: 'avo', label: 'Avô / Avó' },
  { value: 'tio', label: 'Tio(a)' },
  { value: 'amigo', label: 'Amigo(a)' },
  { value: 'outro', label: 'Outro' },
]

const consultationStatusLabel: Record<ConsultationRecord['status'], string> = {
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  agendada: 'Agendada',
}

const consultationStatusClass: Record<ConsultationRecord['status'], string> = {
  concluida: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelada: 'bg-red-50 text-red-700 ring-red-200',
  agendada: 'bg-sky-50 text-sky-700 ring-sky-200',
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{value || '—'}</dd>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  className,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  type?: string
}) {
  return (
    <label className={`block ${className ?? ''}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 ${drawerInputClass}`}
      />
    </label>
  )
}

function SectionCard({
  title,
  children,
}: {
  title?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
      {title ? (
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  )
}

export function UserDetailDrawer({
  user,
  open,
  closing,
  sensitiveDataUnlocked,
  editSessionKey,
  userEdits,
  annotations,
  lastReviewedAt,
  contactLogs,
  lastTeamContact,
  onClose,
  onTransitionEnd,
  onRequestUnlock,
  onRequestEditUnlock,
  onSaveEdits,
  onSaveContacts,
  onRegisterContact,
  onAddAnnotation,
  extraContextItems = [],
}: UserDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('resumo')
  const [entered, setEntered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<UserProfileEdits | null>(null)
  const [contactsDraft, setContactsDraft] = useState<PatientContact[]>([])
  const [contactsBaseline, setContactsBaseline] = useState('')
  const [newAnnotation, setNewAnnotation] = useState('')
  const [drawerSearch, setDrawerSearch] = useState('')
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false)
  const [contactToDeleteIndex, setContactToDeleteIndex] = useState<number | null>(null)
  const [registerChannel, setRegisterChannel] = useState<ContactChannel>('telefone')
  const [registerPhone, setRegisterPhone] = useState('')
  const [registerNote, setRegisterNote] = useState('')
  const [registerError, setRegisterError] = useState<string | null>(null)
  const handledEditSessionRef = useRef(0)

  useEffect(() => {
    if (!open || !user) {
      setEntered(false)
      setIsEditing(false)
      setDraft(null)
      setNewAnnotation('')
      setDrawerSearch('')
      setPhotoPreviewOpen(false)
      setContactToDeleteIndex(null)
      setRegisterChannel('telefone')
      setRegisterPhone('')
      setRegisterNote('')
      setRegisterError(null)
      handledEditSessionRef.current = 0
      return
    }

    setActiveTab('resumo')
    setEntered(false)
    setIsEditing(false)
    setDraft(null)
    setNewAnnotation('')
    setDrawerSearch('')
    setPhotoPreviewOpen(false)
    setContactToDeleteIndex(null)
    setRegisterChannel('telefone')
    setRegisterPhone('')
    setRegisterNote('')
    setRegisterError(null)
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })

    return () => cancelAnimationFrame(frame)
  }, [open, user?.id])

  useEffect(() => {
    if (!user || !open) return
    const profile = getNetworkUserProfile(user)
    const base = buildEditableData(user, profile, userEdits)
    const contacts = base.contacts.map((contact) => ({ ...contact }))
    setContactsDraft(contacts)
    setContactsBaseline(JSON.stringify(contacts))
  }, [open, user?.id, userEdits])

  useEffect(() => {
    if (!user || editSessionKey === 0 || editSessionKey === handledEditSessionRef.current) return
    handledEditSessionRef.current = editSessionKey
    const profile = getNetworkUserProfile(user)
    const base = buildEditableData(user, profile, userEdits)
    setDraft({ ...base, contacts: contactsDraft })
    setIsEditing(true)
  }, [editSessionKey, user?.id, userEdits])

  const isActive = open || closing

  useEffect(() => {
    if (!isActive) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  useEffect(() => {
    if (!photoPreviewOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPhotoPreviewOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [photoPreviewOpen])

  useEffect(() => {
    if (!open || !user || activeTab !== 'historico') return
    const profile = getNetworkUserProfile(user)
    const effective = buildEditableData(user, profile, userEdits)
    const phone = effective.phone
    setRegisterPhone(phone && phone !== '—' ? phone : '')
    setRegisterError(null)
  }, [open, activeTab, user?.id, userEdits])

  if (!user || !isActive) return null

  const profile = getNetworkUserProfile(user)
  const photoUrl = profile.photoDataUrl
  const effective = buildEditableData(user, profile, userEdits)
  const panelVisible = entered && !closing
  const editingData: UserProfileEdits = {
    ...(isEditing && draft ? draft : effective),
    contacts: contactsDraft,
  }
  const contactsDirty = contactsBaseline !== JSON.stringify(contactsDraft)
  const canDeleteEmergencyContacts = editSessionKey > 0
  const registrationStale = isRegistrationStale(profile.registeredAt, lastReviewedAt)
  const searchQuery = drawerSearch.trim().toLowerCase()
  const showDrawerSearch = searchableTabs.includes(activeTab)

  const filteredConsultations = profile.consultations.filter((item) => {
    if (!searchQuery) return true
    const haystack =
      `${item.specialty} ${item.date} ${item.time} ${item.professional} ${item.protocol}`.toLowerCase()
    return haystack.includes(searchQuery)
  })

  const filteredAnnotations = annotations.filter((item) => {
    if (!searchQuery) return true
    return `${item.text} ${item.authorLabel}`.toLowerCase().includes(searchQuery)
  })

  const filteredContactLogs = [...contactLogs]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .filter((item) => {
      if (!searchQuery) return true
      const haystack =
        `${contactChannelLabel(item.channel)} ${item.phone} ${item.note ?? ''} ${item.authorLabel}`.toLowerCase()
      return haystack.includes(searchQuery)
    })

  function display(value: string, mask?: (v: string) => string) {
    if (sensitiveDataUnlocked || isEditing) return value || '—'
    return mask && value ? mask(value) : value || '—'
  }

  function handleEditClick() {
    if (!user) return
    onRequestEditUnlock?.()
  }

  function handleCancelEdit() {
    setIsEditing(false)
    setDraft(null)
  }

  function handleSaveEdit() {
    if (!draft) return
    const payload: UserProfileEdits = {
      ...draft,
      contacts: contactsDraft.filter(
        (contact) =>
          contact.name.trim() ||
          contact.phone.replace(/\D/g, '') ||
          contact.relationship,
      ),
    }
    const changedFields = detectChangedFields(effective, payload)
    onSaveEdits(payload, changedFields)
    setContactsDraft(payload.contacts.map((contact) => ({ ...contact })))
    setContactsBaseline(JSON.stringify(payload.contacts))
    setIsEditing(false)
    setDraft(null)
  }

  function handleSaveContacts() {
    const cleaned = contactsDraft.filter(
      (contact) =>
        contact.name.trim() ||
        contact.phone.replace(/\D/g, '') ||
        contact.relationship,
    )
    onSaveContacts(cleaned)
    setContactsDraft(cleaned.map((contact) => ({ ...contact })))
    setContactsBaseline(JSON.stringify(cleaned))
  }

  function updateDraft(partial: Partial<UserProfileEdits>) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev))
  }

  function updateContact(index: number, partial: Partial<PatientContact>) {
    setContactsDraft((prev) =>
      prev.map((contact, i) => (i === index ? { ...contact, ...partial } : contact)),
    )
  }

  function addContact() {
    setContactsDraft((prev) => [...prev, emptyPatientContact()])
  }

  function confirmRemoveContact() {
    if (contactToDeleteIndex === null) return
    setContactsDraft((prev) => prev.filter((_, i) => i !== contactToDeleteIndex))
    setContactToDeleteIndex(null)
  }

  function handleRegisterContactSubmit(event: React.FormEvent) {
    event.preventDefault()
    const phone = registerPhone.trim()
    const note = registerNote.trim()
    const requiresPhone =
      registerChannel === 'whatsapp' ||
      registerChannel === 'sms' ||
      registerChannel === 'telefone'

    if (!note) {
      setRegisterError('Descreva o que foi falado e o que a pessoa respondeu.')
      return
    }

    if (requiresPhone && !onlyDigitsPhone(phone)) {
      setRegisterError('Informe um telefone válido para este canal.')
      return
    }

    onRegisterContact(registerChannel, phone || '—', note)
    setRegisterNote('')
    setRegisterError(null)
  }

  function handleAddAnnotation() {
    const text = newAnnotation.trim()
    if (!text) return
    onAddAnnotation(text)
    setNewAnnotation('')
  }

  return createPortal(
    <>
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        tabIndex={panelVisible ? 0 : -1}
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar detalhes do paciente"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[95vh] max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-white px-5 pb-4 pt-4">
          <div className="flex items-start gap-4">
            {photoUrl ? (
              <button
                type="button"
                onClick={() => setPhotoPreviewOpen(true)}
                className="group shrink-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
                aria-label={`Ver foto de ${user.name}`}
              >
                <img
                  src={photoUrl}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 rounded-2xl border border-gray-200 object-cover shadow-sm transition group-hover:shadow-md group-hover:ring-2 group-hover:ring-[var(--brand-primary)]/20"
                />
              </button>
            ) : (
              <span
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gray-200 text-lg font-bold shadow-sm ${user.avatarClassName}`}
              >
                {user.initials}
              </span>
            )}

            <div className="min-w-0 flex-1 pr-8">
              <h2 id="user-drawer-title" className="text-lg font-bold text-gray-900">
                {user.name}
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                {user.age} anos · {editingData.neighborhood || user.bairro}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                  <Stethoscope className="h-3 w-3 text-[var(--brand-primary)]" />
                  {user.totalAppointments} atendimentos
                </span>
                <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                  Último: {user.lastAppointmentRelative}
                </span>
                {registrationStale ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    <AlertTriangle className="h-3 w-3" />
                    Cadastro desatualizado (+{STALE_REGISTRATION_MONTHS} meses)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="absolute right-4 top-4 flex items-center gap-2">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)]/40 hover:text-[var(--brand-primary)]"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
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
          </div>

          {isEditing ? (
            <p className="mt-3 rounded-xl border border-sky-200/80 bg-sky-50 px-3 py-2 text-xs text-sky-900">
              Modo de edição ativo (dados pessoais e endereço). Na aba Contatos você pode alterar os dados; para excluir um contato, use o ícone da lixeira.
            </p>
          ) : null}

          {!sensitiveDataUnlocked && !isEditing ? (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5">
              <p className="flex items-center gap-2 text-xs text-amber-900">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                CPF, telefone e endereço mascarados (LGPD).
              </p>
              {onRequestUnlock ? (
                <button
                  type="button"
                  onClick={onRequestUnlock}
                  className="shrink-0 text-xs font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
                >
                  Ver dados
                </button>
              ) : null}
            </div>
          ) : null}
        </header>

        <nav
          className="flex w-full shrink-0 gap-1 border-b border-gray-200 bg-white px-2 py-2"
          aria-label="Seções do paciente"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold leading-tight transition sm:gap-1.5 sm:px-1.5 sm:text-xs ${
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white shadow-[0_4px_12px_rgba(255,107,0,0.3)]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                <span className="truncate">{tab.label}</span>
              </button>
            )
          })}
        </nav>

        {showDrawerSearch ? (
          <div className="shrink-0 border-b border-gray-200 bg-white px-5 py-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={drawerSearch}
                onChange={(event) => setDrawerSearch(event.target.value)}
                placeholder="Buscar nesta seção..."
                className={`${drawerInputClass} pl-9`}
              />
            </label>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
          {activeTab === 'resumo' && (
            <div className="space-y-4">
              {extraContextItems.length > 0 ? (
                <SectionCard title="Vínculo contratual">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {extraContextItems.map((item) => (
                      <DetailField key={item.label} label={item.label} value={item.value} />
                    ))}
                  </dl>
                </SectionCard>
              ) : null}

              <SectionCard title="Comunicação com o paciente">
                {lastTeamContact ? (
                  <p className="text-sm text-gray-600">
                    Último contato da equipe:{' '}
                    <span className="font-semibold text-gray-900">
                      {teamContactChannelLabel(lastTeamContact.channel)}
                    </span>{' '}
                    · {formatActivityDate(lastTeamContact.at)}
                    {lastTeamContact.note ? ` — ${lastTeamContact.note}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Nenhum contato registrado pela equipe.</p>
                )}
              </SectionCard>

              <SectionCard title="Identificação rápida">
                <dl className="grid grid-cols-2 gap-4">
                  <DetailField label="CPF" value={display(user.cpf, maskCpfForDisplay)} />
                  <DetailField
                    label="Telefone"
                    value={display(editingData.phone, maskPhoneForDisplay)}
                  />
                  <DetailField label="Nascimento" value={user.birthDate} />
                  <DetailField label="Faixa etária" value={profile.ageGroupLabel} />
                </dl>
              </SectionCard>

              <SectionCard title="Última consulta">
                {profile.consultations[0] ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {profile.consultations[0].specialty}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.consultations[0].date} às {profile.consultations[0].time}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.consultations[0].professional} · Protocolo{' '}
                      {profile.consultations[0].protocol}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma consulta registrada.</p>
                )}
              </SectionCard>

              {editingData.contacts.length > 0 ? (
                <SectionCard title="Contato principal">
                  <p className="text-sm font-semibold text-gray-900">
                    {editingData.contacts[0].name}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {editingData.contacts[0].phone} ·{' '}
                    {formatRelationship(editingData.contacts[0].relationship)}
                  </p>
                </SectionCard>
              ) : null}
            </div>
          )}

          {activeTab === 'pessoais' && (
            <SectionCard>
              {isEditing && draft ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Nome completo" value={user.name} className="sm:col-span-2" />
                  <DetailField label="CPF" value={display(user.cpf, maskCpfForDisplay)} />
                  <DetailField label="Data de nascimento" value={user.birthDate} />
                  <DetailField label="Idade" value={`${user.age} anos`} />
                  <DetailField label="Gênero" value={profile.genderLabel} />
                  <DetailField label="Faixa etária" value={profile.ageGroupLabel} />
                  <EditField
                    label="Celular"
                    value={draft.phone}
                    onChange={(phone) => updateDraft({ phone })}
                  />
                  <EditField
                    label="E-mail"
                    type="email"
                    value={draft.email}
                    onChange={(email) => updateDraft({ email })}
                    className="sm:col-span-2"
                  />
                  <EditField
                    label="Responsável / cuidador"
                    value={draft.guardianName}
                    onChange={(guardianName) => updateDraft({ guardianName })}
                    className="sm:col-span-2"
                  />
                  <DetailField
                    label="CPF do responsável"
                    value={display(draft.guardianCpf, maskCpfForDisplay)}
                    className="sm:col-span-2"
                  />
                  <p className="sm:col-span-2 text-xs text-gray-500">
                    O CPF não pode ser alterado por esta tela.
                  </p>
                </div>
              ) : (
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Nome completo" value={user.name} className="sm:col-span-2" />
                  <DetailField label="CPF" value={display(user.cpf, maskCpfForDisplay)} />
                  <DetailField label="Data de nascimento" value={user.birthDate} />
                  <DetailField label="Idade" value={`${user.age} anos`} />
                  <DetailField label="Gênero" value={profile.genderLabel} />
                  <DetailField label="Faixa etária" value={profile.ageGroupLabel} />
                  <DetailField
                    label="Celular"
                    value={display(editingData.phone, maskPhoneForDisplay)}
                  />
                  <DetailField
                    label="E-mail"
                    value={editingData.email}
                    className="sm:col-span-2"
                  />
                  {editingData.guardianName ? (
                    <>
                      <DetailField
                        label="Responsável / cuidador"
                        value={editingData.guardianName}
                        className="sm:col-span-2"
                      />
                      <DetailField
                        label="CPF do responsável"
                        value={display(editingData.guardianCpf, maskCpfForDisplay)}
                        className="sm:col-span-2"
                      />
                    </>
                  ) : null}
                </dl>
              )}
            </SectionCard>
          )}

          {activeTab === 'endereco' && (
            <SectionCard>
              <div className="mb-4 flex items-center gap-2 text-[var(--brand-primary)]">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-semibold">Endereço residencial</span>
              </div>
              {isEditing && draft ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <EditField
                    label="CEP"
                    value={draft.zipCode}
                    onChange={(zipCode) => updateDraft({ zipCode })}
                  />
                  <EditField
                    label="Bairro"
                    value={draft.neighborhood}
                    onChange={(neighborhood) => updateDraft({ neighborhood })}
                  />
                  <EditField
                    label="Logradouro"
                    value={draft.street}
                    onChange={(street) => updateDraft({ street })}
                    className="sm:col-span-2"
                  />
                  <EditField
                    label="Número"
                    value={draft.number}
                    onChange={(number) => updateDraft({ number })}
                  />
                  <EditField
                    label="Complemento"
                    value={draft.complement}
                    onChange={(complement) => updateDraft({ complement })}
                  />
                  <EditField
                    label="Cidade"
                    value={draft.city}
                    onChange={(city) => updateDraft({ city })}
                  />
                  <EditField
                    label="UF"
                    value={draft.state}
                    onChange={(state) => updateDraft({ state })}
                  />
                </div>
              ) : (
                <>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="CEP"
                  value={display(editingData.zipCode, maskZipCodeForDisplay)}
                />
                <DetailField
                  label="Bairro"
                  value={display(editingData.neighborhood, maskNeighborhoodForDisplay)}
                />
                <DetailField
                  label="Logradouro"
                  value={display(editingData.street, maskStreetForDisplay)}
                  className="sm:col-span-2"
                />
                <DetailField
                  label="Número"
                  value={display(editingData.number, maskAddressFieldForDisplay)}
                />
                <DetailField
                  label="Complemento"
                  value={display(editingData.complement || '—', maskAddressFieldForDisplay)}
                />
                <DetailField label="Cidade" value={editingData.city} />
                <DetailField label="UF" value={editingData.state} />
              </dl>
              <p className="mt-4 rounded-xl bg-white px-3 py-2.5 text-sm text-gray-700 ring-1 ring-gray-100">
                {sensitiveDataUnlocked || isEditing ? (
                  <>
                    {editingData.street}, {editingData.number}
                    {editingData.complement ? ` — ${editingData.complement}` : ''}
                    <br />
                    {editingData.neighborhood} · {editingData.city}/{editingData.state} · CEP{' '}
                    {editingData.zipCode}
                  </>
                ) : (
                  <>
                    {display(editingData.street, maskStreetForDisplay)},{' '}
                    {display(editingData.number, maskAddressFieldForDisplay)}
                    {editingData.complement
                      ? ` — ${display(editingData.complement, maskAddressFieldForDisplay)}`
                      : ''}
                    <br />
                    {display(editingData.neighborhood, maskNeighborhoodForDisplay)} ·{' '}
                    {editingData.city}/{editingData.state} · CEP{' '}
                    {display(editingData.zipCode, maskZipCodeForDisplay)}
                  </>
                )}
              </p>
                </>
              )}
            </SectionCard>
          )}

          {activeTab === 'contatos' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                Você pode editar os contatos de emergência nesta aba. Para excluir, clique em Editar no
                topo e informe sua senha. CPF do paciente não é editável.
              </p>

              {contactsDraft.length === 0 ? (
                <SectionCard>
                  <p className="text-sm text-gray-500">Nenhum contato de emergência cadastrado.</p>
                </SectionCard>
              ) : null}

              {contactsDraft.map((contact, index) => (
                <SectionCard key={contact.id}>
                  <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Contato {index + 1}
                        </h3>
                        <button
                          type="button"
                          disabled={!canDeleteEmergencyContacts}
                          onClick={() => {
                            if (!canDeleteEmergencyContacts) return
                            setContactToDeleteIndex(index)
                          }}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            canDeleteEmergencyContacts
                              ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                              : 'cursor-not-allowed text-gray-300'
                          }`}
                          aria-label={
                            canDeleteEmergencyContacts
                              ? `Excluir contato ${index + 1}`
                              : 'Excluir contato — libere a edição com senha'
                          }
                          title={
                            canDeleteEmergencyContacts
                              ? 'Excluir contato'
                              : 'Clique em Editar e informe sua senha para excluir'
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                        </button>
                      </div>
                      <EditField
                          label="Nome"
                          value={contact.name}
                          onChange={(name) => updateContact(index, { name })}
                        />
                        <EditField
                          label="Telefone"
                          value={contact.phone}
                          onChange={(phone) => updateContact(index, { phone })}
                        />
                        <label className="block">
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Parentesco
                          </span>
                          <select
                            value={contact.relationship}
                            onChange={(event) =>
                              updateContact(index, { relationship: event.target.value })
                            }
                            className={`mt-1 ${drawerInputClass}`}
                          >
                            <option value="">Selecione</option>
                            {relationshipOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                </SectionCard>
              ))}

              <button
                  type="button"
                  onClick={addContact}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary-light)]/40"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Adicionar contato
              </button>

              {contactsDirty ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveContacts}
                    className="btn-brand-gradient rounded-lg px-3.5 py-2 text-xs font-semibold"
                  >
                    Salvar contatos
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === 'consultas' && (
            <div className="space-y-3">
              {filteredConsultations.length === 0 ? (
                <SectionCard>
                  <p className="text-sm text-gray-500">Sem histórico de consultas.</p>
                </SectionCard>
              ) : (
                filteredConsultations.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_10px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.specialty}</p>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.date} · {item.time}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{item.professional}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${consultationStatusClass[item.status]}`}
                      >
                        {consultationStatusLabel[item.status]}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-gray-400">Protocolo {item.protocol}</p>
                  </article>
                ))
              )}
            </div>
          )}

          {activeTab === 'cadastro' && (
            <div className="space-y-4">
              <SectionCard title="Informações do cadastro">
                <dl className="grid grid-cols-1 gap-4">
                  {extraContextItems.map((item) => (
                    <DetailField key={`cad-${item.label}`} label={item.label} value={item.value} />
                  ))}
                  <DetailField label="Cadastrado em" value={profile.registeredAt} />
                  <DetailField label="Unidade" value={profile.registrationUnit} />
                  <DetailField label="Total de atendimentos" value={String(user.totalAppointments)} />
                </dl>
              </SectionCard>

              {profile.notes ? (
                <SectionCard title="Observações clínicas">
                  <p className="text-sm leading-relaxed text-gray-700">{profile.notes}</p>
                </SectionCard>
              ) : null}
            </div>
          )}

          {activeTab === 'anotacoes' && (
            <div className="space-y-4">
              <SectionCard title="Nova anotação">
                <textarea
                  value={newAnnotation}
                  onChange={(event) => setNewAnnotation(event.target.value)}
                  rows={4}
                  placeholder="Registre observações sobre o paciente, orientações da equipe ou histórico relevante..."
                  className={`${drawerInputClass} resize-none`}
                />
                <button
                  type="button"
                  onClick={handleAddAnnotation}
                  disabled={!newAnnotation.trim()}
                  className="btn-brand-gradient mt-3 w-full rounded-xl py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Salvar anotação
                </button>
              </SectionCard>

              <SectionCard title="Histórico de anotações">
                {filteredAnnotations.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma anotação registrada ainda.</p>
                ) : (
                  <ul className="space-y-3">
                    {filteredAnnotations.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                      >
                        <p className="text-sm leading-relaxed text-gray-800">{item.text}</p>
                        <p className="mt-2 text-[11px] font-medium text-gray-400">
                          {item.authorLabel} · {formatAnnotationDate(item.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-4">
              <SectionCard title="Registrar contato">
                <form className="space-y-3" onSubmit={handleRegisterContactSubmit}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block min-w-0">
                      <span className="mb-1 block text-xs font-semibold text-gray-600">Canal</span>
                      <CustomSelect
                        value={registerChannel}
                        onChange={(value) => {
                          setRegisterChannel(value as ContactChannel)
                          setRegisterError(null)
                        }}
                        options={contactChannelOptions}
                        className="py-2.5 px-3.5"
                      />
                    </label>

                    <label className="block min-w-0">
                      <span className="mb-1 block text-xs font-semibold text-gray-600">
                        Telefone{' '}
                        {registerChannel === 'presencial' || registerChannel === 'outro' ? (
                          <span className="font-normal text-gray-400">(opcional)</span>
                        ) : null}
                      </span>
                      <input
                        type="tel"
                        value={registerPhone}
                        onChange={(event) => {
                          setRegisterPhone(event.target.value)
                          setRegisterError(null)
                        }}
                        placeholder="(00) 00000-0000"
                        className={drawerInputClass}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-gray-600">
                      Registro do contato
                    </span>
                    <p className="mb-2 text-xs text-gray-500">
                      Descreva o que foi falado e o que a pessoa respondeu. Este campo é
                      obrigatório para registrar o contato.
                    </p>
                    <textarea
                      value={registerNote}
                      onChange={(event) => {
                        setRegisterNote(event.target.value)
                        setRegisterError(null)
                      }}
                      rows={4}
                      required
                      placeholder="Ex.: Liguei para confirmar o retorno; a paciente disse que pode comparecer na terça às 14h."
                      className={`${drawerInputClass} resize-y`}
                    />
                  </label>

                  {registerError ? (
                    <p className="text-xs font-medium text-red-600">{registerError}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={!registerNote.trim()}
                    className="btn-brand-gradient inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Registrar contato
                  </button>
                </form>
              </SectionCard>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Histórico de contatos
                </h3>
              {filteredContactLogs.length === 0 ? (
                <SectionCard>
                    <p className="text-sm text-gray-500">
                      {searchQuery
                        ? 'Nenhum contato encontrado para esta busca.'
                        : 'Nenhum contato registrado ainda.'}
                    </p>
                </SectionCard>
              ) : (
                <ul className="space-y-3">
                    {filteredContactLogs.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {contactChannelLabel(entry.channel)}
                        </p>
                        {entry.phone && entry.phone !== '—' ? (
                          <p className="mt-1 text-sm text-gray-600">
                            {sensitiveDataUnlocked
                              ? entry.phone
                              : maskPhoneForDisplay(entry.phone)}
                          </p>
                        ) : null}
                        {entry.note ? (
                          <p className="mt-1 text-sm text-gray-600">{entry.note}</p>
                        ) : null}
                        <p className="mt-2 text-[11px] font-medium text-gray-400">
                          {entry.authorLabel} · {formatActivityDate(entry.at)}
                        </p>
                      </li>
                    ))}
                </ul>
              )}
              </div>
            </div>
          )}
        </div>

        {isEditing ? (
          <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              className="btn-brand-gradient rounded-lg px-3.5 py-2 text-xs font-semibold"
            >
              Salvar alterações
            </button>
          </footer>
        ) : null}
      </aside>
    </div>

    <ConfirmDialog
      open={contactToDeleteIndex !== null}
      title="Excluir contato de emergência?"
      description="Esta ação remove o contato da lista. Salve os contatos para confirmar a exclusão."
      confirmLabel="Excluir"
      tone="danger"
      onConfirm={confirmRemoveContact}
      onCancel={() => setContactToDeleteIndex(null)}
    />

    {photoPreviewOpen && photoUrl ? (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/70 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-label={`Foto de ${user.name}`}
        onClick={() => setPhotoPreviewOpen(false)}
      >
        <button
          type="button"
          onClick={() => setPhotoPreviewOpen(false)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/90 text-gray-600 shadow-lg transition hover:bg-white hover:text-gray-900"
          aria-label="Fechar visualização da foto"
        >
          <X className="h-5 w-5" />
        </button>

        <div
          className="flex max-h-full w-full max-w-lg flex-col items-center"
          onClick={(event) => event.stopPropagation()}
        >
          <img
            src={photoUrl}
            alt={`Foto de ${user.name}`}
            className="max-h-[min(78vh,720px)] w-full rounded-2xl border border-white/20 object-contain shadow-[0_24px_64px_rgba(0,0,0,0.45)]"
          />
          <p className="mt-4 text-center text-sm font-medium text-white/90">{user.name}</p>
        </div>
      </div>
    ) : null}
    </>,
    document.body,
  )
}
