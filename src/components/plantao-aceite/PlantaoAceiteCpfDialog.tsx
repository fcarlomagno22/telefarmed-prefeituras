import { useEffect, useId, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { maskCpf } from '../../utils/masks'
import { cpfDigits, isValidCpf } from '../../utils/cpf'

type PlantaoAceiteCpfDialogProps = {
  open: boolean
  specialty?: string
  description?: string
  mode?: 'titular' | 'reserva' | 'batch'
  isSubmitting: boolean
  errorMessage: string | null
  onClose: () => void
  onConfirm: (cpf: string) => void
}

export function PlantaoAceiteCpfDialog({
  open,
  specialty,
  description,
  mode = 'titular',
  isSubmitting,
  errorMessage,
  onClose,
  onConfirm,
}: PlantaoAceiteCpfDialogProps) {
  const titleId = useId()
  const [cpf, setCpf] = useState('')

  useEffect(() => {
    if (!open) {
      setCpf('')
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, isSubmitting, onClose])

  if (!open) return null

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!isValidCpf(cpf)) return
    onConfirm(cpfDigits(cpf))
  }

  const cpfInvalid = cpfDigits(cpf).length === 11 && !isValidCpf(cpf)
  const submitLabel =
    mode === 'batch'
      ? 'Aceitar selecionados'
      : mode === 'reserva'
        ? 'Candidatar-se como reserva'
        : 'Pegar plantão'
  const submittingLabel =
    mode === 'batch'
      ? 'Aceitando…'
      : mode === 'reserva'
        ? 'Candidatando…'
        : 'Reservando…'
  const subtitle =
    description ??
    (specialty ? `Plantão de ${specialty}` : 'Confirme sua identidade para continuar.')

  return (
    <div
      className="fixed inset-0 z-[120] hidden items-end justify-center bg-black/40 p-4 sm:flex sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget || isSubmitting) return
        onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">
              Confirme seu CPF
            </h2>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              id="plantao-aceite-cpf"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Digite seu CPF"
              value={cpf}
              onChange={(event) => setCpf(maskCpf(event.target.value))}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-medium tabular-nums tracking-wide text-gray-900 outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
            />
            {cpfInvalid ? (
              <p className="mt-2 text-center text-xs text-red-600">CPF inválido</p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !isValidCpf(cpf)}
            className="btn-brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
