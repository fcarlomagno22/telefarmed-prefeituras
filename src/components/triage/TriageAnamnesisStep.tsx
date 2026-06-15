import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { PatientAgeGroup } from '../../types/attendance'
import {
  SYMPTOM_INTENSITY_LABELS,
  SYMPTOM_ONSET_LABELS,
  TRIAGE_CHRONIC_CONDITIONS,
  TRIAGE_SYMPTOM_OPTIONS,
} from '../../data/triageClinicalCatalog'
import {
  createTriageMedicationId,
  type ChronicConditionId,
  type HypertensionMedicationUse,
  type PregnancyBreastfeedingStatus,
  type SymptomIntensity,
  type SymptomOnset,
  type TriageClinicalData,
  type TriageMedication,
} from '../../types/triageClinical'
import {
  buildTriagemResumo,
  buildTriagemResumoPreview,
} from '../../utils/triage/buildTriagemResumo'
import {
  hasDiabetesCondition,
  hasHypertensionCondition,
  isBloodPressureValid,
  isFemaleReproductiveAge,
  isMotiveStepComplete,
  parseNumericInput,
  shouldShowGlucoseVital,
  shouldShowSafetyForElderly,
  shouldShowSafetyForMinor,
} from '../../utils/triage/triageClinicalHelpers'
import { AttendanceFieldHighlight } from '../dashboard/AttendanceFieldHighlight'
import { AttendanceStepFooter } from '../dashboard/AttendanceStepFooter'
import { AttendanceStepShell } from '../dashboard/AttendanceStepShell'
import {
  triageChipClass,
  triageHintClass,
  triageInputClass,
  triageInputErrorClass,
  triageLabelClass,
  triageNotMeasuredButtonClass,
  triageSectionTitleClass,
} from './triageStepUi'

type TriageSubStep = 'motive' | 'chronic' | 'vitals' | 'medications' | 'safety' | 'review'

const SUB_STEPS: TriageSubStep[] = ['motive', 'chronic', 'vitals', 'medications', 'safety', 'review']

const SUB_STEP_TITLES: Record<TriageSubStep, string> = {
  motive: 'Motivo e sintomas',
  chronic: 'Doenças crônicas',
  vitals: 'Sinais vitais',
  medications: 'Medicamentos',
  safety: 'Perguntas de segurança',
  review: 'Revisão',
}

type TriageAnamnesisStepProps = {
  data: TriageClinicalData
  onChange: (data: TriageClinicalData) => void
  patientGender: string
  patientBirthDate: string
  ageGroup: PatientAgeGroup | null
  onSubmit: (triagemResumo: string) => void
  onBack: () => void
  isSubmitting?: boolean
}

function toggleSymptom(data: TriageClinicalData, symptomId: string): TriageClinicalData {
  const exists = data.associatedSymptoms.includes(symptomId)
  return {
    ...data,
    associatedSymptoms: exists
      ? data.associatedSymptoms.filter((id) => id !== symptomId)
      : [...data.associatedSymptoms, symptomId],
  }
}

function toggleChronicCondition(
  data: TriageClinicalData,
  conditionId: ChronicConditionId,
): TriageClinicalData {
  if (conditionId === 'none') {
    return {
      ...data,
      chronicConditions: ['none'],
      chronicOther: '',
      usesInsulin: null,
      lastKnownGlucose: null,
      hypertensionMedicationUse: null,
    }
  }

  const withoutNone = data.chronicConditions.filter((id) => id !== 'none')
  const exists = withoutNone.includes(conditionId)
  const nextConditions = exists
    ? withoutNone.filter((id) => id !== conditionId)
    : [...withoutNone, conditionId]

  const next: TriageClinicalData = { ...data, chronicConditions: nextConditions }

  if (!hasDiabetesCondition(nextConditions)) {
    next.usesInsulin = null
    next.lastKnownGlucose = null
  }

  if (!hasHypertensionCondition(nextConditions)) {
    next.hypertensionMedicationUse = null
  }

  if (!nextConditions.includes('other')) {
    next.chronicOther = ''
  }

  return next
}

