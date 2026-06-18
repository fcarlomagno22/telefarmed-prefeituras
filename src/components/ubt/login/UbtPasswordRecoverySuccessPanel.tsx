import { UbtPasswordRecoveryLottieHero } from './UbtPasswordRecoveryLottieHero'
import { UbtPasswordRecoverySuccessLottie } from './UbtPasswordRecoverySuccessLottie'

type UbtPasswordRecoverySuccessPanelProps = {
  onClose: () => void
}

export function UbtPasswordRecoverySuccessPanel({ onClose }: UbtPasswordRecoverySuccessPanelProps) {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-6 text-center"
      role="status"
      aria-live="polite"
    >
      <UbtPasswordRecoveryLottieHero size="xl" accent="success">
        <UbtPasswordRecoverySuccessLottie className="h-full w-full shrink-0 [&_svg]:h-full [&_svg]:w-full" />
      </UbtPasswordRecoveryLottieHero>

      <h3
        id="ubt-password-recovery-title"
        className="text-xl font-semibold tracking-tight text-gray-900"
      >
        Senha redefinida
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
        Entre com a nova senha na tela de login.
      </p>

      <button
        type="button"
        onClick={onClose}
        className="btn-brand-gradient mt-8 w-full max-w-xs rounded-xl py-3 text-sm font-semibold"
      >
        Voltar ao login
      </button>
    </div>
  )
}
