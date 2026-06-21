type NavigationBlockModalProps = {
  open: boolean
  onAcknowledge: () => void
  onEndSession?: () => void
  stackZIndex?: number
}

export function NavigationBlockModal({
  open,
  onAcknowledge,
  onEndSession,
  stackZIndex = 300,
}: NavigationBlockModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 px-4"
      style={{ zIndex: stackZIndex }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="navigation-block-title"
      aria-describedby="navigation-block-description"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_48px_rgba(0,0,0,0.18)] sm:p-8">
        <h2
          id="navigation-block-title"
          className="text-lg font-bold text-gray-900"
        >
          Encerre o atendimento antes de sair
        </h2>
        <p
          id="navigation-block-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          Para voltar, atualizar ou fechar esta página, use o botão{' '}
          <strong className="font-semibold text-gray-800">Encerrar atendimento</strong>{' '}
          na tela de espera.
        </p>
                <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse sm:gap-3">
          <button
            type="button"
            onClick={onAcknowledge}
            className="w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-primary-hover)] sm:flex-1"
          >
            Continuar aguardando
          </button>
          {onEndSession ? (
            <button
              type="button"
              onClick={onEndSession}
              className="btn-brand-gradient w-full rounded-xl px-6 py-3 text-sm font-semibold sm:flex-1"
            >
              Encerrar atendimento
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
