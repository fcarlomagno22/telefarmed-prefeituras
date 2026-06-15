export type SymptomOnset = 'today' | 'yesterday' | 'few_days' | 'over_week'

export type SymptomIntensity = 'leve' | 'moderado' | 'intenso'

export type ChronicConditionId =
  | 'hypertension'
  | 'diabetes_type_1'
  | 'diabetes_type_2'
  | 'asthma_copd'
  | 'heart_disease'
  | 'renal_failure'
  | 'epilepsy'
  | 'depression_anxiety'
  | 'obesity'
  | 'hypothyroidism'
  | 'cancer_treatment'
  | 'other'
  | 'none'

export type HypertensionMedicationUse = 'yes' | 'no' | 'unknown'

export type PregnancyBreastfeedingStatus =
  | 'pregnant'
  | 'breastfeeding'
  | 'neither'
  | 'unknown'

export type TriageMedication = {
  id: string
  name: string
  doseFrequency: string
}

export type TriageVitalField<T> = {
  value: T | null
  notMeasured: boolean
}

export type TriageClinicalData = {
  chiefComplaint: string
  symptomOnset: SymptomOnset | null
  symptomIntensity: SymptomIntensity | null
  symptomIntensityScale: number | null
  associatedSymptoms: string[]
  symptomDetails: string

  chronicConditions: ChronicConditionId[]
  chronicOther: string
  usesInsulin: boolean | null
  lastKnownGlucose: number | null
  hypertensionMedicationUse: HypertensionMedicationUse | null

  bloodPressureSystolic: TriageVitalField<number>
  bloodPressureDiastolic: TriageVitalField<number>
  bloodGlucose: TriageVitalField<number>
  temperature: TriageVitalField<number>
  weightKg: TriageVitalField<number>
  oxygenSaturation: TriageVitalField<number>

  medications: TriageMedication[]
  noContinuousMedications: boolean
  medicationAllergies: string

  pregnancyBreastfeeding: PregnancyBreastfeedingStatus | null
  minorCompanion: string
  elderlyRecentFall: boolean | null
  elderlyMentalConfusion: boolean | null
  elderlyWeightLoss: boolean | null
}

export function createTriageMedicationId() {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function emptyVitalField<T>(): TriageVitalField<T> {
  return { value: null, notMeasured: false }
}

export function emptyTriageClinicalData(): TriageClinicalData {
  return {
    chiefComplaint: '',
    symptomOnset: null,
    symptomIntensity: null,
    symptomIntensityScale: null,
    associatedSymptoms: [],
    symptomDetails: '',

    chronicConditions: [],
    chronicOther: '',
    usesInsulin: null,
    lastKnownGlucose: null,
    hypertensionMedicationUse: null,

    bloodPressureSystolic: emptyVitalField(),
    bloodPressureDiastolic: emptyVitalField(),
    bloodGlucose: emptyVitalField(),
    temperature: emptyVitalField(),
    weightKg: emptyVitalField(),
    oxygenSaturation: emptyVitalField(),

    medications: [],
    noContinuousMedications: false,
    medicationAllergies: '',

    pregnancyBreastfeeding: null,
    minorCompanion: '',
    elderlyRecentFall: null,
    elderlyMentalConfusion: null,
    elderlyWeightLoss: null,
  }
}
