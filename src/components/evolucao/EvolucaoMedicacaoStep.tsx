import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import type { PosConsultaCheckinRespostas, PosConsultaMedicacaoAdesao } from '../../types/posConsulta'
import { triageInputClass, triageLabelClass } from '../triage/triageStepUi'

type EvolucaoMedicacaoStepProps = {
  respostas: PosConsultaCheckinRespostas
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onBack: () => void
  onContinue: () => void
}

const ADESAO_OPTIONS: {
  id: PosConsultaMedicacaoAdesao
  label: string
  icon: typeof CheckCircle2
  selectedClass: string
  idleClass: string
}[] = [
  {
    id: 'sim',
    label: 'Sim, tomei conforme orientado',
    icon: CheckCircle2,
    selectedClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/70 shadow-sm',
    idleClass:
      'border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/40',
  },
  {
    id: 'parcial',
    label: 'Tomei em parte',
    icon: AlertCircle,
    selectedClass:
      'border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-200/70 shadow-sm',
    idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:bg-amber-50/40',
  },
  {
    id: 'nao',
    label: 'Não tomei',
    icon: XCircle,
    selectedClass:
      'border-rose-300 bg-rose-50 text-rose-700 ring-2 ring-rose-200/70 shadow-sm',
    idleClass: 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:bg-rose-50/40',
  },
]

function adesaoButtonClass(selected: boolean, option: (typeof ADESAO_OPTIONS)[number]) {
  return [
    'flex w-full items-center justify-center gap-2.5 rounded-2xl border px-4 py-4 text-center text-sm font-semibold transition-all duration-200',
    selected ? option.selectedClass : option.idleClass,
  ].join(' ')
}

export function EvolucaoMedicacaoStep({
  respostas,
  onChange,
  onBack,
  onContinue,
}: EvolucaoMedicacaoStepProps) {
  const needsMotivo =
    respostas.medicacaoAdesao === 'parcial' || respostas.medicacaoAdesao === 'nao'
  const canContinue =
    respostas.medicacaoAdesao !== null &&
    (!needsMotivo || respostas.medicacaoAdesaoMotivo.trim().length >= 3)

  return (
    <div className="flex w-full flex-col">
      <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">
        Você tomou os medicamentos prescritos?
      </h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
        Inclua remédios receitados na consulta, incluindo uso contínuo orientado pelo médico.
      </p>

      <div className="mt-8 space-y-2.5">
        {ADESAO_OPTIONS.map((option) => {
          const selected = respostas.medicacaoAdesao === option.id
          const Icon = option.icon
          return (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                onChange({
                  ...respostas,
                  medicacaoAdesao: option.id,
                  medicacaoAdesaoMotivo:
                    option.id === 'sim' ? '' : respostas.medicacaoAdesaoMotivo,
                })
              }
              className={adesaoButtonClass(selected, option)}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      {needsMotivo ? (
        <label className="mt-6 block text-left">
          <span className={triageLabelClass}>Conte o que aconteceu</span>
          <textarea
            value={respostas.medicacaoAdesaoMotivo}
            onChange={(event) =>
              onChange({ ...respostas, medicacaoAdesaoMotivo: event.target.value })
            }
            rows={3}
            maxLength={300}
            placeholder="Ex.: esqueci em um dia, efeito colateral, não encontrei o medicamento..."
            className={`${triageInputClass} mt-2 resize-none`}
          />
        </label>
      ) : null}

      <div className="mt-8 flex w-full flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 sm:flex-1"
        >
          Voltar
        </button>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className="btn-brand-gradient w-full rounded-xl px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
