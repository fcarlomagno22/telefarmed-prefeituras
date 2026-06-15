import { AlertTriangle } from 'lucide-react'
import { POS_CONSULTA_ALERT_SIGNS } from '../../data/posConsultaMock'
import type { PosConsultaCheckinRespostas } from '../../types/posConsulta'
import { triageHintClass } from '../triage/triageStepUi'

type EvolucaoSinaisAlertaStepProps = {
  respostas: PosConsultaCheckinRespostas
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onBack: () => void
  onSubmit: () => void
  isSubmitting?: boolean
}

function alertChoiceButtonClass(selected: boolean, choice: 'nao' | 'sim') {
  const base =
    'rounded-2xl border px-4 py-3 text-center text-sm font-semibold transition-all duration-200'

  if (!selected) {
    return `${base} border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50`
  }

  if (choice === 'nao') {
    return `${base} border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/70 shadow-sm`
  }

  return `${base} border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200/70 shadow-sm`
}

export function EvolucaoSinaisAlertaStep({
  respostas,
  onChange,
  onBack,
  onSubmit,
  isSubmitting = false,
}: EvolucaoSinaisAlertaStepProps) {
  const hasCriticalSign = Object.values(respostas.alertSigns).some(Boolean)

  function setAlertSign(id: keyof PosConsultaCheckinRespostas['alertSigns'], active: boolean) {
    onChange({
      ...respostas,
      alertSigns: { ...respostas.alertSigns, [id]: active },
    })
  }

  return (
    <div className="flex w-full flex-col">
      <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">
        Algum sinal de alerta?
      </h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
        Toque em <strong>Sim</strong> apenas para sintomas que você está sentindo agora.
      </p>

      <div className="mx-auto mt-8 w-full max-w-md space-y-4">
        {POS_CONSULTA_ALERT_SIGNS.map((sign) => {
          const isYes = respostas.alertSigns[sign.id]
          return (
            <div
              key={sign.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <p className="text-sm font-medium leading-snug text-gray-700">{sign.label}</p>
              <div className="mx-auto mt-3 grid max-w-[240px] grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setAlertSign(sign.id, false)}
                  className={alertChoiceButtonClass(!isYes, 'nao')}
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={() => setAlertSign(sign.id, true)}
                  className={alertChoiceButtonClass(isYes, 'sim')}
                >
                  Sim
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {hasCriticalSign ? (
        <div
          className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center"
          role="alert"
        >
          <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" aria-hidden />
          <p className="mt-2 text-sm font-semibold text-amber-900">Atenção</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-800">
            Se os sintomas forem intensos ou preocupantes, procure atendimento presencial ou ligue
            para o serviço de urgência da sua região. Suas respostas serão registradas para a
            equipe de saúde.
          </p>
        </div>
      ) : (
        <p className={`mt-6 text-center ${triageHintClass}`}>
          Se não tiver nenhum destes sinais, mantenha &quot;Não&quot; em todas as perguntas.
        </p>
      )}

      <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:opacity-50 sm:flex-1"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-brand-gradient w-full rounded-xl px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          {isSubmitting ? 'Enviando…' : 'Enviar respostas'}
        </button>
      </div>
    </div>
  )
}
