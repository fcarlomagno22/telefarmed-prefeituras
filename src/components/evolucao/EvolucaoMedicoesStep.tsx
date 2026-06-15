import { POS_CONSULTA_PLAN_TOTAL_DAYS } from '../../config/posConsulta'
import type {
  PosConsultaCheckinRespostas,
  PosConsultaMeasurementId,
  PosConsultaVitalField,
} from '../../types/posConsulta'
import { parseNumericInput } from '../../utils/triage/triageClinicalHelpers'
import {
  triageHintClass,
  triageInputClass,
  triageLabelClass,
  triageNotMeasuredButtonClass,
} from '../triage/triageStepUi'

type EvolucaoMedicoesStepProps = {
  respostas: PosConsultaCheckinRespostas
  requestedMeasurements: PosConsultaMeasurementId[]
  onChange: (respostas: PosConsultaCheckinRespostas) => void
  onBack: () => void
  onContinue: () => void
}

function VitalInput({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string
  value: PosConsultaVitalField<number>
  onChange: (next: PosConsultaVitalField<number>) => void
  placeholder: string
  unit: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className={triageLabelClass}>{label}</span>
        <button
          type="button"
          onClick={() =>
            onChange({
              notMeasured: !value.notMeasured,
              value: !value.notMeasured ? null : value.value,
            })
          }
          className={triageNotMeasuredButtonClass(value.notMeasured)}
        >
          Não medi
        </button>
      </div>
      <div className="relative mt-2">
        <input
          type="text"
          inputMode="decimal"
          disabled={value.notMeasured}
          value={value.notMeasured ? '' : (value.value ?? '')}
          onChange={(event) => {
            const parsed = parseNumericInput(event.target.value)
            onChange({ notMeasured: false, value: parsed })
          }}
          placeholder={value.notMeasured ? 'Não informado' : placeholder}
          className={`${triageInputClass} pr-14 ${value.notMeasured ? 'bg-gray-50 text-gray-400' : ''}`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          {unit}
        </span>
      </div>
    </div>
  )
}

function isBloodPressureComplete(respostas: PosConsultaCheckinRespostas) {
  const sys = respostas.bloodPressureSystolic
  const dia = respostas.bloodPressureDiastolic
  const sysOk = sys.notMeasured || sys.value !== null
  const diaOk = dia.notMeasured || dia.value !== null
  return sysOk && diaOk
}

function isGlucoseComplete(respostas: PosConsultaCheckinRespostas) {
  const g = respostas.bloodGlucose
  return g.notMeasured || g.value !== null
}

export function EvolucaoMedicoesStep({
  respostas,
  requestedMeasurements,
  onChange,
  onBack,
  onContinue,
}: EvolucaoMedicoesStepProps) {
  const showBloodPressure = requestedMeasurements.includes('blood_pressure')
  const showGlucose = requestedMeasurements.includes('blood_glucose')

  const canContinue =
    (!showBloodPressure || isBloodPressureComplete(respostas)) &&
    (!showGlucose || isGlucoseComplete(respostas))

  if (!showBloodPressure && !showGlucose) {
    return (
      <div className="flex w-full flex-col">
        <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">Medições</h2>
        <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
          Nenhuma medição foi solicitada neste check-in. Continue para as perguntas de segurança.
        </p>
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
            onClick={onContinue}
            className="btn-brand-gradient w-full rounded-xl px-6 py-3.5 text-sm font-semibold sm:flex-1"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col">
      <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">Suas medições</h2>
      <p className="mt-3 text-center text-sm leading-relaxed text-gray-500">
        Informe os valores mais recentes, se tiver. Se não mediu, use &quot;Não medi&quot;.
      </p>

      <div className="mt-8 space-y-6">
        {showBloodPressure ? (
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
            <p className="text-sm font-semibold text-gray-900">Pressão arterial</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <VitalInput
                label="Sistólica"
                value={respostas.bloodPressureSystolic}
                onChange={(bloodPressureSystolic) =>
                  onChange({ ...respostas, bloodPressureSystolic })
                }
                placeholder="Ex.: 120"
                unit="mmHg"
              />
              <VitalInput
                label="Diastólica"
                value={respostas.bloodPressureDiastolic}
                onChange={(bloodPressureDiastolic) =>
                  onChange({ ...respostas, bloodPressureDiastolic })
                }
                placeholder="Ex.: 80"
                unit="mmHg"
              />
            </div>
          </div>
        ) : null}

        {showGlucose ? (
          <VitalInput
            label="Glicemia"
            value={respostas.bloodGlucose}
            onChange={(bloodGlucose) => onChange({ ...respostas, bloodGlucose })}
            placeholder="Ex.: 110"
            unit="mg/dL"
          />
        ) : null}
      </div>

      <p className={`mt-4 text-center ${triageHintClass}`}>
        Estas informações complementam o acompanhamento pós-consulta de{' '}
        {POS_CONSULTA_PLAN_TOTAL_DAYS} dias.
      </p>

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
