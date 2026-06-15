import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import { EvolucaoCheckinSuccessLottie } from './EvolucaoCheckinSuccessLottie'

type EvolucaoCheckinSuccessProps = {
  patientFirstName: string
  nextCheckinLabel: string | null
}

export function EvolucaoCheckinSuccess({
  patientFirstName,
  nextCheckinLabel,
}: EvolucaoCheckinSuccessProps) {
  return (
    <div
      className="flex w-full max-w-md flex-col items-center text-center"
      role="status"
      aria-live="polite"
    >
      <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
        <div
          className="pointer-events-none absolute inset-4 rounded-full bg-emerald-400/15 blur-2xl"
          aria-hidden
        />
        <div className="relative h-44 w-44">
          <EvolucaoCheckinSuccessLottie />
        </div>
      </div>

      <h2 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">Resposta registrada</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        Obrigado, {patientFirstName}. Suas informações foram salvas e ajudam no acompanhamento dos{' '}
        {POS_CONSULTA_PLAN_TOTAL_DAYS} dias após a consulta.
      </p>
      {nextCheckinLabel ? (
        <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          Próximo contato previsto em{' '}
          <span className="font-semibold text-gray-900">{nextCheckinLabel}</span>
        </p>
      ) : null}
      <p className="mt-6 text-xs leading-relaxed text-gray-400">
        Você pode fechar esta página. Enviaremos um novo e-mail quando for hora do próximo check-in.
      </p>
    </div>
  )
}
