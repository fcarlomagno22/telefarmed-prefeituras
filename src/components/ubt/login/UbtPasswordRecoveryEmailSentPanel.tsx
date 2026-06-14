import {
  UBT_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES,
  UBT_PASSWORD_RECOVERY_CODE_LENGTH,
} from '../../../config/ubtPasswordRecovery'
import { UbtPasswordRecoveryContactEmailLottie } from './UbtPasswordRecoveryContactEmailLottie'
import { UbtPasswordRecoveryLottieHero } from './UbtPasswordRecoveryLottieHero'

type UbtPasswordRecoveryEmailSentPanelProps = {
  email: string
  expiresInMinutes?: number
  onContinue: () => void
}

export function UbtPasswordRecoveryEmailSentPanel({
  email,
  expiresInMinutes = UBT_PASSWORD_RECOVERY_CODE_EXPIRES_MINUTES,
  onContinue,
}: UbtPasswordRecoveryEmailSentPanelProps) {
  return (
    <div className="flex flex-col items-center pb-4 pt-2 text-center">
      <UbtPasswordRecoveryLottieHero size="xl">
        <UbtPasswordRecoveryContactEmailLottie
          className="h-full w-full shrink-0 [&_svg]:h-full [&_svg]:w-full"
          onComplete={onContinue}
        />
      </UbtPasswordRecoveryLottieHero>

      <h3 className="text-lg font-semibold text-gray-900">E-mail enviado</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
        Código de {UBT_PASSWORD_RECOVERY_CODE_LENGTH} dígitos enviado para{' '}
        <span className="font-medium text-gray-700">{email}</span>.
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Válido por {expiresInMinutes} min · redirecionando…
      </p>
    </div>
  )
}
