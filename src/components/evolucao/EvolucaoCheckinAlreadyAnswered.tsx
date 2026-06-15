import type { PosConsultaCheckinContext } from '../../types/posConsulta'

const EVOLUCAO_LABELS = {
  melhorou: 'Melhorou',
  igual: 'Estável',
  piorou: 'Piorou',
} as const

const ADESAO_LABELS = {
  sim: 'Tomou conforme orientado',
  parcial: 'Tomou em parte',
  nao: 'Não tomou',
} as const

type EvolucaoCheckinAlreadyAnsweredProps = {
  context: PosConsultaCheckinContext
}

export function EvolucaoCheckinAlreadyAnswered({ context }: EvolucaoCheckinAlreadyAnsweredProps) {
  const respostas = context.respostas

  return (
    <div className="flex w-full max-w-md flex-col text-left">
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Check-in já respondido</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        {context.respondidoEmLabel
          ? `Você respondeu em ${context.respondidoEmLabel}.`
          : 'Este check-in já foi registrado.'}
      </p>

      {respostas ? (
        <dl className="mt-6 space-y-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 text-sm">
          {respostas.evolucaoComparacao ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Como estava
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {EVOLUCAO_LABELS[respostas.evolucaoComparacao]}
                {respostas.intensidadeSintoma !== null
                  ? ` · intensidade ${respostas.intensidadeSintoma}/10`
                  : ''}
              </dd>
            </div>
          ) : null}
          {respostas.medicacaoAdesao ? (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Medicamentos
              </dt>
              <dd className="mt-0.5 font-medium text-gray-900">
                {ADESAO_LABELS[respostas.medicacaoAdesao]}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {context.nextCheckinLabel ? (
        <p className="mt-6 text-sm text-gray-600">
          Próximo contato previsto em{' '}
          <span className="font-semibold text-gray-900">{context.nextCheckinLabel}</span>.
        </p>
      ) : null}
    </div>
  )
}
