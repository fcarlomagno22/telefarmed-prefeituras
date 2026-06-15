import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import type { PosConsultaCheckinRespostas, PosConsultaEvolucaoComparacao } from '../../types/posConsulta'
import { triageHintClass, triageLabelClass, triageRangeInputClass, triageRangeProgressStyle } from '../triage/triageStepUi'

type EvolucaoSintomasStepProps = {
  respostas: PosConsultaCheckinRespostas
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onContinue: () => void
}

const COMPARACAO_OPTIONS: {
  id: PosConsultaEvolucaoComparacao
  label: string
  icon: typeof TrendingUp
  selectedClass: string
  idleClass: string
}[] = [
  {
    id: 'melhorou',
    label: 'Melhorou',
    icon: TrendingUp,
    selectedClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/70 shadow-sm',
    idleClass:
      'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/40',
  },
  {
    id: 'igual',
    label: 'Igual',
    icon: Minus,
    selectedClass:
      'border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-200/70 shadow-sm',
    idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-sky-200 hover:bg-sky-50/40',
  },
  {
    id: 'piorou',
    label: 'Piorou',
    icon: TrendingDown,
    selectedClass:
      'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200/70 shadow-sm',
    idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50/40',
  },
]

function comparacaoButtonClass(selected: boolean, option: (typeof COMPARACAO_OPTIONS)[number]) {
  return [
    'flex flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-4 text-sm font-semibold transition-all duration-200',
    selected ? option.selectedClass : option.idleClass,
  ].join(' ')
}

export function EvolucaoSintomasStep({ respostas, onChange, onContinue }: EvolucaoSintomasStepProps) {
  const canContinue =
    respostas.evolucaoComparacao !== null && respostas.intensidadeSintoma !== null

  return (
    <div className="flex w-full flex-col">
      <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">
        Como você está comparado à consulta?
      </h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
        Suas respostas ajudam a equipe de saúde a acompanhar sua evolução nos próximos{' '}
        {POS_CONSULTA_PLAN_TOTAL_DAYS} dias.
      </p>

      <div className="mt-8 text-center">
        <p className={`${triageLabelClass} text-center`}>Situação geral</p>
        <div className="mt-3 grid grid-cols-3 gap-2.5 sm:gap-3">
          {COMPARACAO_OPTIONS.map((option) => {
            const selected = respostas.evolucaoComparacao === option.id
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange({ ...respostas, evolucaoComparacao: option.id })}
                className={comparacaoButtonClass(selected, option)}
              >
                <span
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                    selected ? 'bg-white/80' : 'bg-gray-50',
                  ].join(' ')}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <p className={triageLabelClass}>Intensidade dos sintomas (0 a 10)</p>
          <span className="text-sm font-semibold tabular-nums text-[var(--brand-primary)]">
            {respostas.intensidadeSintoma ?? '—'}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={respostas.intensidadeSintoma ?? 0}
          onChange={(event) =>
            onChange({ ...respostas, intensidadeSintoma: Number(event.target.value) })
          }
          className={triageRangeInputClass}
          style={triageRangeProgressStyle(respostas.intensidadeSintoma ?? 0, 0, 10)}
        />
        <div className="mt-1 flex justify-between text-[11px] text-gray-400">
          <span>0 — sem incômodo</span>
          <span>10 — intenso</span>
        </div>
        <p className={`mt-2 ${triageHintClass}`}>
          Use a escala considerando o principal sintoma que motivou sua consulta.
        </p>
      </div>

      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue}
        className="btn-brand-gradient mt-8 w-full rounded-xl px-8 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continuar
      </button>
    </div>
  )
}
