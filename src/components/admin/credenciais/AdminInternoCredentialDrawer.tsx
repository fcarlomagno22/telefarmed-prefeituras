import { Eye, EyeOff, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  accessLevels,
  permissionActions,
  type AccessLevelId,
  type PermissionAction,
} from '../../../config/accessCredentials'
import {
  adminInternoDepartments,
  adminPortalPages,
  buildAdminInternoPagePermissions,
  emptyAdminPagePermissions,
  inferAdminInternoAccessLevelFromPermissions,
  type AdminInternoCredentialUser,
  type AdminInternoDepartmentId,
  type AdminPortalPageId,
} from '../../../config/adminCredenciaisConfig'
import { cpfDigits, isValidCpf } from '../../../utils/cpf'
import { maskCpf } from '../../../utils/masks'
import { CustomSelect } from '../../ui/CustomSelect'
import { PinInput } from '../../ui/PinInput'

export type AdminInternoDrawerMode = 'create' | 'edit' | 'view'

type AdminInternoCredentialDrawerProps = {
  open: boolean
  closing: boolean
  mode: AdminInternoDrawerMode
  editingUser: AdminInternoCredentialUser | null
  onClose: () => void
  onTransitionEnd: () => void
  onSave: (
    user: AdminInternoCredentialUser,
    secrets?: { password?: string; authorizationPin?: string | null },
  ) => void | Promise<void>
  isSaving?: boolean
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15'

const MIN_ACCESS_PASSWORD_LENGTH = 6
const PIN_LENGTH = 6

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

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  show: boolean
  onToggleShow: () => void
  placeholder: string
  required?: boolean
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
          autoComplete="new-password"
          minLength={required ? MIN_ACCESS_PASSWORD_LENGTH : undefined}
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
]

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

