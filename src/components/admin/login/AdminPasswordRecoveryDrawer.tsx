import {
  ArrowLeft,
  Eye,
  EyeOff,
  IdCard,
  Lock,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { brand } from '../../../config/brand'
import {
  ADMIN_PASSWORD_RECOVERY_CODE_LENGTH,
  type AdminPasswordRecoveryStepId,
} from '../../../config/adminPasswordRecovery'
import {
  adminCompletePasswordRecovery,
  adminRequestPasswordRecovery,
  adminVerifyPasswordRecoveryCode,
  AdminPasswordRecoveryError,
} from '../../../lib/services/admin/passwordRecovery'
import { isValidCpf } from '../../../utils/cpf'
import { maskCpf } from '../../../utils/masks'
import { isPortalPasswordValid, validatePortalPassword } from '../../../utils/passwordPolicy'
import { UbtPasswordRecoveryEmailSentPanel } from '../../ubt/login/UbtPasswordRecoveryEmailSentPanel'
import { UbtPasswordRecoveryEtapa3Lottie } from '../../ubt/login/UbtPasswordRecoveryEtapa3Lottie'
import { UbtPasswordRecoveryLottie } from '../../ubt/login/UbtPasswordRecoveryLottie'
import { UbtPasswordRecoveryLottieHero } from '../../ubt/login/UbtPasswordRecoveryLottieHero'
import { UbtPasswordRecoveryPinValidationLottie } from '../../ubt/login/UbtPasswordRecoveryPinValidationLottie'
import { UbtPasswordRecoverySuccessPanel } from '../../ubt/login/UbtPasswordRecoverySuccessPanel'
import { PasswordStrengthChecklist } from '../../ubt/login/PasswordStrengthChecklist'
import { PinInput } from '../../ui/PinInput'
import { AdminPasswordRecoveryStepper } from './AdminPasswordRecoveryStepper'

const lottieInnerClass = 'h-full w-full shrink-0 [&_svg]:h-full [&_svg]:w-full'
const primaryButtonClass =
  'w-full rounded-xl bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50'
const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10'
const drawerShellClass =
  'absolute inset-y-0 right-0 z-10 flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-gray-200/90 bg-white shadow-[-12px_0_40px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none'

type AdminPasswordRecoveryDrawerProps = {
  open: boolean
  closing: boolean
  onClose: () => void
  onTransitionEnd: () => void
}

export function AdminPasswordRecoveryDrawer({
  open,
  closing,
  onClose,
  onTransitionEnd,
}: AdminPasswordRecoveryDrawerProps) {
  const [entered, setEntered] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const isActive = open || closing
  const panelVisible = isActive && entered && !closing

  useEffect(() => {
    if (!open) {
      setEntered(false)
      return
    }
    setSessionKey((current) => current + 1)
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!isActive) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, onClose])

  useEffect(() => {
    if (!closing) return
    const fallback = window.setTimeout(() => onTransitionEnd(), 350)
    return () => window.clearTimeout(fallback)
  }, [closing, onTransitionEnd])

  if (!isActive) return null

  return createPortal(
    <div
      className={`fixed inset-0 z-[9998] ${panelVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-gray-900/45 backdrop-blur-[2px] transition-opacity duration-300 ${panelVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Fechar recuperação de senha"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-password-recovery-title"
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget && event.propertyName === 'transform') {
            onTransitionEnd()
          }
        }}
        className={`${drawerShellClass} ${panelVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {isActive ? (
          <AdminPasswordRecoveryDrawerContent key={sessionKey} onClose={onClose} />
        ) : null}
      </aside>
    </div>,
    document.body,
  )
}

type AdminPasswordRecoveryDrawerContentProps = {
  onClose: () => void
}

function AdminPasswordRecoveryDrawerContent({ onClose }: AdminPasswordRecoveryDrawerContentProps) {
  const [step, setStep] = useState<AdminPasswordRecoveryStepId>('cpf')
  const [cpf, setCpf] = useState('')
  const [sentToEmail, setSentToEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [codeExpiresInMinutes, setCodeExpiresInMinutes] = useState(15)
  const [cpfTouched, setCpfTouched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [codeError, setCodeError] = useState(false)

  const cpfInvalid = cpfTouched && cpf.length > 0 && !isValidCpf(cpf)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const resetFlow = useCallback(() => {
    setStep('cpf')
    setCpf('')
    setSentToEmail('')
    setCode('')
    setPassword('')
    setConfirmPassword('')
    setResetToken(null)
    setVerificationToken(null)
    setCodeExpiresInMinutes(15)
    setCpfTouched(false)
    setSubmitError(null)
    setCodeError(false)
  }, [])

  async function handleCpfSubmit(event: FormEvent) {
    event.preventDefault()
    setCpfTouched(true)
    setSubmitError(null)

    if (!isValidCpf(cpf)) return

    setIsSubmitting(true)
    try {
      const result = await adminRequestPasswordRecovery(cpf)
      setResetToken(result.resetToken)
      setSentToEmail(result.sentTo)
      setCodeExpiresInMinutes(result.expiresInMinutes)
      setStep('emailSent')
      setCode('')
      setCodeError(false)
    } catch (error) {
      setSubmitError(
        error instanceof AdminPasswordRecoveryError
          ? error.message
          : 'Não foi possível enviar o código. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitError(null)
    setCodeError(false)

    if (code.length !== ADMIN_PASSWORD_RECOVERY_CODE_LENGTH || !resetToken) return

    setIsSubmitting(true)
    try {
      const result = await adminVerifyPasswordRecoveryCode({ resetToken, code })
      setVerificationToken(result.verificationToken)
      setStep('password')
      setPassword('')
      setConfirmPassword('')
    } catch (error) {
      setCodeError(true)
      setSubmitError(
        error instanceof AdminPasswordRecoveryError
          ? error.message
          : 'Não foi possível validar o código. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitError(null)

    if (!verificationToken) return
    if (!isPortalPasswordValid(password)) {
      setSubmitError(validatePortalPassword(password))
      return
    }
    if (!passwordsMatch) {
      setSubmitError('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      await adminCompletePasswordRecovery({ verificationToken, password })
      setStep('success')
    } catch (error) {
      setSubmitError(
        error instanceof AdminPasswordRecoveryError
          ? error.message
          : 'Não foi possível redefinir a senha. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    if (!isValidCpf(cpf)) return
    setSubmitError(null)
    setCodeError(false)
    setIsSubmitting(true)
    try {
      const result = await adminRequestPasswordRecovery(cpf)
      setResetToken(result.resetToken)
      setSentToEmail(result.sentTo)
      setCodeExpiresInMinutes(result.expiresInMinutes)
      setCode('')
      setStep('emailSent')
    } catch (error) {
      setSubmitError(
        error instanceof AdminPasswordRecoveryError
          ? error.message
          : 'Não foi possível reenviar o código.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    setSubmitError(null)
    setCodeError(false)
    if (step === 'code') {
      setStep('cpf')
      setCode('')
      return
    }
    if (step === 'password') {
      setStep('code')
      setPassword('')
      setConfirmPassword('')
    }
  }

  function continueToCodeStep() {
    setSubmitError(null)
    setStep('code')
  }

  const showStepper = step !== 'success' && step !== 'emailSent'
  const showHeaderLottie = step !== 'emailSent' && step !== 'success'
  const showChrome = step !== 'emailSent' && step !== 'success'

  const stepSubtitle =
    step === 'cpf'
      ? 'Informe o CPF do usuário administrativo cadastrado.'
      : step === 'code'
        ? `Digite o código de ${ADMIN_PASSWORD_RECOVERY_CODE_LENGTH} dígitos enviado para ${sentToEmail}.`
        : 'Defina uma nova senha para acessar o painel administrativo.'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between px-6 pt-6">
        {showChrome ? (
          <h2 id="admin-password-recovery-title" className="text-lg font-semibold text-gray-900">
            Recuperar senha
          </h2>
        ) : (
          <span aria-hidden className="h-7 w-7" />
        )}
        <button
          type="button"
          onClick={showChrome ? resetFlow : onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
          aria-label={showChrome ? 'Cancelar recuperação' : 'Fechar'}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {showHeaderLottie ? (
        <UbtPasswordRecoveryLottieHero size="lg">
          {step === 'code' ? (
            <UbtPasswordRecoveryPinValidationLottie className={lottieInnerClass} />
          ) : step === 'password' ? (
            <UbtPasswordRecoveryEtapa3Lottie className={lottieInnerClass} />
          ) : (
            <UbtPasswordRecoveryLottie className={lottieInnerClass} loop />
          )}
        </UbtPasswordRecoveryLottieHero>
      ) : null}

      {showChrome ? (
        <p className="shrink-0 px-6 pb-1 text-sm text-gray-500">{stepSubtitle}</p>
      ) : null}

      {showStepper ? <AdminPasswordRecoveryStepper currentStep={step} /> : null}

      {step === 'success' ? (
        <UbtPasswordRecoverySuccessPanel onClose={onClose} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {step === 'cpf' ? (
            <form className="space-y-4" onSubmit={handleCpfSubmit} noValidate>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">CPF</span>
                <span className="relative flex items-center">
                  <IdCard
                    className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400"
                    strokeWidth={1.75}
                  />
                  <input
                    type="text"
                    name="cpf"
                    autoComplete="username"
                    inputMode="numeric"
                    value={cpf}
                    onChange={(event) => setCpf(maskCpf(event.target.value))}
                    onBlur={() => setCpfTouched(true)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={[
                      inputClass,
                      cpfInvalid ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : '',
                    ].join(' ')}
                  />
                </span>
                {cpfInvalid ? (
                  <span className="text-xs text-red-600">Informe um CPF válido.</span>
                ) : null}
              </label>

              {submitError ? <AlertMessage message={submitError} /> : null}

              <button
                type="submit"
                disabled={isSubmitting || !isValidCpf(cpf)}
                className={primaryButtonClass}
              >
                {isSubmitting ? 'Enviando…' : 'Enviar código'}
              </button>
            </form>
          ) : null}

          {step === 'emailSent' ? (
            <UbtPasswordRecoveryEmailSentPanel
              email={sentToEmail}
              expiresInMinutes={codeExpiresInMinutes}
              onContinue={continueToCodeStep}
            />
          ) : null}

          {step === 'code' ? (
            <form className="space-y-5" onSubmit={handleCodeSubmit} noValidate>
              <PinInput
                id="admin-recovery-code"
                label={`Código de ${ADMIN_PASSWORD_RECOVERY_CODE_LENGTH} dígitos`}
                value={code}
                onChange={setCode}
                length={ADMIN_PASSWORD_RECOVERY_CODE_LENGTH}
                visible={showCode}
                onToggleVisible={() => setShowCode((current) => !current)}
                error={codeError}
                disabled={isSubmitting}
                autoFocus
                toggleVisibleLabel="Ver código"
                toggleHiddenLabel="Ocultar código"
              />

              {submitError ? <AlertMessage message={submitError} /> : null}

              <button
                type="submit"
                disabled={isSubmitting || code.length !== ADMIN_PASSWORD_RECOVERY_CODE_LENGTH}
                className={primaryButtonClass}
              >
                {isSubmitting ? 'Validando…' : 'Continuar'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800 disabled:opacity-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => void handleResendCode()}
                  disabled={isSubmitting}
                  className="text-sm text-[var(--brand-primary)] transition hover:underline disabled:opacity-50"
                >
                  Reenviar código
                </button>
              </div>
            </form>
          ) : null}

          {step === 'password' ? (
            <form className="space-y-4" onSubmit={handlePasswordSubmit} noValidate>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">Nova senha</span>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  visible={showPassword}
                  onToggleVisible={() => setShowPassword((current) => !current)}
                  autoComplete="new-password"
                  placeholder="Nova senha"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-gray-600">Confirmar senha</span>
                <PasswordField
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirmPassword}
                  onToggleVisible={() => setShowConfirmPassword((current) => !current)}
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  invalid={confirmPassword.length > 0 && !passwordsMatch}
                />
                {confirmPassword.length > 0 && !passwordsMatch ? (
                  <span className="text-xs text-red-600">As senhas não coincidem.</span>
                ) : null}
              </label>

              <PasswordStrengthChecklist password={password} />

              {submitError ? <AlertMessage message={submitError} /> : null}

              <button
                type="submit"
                disabled={isSubmitting || !isPortalPasswordValid(password) || !passwordsMatch}
                className={primaryButtonClass}
              >
                {isSubmitting ? 'Salvando…' : 'Redefinir senha'}
              </button>

              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800 disabled:opacity-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
            </form>
          ) : null}
        </div>
      )}

      <footer className="mt-auto shrink-0 border-t border-gray-100 px-6 py-4">
        <div className="flex justify-center">
          <img
            src={brand.logoUrl}
            alt={brand.appName}
            className="h-8 w-auto max-w-[180px] object-contain opacity-90"
          />
        </div>
      </footer>
    </div>
  )
}

function AlertMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="text-center text-xs text-red-600">
      {message}
    </p>
  )
}

type PasswordFieldProps = {
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisible: () => void
  autoComplete?: string
  placeholder?: string
  invalid?: boolean
}

function PasswordField({
  value,
  onChange,
  visible,
  onToggleVisible,
  autoComplete = 'new-password',
  placeholder = 'Senha',
  invalid = false,
}: PasswordFieldProps) {
  return (
    <span className="relative flex items-center">
      <Lock
        className="pointer-events-none absolute left-3.5 h-4 w-4 text-gray-400"
        strokeWidth={1.75}
      />
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={[
          inputClass,
          'pr-11',
          invalid ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : '',
        ].join(' ')}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3.5 text-gray-400 transition hover:text-gray-600"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </span>
  )
}
