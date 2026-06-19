import { Loader2 } from 'lucide-react'

type AttendanceStepFooterProps = {
  onBack: () => void
  onContinue?: () => void
  continueLabel?: string
  /** Quando true, o botão Continuar fica ativo (cor primária). Caso contrário, permanece em ghost. */
  continueReady?: boolean
  /** Bloqueia interação durante carregamento (ex.: consulta de CPF). */
  continueLoading?: boolean
  continueType?: 'button' | 'submit'
  formId?: string
  backLabel?: string
  /** Chamado ao clicar em Continuar enquanto ainda faltam campos obrigatórios. */
  onContinueBlocked?: () => void
}

export function AttendanceStepFooter({
  onBack,
  onContinue,
  continueLabel = 'Continuar',
  continueReady = false,
  continueLoading = false,
  continueType = 'button',
  formId,
  backLabel = 'Voltar',
  onContinueBlocked,
}: AttendanceStepFooterProps) {
  const buttonSizeClass =
    'w-full min-w-0 rounded-xl px-4 py-3 text-center text-sm font-semibold transition'

  function handleContinueClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()

    if (continueLoading) return

    if (!continueReady) {
      onContinueBlocked?.()
      return
    }

    if (continueType === 'submit' && formId) {
      document.getElementById(formId)?.requestSubmit()
      return
    }

    onContinue?.()
  }

  const showContinue = onContinue || continueType === 'submit'

  return (
    <div className="grid grid-cols-2 gap-3 sm:ml-auto sm:w-full sm:max-w-[22rem]">
      <button
        type="button"
        onClick={onBack}
        disabled={continueLoading}
        className={`${buttonSizeClass} border border-gray-200 bg-white text-[var(--brand-primary)] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {backLabel}
      </button>
      {showContinue ? (
        <button
          type="button"
          onClick={handleContinueClick}
          disabled={continueLoading}
          className={
            continueReady
              ? `${buttonSizeClass} bg-[var(--brand-primary)] text-white shadow-[var(--brand-primary-shadow-sm)] hover:bg-[var(--brand-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50`
              : `${buttonSizeClass} border border-gray-200 bg-transparent text-gray-400 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50`
          }
        >
          {continueLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {continueLabel}
            </span>
          ) : (
            continueLabel
          )}
        </button>
      ) : (
        <span aria-hidden className="w-full" />
      )}
    </div>
  )
}
