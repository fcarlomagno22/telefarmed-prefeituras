import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  FileText,
  KeyRound,
  Loader2,
  Send,
  Wallet,
  X,
} from 'lucide-react'
import type {
  ProfissionalCompetenceClosure,
  ProfissionalPrestadorEmpresa,
} from '../../../types/profissionalFinanceiro'
import type { ProfissionalFinanceiroStats } from '../../../utils/profissional/computeProfissionalFinanceiroStats'
import { formatProfissionalCurrency } from '../../../utils/profissional/formatProfissionalCurrency'
import { formatCompetenceLabel } from '../../../utils/profissional/profissionalCompetence'
import {
  inferPixKeyTypeFromValue,
  defaultPixKeyForType,
  maskPixKeyValue,
  pixKeyIsFilled,
  pixKeyMatchesEmpresa,
  pixKeyPlaceholder,
  pixKeyValidationMessage,
  profissionalPixKeyTypeOptions,
  type ProfissionalPixKeyType,
} from '../../../utils/profissional/profissionalPixKey'
import {
  getProfissionalClosurePaymentMessage,
  simulateProfissionalInvoiceUpload,
} from '../../../utils/profissional/profissionalClosurePaymentMessage'
import { SituationStatusBadge } from '../../ui/SituationStatusBadge'
import { ClosureSuccessLottie } from './ClosureSuccessLottie'
import {
  PROFISSIONAL_CLOSURE_STATUS_BADGE_WIDTH,
  profissionalClosureStatusBadgeConfig,
} from './profissionalFinanceiroUi'
import { PROFISSIONAL_FINANCEIRO_TOUR_DEMO_INVOICE_FILE } from '../../../config/profissionalFinanceiroTour'

const ACCEPT_INVOICE = '.pdf,.xml,application/pdf,text/xml,application/xml'

type ClosureSubmitPhase = 'idle' | 'uploading' | 'success'

const closureSteps = [
  { id: 1 as const, label: 'Conferência', short: 'Resumo da competência' },
  { id: 2 as const, label: 'Nota fiscal', short: 'Anexar documento' },
  { id: 3 as const, label: 'PIX e envio', short: 'Confirmar repasse' },
]

type ClosureStepId = (typeof closureSteps)[number]['id']

type ProfissionalFinanceiroClosureModalProps = {
  open: boolean
  competenceKey: string
  closure: ProfissionalCompetenceClosure
  empresa: ProfissionalPrestadorEmpresa
  stats: ProfissionalFinanceiroStats
  canSubmit: boolean
  onClose: () => void
  onSubmit: (payload: {
    invoiceFileName: string
    pixKey: string
  }) => void
  tourLockClose?: boolean
  tourStepOverride?: ClosureStepId | null
  tourActive?: boolean
}

function pixMatchesRegisteredEmpresa(
  pixKeyType: ProfissionalPixKeyType,
  pixKey: string,
  empresa: ProfissionalPrestadorEmpresa,
) {
  return pixKeyMatchesEmpresa(pixKeyType, pixKey, empresa)
}

