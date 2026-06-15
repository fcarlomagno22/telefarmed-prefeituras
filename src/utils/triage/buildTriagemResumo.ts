import {
  SYMPTOM_INTENSITY_LABELS,
  SYMPTOM_ONSET_LABELS,
  TRIAGE_CHRONIC_CONDITIONS,
  TRIAGE_SYMPTOM_OPTIONS,
} from '../../data/triageClinicalCatalog'
import type { TriageClinicalData } from '../../types/triageClinical'

function formatVital(
  label: string,
  value: number | null,
  unit: string,
  notMeasured: boolean,
): string | null {
  if (notMeasured) return `${label}: não aferido`
  if (value === null) return null
  return `${label}: ${value}${unit}`
}

function formatBloodPressure(data: TriageClinicalData): string | null {
  const { bloodPressureSystolic, bloodPressureDiastolic } = data
  if (bloodPressureSystolic.notMeasured || bloodPressureDiastolic.notMeasured) {
    return 'Pressão arterial: não aferida'
  }
  if (
    bloodPressureSystolic.value !== null &&
    bloodPressureDiastolic.value !== null
  ) {
    return `Pressão arterial: ${bloodPressureSystolic.value}/${bloodPressureDiastolic.value} mmHg`
  }
  return null
}

export function buildTriagemResumoPreview(data: TriageClinicalData): string {
  const parts: string[] = []

  const chronicLabels = data.chronicConditions
    .filter((id) => id !== 'none')
    .map((id) => TRIAGE_CHRONIC_CONDITIONS.find((item) => item.id === id)?.label ?? id)

  if (data.chronicConditions.includes('none')) {
    parts.push('Sem doenças crônicas conhecidas')
  } else if (chronicLabels.length > 0) {
    parts.push(chronicLabels.join(' · '))
  }

  const bp = formatBloodPressure(data)
  if (bp) parts.push(bp.replace('Pressão arterial: ', 'PA '))

  if (data.chiefComplaint.trim()) {
    const onset = data.symptomOnset
      ? SYMPTOM_ONSET_LABELS[data.symptomOnset]
      : ''
    parts.push(
      `${data.chiefComplaint.trim()}${onset ? ` (${onset.toLowerCase()})` : ''}`,
    )
  }

  const meds = data.noContinuousMedications
    ? []
    : data.medications
        .filter((med) => med.name.trim())
        .map((med) =>
          med.doseFrequency.trim()
            ? `${med.name.trim()} — ${med.doseFrequency.trim()}`
            : med.name.trim(),
        )

  if (meds.length > 0) {
    parts.push(meds.join(' · '))
  }

  return parts.filter(Boolean).join(' · ') || 'Triagem registrada — revise os detalhes abaixo.'
}

export function buildTriagemResumo(data: TriageClinicalData): string {
  const lines: string[] = []

  if (data.chiefComplaint.trim()) {
    lines.push(`Motivo: ${data.chiefComplaint.trim()}`)
  }

  if (data.symptomOnset) {
    lines.push(`Início: ${SYMPTOM_ONSET_LABELS[data.symptomOnset]}`)
  }

  if (data.symptomIntensity) {
    let intensity = SYMPTOM_INTENSITY_LABELS[data.symptomIntensity]
    if (data.symptomIntensityScale !== null) {
      intensity += ` (${data.symptomIntensityScale}/10)`
    }
    lines.push(`Intensidade: ${intensity}`)
  }

  if (data.associatedSymptoms.length > 0) {
    const labels = data.associatedSymptoms
      .map((id) => TRIAGE_SYMPTOM_OPTIONS.find((item) => item.id === id)?.label ?? id)
      .join(', ')
    lines.push(`Sintomas: ${labels}`)
  }

  if (data.symptomDetails.trim()) {
    lines.push(`Detalhes: ${data.symptomDetails.trim()}`)
  }

  const chronicLabels = data.chronicConditions
    .filter((id) => id !== 'none')
    .map((id) => TRIAGE_CHRONIC_CONDITIONS.find((item) => item.id === id)?.label ?? id)

  if (data.chronicConditions.includes('none')) {
    lines.push('Crônicas: nenhuma informada')
  } else if (chronicLabels.length > 0) {
    lines.push(`Crônicas: ${chronicLabels.join(', ')}`)
  }

  if (data.chronicOther.trim()) {
    lines.push(`Outra condição: ${data.chronicOther.trim()}`)
  }

  if (data.usesInsulin !== null) {
    lines.push(`Usa insulina: ${data.usesInsulin ? 'sim' : 'não'}`)
  }

  if (data.lastKnownGlucose !== null) {
    lines.push(`Última glicemia conhecida: ${data.lastKnownGlucose} mg/dL`)
  }

  if (data.hypertensionMedicationUse) {
    const map = { yes: 'sim', no: 'não', unknown: 'não sabe' } as const
    lines.push(`Medicação para pressão: ${map[data.hypertensionMedicationUse]}`)
  }

  const bp = formatBloodPressure(data)
  if (bp) lines.push(bp)

  const glucose = formatVital(
    'Glicemia',
    data.bloodGlucose.value,
    ' mg/dL',
    data.bloodGlucose.notMeasured,
  )
  if (glucose) lines.push(glucose)

  const temp = formatVital('Temperatura', data.temperature.value, ' °C', data.temperature.notMeasured)
  if (temp) lines.push(temp)

  const weight = formatVital('Peso', data.weightKg.value, ' kg', data.weightKg.notMeasured)
  if (weight) lines.push(weight)

  const spo2 = formatVital(
    'Saturação O₂',
    data.oxygenSaturation.value,
    '%',
    data.oxygenSaturation.notMeasured,
  )
  if (spo2) lines.push(spo2)

  if (data.noContinuousMedications) {
    lines.push('Medicamentos contínuos: não usa')
  } else if (data.medications.some((med) => med.name.trim())) {
    const medLines = data.medications
      .filter((med) => med.name.trim())
      .map((med, index) => {
        const dose = med.doseFrequency.trim()
        return dose
          ? `${index + 1}. ${med.name.trim()} — ${dose}`
          : `${index + 1}. ${med.name.trim()}`
      })
    lines.push(`Medicamentos:\n${medLines.join('\n')}`)
  }

  if (data.medicationAllergies.trim()) {
    lines.push(`Alergias: ${data.medicationAllergies.trim()}`)
  }

  if (data.pregnancyBreastfeeding) {
    const map = {
      pregnant: 'Grávida',
      breastfeeding: 'Amamentando',
      neither: 'Não grávida / não amamentando',
      unknown: 'Não sabe',
    } as const
    lines.push(`Gravidez/amamentação: ${map[data.pregnancyBreastfeeding]}`)
  }

  if (data.minorCompanion.trim()) {
    lines.push(`Acompanhante (menor): ${data.minorCompanion.trim()}`)
  }

  const elderlyFlags: string[] = []
  if (data.elderlyRecentFall === true) elderlyFlags.push('queda recente')
  if (data.elderlyMentalConfusion === true) elderlyFlags.push('confusão mental')
  if (data.elderlyWeightLoss === true) elderlyFlags.push('perda de peso')
  if (elderlyFlags.length > 0) {
    lines.push(`Idoso — alertas: ${elderlyFlags.join(', ')}`)
  }

  return lines.join('\n')
}