function shouldShowSafetyStep(
  ageGroup: PatientAgeGroup | null,
  gender: string,
  birthDate: string,
): boolean {
  return (
    shouldShowSafetyForMinor(ageGroup) ||
    shouldShowSafetyForElderly(ageGroup) ||
    isFemaleReproductiveAge(gender, birthDate)
  )
}

function nextSubStep(
  current: TriageSubStep,
  ageGroup: PatientAgeGroup | null,
  gender: string,
  birthDate: string,
): TriageSubStep | null {
  const index = SUB_STEPS.indexOf(current)
  if (index < 0 || index >= SUB_STEPS.length - 1) return null

  let nextIndex = index + 1
  while (nextIndex < SUB_STEPS.length - 1) {
    const candidate = SUB_STEPS[nextIndex]
    if (candidate === 'safety' && !shouldShowSafetyStep(ageGroup, gender, birthDate)) {
      nextIndex += 1
      continue
    }
    return candidate
  }

  return 'review'
}

function previousSubStep(
  current: TriageSubStep,
  ageGroup: PatientAgeGroup | null,
  gender: string,
  birthDate: string,
): TriageSubStep | null {
  const index = SUB_STEPS.indexOf(current)
  if (index <= 0) return null

  let prevIndex = index - 1
  while (prevIndex > 0) {
    const candidate = SUB_STEPS[prevIndex]
    if (candidate === 'safety' && !shouldShowSafetyStep(ageGroup, gender, birthDate)) {
      prevIndex -= 1
      continue
    }
    return candidate
  }

  return SUB_STEPS[prevIndex]
}

function VitalNumericField({
  label,
  value,
  notMeasured,
  onValueChange,
  onNotMeasuredToggle,
  unit,
  min,
  max,
  placeholder,
  invalid,
}: {
  label: string
  value: number | null
  notMeasured: boolean
  onValueChange: (value: number | null) => void
  onNotMeasuredToggle: () => void
  unit: string
  min?: number
  max?: number
  placeholder?: string
  invalid?: boolean
}) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <label className={triageSectionTitleClass}>{label}</label>
        <button
          type="button"
          onClick={onNotMeasuredToggle}
          className={triageNotMeasuredButtonClass(notMeasured)}
        >
          Não aferido / não sabe
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          disabled={notMeasured}
          value={value !== null && !notMeasured ? String(value) : ''}
          onChange={(event) => onValueChange(parseNumericInput(event.target.value))}
          placeholder={placeholder ?? '—'}
          className={invalid ? triageInputErrorClass : triageInputClass}
        />
        <span className="shrink-0 text-sm text-gray-500">{unit}</span>
      </div>
      {invalid ? (
        <p className="mt-1.5 text-xs text-red-600">Valor fora da faixa esperada.</p>
      ) : min !== undefined && max !== undefined ? (
        <p className={`mt-1.5 ${triageHintClass}`}>
          Faixa sugerida: {min}–{max} {unit}
        </p>
      ) : null}
    </div>
  )
}