export function ProfissionalFinanceiroClosureModal({
  open,
  competenceKey,
  closure,
  empresa,
  stats,
  canSubmit,
  onClose,
  onSubmit,
  tourLockClose = false,
  tourStepOverride = null,
  tourActive = false,
}: ProfissionalFinanceiroClosureModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<ClosureStepId>(1)
  const [invoiceFileName, setInvoiceFileName] = useState('')
  const [pixKeyType, setPixKeyType] = useState<ProfissionalPixKeyType>(empresa.pixKeyType)
  const [pixKey, setPixKey] = useState(() => defaultPixKeyForType(empresa.pixKeyType, empresa))
  const [confirmedSummary, setConfirmedSummary] = useState(false)
  const [confirmAttentionKey, setConfirmAttentionKey] = useState(0)
  const [invoiceAttentionKey, setInvoiceAttentionKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitPhase, setSubmitPhase] = useState<ClosureSubmitPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [issuedAt, setIssuedAt] = useState<Date | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const pendingSubmissionRef = useRef<{ invoiceFileName: string; pixKey: string } | null>(null)

  const isLocked =
    closure.status === 'em_analise' ||
    closure.status === 'aprovado' ||
    closure.status === 'pago'
  const readOnly =
    submitPhase !== 'success' && submitPhase !== 'uploading' && (isLocked || !canSubmit)
  const competenceLabel = formatCompetenceLabel(competenceKey)
  const statusBadge = profissionalClosureStatusBadgeConfig[closure.status]
  const displayStep = tourStepOverride ?? step

  useEffect(() => {
    if (!open) return
    if (tourStepOverride != null) return

    setStep(1)
    setFormError(null)
    setConfirmedSummary(false)
    setConfirmAttentionKey(0)
    setInvoiceAttentionKey(0)
    setIsDragging(false)
    setSubmitPhase('idle')
    setUploadProgress(0)
    setIssuedAt(null)
    setIsSubmitting(false)
    pendingSubmissionRef.current = null
    setInvoiceFileName('')
  }, [open, tourStepOverride])

  useEffect(() => {
    if (!open || tourStepOverride == null) return

    if (tourStepOverride >= 1) {
      setConfirmedSummary(true)
    }
    if (tourStepOverride >= 2) {
      setInvoiceFileName(PROFISSIONAL_FINANCEIRO_TOUR_DEMO_INVOICE_FILE)
    }
  }, [open, tourStepOverride])

  useEffect(() => {
    if (!open) return

    setInvoiceFileName(closure.invoiceFileName ?? '')
    setPixKeyType(
      closure.pixKeyUsed
        ? inferPixKeyTypeFromValue(closure.pixKeyUsed, empresa)
        : empresa.pixKeyType,
    )
    setPixKey(
      closure.pixKeyUsed
        ? maskPixKeyValue(
            inferPixKeyTypeFromValue(closure.pixKeyUsed, empresa),
            closure.pixKeyUsed,
          )
        : defaultPixKeyForType(empresa.pixKeyType, empresa),
    )
  }, [open, closure.invoiceFileName, closure.pixKeyUsed, empresa])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && submitPhase === 'idle' && !tourLockClose) onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, submitPhase, tourLockClose])

  if (!open) return null

  function handleCloseAttempt(event?: React.SyntheticEvent) {
    if (tourLockClose) {
      event?.preventDefault()
      event?.stopPropagation()
      return
    }
    onClose()
  }

  function handleFile(file: File | undefined) {
    if (!file || readOnly) return
    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.pdf') && !lower.endsWith('.xml')) {
      setFormError('Envie a nota fiscal em PDF ou XML.')
      return
    }
    setFormError(null)
    setInvoiceFileName(file.name)
    setInvoiceAttentionKey(0)
  }

  function validateStep(target: ClosureStepId): boolean {
    setFormError(null)
    if (readOnly) return true

    if (target > 1 && step === 1 && !confirmedSummary) {
      setConfirmAttentionKey((key) => key + 1)
      return false
    }
    if (target > 2) {
      if (!invoiceFileName.trim()) {
        setInvoiceAttentionKey((key) => key + 1)
        return false
      }
    }
    return true
  }

  function goNext() {
    if (tourActive) return
    const next = Math.min(3, step + 1) as ClosureStepId
    if (!validateStep(next)) return
    setStep(next)
  }

  function goBack() {
    if (tourActive) return
    setFormError(null)
    setStep((prev) => Math.max(1, prev - 1) as ClosureStepId)
  }

  async function handleSubmit() {
    setFormError(null)
    if (readOnly) {
      onClose()
      return
    }
    if (!invoiceFileName.trim()) {
      setInvoiceAttentionKey((key) => key + 1)
      setStep(2)
      return
    }
    if (!pixKeyIsFilled(pixKeyType, pixKey)) {
      setFormError('Informe a chave PIX antes de enviar.')
      return
    }
    if (!pixMatchesRegisteredEmpresa(pixKeyType, pixKey, empresa)) {
      setFormError(pixKeyValidationMessage(pixKeyType, empresa))
      return
    }

    setIsSubmitting(true)
    setSubmitPhase('uploading')
    setUploadProgress(0)

    const submissionDate = new Date()
    setIssuedAt(submissionDate)

    await simulateProfissionalInvoiceUpload(setUploadProgress)

    pendingSubmissionRef.current = {
      invoiceFileName: invoiceFileName.trim(),
      pixKey: pixKey.trim(),
    }
    setSubmitPhase('success')
    setIsSubmitting(false)
  }

  function handleFinishSuccess() {
    const pending = pendingSubmissionRef.current
    if (pending) {
      onSubmit(pending)
      pendingSubmissionRef.current = null
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prof-financeiro-closure-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && submitPhase === 'idle') handleCloseAttempt(e)
      }}
    >
      <div
        data-tour="financeiro-closure-modal"
        className="flex max-h-[min(92dvh,48rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-black/10"
      >
        <header className="relative shrink-0 overflow-hidden border-b border-gray-100 px-6 py-5">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--brand-primary-light)]/50 via-white to-emerald-50/40"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--brand-primary)]">
                Fechamento da competência
              </p>
              <h2 id="prof-financeiro-closure-title" className="mt-1 text-xl font-bold tracking-tight text-gray-900">
                {competenceLabel}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {submitPhase === 'uploading'
                  ? 'Enviando sua nota fiscal...'
                  : submitPhase === 'success'
                    ? 'Fechamento concluído'
                    : 'Envie a nota fiscal e confirme o PIX para repasse.'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <SituationStatusBadge
                config={statusBadge}
                widthClass={PROFISSIONAL_CLOSURE_STATUS_BADGE_WIDTH}
              />
              <button
                type="button"
                onClick={(e) => handleCloseAttempt(e)}
                disabled={submitPhase === 'uploading'}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-white/80 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!readOnly && submitPhase === 'idle' ? (
            <nav
              className="relative mt-5"
              aria-label="Etapas do fechamento"
              data-tour="financeiro-closure-stepper"
            >
              <ClosureStepper activeStep={displayStep} />
            </nav>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5">
          {readOnly ? (
            <ReadOnlyClosureBody closure={closure} empresa={empresa} stats={stats} />
          ) : submitPhase === 'uploading' ? (
            <ClosureUploadPanel
              invoiceFileName={invoiceFileName}
              progress={uploadProgress}
            />
          ) : submitPhase === 'success' && issuedAt ? (
            <ClosureSuccessPanel
              competenceLabel={competenceLabel}
              invoiceFileName={invoiceFileName}
              issuedAt={issuedAt}
            />
          ) : (
            <>
              {displayStep === 1 ? (
                <StepConferencia
                  empresa={empresa}
                  stats={stats}
                  confirmed={confirmedSummary}
                  confirmAttentionKey={confirmAttentionKey}
                  onConfirmedChange={tourActive ? () => {} : setConfirmedSummary}
                />
              ) : null}
              {displayStep === 2 ? (
                <StepNotaFiscal
                  fileInputRef={fileInputRef}
                  invoiceFileName={invoiceFileName}
                  invoiceAttentionKey={invoiceAttentionKey}
                  isDragging={isDragging}
                  onFile={handleFile}
                  onDraggingChange={setIsDragging}
                />
              ) : null}
              {displayStep === 3 ? (
                <StepPixEnvio
                  empresa={empresa}
                  stats={stats}
                  invoiceFileName={invoiceFileName}
                  pixKeyType={pixKeyType}
                  pixKey={pixKey}
                  onPixKeyTypeChange={(type) => {
                    setPixKeyType(type)
                    setPixKey(defaultPixKeyForType(type, empresa))
                  }}
                  onPixKeyChange={(value) => setPixKey(maskPixKeyValue(pixKeyType, value))}
                />
              ) : null}
            </>
          )}

          {formError && submitPhase === 'idle' ? (
            <p className="mt-4 text-xs font-medium text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          {!canSubmit && !readOnly && submitPhase === 'idle' ? (
            <p className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              O fechamento fica disponível após o encerramento dos plantões previstos nesta
              competência ou ao final do mês.
            </p>
          ) : null}
        </div>

        <footer className="shrink-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/50 px-6 py-4 sm:flex-row sm:justify-between">
          {readOnly ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 sm:ml-auto sm:w-auto"
            >
              Fechar
            </button>
          ) : submitPhase === 'success' ? (
            <button
              type="button"
              onClick={handleFinishSuccess}
              className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 sm:ml-auto sm:w-auto"
            >
              Concluir
            </button>
          ) : submitPhase === 'uploading' ? (
            <button
              type="button"
              disabled
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white opacity-80 sm:ml-auto sm:w-auto"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enviando nota fiscal...
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={step === 1 ? (e) => handleCloseAttempt(e) : goBack}
                disabled={isSubmitting || tourActive}
                className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {displayStep === 1 ? (
                  'Cancelar'
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Voltar
                  </>
                )}
              </button>

              {displayStep < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canSubmit || tourActive}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isSubmitting || tourActive}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Enviar fechamento
                </button>
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  )
}

