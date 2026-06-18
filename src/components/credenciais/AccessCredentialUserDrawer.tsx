import { Ban, Eye, EyeOff, Pencil, Trash2, UserCheck, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { buildUbtUrl } from '../../config/tenantHost'
import {
  accessLevels,
  buildPresetPagePermissions,
  emptyPagePermissions,
  inferAccessLevelFromPermissions,
  permissionActions,
  systemPages,
  type AccessLevelId,
  type PermissionAction,
  type SystemPageId,
} from '../../config/accessCredentials'
import type { AccessCredentialUser, CredentialUserStatus } from '../../data/accessCredentialsMock'
import type { PrefeituraCredentialUbtOption } from '../../data/prefeituraAccessCredentialsMock'
import { isResponsibleUbtRole, RESPONSIBLE_UBT_ROLE } from '../../data/prefeituraAccessCredentialsMock'
import { cpfDigits, isValidCpf } from '../../utils/cpf'
import { maskCpf } from '../../utils/masks'
import { CustomSelect } from '../ui/CustomSelect'
import { PinInput } from '../ui/PinInput'
import { CredentialPortalAccessLink } from './CredentialPortalAccessLink'

export type AccessCredentialDrawerMode = 'create' | 'edit' | 'edit_permissions' | 'view'

type AccessCredentialUserDrawerProps = {
  open: boolean
  closing: boolean
  mode: AccessCredentialDrawerMode
  editingUser: AccessCredentialUser | null
  municipalConfig?: {
    ubtOptions: PrefeituraCredentialUbtOption[]
    contractingEntityOptions?: {
      value: string
      label: string
    }[]
    ubtOptionsByContractingEntityId?: Record<string, PrefeituraCredentialUbtOption[]>
    skipPasswordOnCreate?: boolean
    requireCpfOnCreate?: boolean
    /** Slug do portal UBT quando há uma única unidade (ex.: portal da própria UBT). */
    defaultPortalSlug?: string | null
    viewActions?: {
      onEditPermissions: () => void
      onDeactivate: () => void
      onUnblock?: () => void
      onDelete: () => void
    }
  }
  onClose: () => void
  onTransitionEnd: () => void
  onSave: (
    user: AccessCredentialUser,
    meta?: {
      contractingEntityId?: string
      cpf?: string
      password?: string
      authorizationPin?: string | null
    },
  ) => void | Promise<void>
}

function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label className="mb-1.5 block text-xs font-semibold text-gray-600">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const MIN_PASSWORD_LENGTH = 6
const PIN_LENGTH = 6

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  required = false,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggleShow: () => void
  placeholder: string
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-11`}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          minLength={required ? MIN_PASSWORD_LENGTH : undefined}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const avatarPalette = [
  'bg-orange-100 text-orange-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
]

function createCredentialId(municipal: boolean) {
  const suffix = Math.random().toString(36).slice(2, 7)
  return municipal ? `pref-cred-${Date.now()}-${suffix}` : `cred-${Date.now()}-${suffix}`
}

function toggleAction(
  current: PermissionAction[],
  action: PermissionAction,
): PermissionAction[] {
  if (current.includes(action)) {
    return current.filter((item) => item !== action)
  }
  const next = [...current, action]
  if (action !== 'visualizar' && !next.includes('visualizar')) {
    next.unshift('visualizar')
  }
  return next
}

export function AccessCredentialUserDrawer({
  open,
  closing,
  mode,
  editingUser,
  municipalConfig,
  onClose,
  onTransitionEnd,
  onSave,
}: AccessCredentialUserDrawerProps) {
  const isMunicipal = Boolean(municipalConfig)
  const contractingEntityOptions = municipalConfig?.contractingEntityOptions ?? []
  const fixedContractingEntity =
    contractingEntityOptions.length === 1 ? contractingEntityOptions[0] : null
  const usesContractingEntitySelection =
    contractingEntityOptions.length > 1 &&
    Boolean(municipalConfig?.ubtOptionsByContractingEntityId)

  const [entered, setEntered] = useState(false)
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [cpfTouched, setCpfTouched] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [selectedContractingEntityId, setSelectedContractingEntityId] = useState('')
  const [selectedUbtId, setSelectedUbtId] = useState('')
  const [isUbtResponsible, setIsUbtResponsible] = useState(false)
  const [status, setStatus] = useState<CredentialUserStatus>('ativo')
  const [accessLevel, setAccessLevel] = useState<AccessLevelId>('operador')
  const [pagePermissions, setPagePermissions] = useState(emptyPagePermissions())
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinVisible, setPinVisible] = useState(false)
  const [confirmPinVisible, setConfirmPinVisible] = useState(false)
  const [changePin, setChangePin] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)

  const isActive = open || closing
  const isViewMode = mode === 'view'
  const isEditPermissionsMode = mode === 'edit_permissions'
  const isEditMode = mode === 'edit' || isEditPermissionsMode
  const isCreateMode = mode === 'create'
  const isFormReadOnly = isViewMode || isEditPermissionsMode
  const mustSetPassword = isEditMode && editingUser !== null && !editingUser.hasPassword
  const skipPasswordOnCreate = Boolean(municipalConfig?.skipPasswordOnCreate)
  const requireCpfOnCreate = Boolean(municipalConfig?.requireCpfOnCreate)
  const showPasswordFields =
    !isViewMode && ((isCreateMode && !skipPasswordOnCreate) || changePassword || mustSetPassword)
  const showPinFields = !isViewMode && !isEditPermissionsMode

  const filteredUbtOptions =
    isMunicipal && usesContractingEntitySelection && selectedContractingEntityId
      ? (municipalConfig?.ubtOptionsByContractingEntityId?.[selectedContractingEntityId] ?? [])
      : (municipalConfig?.ubtOptions ?? [])

  const ubtSelectOptions = [
    { value: '', label: usesContractingEntitySelection ? 'Selecione a UBT' : 'Selecione a UBT' },
    ...(filteredUbtOptions.map((option) => ({
      value: option.value,
      label: `${option.label} · ${option.raLabel}`,
    })) ?? []),
  ]

  const portalLoginUrl = useMemo(() => {
    if (!isCreateMode || !isMunicipal) return null
    const selectedOption = filteredUbtOptions.find((option) => option.value === selectedUbtId)
    const slug = selectedOption?.slug?.trim() || municipalConfig?.defaultPortalSlug?.trim()
    return slug ? buildUbtUrl(slug) : null
  }, [
    filteredUbtOptions,
    isCreateMode,
    isMunicipal,
    municipalConfig?.defaultPortalSlug,
    selectedUbtId,
  ])

  const resetForm = useCallback(() => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setPasswordError(null)
    setPin('')
    setConfirmPin('')
    setPinVisible(false)
    setConfirmPinVisible(false)
    setChangePin(false)
    setPinError(null)

    if (editingUser) {
      setName(editingUser.name)
      setCpf(editingUser.cpf ? maskCpf(editingUser.cpf) : '')
      setCpfTouched(false)
      setEmail(editingUser.email)
      setRole(editingUser.role)
      setSelectedContractingEntityId('')
      setSelectedUbtId(editingUser.ubtId ?? '')
      setIsUbtResponsible(editingUser.isUbtResponsible ?? isResponsibleUbtRole(editingUser.role))
      setStatus(editingUser.status)
      setAccessLevel(editingUser.accessLevel)
      setPagePermissions({ ...emptyPagePermissions(), ...editingUser.pagePermissions })
      setChangePassword(!editingUser.hasPassword)
      return
    }

    setChangePassword(false)

    setName('')
    setCpf('')
    setCpfTouched(false)
    setEmail('')
    setRole('')
    setSelectedContractingEntityId(
      fixedContractingEntity?.value ??
        (contractingEntityOptions.length === 1 ? contractingEntityOptions[0]?.value ?? '' : ''),
    )
    setSelectedUbtId(
      municipalConfig?.ubtOptions?.length === 1
        ? (municipalConfig.ubtOptions[0]?.value ?? '')
        : '',
    )
    setIsUbtResponsible(false)
    setStatus('ativo')
    setAccessLevel('operador')
    setPagePermissions(buildPresetPagePermissions('operador'))
  }, [editingUser, municipalConfig, fixedContractingEntity, contractingEntityOptions])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }

    resetForm()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, resetForm])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  const panelVisible = isActive && entered && !closing

  function applyAccessLevelPreset(level: AccessLevelId) {
    setAccessLevel(level)
    setPagePermissions(buildPresetPagePermissions(level))
  }

  function togglePageAction(pageId: SystemPageId, action: PermissionAction) {
    setPagePermissions((prev) => {
      const next = {
        ...prev,
        [pageId]: toggleAction(prev[pageId] ?? [], action),
      }
      setAccessLevel(inferAccessLevelFromPermissions(next))
      return next
    })
  }

  function togglePageEnabled(pageId: SystemPageId, enabled: boolean) {
    setPagePermissions((prev) => {
      const current = prev[pageId] ?? []
      const next = {
        ...prev,
        [pageId]: enabled ? (current.length ? current : ['visualizar']) : [],
      }
      setAccessLevel(inferAccessLevelFromPermissions(next))
      return next
    })
  }

  function validatePasswordFields(): string | null {
    if (!showPasswordFields) return null

    const trimmedPassword = password.trim()
    const trimmedConfirm = confirmPassword.trim()
    if (trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`
    }
    if (trimmedPassword !== trimmedConfirm) {
      return 'As senhas não coincidem.'
    }
    return null
  }

  function validateOptionalPinFields(): string | null {
    if (!showPinFields) return null
    if (pin.length === 0 && confirmPin.length === 0) return null
    if (pin.length !== PIN_LENGTH) {
      return 'Se informar, a senha de autorização deve ter 6 dígitos.'
    }
    if (pin !== confirmPin) {
      return 'As senhas de autorização não coincidem.'
    }
    return null
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedRole = role.trim()
    const cpfValue = cpfDigits(cpf)
    if (!trimmedName || !trimmedEmail || !trimmedRole) return
    if (requireCpfOnCreate && isCreateMode) {
      setCpfTouched(true)
      if (!isValidCpf(cpfValue)) return
    }
    if (isMunicipal && usesContractingEntitySelection && isCreateMode && !selectedContractingEntityId) return

    const passwordValidationError = validatePasswordFields()
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      return
    }
    setPasswordError(null)

    const pinValidationError = validateOptionalPinFields()
    if (pinValidationError) {
      setPinError(pinValidationError)
      return
    }
    setPinError(null)

    const hasAnyPermission = systemPages.some(
      (page) => (pagePermissions[page.id] ?? []).length > 0,
    )
    if (!hasAnyPermission) return

    const resolvedLevel = inferAccessLevelFromPermissions(pagePermissions)
    const paletteIndex = trimmedName.length % avatarPalette.length
    const passwordWasSet = showPasswordFields && password.length > 0
    const pinWasSet = pin.length === PIN_LENGTH && pin === confirmPin

    const responsible = isMunicipal && (isUbtResponsible || isResponsibleUbtRole(trimmedRole))
    const selectedUbt = filteredUbtOptions.find(
      (option) => option.value === selectedUbtId,
    )

    const payload: AccessCredentialUser = {
      id: editingUser?.id ?? createCredentialId(isMunicipal),
      name: trimmedName,
      email: trimmedEmail,
      role: responsible ? RESPONSIBLE_UBT_ROLE : trimmedRole,
      status,
      accessLevel: responsible ? 'administrador' : resolvedLevel,
      initials: editingUser?.initials ?? getInitials(trimmedName),
      avatarClassName: editingUser?.avatarClassName ?? avatarPalette[paletteIndex],
      avatarUrl: editingUser?.avatarUrl,
      hasPassword:
        (isCreateMode && skipPasswordOnCreate)
          ? false
          : passwordWasSet || (editingUser?.hasPassword ?? false),
      hasAuthorizationPin:
        pinWasSet ||
        (Boolean(editingUser?.hasAuthorizationPin) && !changePin),
      pagePermissions: responsible
        ? buildPresetPagePermissions('administrador')
        : { ...pagePermissions },
      ubtId: selectedUbt?.value ?? editingUser?.ubtId,
      ubtName: selectedUbt?.ubtName ?? editingUser?.ubtName,
      raKey: selectedUbt?.raKey ?? editingUser?.raKey,
      raLabel: selectedUbt?.raLabel ?? editingUser?.raLabel,
      isUbtResponsible: responsible,
    }

    void onSave(payload, {
      contractingEntityId:
        isMunicipal && usesContractingEntitySelection && isCreateMode
          ? selectedContractingEntityId
          : undefined,
      cpf:
        requireCpfOnCreate && isCreateMode && cpfValue.length === 11
          ? cpfValue
          : undefined,
      password:
        showPasswordFields && password.trim().length >= MIN_PASSWORD_LENGTH
          ? password.trim()
          : undefined,
      authorizationPin:
        pin.length === PIN_LENGTH && pin === confirmPin
          ? pin
          : changePin && pin.length === 0
            ? null
            : undefined,
    })
  }

  function handleRoleChange(value: string) {
    setRole(value)
    if (!isMunicipal) return
    if (isResponsibleUbtRole(value)) {
      setIsUbtResponsible(true)
      applyAccessLevelPreset('administrador')
    }
  }

  function handleResponsibleToggle(checked: boolean) {
    setIsUbtResponsible(checked)
    if (checked) {
      setRole(RESPONSIBLE_UBT_ROLE)
      applyAccessLevelPreset('administrador')
    }
  }

  const passwordValid =
    isEditPermissionsMode || !showPasswordFields || validatePasswordFields() === null
  const pinValid = !showPinFields || validateOptionalPinFields() === null
  const ubtSelected =
    !isMunicipal || isViewMode || isEditPermissionsMode || selectedUbtId.length > 0
  const contractingEntitySelected =
    !isMunicipal ||
    !usesContractingEntitySelection ||
    isViewMode ||
    isEditPermissionsMode ||
    !isCreateMode ||
    selectedContractingEntityId.length > 0
  const locksAccessProfile =
    isMunicipal && isUbtResponsible && !isViewMode && !isEditPermissionsMode

  const cpfValid =
    !requireCpfOnCreate ||
    !isCreateMode ||
    isFormReadOnly ||
    (cpfDigits(cpf).length > 0 && isValidCpf(cpfDigits(cpf)))

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    role.trim().length > 0 &&
    cpfValid &&
    contractingEntitySelected &&
    ubtSelected &&
    systemPages.some((page) => (pagePermissions[page.id] ?? []).length > 0) &&
    passwordValid &&
    pinValid &&
    (isEditPermissionsMode ||
      !showPasswordFields ||
      (password.length > 0 && confirmPassword.length > 0))

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9997] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Fechar cadastro de usuário"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-credential-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[95vh] max-h-[95dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/40 to-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="access-credential-drawer-title" className="text-lg font-bold text-gray-900">
                {isViewMode
                  ? 'Visualizar usuário'
                  : isEditPermissionsMode
                    ? 'Editar páginas e autorizações'
                    : isEditMode
                      ? 'Editar usuário'
                      : 'Novo usuário'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isViewMode
                  ? 'Consulte os dados, o perfil e as permissões deste usuário.'
                  : isEditPermissionsMode
                    ? 'Ajuste as páginas e autorizações permitidas para este usuário.'
                    : isCreateMode && skipPasswordOnCreate
                      ? 'Defina a função, a unidade e as permissões. Um e-mail será enviado para o usuário criar o acesso.'
                      : 'Defina a função, a senha de acesso e as permissões por página do sistema.'}
              </p>
              {editingUser?.ubtName ? (
                <p className="mt-2 rounded-lg border border-gray-200 bg-white/80 px-3 py-2 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">UBT:</span> {editingUser.ubtName}
                  {editingUser.raLabel ? (
                    <>
                      {' '}
                      · <span className="font-semibold text-gray-800">RA:</span>{' '}
                      {editingUser.raLabel}
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <form
          onSubmit={isViewMode ? (e) => e.preventDefault() : handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <section>
              <h3 className="text-sm font-bold text-gray-900">Dados do usuário</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {isMunicipal ? (
                  <div className="sm:col-span-2">
                    {fixedContractingEntity && isCreateMode && !isFormReadOnly ? (
                      <div className="mb-4">
                        <FieldLabel>Unidade contratante</FieldLabel>
                        <div className={`${inputClass} bg-gray-50 text-gray-700`}>
                          {fixedContractingEntity.label}
                        </div>
                      </div>
                    ) : usesContractingEntitySelection && isCreateMode && !isFormReadOnly ? (
                      <div className="mb-4">
                        <FieldLabel required>Unidade contratante</FieldLabel>
                        <CustomSelect
                          value={selectedContractingEntityId}
                          onChange={(value) => {
                            setSelectedContractingEntityId(value)
                            setSelectedUbtId('')
                          }}
                          options={[
                            { value: '', label: 'Selecione a unidade contratante' },
                            ...contractingEntityOptions,
                          ]}
                        />
                      </div>
                    ) : null}

                    <FieldLabel required={!isFormReadOnly}>
                      UBT vinculada
                      {usesContractingEntitySelection && isCreateMode && !isFormReadOnly
                        ? ' (da unidade contratante)'
                        : ''}
                    </FieldLabel>
                    {isFormReadOnly ? (
                      <div className={`${inputClass} bg-gray-50 text-gray-700`}>
                        {editingUser?.ubtName ?? '—'}
                        {editingUser?.raLabel ? ` · ${editingUser.raLabel}` : ''}
                      </div>
                    ) : usesContractingEntitySelection &&
                      isCreateMode &&
                      !selectedContractingEntityId ? (
                      <div className={`${inputClass} bg-gray-50 text-gray-500`}>
                        Selecione a unidade contratante primeiro
                      </div>
                    ) : (
                      <CustomSelect
                        value={selectedUbtId}
                        onChange={setSelectedUbtId}
                        options={ubtSelectOptions}
                        placeholder="Selecione a UBT"
                      />
                    )}
                  </div>
                ) : null}
                {isCreateMode && isMunicipal ? (
                  <div className="sm:col-span-2">
                    <CredentialPortalAccessLink loginUrl={portalLoginUrl} />
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <FieldLabel required>Nome completo</FieldLabel>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Ex.: Juliana Silva"
                    required={!isFormReadOnly}
                    readOnly={isFormReadOnly}
                    disabled={isFormReadOnly}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel required>E-mail de acesso</FieldLabel>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="nome@ubt.gov.br"
                    required={!isFormReadOnly}
                    readOnly={isFormReadOnly}
                    disabled={isFormReadOnly}
                  />
                </div>
                {requireCpfOnCreate && isCreateMode && !isFormReadOnly ? (
                  <div className="sm:col-span-2">
                    <FieldLabel required>CPF (login no terminal UBT)</FieldLabel>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cpf}
                      onChange={(e) => setCpf(maskCpf(e.target.value))}
                      onBlur={() => setCpfTouched(true)}
                      className={inputClass}
                      placeholder="000.000.000-00"
                      required
                    />
                    {cpfTouched && cpf.length > 0 && !isValidCpf(cpfDigits(cpf)) ? (
                      <p className="mt-1 text-xs text-red-600">Informe um CPF válido.</p>
                    ) : null}
                  </div>
                ) : null}
                {isFormReadOnly && editingUser?.cpf ? (
                  <div className="sm:col-span-2">
                    <FieldLabel>CPF</FieldLabel>
                    <div className={`${inputClass} bg-gray-50 text-gray-700`}>
                      {maskCpf(editingUser.cpf)}
                    </div>
                  </div>
                ) : null}
                <div>
                  <FieldLabel required>Função</FieldLabel>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className={inputClass}
                    placeholder="Ex.: Enfermeira"
                    required={!isFormReadOnly}
                    readOnly={isFormReadOnly || (isMunicipal && isUbtResponsible)}
                    disabled={isFormReadOnly || (isMunicipal && isUbtResponsible)}
                  />
                </div>
                {isMunicipal && !isFormReadOnly ? (
                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isUbtResponsible}
                        onChange={(e) => handleResponsibleToggle(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900">
                          Responsável pela UBT
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-600">
                          Define perfil administrador e destaque na lista da unidade. Apenas um
                          responsável por UBT.
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}
                {isMunicipal && isViewMode && editingUser?.isUbtResponsible ? (
                  <div className="sm:col-span-2">
                    <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Responsável pela UBT
                    </span>
                  </div>
                ) : null}
                <div>
                  <FieldLabel required={!isFormReadOnly}>Status</FieldLabel>
                  {isFormReadOnly ? (
                    <div className={`${inputClass} bg-gray-50 text-gray-700`}>
                      {status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                    </div>
                  ) : (
                    <CustomSelect
                      value={status}
                      onChange={(value) => setStatus(value as CredentialUserStatus)}
                      options={[
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'inativo', label: 'Bloqueado' },
                      ]}
                    />
                  )}
                </div>
              </div>
            </section>

            {!isViewMode && !isEditPermissionsMode ? (
            <>
            <section>
              <h3 className="text-sm font-bold text-gray-900">Senha de acesso</h3>
              {isEditMode && editingUser ? (
                <div className="mt-3">
                  {editingUser.hasPassword ? (
                    <p className="text-xs text-gray-500">
                      Este usuário já possui senha cadastrada para entrar no sistema.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-700">
                      Nenhuma senha cadastrada ainda. Defina uma senha para liberar o acesso.
                    </p>
                  )}
                  {editingUser.hasPassword ? (
                    <label className="mt-3 flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={changePassword}
                        onChange={(e) => {
                          setChangePassword(e.target.checked)
                          setPassword('')
                          setConfirmPassword('')
                          setPasswordError(null)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                      />
                      <span className="text-sm font-medium text-gray-700">Alterar senha</span>
                    </label>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  Crie a senha que o usuário usará para entrar no painel (e-mail + senha).
                </p>
              )}

              {showPasswordFields ? (
                <div className="mt-3">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <PasswordField
                      label={isEditMode ? 'Nova senha' : 'Senha'}
                      value={password}
                      onChange={(value) => {
                        setPassword(value)
                        setPasswordError(null)
                      }}
                      show={showPassword}
                      onToggleShow={() => setShowPassword((v) => !v)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoComplete="off"
                    />
                    <PasswordField
                      label="Confirmar senha"
                      value={confirmPassword}
                      onChange={(value) => {
                        setConfirmPassword(value)
                        setPasswordError(null)
                      }}
                      show={showConfirmPassword}
                      onToggleShow={() => setShowConfirmPassword((v) => !v)}
                      placeholder="Repita a senha"
                      required
                      autoComplete="off"
                    />
                  </div>
                  {passwordError ? (
                    <p className="mt-2 text-xs font-medium text-red-600" role="alert">
                      {passwordError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-900">Senha de autorização</h3>
              <p className="mt-1 text-xs text-gray-500">
                Senha numérica de 6 dígitos para confirmar ações sensíveis (opcional).
              </p>
              {isEditMode && editingUser?.hasAuthorizationPin ? (
                <label className="mt-3 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={changePin}
                    onChange={(e) => {
                      setChangePin(e.target.checked)
                      setPin('')
                      setConfirmPin('')
                      setPinError(null)
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Alterar senha de 6 dígitos
                  </span>
                </label>
              ) : null}
              {isEditMode && editingUser?.hasAuthorizationPin && !changePin ? (
                <p className="mt-2 text-xs text-gray-500">PIN de autorização já cadastrado.</p>
              ) : (
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start sm:gap-x-12 lg:max-w-4xl xl:gap-x-20">
                  <PinInput
                    id="credential-authorization-pin"
                    label="Senha de autorização (6 dígitos)"
                    value={pin}
                    onChange={(value) => {
                      setPin(value)
                      setPinError(null)
                    }}
                    visible={pinVisible}
                    onToggleVisible={() => setPinVisible((v) => !v)}
                    error={Boolean(pinError)}
                  />
                  <PinInput
                    id="credential-authorization-pin-confirm"
                    label="Confirmar senha de autorização"
                    value={confirmPin}
                    onChange={(value) => {
                      setConfirmPin(value)
                      setPinError(null)
                    }}
                    visible={confirmPinVisible}
                    onToggleVisible={() => setConfirmPinVisible((v) => !v)}
                    error={Boolean(pinError)}
                  />
                  {pinError ? (
                    <p className="sm:col-span-2 text-xs font-medium text-red-600" role="alert">
                      {pinError}
                    </p>
                  ) : null}
                </div>
              )}
            </section>
            </>
            ) : (
              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Senha de acesso</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {editingUser?.hasPassword
                      ? 'Senha cadastrada para acesso ao painel.'
                      : 'Nenhuma senha cadastrada.'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Senha de autorização</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {editingUser?.hasAuthorizationPin
                      ? 'PIN de 6 dígitos cadastrado.'
                      : 'Nenhum PIN cadastrado.'}
                  </p>
                </div>
              </section>
            )}

            <section>
              <h3 className="text-sm font-bold text-gray-900">Perfil de acesso</h3>
              <p className="mt-1 text-xs text-gray-500">
                Escolha um perfil para preencher as permissões automaticamente. Você pode ajustar
                cada página abaixo.
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {accessLevels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    disabled={isViewMode || locksAccessProfile}
                    onClick={() => applyAccessLevelPreset(level.id)}
                    className={[
                      'flex min-w-0 flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition sm:px-3',
                      accessLevel === level.id
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)] ring-1 ring-[var(--brand-primary)]/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
                      isViewMode || locksAccessProfile ? 'cursor-default opacity-80' : '',
                    ].join(' ')}
                  >
                    <span className="block text-xs font-semibold text-gray-900 sm:text-sm">
                      {level.label}
                    </span>
                    <span className="mt-1 block text-[10px] leading-snug text-gray-500 sm:text-xs">
                      {level.description}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-900">Páginas e autorizações</h3>
              <p className="mt-1 text-xs text-gray-500">
                Marque as páginas que o usuário pode acessar e o tipo de ação permitida em cada uma.
              </p>

              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                <div className="grid grid-cols-[1fr_repeat(4,minmax(0,3.5rem))] gap-1 border-b border-gray-200 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <span>Página</span>
                  {permissionActions.map((action) => (
                    <span key={action.id} className="text-center">
                      {action.shortLabel}
                    </span>
                  ))}
                </div>

                <ul className="divide-y divide-gray-100">
                  {systemPages.map((page) => {
                    const actions = pagePermissions[page.id] ?? []
                    const pageEnabled = actions.length > 0

                    return (
                      <li
                        key={page.id}
                        className="grid grid-cols-[1fr_repeat(4,minmax(0,3.5rem))] items-center gap-1 px-3 py-3"
                      >
                        <div className="min-w-0 pr-2">
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={pageEnabled}
                              disabled={isViewMode || locksAccessProfile}
                              onChange={(e) => togglePageEnabled(page.id, e.target.checked)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] disabled:opacity-60"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-gray-900">
                                {page.label}
                              </span>
                              <span className="block text-[11px] text-gray-500">
                                {page.description}
                              </span>
                            </span>
                          </label>
                        </div>

                        {permissionActions.map((action) => (
                          <div key={action.id} className="flex justify-center">
                            <input
                              type="checkbox"
                              checked={actions.includes(action.id)}
                              disabled={isViewMode || locksAccessProfile || !pageEnabled}
                              onChange={() => togglePageAction(page.id, action.id)}
                              aria-label={`${action.label} em ${page.label}`}
                              className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)] disabled:opacity-40"
                            />
                          </div>
                        ))}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          </div>

          <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            {isViewMode && municipalConfig?.viewActions ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={municipalConfig.viewActions.onEditPermissions}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--brand-primary)] bg-[var(--brand-primary-light)] px-3.5 py-2 text-xs font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-light)]"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                    Editar páginas e autorizações
                  </button>
                  {status === 'inativo' && municipalConfig.viewActions.onUnblock ? (
                    <button
                      type="button"
                      onClick={municipalConfig.viewActions.onUnblock}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      <UserCheck className="h-3.5 w-3.5" strokeWidth={2} />
                      Desbloquear usuário
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={municipalConfig.viewActions.onDeactivate}
                      disabled={status === 'inativo'}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                      Bloquear usuário
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={municipalConfig.viewActions.onDelete}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    Excluir usuário
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 sm:shrink-0"
                >
                  Fechar
                </button>
              </>
            ) : isViewMode ? (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Fechar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-brand-gradient rounded-lg px-3.5 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEditPermissionsMode
                    ? 'Salvar permissões'
                    : isEditMode
                      ? 'Salvar alterações'
                      : 'Cadastrar usuário'}
                </button>
              </>
            )}
          </footer>
        </form>
      </aside>
    </div>,
    document.body,
  )
}