export function AdminInternoCredentialDrawer({
  open,
  closing,
  mode,
  editingUser,
  onClose,
  onTransitionEnd,
  onSave,
  isSaving = false,
}: AdminInternoCredentialDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [role, setRole] = useState('')
  const [departmentId, setDepartmentId] = useState<AdminInternoDepartmentId>('operacoes')
  const [accessLevel, setAccessLevel] = useState<AccessLevelId>('operador')
  const [pagePermissions, setPagePermissions] = useState(emptyAdminPagePermissions())
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo')
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
  const [cpfTouched, setCpfTouched] = useState(false)
  const [cpfError, setCpfError] = useState<string | null>(null)

  const isActive = open || closing
  const isViewMode = mode === 'view'
  const isEditMode = mode === 'edit'
  const isCreateMode = mode === 'create'
  const panelVisible = open && entered && !closing
  const mustSetPassword = isEditMode && editingUser !== null && !editingUser.hasPassword
  const showPasswordFields =
    !isViewMode && (isCreateMode || changePassword || mustSetPassword)
  const showPinInputs =
    !isViewMode &&
    (isCreateMode || changePin || !editingUser?.hasAuthorizationPin)

  const resetForm = useCallback(() => {
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setChangePassword(false)
    setPasswordError(null)
    setPin('')
    setConfirmPin('')
    setPinVisible(false)
    setConfirmPinVisible(false)
    setChangePin(false)
    setPinError(null)
    setCpfTouched(false)
    setCpfError(null)

    if (editingUser) {
      setName(editingUser.name)
      setEmail(editingUser.email)
      setCpf(maskCpf(editingUser.cpf))
      setRole(editingUser.role)
      setDepartmentId(editingUser.departmentId)
      setAccessLevel(editingUser.accessLevel)
      setPagePermissions({ ...editingUser.pagePermissions })
      setStatus(editingUser.status)
      return
    }
    setName('')
    setEmail('')
    setCpf('')
    setRole('')
    setDepartmentId('operacoes')
    setAccessLevel('operador')
    setPagePermissions(buildAdminInternoPagePermissions('operador'))
    setStatus('ativo')
  }, [editingUser])

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    resetForm()
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open, resetForm])

  function applyAccessLevelPreset(level: AccessLevelId) {
    setAccessLevel(level)
    setPagePermissions(buildAdminInternoPagePermissions(level))
  }

  function togglePageAction(pageId: AdminPortalPageId, action: PermissionAction) {
    setPagePermissions((prev) => {
      const next = {
        ...prev,
        [pageId]: toggleAction(prev[pageId], action),
      }
      setAccessLevel(inferAdminInternoAccessLevelFromPermissions(next))
      return next
    })
  }

  function togglePageEnabled(pageId: AdminPortalPageId, enabled: boolean) {
    setPagePermissions((prev) => {
      const next = {
        ...prev,
        [pageId]: enabled ? (prev[pageId].length ? prev[pageId] : ['visualizar']) : [],
      }
      setAccessLevel(inferAdminInternoAccessLevelFromPermissions(next))
      return next
    })
  }

  function validatePasswordFields(): string | null {
    if (!showPasswordFields) return null
    if (password.length < MIN_ACCESS_PASSWORD_LENGTH) {
      return `A senha de acesso deve ter pelo menos ${MIN_ACCESS_PASSWORD_LENGTH} caracteres.`
    }
    if (password !== confirmPassword) {
      return 'As senhas de acesso não coincidem.'
    }
    return null
  }

  function validatePinFields(): string | null {
    if (isViewMode) return null
    if (pin.length === 0 && confirmPin.length === 0) return null
    if (pin.length !== PIN_LENGTH) {
      return 'Se informar, a senha de autorização deve ter 6 dígitos.'
    }
    if (pin !== confirmPin) {
      return 'As senhas de autorização não coincidem.'
    }
    return null
  }

  function validateCpfField(): string | null {
    if (isViewMode) return null
    const digitsCount = cpfDigits(cpf).length
    if (digitsCount === 0) {
      return 'Informe o CPF do colaborador.'
    }
    if (digitsCount < 11) {
      return 'Informe um CPF completo com 11 dígitos.'
    }
    if (!isValidCpf(cpf)) {
      return 'CPF inválido. Verifique os números digitados.'
    }
    return null
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (isViewMode) return

    setCpfTouched(true)
    const cpfValidationError = validateCpfField()
    if (cpfValidationError) {
      setCpfError(cpfValidationError)
      return
    }
    setCpfError(null)

    const passwordValidationError = validatePasswordFields()
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      return
    }

    const pinValidationError = validatePinFields()
    if (pinValidationError) {
      setPinError(pinValidationError)
      return
    }

    const id = editingUser?.id ?? `adm-cred-${Date.now()}`
    const paletteIndex = Math.abs(id.length) % avatarPalette.length
    const passwordWasSet = showPasswordFields && password.length > 0
    const pinWasSet = pin.length === PIN_LENGTH && pin === confirmPin

    void onSave(
      {
        id,
        name: name.trim(),
        email: email.trim(),
        cpf: cpf.trim(),
        role: role.trim(),
        departmentId,
        accessLevel,
        status,
        initials: editingUser?.initials ?? getInitials(name),
        avatarClassName: editingUser?.avatarClassName ?? avatarPalette[paletteIndex]!,
        hasPassword: passwordWasSet || (editingUser?.hasPassword ?? false),
        hasAuthorizationPin:
          pinWasSet || (Boolean(editingUser?.hasAuthorizationPin) && !changePin),
        lastAccessLabel: editingUser?.lastAccessLabel ?? 'Nunca',
        pagePermissions,
      },
      {
        password: passwordWasSet ? password : undefined,
        authorizationPin: pinWasSet ? pin : changePin && pin.length === 0 ? null : undefined,
      },
    )
  }

  const passwordValid =
    !showPasswordFields ||
    (password.length >= MIN_ACCESS_PASSWORD_LENGTH && password === confirmPassword)

  const pinValid = validatePinFields() === null
  const cpfValid = validateCpfField() === null
  const cpfDigitsCount = cpfDigits(cpf).length
  const cpfInvalid = cpfTouched && cpfDigitsCount > 0 && !isValidCpf(cpf)
  const cpfShowError = Boolean(cpfError) || (cpfTouched && !cpfValid && !isViewMode)

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    cpfValid &&
    role.trim().length > 0 &&
    adminPortalPages.some((page) => pagePermissions[page.id].length > 0) &&
    passwordValid &&
    pinValid

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
        aria-label="Fechar cadastro"
        onClick={onClose}
        tabIndex={panelVisible ? 0 : -1}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-interno-drawer-title"
        onTransitionEnd={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.propertyName === 'transform') onTransitionEnd()
        }}
        className={`absolute inset-x-0 bottom-0 flex h-[92vh] max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border-t border-gray-200 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          panelVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-gray-200 bg-gradient-to-b from-[var(--brand-primary-light)]/40 to-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="admin-interno-drawer-title" className="text-lg font-bold text-gray-900">
                  {isViewMode
                    ? 'Visualizar colaborador'
                    : isEditMode
                      ? 'Editar colaborador'
                      : 'Novo acesso interno'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Credencial para o painel administrativo Telefarmed (/admin).
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Nome completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isViewMode}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  E-mail corporativo <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isViewMode}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  CPF <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(maskCpf(e.target.value))
                    if (cpfError) setCpfError(null)
                  }}
                  onBlur={() => setCpfTouched(true)}
                  disabled={isViewMode}
                  maxLength={14}
                  required
                  aria-invalid={cpfShowError}
                  className={[
                    inputClass,
                    cpfShowError ? 'border-red-300 focus:border-red-400 focus:ring-red-200/60' : '',
                  ].join(' ')}
                  placeholder="000.000.000-00"
                />
                {cpfShowError ? (
                  <p className="mt-1.5 text-xs text-red-600">
                    {cpfError ??
                      (cpfDigitsCount < 11
                        ? 'Informe um CPF completo com 11 dígitos.'
                        : 'CPF inválido. Verifique os números digitados.')}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">
                  Função <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isViewMode}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Área</label>
                <CustomSelect
                  value={departmentId}
                  onChange={(value) => setDepartmentId(value as AdminInternoDepartmentId)}
                  options={adminInternoDepartments.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  className="text-left"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Status</label>
                {isViewMode ? (
                  <div className={`${inputClass} bg-gray-50 text-gray-700`}>
                    {status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                  </div>
                ) : (
                  <CustomSelect
                    value={status}
                    onChange={(value) => setStatus(value as 'ativo' | 'inativo')}
                    options={[
                      { value: 'ativo', label: 'Ativo' },
                      { value: 'inativo', label: 'Bloqueado' },
                    ]}
                    className="text-left"
                  />
                )}
              </div>
            </section>

            {!isViewMode ? (
              <>
                <section>
                  <h3 className="text-sm font-bold text-gray-900">Senha de acesso à plataforma</h3>
                  {isEditMode && editingUser ? (
                    <div className="mt-2">
                      {editingUser.hasPassword ? (
                        <p className="text-xs text-gray-500">
                          Este colaborador já possui senha para entrar no painel (e-mail + senha).
                        </p>
                      ) : (
                        <p className="text-xs text-amber-700">
                          Nenhuma senha cadastrada. Defina uma senha para liberar o login.
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
                            className="h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)]"
                          />
                          <span className="text-sm font-medium text-gray-700">Alterar senha de acesso</span>
                        </label>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Senha usada no login do painel administrativo (/admin/login).
                    </p>
                  )}

                  {showPasswordFields ? (
                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <PasswordField
                        label={isEditMode ? 'Nova senha de acesso' : 'Senha de acesso'}
                        value={password}
                        onChange={(value) => {
                          setPassword(value)
                          setPasswordError(null)
                        }}
                        show={showPassword}
                        onToggleShow={() => setShowPassword((v) => !v)}
                        placeholder={`Mínimo ${MIN_ACCESS_PASSWORD_LENGTH} caracteres`}
                        required
                      />
                      <PasswordField
                        label="Confirmar senha de acesso"
                        value={confirmPassword}
                        onChange={(value) => {
                          setConfirmPassword(value)
                          setPasswordError(null)
                        }}
                        show={showConfirmPassword}
                        onToggleShow={() => setShowConfirmPassword((v) => !v)}
                        placeholder="Repita a senha de acesso"
                        required
                      />
                      {passwordError ? (
                        <p className="sm:col-span-2 text-xs font-medium text-red-600" role="alert">
                          {passwordError}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-900">Senha de autorização</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Senha numérica de 6 dígitos para confirmar ações sensíveis no painel admin
                    (opcional).
                  </p>
                  {isEditMode && editingUser ? (
                    <div className="mt-2">
                      {editingUser.hasAuthorizationPin ? (
                        <p className="text-xs text-gray-500">PIN de autorização já cadastrado.</p>
                      ) : (
                        <p className="text-xs text-amber-700">
                          Nenhum PIN cadastrado. Defina os 6 dígitos para liberar confirmações.
                        </p>
                      )}
                      {editingUser.hasAuthorizationPin ? (
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
                    </div>
                  ) : null}

                  {showPinInputs ? (
                    <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:items-start sm:gap-x-12 lg:max-w-4xl xl:gap-x-20">
                      <PinInput
                        id="admin-interno-auth-pin"
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
                        id="admin-interno-auth-pin-confirm"
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
                  ) : null}
                </section>
              </>
            ) : (
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Senha de acesso
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {editingUser?.hasPassword ? 'Cadastrada' : 'Não cadastrada'}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Senha de 6 dígitos
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-800">
                    {editingUser?.hasAuthorizationPin ? 'Cadastrada' : 'Não cadastrada'}
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
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {accessLevels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    disabled={isViewMode}
                    onClick={() => applyAccessLevelPreset(level.id)}
                    className={[
                      'rounded-xl border px-2 py-3 text-center text-xs transition',
                      accessLevel === level.id
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]'
                        : 'border-gray-200 bg-white hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <span className="font-semibold text-gray-900">{level.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-900">Páginas e autorizações</h3>
              <p className="mt-1 text-xs text-gray-500">
                Marque as páginas que o colaborador pode acessar e o tipo de ação permitida em
                cada uma.
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
                  {adminPortalPages.map((page) => {
                    const actions = pagePermissions[page.id]
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
                              disabled={isViewMode}
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
                              disabled={isViewMode || !pageEnabled}
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

          <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {isViewMode ? 'Fechar' : 'Cancelar'}
            </button>
            {!isViewMode ? (
              <button
                type="submit"
                disabled={!canSubmit || isSaving}
                className="btn-brand-gradient rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {isSaving
                  ? 'Salvando...'
                  : isEditMode
                    ? 'Salvar alterações'
                    : 'Cadastrar colaborador'}
              </button>
            ) : null}
          </footer>
        </form>
      </aside>
    </div>,
    document.body,
  )
}
