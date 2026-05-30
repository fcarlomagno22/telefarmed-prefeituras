import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  formatProfissionalConselhoRegistro,
  getProfissionalConselhoConfig,
  type ProfissionalConselhoConfig,
} from '../../../config/profissionalConselhoConfig'
import type { ProfissionalPerfil } from '../../../types/profissionalPerfil'
import type { ProfissionalCertificadoVinculoPhase } from '../../../utils/profissional/simulateProfissionalCertificadoVinculo'

type VincularStep = 'confirm' | 'authorizing' | 'success'

type ProfissionalPerfilVincularCertificadoModalProps = {
  open: boolean
  profile: ProfissionalPerfil
  onClose: () => void
  onVincular: (
    onPhase: (phase: ProfissionalCertificadoVinculoPhase, progress: number) => void,
  ) => Promise<void>
}

const phaseLabels: Record<ProfissionalCertificadoVinculoPhase, string> = {
  redirect: 'Redirecionando ao portal do conselho…',
  validate: 'Validando certificado e registro profissional…',
  bind: 'Vinculando certificado à sua conta Telefarmed…',
}

function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function ConfirmStep({
  conselho,
  profile,
  registroLabel,
  confirmed,
  onConfirmedChange,
  formError,
}: {
  conselho: ProfissionalConselhoConfig
  profile: ProfissionalPerfil
  registroLabel: string
  confirmed: boolean
  onConfirmedChange: (value: boolean) => void
  formError: string | null
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-gray-600">{conselho.certificadoNuvemDescricao}</p>

      <dl className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase text-gray-500">Profissional</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-800">{profile.fullName}</dd>
        </div>
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase text-gray-500">{conselho.registroFieldLabel}</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-800">{registroLabel}</dd>
        </div>
        <div className="rounded-xl border border-gray-100 bg-slate-50/70 px-3 py-2 sm:col-span-2">
          <dt className="text-[10px] font-bold uppercase text-gray-500">CPF</dt>
          <dd className="mt-0.5 text-sm font-medium text-gray-800">{maskCpf(profile.cpf)}</dd>
        </div>
      </dl>

      <ul className="space-y-1.5 rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs leading-relaxed text-sky-900">
        <li>Registro ativo e adimplente no {conselho.conselhoRegionalSigla}.</li>
        <li>Certificado emitido pelo {conselho.conselhoFederal} (ICP-Brasil).</li>
        <li>Autenticação no portal oficial do conselho neste fluxo.</li>
      </ul>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirmedChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
        />
        <span className="text-xs leading-relaxed text-gray-700">
          Confirmo que possuo certificado digital emitido pelo {conselho.conselhoFederal} e autorizo a
          vinculação à minha conta na plataforma.
        </span>
      </label>

      {formError ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <a
        href={conselho.portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
      >
        Ainda não tenho certificado — abrir portal do {conselho.conselhoFederal}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  )
}

export function ProfissionalPerfilVincularCertificadoModal({
  open,
  profile,
  onClose,
  onVincular,
}: ProfissionalPerfilVincularCertificadoModalProps) {
  const conselho = getProfissionalConselhoConfig(profile.conselhoClasse)
  const registroLabel = formatProfissionalConselhoRegistro(
    conselho.conselhoRegionalSigla,
    profile.conselhoRegistro,
    profile.conselhoUf,
  )

  const [step, setStep] = useState<VincularStep>('confirm')
  const [confirmed, setConfirmed] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [phaseLabel, setPhaseLabel] = useState(phaseLabels.redirect)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && step !== 'authorizing') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, step])

  useEffect(() => {
    if (!open) {
      setStep('confirm')
      setConfirmed(false)
      setFormError(null)
      setProgress(0)
      setPhaseLabel(phaseLabels.redirect)
    }
  }, [open])

  async function handleVincular() {
    if (!confirmed) {
      setFormError('Marque a confirmação para continuar.')
      return
    }
    setFormError(null)
    setStep('authorizing')
    setProgress(0)
    setPhaseLabel(phaseLabels.redirect)
    try {
      await onVincular((phase, value) => {
        setProgress(value)
        setPhaseLabel(phaseLabels[phase])
      })
      setStep('success')
    } catch {
      setFormError('Não foi possível vincular o certificado. Tente novamente.')
      setStep('confirm')
      setProgress(0)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-end justify-center p-4 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-gray-900/45 backdrop-blur-[2px]"
        aria-label="Fechar vinculação de certificado"
        onClick={() => {
          if (step !== 'authorizing') onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perfil-vincular-certificado-title"
        className="relative flex max-h-[min(92dvh,38rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <header className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[var(--brand-primary-light)]/25 to-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={step === 'authorizing'}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 pr-10">
            <ShieldCheck className="h-5 w-5 text-[var(--brand-primary)]" aria-hidden />
            <h2 id="perfil-vincular-certificado-title" className="text-lg font-bold text-gray-900">
              Vincular certificado
            </h2>
          </div>
          <p className="mt-1 pr-10 text-sm text-gray-600">{conselho.certificadoNuvemTitulo}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 'confirm' ? (
            <ConfirmStep
              conselho={conselho}
              profile={profile}
              registroLabel={registroLabel}
              confirmed={confirmed}
              onConfirmedChange={(value) => {
                setConfirmed(value)
                if (value) setFormError(null)
              }}
              formError={formError}
            />
          ) : null}

          {step === 'authorizing' ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <Loader2
                className="h-10 w-10 animate-spin text-[var(--brand-primary)]"
                aria-hidden
              />
              <p className="mt-4 text-sm font-semibold text-gray-900">{phaseLabel}</p>
              <p className="mt-1 max-w-xs text-xs text-gray-500">
                Não feche esta janela. Estamos validando seu certificado com o {conselho.conselhoFederal}.
              </p>
              <div className="mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-medium text-gray-500">{progress}%</p>
            </div>
          ) : null}

          {step === 'success' ? (
            <div className="flex flex-col items-center px-4 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" aria-hidden />
              <p className="mt-4 text-base font-bold text-gray-900">Certificado vinculado</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
                Seu certificado {conselho.conselhoFederal} foi associado com sucesso. Você já pode assinar
                receitas, atestados e documentos clínicos na plataforma.
              </p>
            </div>
          ) : null}
        </div>

        {step !== 'authorizing' ? (
          <footer className="shrink-0 border-t border-gray-100 px-5 py-4">
            {step === 'confirm' ? (
              <button
                type="button"
                onClick={handleVincular}
                className="w-full rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
              >
                Vincular com o {conselho.conselhoFederal}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary-hover)]"
              >
                Concluir
              </button>
            )}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