export function TriageAnamnesisStep({
  data,
  onChange,
  patientGender,
  patientBirthDate,
  ageGroup,
  onSubmit,
  onBack,
  isSubmitting = false,
}: TriageAnamnesisStepProps) {
  const [subStep, setSubStep] = useState<TriageSubStep>('motive')
  const [showHints, setShowHints] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const showSafety = shouldShowSafetyStep(ageGroup, patientGender, patientBirthDate)
  const visibleSubSteps = useMemo(
    () => SUB_STEPS.filter((step) => step !== 'safety' || showSafety),
    [showSafety],
  )
  const subStepIndex = visibleSubSteps.indexOf(subStep)
  const showGlucose = shouldShowGlucoseVital(data)

  const bpInvalid =
    !data.bloodPressureSystolic.notMeasured &&
    !data.bloodPressureDiastolic.notMeasured &&
    !isBloodPressureValid(
      data.bloodPressureSystolic.value,
      data.bloodPressureDiastolic.value,
    )

  const motiveComplete = isMotiveStepComplete(data)
  const canContinue =
    subStep === 'motive'
      ? motiveComplete
      : subStep === 'vitals'
        ? !bpInvalid
        : true

  const continueLabel =
    subStep === 'review'
      ? isSubmitting
        ? 'Salvando…'
        : 'Confirmar e ir para sala de espera'
      : 'Continuar'

  function patchMedication(id: string, field: keyof TriageMedication, value: string) {
    onChange({
      ...data,
      medications: data.medications.map((med) =>
        med.id === id ? { ...med, [field]: value } : med,
      ),
    })
  }

  function addMedication() {
    onChange({
      ...data,
      noContinuousMedications: false,
      medications: [
        ...data.medications,
        { id: createTriageMedicationId(), name: '', doseFrequency: '' },
      ],
    })
  }

  function removeMedication(id: string) {
    onChange({
      ...data,
      medications: data.medications.filter((med) => med.id !== id),
    })
  }

  function handleContinue() {
    if (!canContinue) {
      setShowHints(true)
      return
    }

    if (subStep === 'review') {
      onSubmit(buildTriagemResumo(data))
      return
    }

    const next = nextSubStep(subStep, ageGroup, patientGender, patientBirthDate)
    if (next) setSubStep(next)
    setShowHints(false)
  }

  function handleSubBack() {
    if (subStep === 'motive') {
      onBack()
      return
    }

    const prev = previousSubStep(subStep, ageGroup, patientGender, patientBirthDate)
    if (prev) setSubStep(prev)
  }

  function toggleReviewSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <AttendanceStepShell
      title="Triagem clínica"
      description="Ajude o paciente a informar como está se sentindo. Esses dados serão enviados ao médico antes da consulta."
      footer={
        <AttendanceStepFooter
          onBack={handleSubBack}
          onContinue={handleContinue}
          continueLabel={continueLabel}
          continueReady={canContinue}
          continueLoading={isSubmitting}
          onContinueBlocked={() => setShowHints(true)}
        />
      }
    >
      <div className="mb-4 shrink-0">
        <p className="text-xs font-medium tracking-wide text-gray-500">
          Etapa{' '}
          <span className="tabular-nums text-gray-800">{subStepIndex + 1}</span>
          <span className="text-gray-400"> / </span>
          <span className="tabular-nums text-gray-800">{visibleSubSteps.length}</span>
          <span className="mx-2 text-gray-300">·</span>
          <span className="font-semibold text-[var(--brand-primary)]">
            {SUB_STEP_TITLES[subStep]}
          </span>
        </p>
        <div className="mt-2 flex gap-1">
          {visibleSubSteps.map((step, index) => (
            <div
              key={step}
              className={`h-1 flex-1 rounded-full ${
                index <= subStepIndex ? 'bg-[var(--brand-primary)]' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <AttendanceFieldHighlight
        highlight={showHints && !canContinue}
        className="space-y-5"
      >
        {subStep === 'motive' ? (
          <>
            <div>
              <label htmlFor="chief-complaint" className={triageLabelClass}>
                Motivo da consulta <span className="text-red-500">*</span>
              </label>
              <input
                id="chief-complaint"
                type="text"
                value={data.chiefComplaint}
                onChange={(event) =>
                  onChange({ ...data, chiefComplaint: event.target.value })
                }
                placeholder="Ex.: dor no peito, febre, mal-estar…"
                className={
                  showHints && data.chiefComplaint.trim().length < 3
                    ? triageInputErrorClass
                    : triageInputClass
                }
              />
            </div>

            <div>
              <p className={triageLabelClass}>
                Quando começou <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(SYMPTOM_ONSET_LABELS) as SymptomOnset[]).map((onset) => (
                  <button
                    key={onset}
                    type="button"
                    onClick={() => onChange({ ...data, symptomOnset: onset })}
                    className={triageChipClass(data.symptomOnset === onset)}
                  >
                    {SYMPTOM_ONSET_LABELS[onset]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className={triageLabelClass}>Intensidade</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SYMPTOM_INTENSITY_LABELS) as SymptomIntensity[]).map(
                  (intensity) => (
                    <button
                      key={intensity}
                      type="button"
                      onClick={() => onChange({ ...data, symptomIntensity: intensity })}
                      className={triageChipClass(data.symptomIntensity === intensity)}
                    >
                      {SYMPTOM_INTENSITY_LABELS[intensity]}
                    </button>
                  ),
                )}
              </div>
              <div className="mt-3">
                <label htmlFor="intensity-scale" className={triageHintClass}>
                  Ou ajuste de 0 a 10 (opcional)
                </label>
                <input
                  id="intensity-scale"
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={data.symptomIntensityScale ?? 0}
                  onChange={(event) =>
                    onChange({
                      ...data,
                      symptomIntensityScale: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full accent-[var(--brand-primary)]"
                />
                <p className="mt-1 text-center text-xs font-medium text-gray-600">
                  {data.symptomIntensityScale ?? 0}/10
                </p>
              </div>
            </div>

            <div>
              <p className={triageLabelClass}>Sintomas associados</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TRIAGE_SYMPTOM_OPTIONS.map((symptom) => (
                  <button
                    key={symptom.id}
                    type="button"
                    onClick={() => onChange(toggleSymptom(data, symptom.id))}
                    className={triageChipClass(data.associatedSymptoms.includes(symptom.id))}
                  >
                    {symptom.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="symptom-details" className={triageLabelClass}>
                O que mais incomoda?
              </label>
              <textarea
                id="symptom-details"
                rows={3}
                value={data.symptomDetails}
                onChange={(event) =>
                  onChange({ ...data, symptomDetails: event.target.value })
                }
                placeholder="Detalhes que ajudem o médico a entender melhor…"
                className={`${triageInputClass} resize-none`}
              />
            </div>
          </>
        ) : null}

        {subStep === 'chronic' ? (
          <>
            <p className={triageHintClass}>
              Marque as condições que o paciente já possui. Use &quot;Nenhuma&quot; se não houver.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRIAGE_CHRONIC_CONDITIONS.map((condition) => (
                <button
                  key={condition.id}
                  type="button"
                  onClick={() => onChange(toggleChronicCondition(data, condition.id))}
                  className={triageChipClass(data.chronicConditions.includes(condition.id))}
                >
                  {condition.label}
                </button>
              ))}
            </div>

            {data.chronicConditions.includes('other') ? (
              <div>
                <label htmlFor="chronic-other" className={triageLabelClass}>
                  Qual outra condição?
                </label>
                <input
                  id="chronic-other"
                  type="text"
                  value={data.chronicOther}
                  onChange={(event) =>
                    onChange({ ...data, chronicOther: event.target.value })
                  }
                  placeholder="Descreva brevemente"
                  className={triageInputClass}
                />
              </div>
            ) : null}

            {hasDiabetesCondition(data.chronicConditions) ? (
              <div className="space-y-4 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <p className={triageSectionTitleClass}>Sobre o diabetes</p>
                <div>
                  <p className={triageLabelClass}>Usa insulina?</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: true, label: 'Sim' },
                      { value: false, label: 'Não' },
                    ].map((option) => (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => onChange({ ...data, usesInsulin: option.value })}
                        className={triageChipClass(data.usesInsulin === option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="last-glucose" className={triageLabelClass}>
                    Última glicemia conhecida (opcional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="last-glucose"
                      type="text"
                      inputMode="decimal"
                      value={
                        data.lastKnownGlucose !== null ? String(data.lastKnownGlucose) : ''
                      }
                      onChange={(event) =>
                        onChange({
                          ...data,
                          lastKnownGlucose: parseNumericInput(event.target.value),
                        })
                      }
                      placeholder="Ex.: 120"
                      className={triageInputClass}
                    />
                    <span className="text-sm text-gray-500">mg/dL</span>
                  </div>
                </div>
              </div>
            ) : null}

            {hasHypertensionCondition(data.chronicConditions) ? (
              <div className="space-y-3 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                <p className={triageSectionTitleClass}>Sobre a hipertensão</p>
                <p className={triageLabelClass}>Usa medicação regularmente?</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: 'yes', label: 'Sim' },
                      { value: 'no', label: 'Não' },
                      { value: 'unknown', label: 'Não sabe' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          hypertensionMedicationUse: option.value as HypertensionMedicationUse,
                        })
                      }
                      className={triageChipClass(
                        data.hypertensionMedicationUse === option.value,
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {subStep === 'vitals' ? (
          <>
            <p className={triageHintClass}>
              Todos os campos são opcionais. Use &quot;Não aferido&quot; quando não houver
              aparelho ou o paciente não souber.
            </p>

            <div className="rounded-xl border border-gray-200/80 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className={triageSectionTitleClass}>Pressão arterial</p>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...data,
                      bloodPressureSystolic: {
                        value: null,
                        notMeasured: !data.bloodPressureSystolic.notMeasured,
                      },
                      bloodPressureDiastolic: {
                        value: null,
                        notMeasured: !data.bloodPressureDiastolic.notMeasured,
                      },
                    })
                  }
                  className={triageNotMeasuredButtonClass(
                    data.bloodPressureSystolic.notMeasured,
                  )}
                >
                  Não aferido / não sabe
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className={triageHintClass}>Sistólica</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={data.bloodPressureSystolic.notMeasured}
                    value={
                      data.bloodPressureSystolic.value !== null
                        ? String(data.bloodPressureSystolic.value)
                        : ''
                    }
                    onChange={(event) =>
                      onChange({
                        ...data,
                        bloodPressureSystolic: {
                          ...data.bloodPressureSystolic,
                          value: parseNumericInput(event.target.value),
                        },
                      })
                    }
                    placeholder="120"
                    className={bpInvalid ? triageInputErrorClass : triageInputClass}
                  />
                </div>
                <div>
                  <label className={triageHintClass}>Diastólica</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    disabled={data.bloodPressureDiastolic.notMeasured}
                    value={
                      data.bloodPressureDiastolic.value !== null
                        ? String(data.bloodPressureDiastolic.value)
                        : ''
                    }
                    onChange={(event) =>
                      onChange({
                        ...data,
                        bloodPressureDiastolic: {
                          ...data.bloodPressureDiastolic,
                          value: parseNumericInput(event.target.value),
                        },
                      })
                    }
                    placeholder="80"
                    className={bpInvalid ? triageInputErrorClass : triageInputClass}
                  />
                </div>
              </div>
              <p className={`mt-1.5 ${triageHintClass}`}>Formato: 120/80 mmHg</p>
              {bpInvalid ? (
                <p className="mt-1 text-xs text-red-600">
                  Verifique os valores (sistólica entre 60–250, diastólica entre 40–150).
                </p>
              ) : null}
            </div>

            {showGlucose ? (
              <VitalNumericField
                label="Glicemia"
                value={data.bloodGlucose.value}
                notMeasured={data.bloodGlucose.notMeasured}
                onValueChange={(value) =>
                  onChange({
                    ...data,
                    bloodGlucose: { ...data.bloodGlucose, value },
                  })
                }
                onNotMeasuredToggle={() =>
                  onChange({
                    ...data,
                    bloodGlucose: {
                      value: null,
                      notMeasured: !data.bloodGlucose.notMeasured,
                    },
                  })
                }
                unit="mg/dL"
                min={30}
                max={600}
                placeholder="Ex.: 110"
              />
            ) : null}

            <VitalNumericField
              label="Temperatura"
              value={data.temperature.value}
              notMeasured={data.temperature.notMeasured}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  temperature: { ...data.temperature, value },
                })
              }
              onNotMeasuredToggle={() =>
                onChange({
                  ...data,
                  temperature: { value: null, notMeasured: !data.temperature.notMeasured },
                })
              }
              unit="°C"
              min={34}
              max={42}
              placeholder="Ex.: 36,5"
            />

            <VitalNumericField
              label="Peso"
              value={data.weightKg.value}
              notMeasured={data.weightKg.notMeasured}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  weightKg: { ...data.weightKg, value },
                })
              }
              onNotMeasuredToggle={() =>
                onChange({
                  ...data,
                  weightKg: { value: null, notMeasured: !data.weightKg.notMeasured },
                })
              }
              unit="kg"
              min={2}
              max={300}
              placeholder="Ex.: 72"
            />

            <VitalNumericField
              label="Saturação O₂"
              value={data.oxygenSaturation.value}
              notMeasured={data.oxygenSaturation.notMeasured}
              onValueChange={(value) =>
                onChange({
                  ...data,
                  oxygenSaturation: { ...data.oxygenSaturation, value },
                })
              }
              onNotMeasuredToggle={() =>
                onChange({
                  ...data,
                  oxygenSaturation: {
                    value: null,
                    notMeasured: !data.oxygenSaturation.notMeasured,
                  },
                })
              }
              unit="%"
              min={70}
              max={100}
              placeholder="Ex.: 98"
            />
          </>
        ) : null}

        {subStep === 'medications' ? (
          <>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...data,
                  noContinuousMedications: !data.noContinuousMedications,
                  medications: data.noContinuousMedications ? data.medications : [],
                })
              }
              className={triageChipClass(data.noContinuousMedications)}
            >
              Não usa medicamentos contínuos
            </button>

            {!data.noContinuousMedications ? (
              <div className="space-y-3">
                {data.medications.length === 0 ? (
                  <p className={`${triageHintClass} rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3`}>
                    Nenhum medicamento adicionado ainda.
                  </p>
                ) : null}

                {data.medications.map((med) => (
                  <div
                    key={med.id}
                    className="rounded-xl border border-gray-200/80 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className={triageSectionTitleClass}>Medicamento</p>
                      <button
                        type="button"
                        onClick={() => removeMedication(med.id)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className={triageLabelClass}>Nome</label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(event) =>
                            patchMedication(med.id, 'name', event.target.value)
                          }
                          placeholder="Ex.: Losartana"
                          className={triageInputClass}
                        />
                      </div>
                      <div>
                        <label className={triageLabelClass}>Dose / frequência</label>
                        <input
                          type="text"
                          value={med.doseFrequency}
                          onChange={(event) =>
                            patchMedication(med.id, 'doseFrequency', event.target.value)
                          }
                          placeholder="Ex.: 50mg — 1x/dia"
                          className={triageInputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-primary)] transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary-light)]"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar medicamento
                </button>
              </div>
            ) : null}

            <div>
              <label htmlFor="med-allergies" className={triageLabelClass}>
                Alergias a medicamentos
              </label>
              <input
                id="med-allergies"
                type="text"
                value={data.medicationAllergies}
                onChange={(event) =>
                  onChange({ ...data, medicationAllergies: event.target.value })
                }
                placeholder="Ex.: dipirona, penicilina… ou “nenhuma conhecida”"
                className={triageInputClass}
              />
            </div>
          </>
        ) : null}

        {subStep === 'safety' && showSafety ? (
          <>
            {isFemaleReproductiveAge(patientGender, patientBirthDate) ? (
              <div className="space-y-3 rounded-xl border border-gray-200/80 bg-white p-4">
                <p className={triageSectionTitleClass}>Gravidez / amamentação</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: 'pregnant', label: 'Grávida' },
                      { value: 'breastfeeding', label: 'Amamentando' },
                      { value: 'neither', label: 'Não' },
                      { value: 'unknown', label: 'Não sabe' },
                    ] as const
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...data,
                          pregnancyBreastfeeding: option.value as PregnancyBreastfeedingStatus,
                        })
                      }
                      className={triageChipClass(data.pregnancyBreastfeeding === option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {shouldShowSafetyForMinor(ageGroup) ? (
              <div>
                <label htmlFor="minor-companion" className={triageLabelClass}>
                  Quem acompanha na consulta?
                </label>
                <input
                  id="minor-companion"
                  type="text"
                  value={data.minorCompanion}
                  onChange={(event) =>
                    onChange({ ...data, minorCompanion: event.target.value })
                  }
                  placeholder="Ex.: mãe, pai, responsável legal…"
                  className={triageInputClass}
                />
              </div>
            ) : null}

            {shouldShowSafetyForElderly(ageGroup) ? (
              <div className="space-y-4 rounded-xl border border-gray-200/80 bg-white p-4">
                <p className={triageSectionTitleClass}>Situação recente (idoso)</p>
                {[
                  {
                    key: 'elderlyRecentFall' as const,
                    label: 'Teve queda recente?',
                    value: data.elderlyRecentFall,
                  },
                  {
                    key: 'elderlyMentalConfusion' as const,
                    label: 'Confusão mental ou desorientação?',
                    value: data.elderlyMentalConfusion,
                  },
                  {
                    key: 'elderlyWeightLoss' as const,
                    label: 'Perda de peso sem explicação?',
                    value: data.elderlyWeightLoss,
                  },
                ].map((item) => (
                  <div key={item.key}>
                    <p className={triageLabelClass}>{item.label}</p>
                    <div className="flex gap-2">
                      {[
                        { value: true, label: 'Sim' },
                        { value: false, label: 'Não' },
                      ].map((option) => (
                        <button
                          key={String(option.value)}
                          type="button"
                          onClick={() => onChange({ ...data, [item.key]: option.value })}
                          className={triageChipClass(item.value === option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {subStep === 'review' ? (
          <>
            <div className="rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary-light)]/40 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-primary)]">
                Resumo para o médico
              </p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-gray-900">
                {buildTriagemResumoPreview(data)}
              </p>
            </div>

            <p className={triageHintClass}>
              Toque em cada bloco para ver ou ajustar os detalhes antes de confirmar.
            </p>

            {(
              [
                { key: 'motive', title: 'Motivo e sintomas', step: 'motive' as const },
                { key: 'chronic', title: 'Doenças crônicas', step: 'chronic' as const },
                { key: 'vitals', title: 'Sinais vitais', step: 'vitals' as const },
                { key: 'medications', title: 'Medicamentos', step: 'medications' as const },
                ...(showSafety
                  ? [{ key: 'safety', title: 'Segurança', step: 'safety' as const }]
                  : []),
              ] as const
            ).map((section) => {
              const open = expandedSections[section.key] ?? false
              return (
                <div
                  key={section.key}
                  className="overflow-hidden rounded-xl border border-gray-200/80 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => toggleReviewSection(section.key)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <span className={triageSectionTitleClass}>{section.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {open ? (
                    <div className="border-t border-gray-100 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSubStep(section.step)}
                        className="text-sm font-medium text-[var(--brand-primary)] underline-offset-2 hover:underline"
                      >
                        Editar este bloco
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </>
        ) : null}
      </AttendanceFieldHighlight>
    </AttendanceStepShell>
  )
}
