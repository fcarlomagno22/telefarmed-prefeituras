import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  PROFISSIONAL_FINALIZAR_CADASTRO_CODE_EXPIRY_DAYS,
  PROFISSIONAL_FINALIZAR_CADASTRO_MIN_PASSWORD_LENGTH,
  profissionalFinalizarCadastroSteps,
  type ProfissionalFinalizarCadastroStepId,
} from '../../../config/profissionalFinalizarCadastro'
import type { ProfissionalPixKeyType } from '../../../types/profissionalFinanceiro'
import type {
  ProfissionalFinalizarCadastroEmpresaData,
  ProfissionalFinalizarCadastroFormErrors,
  ProfissionalFinalizarCadastroFormValues,
  ProfissionalFinalizarCadastroProfissionalData,
} from '../../../types/profissionalFinalizarCadastro'
import { maskCnpj } from '../../../utils/masks'
import {
  maskPixKeyValue,
  pixKeyPlaceholder,
  profissionalPixKeyTypeOptions,
} from '../../../utils/profissional/profissionalPixKey'
import {
  hasProfissionalFinalizarCadastroErrors,
  validateProfissionalFinalizarCadastroAccessStep,
  validateProfissionalFinalizarCadastroConfirmarEmpresaStep,
  validateProfissionalFinalizarCadastroContratoStep,
  validateProfissionalFinalizarCadastroEmpresaStep,
  validateProfissionalFinalizarCadastroFotoStep,
  validateProfissionalFinalizarCadastroPixStep,
  validateProfissionalFinalizarCadastroSenhaStep,
} from '../../../utils/profissional/validateProfissionalFinalizarCadastro'
import {
  fetchProfissionalFinalizarCadastroProfissional,
} from '../../../utils/profissional/fetchProfissionalFinalizarCadastroProfissional'
import {
  fetchProfissionalEmpresaByCnpj,
  ProfissionalEmpresaLookupError,
} from '../../../utils/profissional/fetchProfissionalEmpresaByCnpj'
import { CustomSelect } from '../../ui/CustomSelect'
import { PinInput } from '../../ui/PinInput'
import { ProfissionalFinalizarCadastroFotoPanel } from './ProfissionalFinalizarCadastroFotoPanel'
import { ProfissionalFinalizarCadastroContratoPanel } from './ProfissionalFinalizarCadastroContratoPanel'
import { ProfissionalFinalizarCadastroEmpresaConfirmPanel } from './ProfissionalFinalizarCadastroEmpresaConfirmPanel'
import { ProfissionalFinalizarCadastroStepper } from './ProfissionalFinalizarCadastroStepper'
import { ProfissionalFinalizarCadastroWelcome } from './ProfissionalFinalizarCadastroWelcome'

type ProfissionalFinalizarCadastroFormProps = {
  className?: string
}

const emptyValues = (): ProfissionalFinalizarCadastroFormValues => ({
  accessCode: '',
  cnpj: '',
  empresaConfirmed: false,
  pixKeyType: 'cnpj',
  pixKey: '',
  selfiePhotoDataUrl: '',
  contractOpened: false,
  contractScrolledToEnd: false,
  contractAccepted: false,
  password: '',
  confirmPassword: '',
})

function resolveStepIndex(step: ProfissionalFinalizarCadastroStepId) {
  return profissionalFinalizarCadastroSteps.findIndex((item) => item.id === step)
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-gray-900 outline-none transition',
    hasError
      ? 'border-red-300 ring-2 ring-red-100 focus:border-red-400'
      : 'border-gray-200 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/15',
  ].join(' ')
}