function ClosureUploadPanel({
  invoiceFileName,
  progress,
}: {
  invoiceFileName: string
  progress: number
}) {
  return (
    <div className="flex min-h-[18rem] flex-col items-center justify-center px-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand-primary-light)]/50 text-[var(--brand-primary)] ring-1 ring-orange-100">
        <CloudUpload className="h-8 w-8" aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-bold text-gray-900">Enviando nota fiscal</h3>
      <p className="mt-2 max-w-sm text-sm text-gray-600">
        Aguarde enquanto o arquivo{' '}
        <span className="font-semibold text-gray-900">{invoiceFileName}</span> é enviado com
        segurança.
      </p>

      <div className="mt-8 w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>Upload</span>
          <span className="tabular-nums text-[var(--brand-primary)]">{progress}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-orange-400 transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </div>
  )
}

function ClosureSuccessPanel({
  competenceLabel,
  invoiceFileName,
  issuedAt,
}: {
  competenceLabel: string
  invoiceFileName: string
  issuedAt: Date
}) {
  const paymentMessage = getProfissionalClosurePaymentMessage(issuedAt)

  return (
    <div className="flex flex-col items-center px-2 py-4 text-center">
      <div className="relative mx-auto flex h-[220px] w-[220px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 via-white to-white ring-1 ring-emerald-100/80">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(16,185,129,0.14)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative z-10">
          <ClosureSuccessLottie />
        </div>
      </div>

      <h3 className="mt-5 text-xl font-bold text-gray-900">Nota fiscal enviada!</h3>
      <p className="mt-2 max-w-md text-sm text-gray-600">
        O fechamento de <span className="font-semibold text-gray-900">{competenceLabel}</span> foi
        enviado com sucesso. Arquivo:{' '}
        <span className="font-semibold text-gray-900">{invoiceFileName}</span>.
      </p>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-4 text-left ring-1 ring-emerald-100/80">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Previsão de pagamento</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-800">{paymentMessage}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClosureStepper({ activeStep }: { activeStep: ClosureStepId }) {
  return (
    <ol className="flex items-start gap-0">
      {closureSteps.map((item, index) => {
        const isActive = activeStep === item.id
        const isDone = item.id < activeStep
        const isLast = index === closureSteps.length - 1

        return (
          <li
            key={item.id}
            className="flex min-w-0 flex-1 items-start"
            aria-current={isActive ? 'step' : undefined}
          >
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <span
                    className={[
                      'h-0.5 flex-1 rounded-full transition-colors',
                      isDone || isActive ? 'bg-emerald-400' : 'bg-gray-200',
                    ].join(' ')}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
                <span
                  className={[
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white transition',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white shadow-md shadow-orange-200/60'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                >
                  {isDone ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : item.id}
                </span>
                {!isLast ? (
                  <span
                    className={[
                      'h-0.5 flex-1 rounded-full transition-colors',
                      isDone ? 'bg-emerald-400' : 'bg-gray-200',
                    ].join(' ')}
                    aria-hidden
                  />
                ) : (
                  <span className="flex-1" aria-hidden />
                )}
              </div>
              <span
                className={[
                  'mt-2 text-xs font-bold',
                  isActive ? 'text-[var(--brand-primary)]' : isDone ? 'text-emerald-700' : 'text-gray-500',
                ].join(' ')}
              >
                {item.label}
              </span>
              <span className="mt-0.5 hidden text-[10px] text-gray-500 sm:block">{item.short}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function StepConferencia({
  empresa,
  stats,
  confirmed,
  confirmAttentionKey,
  onConfirmedChange,
}: {
  empresa: ProfissionalPrestadorEmpresa
  stats: ProfissionalFinanceiroStats
  confirmed: boolean
  confirmAttentionKey: number
  onConfirmedChange: (value: boolean) => void
}) {
  return (
    <div className="space-y-4" data-tour="financeiro-closure-conferencia">
      <p className="text-sm text-gray-600">
        Confira a empresa prestadora e os valores dos plantões realizados antes de anexar a nota
        fiscal.
      </p>

      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 ring-1 ring-gray-100">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-100">
            <Building2 className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Empresa do cadastro
            </p>
            <p className="text-sm font-bold text-gray-900">{empresa.razaoSocial}</p>
            <p className="text-xs text-gray-600">
              CNPJ {empresa.cnpj} · {empresa.nomeFantasia}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryTile
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          label="Valor realizados"
          value={formatProfissionalCurrency(stats.forecastCents)}
          tone="emerald"
        />
        <SummaryTile
          icon={<FileText className="h-5 w-5" aria-hidden />}
          label="Plantões"
          tone="brand"
        >
          <div className="mt-2 flex items-center justify-center gap-5">
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-gray-900">{stats.realizedCount}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                realizados
              </p>
            </div>
            <span className="h-8 w-px bg-gray-200" aria-hidden />
            <div className="text-center">
              <p className="text-2xl font-bold tabular-nums text-sky-700">{stats.scheduledCount}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                previstos
              </p>
            </div>
          </div>
        </SummaryTile>
      </div>

      <label
        key={confirmAttentionKey}
        className={[
          'flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm ring-1 ring-gray-50 transition hover:border-[var(--brand-primary)]/20',
          !confirmed && confirmAttentionKey > 0 ? 'closure-confirm-attention' : '',
        ].join(' ')}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => onConfirmedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]/30"
        />
        <span className="text-sm text-gray-700">
          Conferi os plantões e valores desta competência e estão corretos para emissão da nota
          fiscal.
        </span>
      </label>
    </div>
  )
}

function StepNotaFiscal({
  fileInputRef,
  invoiceFileName,
  invoiceAttentionKey,
  isDragging,
  onFile,
  onDraggingChange,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>
  invoiceFileName: string
  invoiceAttentionKey: number
  isDragging: boolean
  onFile: (file: File | undefined) => void
  onDraggingChange: (value: boolean) => void
}) {
  const needsInvoice = !invoiceFileName.trim()

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Anexe a nota fiscal de prestação de serviços referente a esta competência.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
          Arquivo da nota fiscal (PDF ou XML)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_INVOICE}
          className="sr-only"
          onChange={(e) => {
            onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div
          key={invoiceAttentionKey}
          data-tour="financeiro-closure-invoice"
          onDragEnter={(e) => {
            e.preventDefault()
            onDraggingChange(true)
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            e.preventDefault()
            onDraggingChange(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            onDraggingChange(false)
            onFile(e.dataTransfer.files[0])
          }}
          className={[
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition',
            isDragging
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/40'
              : 'border-gray-200 bg-gray-50/50 hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)]/10',
            needsInvoice && invoiceAttentionKey > 0 ? 'closure-confirm-attention' : '',
          ].join(' ')}
        >
          <CloudUpload className="h-7 w-7 text-[var(--brand-primary)]" aria-hidden />
          <p className="mt-2 text-sm text-gray-700">
            {invoiceFileName ? (
              <span className="font-semibold text-gray-900">{invoiceFileName}</span>
            ) : (
              <>
                Arraste a NF ou{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  selecione o arquivo
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function StepPixEnvio({
  empresa,
  stats,
  invoiceFileName,
  pixKeyType,
  pixKey,
  onPixKeyTypeChange,
  onPixKeyChange,
}: {
  empresa: ProfissionalPrestadorEmpresa
  stats: ProfissionalFinanceiroStats
  invoiceFileName: string
  pixKeyType: ProfissionalPixKeyType
  pixKey: string
  onPixKeyTypeChange: (type: ProfissionalPixKeyType) => void
  onPixKeyChange: (value: string) => void
}) {
  const isCnpj = pixKeyType === 'cnpj'
  const inputType = pixKeyType === 'email' ? 'email' : 'text'

  return (
    <div className="space-y-4" data-tour="financeiro-closure-pix">
      <p className="text-sm text-gray-600">
        Informe a chave PIX da mesma empresa do cadastro para recebimento do repasse.
      </p>

      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 text-sm">
        <p className="font-semibold text-gray-900">
          Total a faturar: {formatProfissionalCurrency(stats.forecastCents)}
        </p>
        <p className="mt-1 text-xs text-gray-600">{invoiceFileName || 'Arquivo não anexado'}</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-700">Tipo de chave PIX</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {profissionalPixKeyTypeOptions.map((option) => {
            const selected = pixKeyType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onPixKeyTypeChange(option.value)}
                className={[
                  'rounded-xl border px-3 py-2.5 text-xs font-semibold transition',
                  selected
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-light)]/40 text-[var(--brand-primary)] shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50',
                ].join(' ')}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="closure-pix-key" className="mb-1.5 block text-xs font-semibold text-gray-700">
          Chave PIX
        </label>
        <div className="relative">
          <KeyRound
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            id="closure-pix-key"
            type={inputType}
            value={pixKey}
            readOnly={isCnpj}
            onChange={(e) => onPixKeyChange(e.target.value)}
            placeholder={pixKeyPlaceholder(pixKeyType)}
            className={[
              'w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-[var(--brand-primary)]/40 focus:ring-2 focus:ring-[var(--brand-primary)]/15',
              isCnpj ? 'cursor-default bg-gray-50 text-gray-700' : '',
              pixKeyType === 'aleatoria' ? 'font-mono text-xs tracking-wide' : '',
            ].join(' ')}
          />
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          {isCnpj
            ? `CNPJ da empresa cadastrada (${empresa.razaoSocial}).`
            : 'Deve corresponder à chave Pix da empresa cadastrada como prestadora.'}
        </p>
      </div>
    </div>
  )
}

function ReadOnlyClosureBody({
  closure,
  empresa,
  stats,
}: {
  closure: ProfissionalCompetenceClosure
  empresa: ProfissionalPrestadorEmpresa
  stats: ProfissionalFinanceiroStats
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 ring-1 ring-gray-100">
        <p className="text-sm font-bold text-gray-900">{empresa.razaoSocial}</p>
        <p className="text-xs text-gray-600">CNPJ {empresa.cnpj}</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">
          {formatProfissionalCurrency(stats.forecastCents)}
        </p>
      </div>

      {closure.status === 'pago' ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            Repasse confirmado
            {closure.paidAt
              ? ` em ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(closure.paidAt))}`
              : ''}
            .
          </p>
        </div>
      ) : null}

      {closure.status === 'rejeitado' && closure.rejectionReason ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{closure.rejectionReason}</p>
        </div>
      ) : null}

      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-5 text-center text-sm text-gray-600">
        <FileText className="mx-auto h-7 w-7 text-gray-300" strokeWidth={1.5} />
        <p className="mt-2 font-medium text-gray-800">Documentos enviados</p>
        <p className="mt-1 text-xs">
          {closure.invoiceFileName ?? '—'}
          {closure.invoiceNumber ? ` · NF nº ${closure.invoiceNumber}` : ''}
        </p>
        <p className="mt-1 text-xs text-gray-500">PIX: {closure.pixKeyUsed ?? empresa.pixKeys[empresa.pixKeyType]}</p>
      </div>
    </div>
  )
}

function SummaryTile({
  icon,
  label,
  value,
  tone = 'brand',
  children,
}: {
  icon: ReactNode
  label: string
  value?: string
  tone?: 'emerald' | 'brand'
  children?: ReactNode
}) {
  const toneStyles = {
    emerald: {
      card: 'from-emerald-50/90 via-white to-emerald-50/30 ring-emerald-100/90',
      icon: 'text-emerald-600',
      value: 'text-emerald-900',
    },
    brand: {
      card: 'from-[var(--brand-primary-light)]/50 via-white to-orange-50/30 ring-orange-100/90',
      icon: 'text-[var(--brand-primary)]',
      value: 'text-gray-900',
    },
  }[tone]

  return (
    <div
      className={[
        'flex min-h-[9.5rem] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gradient-to-br px-5 py-5 text-center shadow-sm ring-1',
        toneStyles.card,
      ].join(' ')}
    >
      <span className={toneStyles.icon}>{icon}</span>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      {children ?? (
        <p className={['mt-2 text-2xl font-bold tabular-nums leading-tight', toneStyles.value].join(' ')}>
          {value}
        </p>
      )}
    </div>
  )
}