export function ProfissionalFinalizarCadastroForm({
  className = '',
}: ProfissionalFinalizarCadastroFormProps) {
  const [step, setStep] = useState<ProfissionalFinalizarCadastroStepId>('access')
  const [values, setValues] = useState<ProfissionalFinalizarCadastroFormValues>(emptyValues)
  const [empresaData, setEmpresaData] = useState<ProfissionalFinalizarCadastroEmpresaData | null>(
    null,
  )
  const [profissionalData, setProfissionalData] =
    useState<ProfissionalFinalizarCadastroProfissionalData | null>(null)
  const [errors, setErrors] = useState<ProfissionalFinalizarCadastroFormErrors>({})
  const [showAccessCode, setShowAccessCode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isFetchingEmpresa, setIsFetchingEmpresa] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const stepIndex = resolveStepIndex(step)
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === profissionalFinalizarCadastroSteps.length - 1

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, completed])

  function validateCurrentStep() {
    if (step === 'access') return validateProfissionalFinalizarCadastroAccessStep(values.accessCode)
    if (step === 'empresa') return validateProfissionalFinalizarCadastroEmpresaStep(values.cnpj)
    if (step === 'confirmarEmpresa') {
      return validateProfissionalFinalizarCadastroConfirmarEmpresaStep(
        values.empresaConfirmed,
        Boolean(empresaData),
      )
    }
    if (step === 'pix') {
      return validateProfissionalFinalizarCadastroPixStep(values.pixKeyType, values.pixKey)
    }
    if (step === 'foto') {
      return validateProfissionalFinalizarCadastroFotoStep(values.selfiePhotoDataUrl)
    }
    if (step === 'contrato') {
      return validateProfissionalFinalizarCadastroContratoStep(
        values.contractScrolledToEnd,
        values.contractAccepted,
      )
    }
    return validateProfissionalFinalizarCadastroSenhaStep(values.password, values.confirmPassword)
  }

  function resetContractProgress() {
    setValues((prev) => ({
      ...prev,
      contractOpened: false,
      contractScrolledToEnd: false,
      contractAccepted: false,
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.contractOpened
      delete next.contractScrolledToEnd
      delete next.contractAccepted
      return next
    })
  }

  async function goNext() {
    const stepErrors = validateCurrentStep()
    setErrors(stepErrors)
    if (hasProfissionalFinalizarCadastroErrors(stepErrors)) return

    if (step === 'access') {
      try {
        const profissional = await fetchProfissionalFinalizarCadastroProfissional(values.accessCode)
        setProfissionalData(profissional)
      } catch {
        setErrors({
          accessCode: 'Não foi possível carregar seus dados de cadastro. Tente novamente.',
        })
        return
      }
    }

    if (step === 'empresa') {
      setIsFetchingEmpresa(true)
      try {
        const data = await fetchProfissionalEmpresaByCnpj(values.cnpj)
        setEmpresaData(data)
        resetContractProgress()
        setValues((prev) => ({
          ...prev,
          empresaConfirmed: false,
          pixKey: prev.pixKeyType === 'cnpj' ? prev.cnpj : prev.pixKey,
        }))
      } catch (error) {
        const message =
          error instanceof ProfissionalEmpresaLookupError
            ? error.message
            : 'Não foi possível consultar o CNPJ. Tente novamente.'
        setErrors({ cnpj: message })
        return
      } finally {
        setIsFetchingEmpresa(false)
      }
    }

    const next = profissionalFinalizarCadastroSteps[stepIndex + 1]
    if (next) setStep(next.id)
  }

  function goBack() {
    const prev = profissionalFinalizarCadastroSteps[stepIndex - 1]
    if (prev) {
      setErrors({})
      setStep(prev.id)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const stepErrors = validateProfissionalFinalizarCadastroSenhaStep(
      values.password,
      values.confirmPassword,
    )
    setErrors(stepErrors)
    if (hasProfissionalFinalizarCadastroErrors(stepErrors)) return

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 900))
      setCompleted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  function patchValues<K extends keyof ProfissionalFinalizarCadastroFormValues>(
    key: K,
    value: ProfissionalFinalizarCadastroFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handlePixTypeChange(type: ProfissionalPixKeyType) {
    setValues((prev) => ({
      ...prev,
      pixKeyType: type,
      pixKey: type === 'cnpj' ? prev.cnpj : '',
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.pixKey
      delete next.pixKeyType
      return next
    })
  }

  function handleCnpjChange(raw: string) {
    const cnpj = maskCnpj(raw)
    setValues((prev) => ({
      ...prev,
      cnpj,
      empresaConfirmed: false,
      pixKey: prev.pixKeyType === 'cnpj' ? cnpj : prev.pixKey,
    }))
    setEmpresaData(null)
    resetContractProgress()
    setErrors((prev) => {
      const next = { ...prev }
      delete next.cnpj
      delete next.confirmarEmpresa
      delete next.empresaConfirmed
      return next
    })
  }

  function handleContractScrolledToEnd() {
    setValues((prev) => ({
      ...prev,
      contractScrolledToEnd: true,
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.contractScrolledToEnd
      return next
    })
  }

  function handleContractOpened() {
    patchValues('contractOpened', true)
  }

  function handleContractAcceptedChange(contractAccepted: boolean) {
    patchValues('contractAccepted', contractAccepted)
  }

  return (
    <div
      className={[
        'flex max-h-[min(720px,calc(100vh-8rem))] min-h-[480px] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_12px_48px_rgba(15,23,42,0.1)] ring-1 ring-gray-900/[0.04]',
        className,
      ].join(' ')}
    >
      {!completed ? (
        <header className="shrink-0 px-5 pt-5 sm:px-6">
          <h2 className="text-base font-bold leading-snug text-gray-900 sm:text-[17px]">
            Finalize seu{' '}
            <span className="text-[var(--brand-primary)]">cadastro profissional</span>
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500 sm:text-[13px]">
            Use o código de 6 dígitos recebido por e-mail após a aprovação da sua candidatura.
          </p>
        </header>
      ) : null}

      {!completed ? <ProfissionalFinalizarCadastroStepper currentStep={step} /> : null}

      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 no-scrollbar sm:px-6">
        {completed ? (
          <ProfissionalFinalizarCadastroWelcome />
        ) : (
          <form className="space-y-4" onSubmit={isLastStep ? handleSubmit : undefined} noValidate>
            {step === 'access' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>
                    Enviamos um código de acesso para o e-mail informado no cadastro inicial. Ele
                    expira em {PROFISSIONAL_FINALIZAR_CADASTRO_CODE_EXPIRY_DAYS} dias.
                  </p>
                </div>

                <PinInput
                  id="finalizar-cadastro-code"
                  label="Código de acesso"
                  value={values.accessCode}
                  onChange={(accessCode) => patchValues('accessCode', accessCode)}
                  visible={showAccessCode}
                  onToggleVisible={() => setShowAccessCode((current) => !current)}
                  error={Boolean(errors.accessCode)}
                  autoFocus
                  toggleVisibleLabel="Ver código"
                  toggleHiddenLabel="Ocultar código"
                />

                {errors.accessCode ? (
                  <p className="text-center text-xs font-medium text-red-600" role="alert">
                    {errors.accessCode}
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 'empresa' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>
                    Informe o CNPJ da empresa prestadora de serviços (PJ). Na próxima etapa
                    consultaremos os dados cadastrais na Receita Federal para você confirmar.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-700">CNPJ da empresa</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="organization"
                    value={values.cnpj}
                    onChange={(event) => handleCnpjChange(event.target.value)}
                    placeholder="00.000.000/0000-00"
                    className={inputClass(Boolean(errors.cnpj))}
                  />
                  {errors.cnpj ? (
                    <span className="text-xs font-medium text-red-600" role="alert">
                      {errors.cnpj}
                    </span>
                  ) : null}
                </label>
              </div>
            ) : null}

            {step === 'confirmarEmpresa' ? (
              empresaData ? (
                <ProfissionalFinalizarCadastroEmpresaConfirmPanel
                  empresa={empresaData}
                  confirmed={values.empresaConfirmed}
                  onConfirmedChange={(empresaConfirmed) =>
                    patchValues('empresaConfirmed', empresaConfirmed)
                  }
                  error={errors.empresaConfirmed ?? errors.confirmarEmpresa}
                />
              ) : (
                <p className="text-center text-sm text-gray-500">
                  Carregando dados da empresa…
                </p>
              )
            ) : null}

            {step === 'pix' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3 py-2.5 text-xs leading-relaxed text-emerald-900">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>
                    Cadastre a chave PIX da mesma empresa. Você poderá alterá-la depois em{' '}
                    <strong>Meu perfil</strong> ou no fechamento financeiro.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-700">Tipo de chave PIX</span>
                  <CustomSelect
                    value={values.pixKeyType}
                    onChange={(value) => handlePixTypeChange(value as ProfissionalPixKeyType)}
                    options={profissionalPixKeyTypeOptions.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    className={inputClass(false)}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-700">Chave PIX</span>
                  <input
                    type="text"
                    value={values.pixKey}
                    onChange={(event) =>
                      patchValues(
                        'pixKey',
                        maskPixKeyValue(values.pixKeyType, event.target.value),
                      )
                    }
                    placeholder={pixKeyPlaceholder(values.pixKeyType)}
                    className={inputClass(Boolean(errors.pixKey))}
                  />
                  {errors.pixKey ? (
                    <span className="text-xs font-medium text-red-600" role="alert">
                      {errors.pixKey}
                    </span>
                  ) : null}
                </label>
              </div>
            ) : null}

            {step === 'foto' ? (
              <ProfissionalFinalizarCadastroFotoPanel
                photoDataUrl={values.selfiePhotoDataUrl}
                onPhotoCapture={(selfiePhotoDataUrl) =>
                  patchValues('selfiePhotoDataUrl', selfiePhotoDataUrl)
                }
                error={errors.selfiePhotoDataUrl}
              />
            ) : null}

            {step === 'contrato' && empresaData && profissionalData ? (
              <ProfissionalFinalizarCadastroContratoPanel
                empresa={empresaData}
                profissional={profissionalData}
                contractOpened={values.contractOpened}
                contractScrolledToEnd={values.contractScrolledToEnd}
                contractAccepted={values.contractAccepted}
                onContractOpened={handleContractOpened}
                onContractScrolledToEnd={handleContractScrolledToEnd}
                onContractAcceptedChange={handleContractAcceptedChange}
                errors={{
                  contractScrolledToEnd: errors.contractScrolledToEnd,
                  contractAccepted: errors.contractAccepted,
                }}
              />
            ) : null}

            {step === 'senha' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-xl border border-violet-100 bg-violet-50/90 px-3 py-2.5 text-xs leading-relaxed text-violet-950">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <p>
                    Defina a senha que usará para entrar na plataforma com seu CPF. Mínimo de{' '}
                    {PROFISSIONAL_FINALIZAR_CADASTRO_MIN_PASSWORD_LENGTH} caracteres.
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-700">Senha de acesso</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={values.password}
                      onChange={(event) => patchValues('password', event.target.value)}
                      className={`${inputClass(Boolean(errors.password))} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:text-gray-600"
                      aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <span className="text-xs font-medium text-red-600" role="alert">
                      {errors.password}
                    </span>
                  ) : null}
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-gray-700">Confirmar senha</span>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={values.confirmPassword}
                      onChange={(event) => patchValues('confirmPassword', event.target.value)}
                      className={`${inputClass(Boolean(errors.confirmPassword))} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Ocultar confirmação' : 'Ver confirmação'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <span className="text-xs font-medium text-red-600" role="alert">
                      {errors.confirmPassword}
                    </span>
                  ) : null}
                </label>
              </div>
            ) : null}

            <div className="flex items-center gap-2 pt-2">
              <div className="min-w-0 flex-1">
                {!isFirstStep ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Voltar
                  </button>
                ) : null}
              </div>

              {isLastStep ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.3)] transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Finalizando…' : 'Concluir cadastro'}
                  {!isSubmitting ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={isFetchingEmpresa}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,107,0,0.3)] transition hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isFetchingEmpresa ? 'Consultando CNPJ…' : 'Continuar'}
                  {!isFetchingEmpresa ? <ChevronRight className="h-4 w-4" aria-hidden /> : null}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
