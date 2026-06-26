export type EatWellMenuObjective =
  | 'weight_loss'
  | 'maintain_weight'
  | 'gain_weight'
  | 'hypertrophy'
  | 'metabolic_health'
  | 'diabetes'
  | 'hypertension'
  | 'other'

export type EatWellActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'intense'
  | 'very_intense'

export type EatWellFrequency = 'daily' | 'weekly' | 'monthly' | 'rare'

export type EatWellBowelFrequency = 'daily' | 'twice_thrice_weekly' | 'weekly' | 'irregular'

export type EatWellMenuWizardForm = {
  menuName: string
  heightMeters: string
  weightKg: string
  objective: EatWellMenuObjective | null
  activityLevel: EatWellActivityLevel | null
  diseases: string[]
  otherDiseases: string
  noKnownDiseases: boolean
  medications: string
  noRegularMedications: boolean
  intolerances: string[]
  otherIntolerances: string
  noKnownIntolerances: boolean
  dietaryPreferences: string[]
  likedFoods: string
  avoidedFoods: string
  isPregnant: boolean | null
  isLactating: boolean | null
  hungerLevel: number
  hasCompulsion: boolean | null
  compulsionFrequency: EatWellFrequency | null
  consumesAlcohol: boolean | null
  alcoholFrequency: EatWellFrequency | null
  alcoholQuantity: string
  sleepHours: string
  sleepQuality: number
  stressLevel: number
  stressCauses: string
  bowelFrequency: EatWellBowelFrequency | null
  previousDiets: string[]
  neverTriedDiets: boolean
  informationAccuracyConfirmed: boolean
}

export const MENU_WIZARD_TOTAL_STEPS = 14
export const MENU_WIZARD_LOADING_MS = 12_000

export const MENU_WIZARD_TIMELINE_STEPS = [
  { id: 1, icon: 'shield-checkmark-outline' as const },
  { id: 2, icon: 'person-outline' as const },
  { id: 3, icon: 'medkit-outline' as const },
]

export const MENU_OBJECTIVE_OPTIONS: { id: EatWellMenuObjective; label: string }[] = [
  { id: 'weight_loss', label: 'Emagrecimento' },
  { id: 'maintain_weight', label: 'Manter o peso' },
  { id: 'gain_weight', label: 'Ganhar peso' },
  { id: 'hypertrophy', label: 'Hipertrofia' },
  { id: 'metabolic_health', label: 'Saúde metabólica' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'Hipertensão' },
  { id: 'other', label: 'Outros' },
]

export const MENU_ACTIVITY_OPTIONS: { id: EatWellActivityLevel; label: string; hint: string }[] = [
  { id: 'sedentary', label: 'Sedentário', hint: 'Pouco ou nenhum exercício' },
  { id: 'light', label: 'Leve', hint: 'Exercício leve 1–3x/semana' },
  { id: 'moderate', label: 'Moderado', hint: 'Exercício moderado 3–5x/semana' },
  { id: 'intense', label: 'Intenso', hint: 'Exercício 6–7x/semana' },
  {
    id: 'very_intense',
    label: 'Muito intenso',
    hint: 'Exercício muito intenso e trabalho físico',
  },
]

export const MENU_DISEASE_OPTIONS = [
  'Diabetes',
  'Hipertensão',
  'Colesterol alto',
  'Tireoide',
  'Gastrite',
  'Intestino irritável',
  'Anemia',
  'Osteoporose',
]

export const MENU_INTOLERANCE_OPTIONS = [
  'Lactose',
  'Glúten',
  'Frutose',
  'Sacarose',
  'Ovos',
  'Soja',
  'Amendoim',
  'Frutos do mar',
]

export const MENU_DIETARY_PREFERENCE_OPTIONS = [
  'Vegetariano',
  'Vegano',
  'Low carb',
  'Sem açúcar',
  'Sem glúten',
  'Sem lactose',
]

export const MENU_PREVIOUS_DIET_OPTIONS = [
  'Low carb',
  'Cetogênica',
  'Jejum intermitente',
  'Mediterrânea',
  'DASH',
  'Vegetariana',
  'Vegana',
  'Outras',
]

export const MENU_FREQUENCY_OPTIONS: { id: EatWellFrequency; label: string }[] = [
  { id: 'daily', label: 'Diária' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensal' },
  { id: 'rare', label: 'Rara' },
]

export const MENU_BOWEL_OPTIONS: { id: EatWellBowelFrequency; label: string }[] = [
  { id: 'daily', label: 'Diário' },
  { id: 'twice_thrice_weekly', label: '2–3x por semana' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'irregular', label: 'Irregular' },
]

export const MENU_WIZARD_STEP_META: Record<
  number,
  { title: string; subtitle: string; optional?: boolean }
> = {
  1: { title: 'Aviso médico', subtitle: 'Leia com atenção antes de continuar' },
  2: { title: 'Dados básicos', subtitle: 'Informações para personalizar seu cardápio' },
  3: { title: 'Histórico de doenças', subtitle: 'Etapa 3 de 14' },
  4: { title: 'Medicamentos em uso', subtitle: 'Etapa 4 de 14' },
  5: { title: 'Intolerâncias alimentares', subtitle: 'Etapa 5 de 14' },
  6: { title: 'Preferências alimentares', subtitle: 'Etapa 6 de 14' },
  7: { title: 'Gestação e amamentação', subtitle: 'Etapa 7 de 14' },
  8: { title: 'Fome e compulsão', subtitle: 'Etapa 8 de 14' },
  9: { title: 'Consumo de álcool', subtitle: 'Etapa 9 de 14' },
  10: { title: 'Qualidade do sono', subtitle: 'Etapa opcional · 10 de 14', optional: true },
  11: { title: 'Nível de estresse', subtitle: 'Etapa opcional · 11 de 14', optional: true },
  12: { title: 'Frequência intestinal', subtitle: 'Etapa opcional · 12 de 14', optional: true },
  13: { title: 'Dietas anteriores', subtitle: 'Etapa 13 de 14' },
  14: {
    title: 'Declaração de veracidade',
    subtitle: 'Confirme antes de gerar o cardápio',
  },
}

export function createEmptyMenuWizardForm(): EatWellMenuWizardForm {
  return {
    menuName: '',
    heightMeters: '',
    weightKg: '',
    objective: null,
    activityLevel: null,
    diseases: [],
    otherDiseases: '',
    noKnownDiseases: false,
    medications: '',
    noRegularMedications: false,
    intolerances: [],
    otherIntolerances: '',
    noKnownIntolerances: false,
    dietaryPreferences: [],
    likedFoods: '',
    avoidedFoods: '',
    isPregnant: null,
    isLactating: null,
    hungerLevel: 5,
    hasCompulsion: null,
    compulsionFrequency: null,
    consumesAlcohol: null,
    alcoholFrequency: null,
    alcoholQuantity: '',
    sleepHours: '',
    sleepQuality: 5,
    stressLevel: 5,
    stressCauses: '',
    bowelFrequency: null,
    previousDiets: [],
    neverTriedDiets: false,
    informationAccuracyConfirmed: false,
  }
}

/** Máscara de altura: aceita vírgula (1,81) ou 3 dígitos (181 → 1,81). */
export function maskHeightMetersInput(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '')

  if (cleaned.includes(',')) {
    const [intPart = '', decPart = ''] = cleaned.split(',')
    const intLimited = intPart.slice(0, 2)
    const decLimited = decPart.slice(0, 2)

    if (cleaned.endsWith(',') && decLimited.length === 0) {
      return intLimited.length > 0 ? `${intLimited},` : ''
    }

    if (decLimited.length > 0) {
      return `${intLimited || '0'},${decLimited}`
    }

    return intLimited
  }

  const digits = cleaned.slice(0, 3)
  if (!digits) return ''
  if (digits.length < 3) return digits

  return `${digits[0]},${digits.slice(1)}`
}

/** Máscara de peso: aceita vírgula (78,5) ou 3 dígitos (785 → 78,5; 120 permanece 120). */
export function maskWeightKgInput(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '')

  if (cleaned.includes(',')) {
    const [intPart = '', decPart = ''] = cleaned.split(',')
    const intLimited = intPart.slice(0, 3)
    const decLimited = decPart.slice(0, 1)

    if (cleaned.endsWith(',') && decLimited.length === 0) {
      return intLimited.length > 0 ? `${intLimited},` : ''
    }

    if (decLimited.length > 0) {
      return `${intLimited || '0'},${decLimited}`
    }

    return intLimited
  }

  const digits = cleaned.slice(0, 3)
  if (!digits) return ''
  if (digits.length < 3) return digits

  const asInteger = parseInt(digits, 10)
  if (asInteger >= 100 && asInteger <= 300) {
    return digits
  }

  const asDecimal = asInteger / 10
  if (asDecimal > 0 && asDecimal <= 99.9) {
    return asDecimal.toFixed(1).replace('.', ',')
  }

  return digits
}

export function parseHeightMeters(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed >= 0.5 && parsed <= 2.5 ? parsed : null
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 3) {
    const parsed = parseInt(digits, 10) / 100
    return parsed >= 0.5 && parsed <= 2.5 ? parsed : null
  }

  return null
}

export function parseWeightKg(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed > 0 && parsed <= 300 ? parsed : null
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 1 || digits.length === 2) {
    const parsed = parseInt(digits, 10)
    return parsed > 0 && parsed <= 300 ? parsed : null
  }

  if (digits.length === 3) {
    const asInteger = parseInt(digits, 10)
    if (asInteger >= 100 && asInteger <= 300) {
      return asInteger
    }
    const parsed = asInteger / 10
    return parsed > 0 && parsed <= 99.9 ? parsed : null
  }

  return null
}

export function getMenuWizardTimelineStep(step: number): number {
  if (step <= 1) return 1
  if (step === 2) return 2
  return 3
}

export function isMenuWizardStepTwoValid(form: EatWellMenuWizardForm): boolean {
  return (
    form.menuName.trim().length >= 2 &&
    parseHeightMeters(form.heightMeters) != null &&
    parseWeightKg(form.weightKg) != null &&
    form.objective != null &&
    form.activityLevel != null
  )
}

export function isMenuWizardStepThreeValid(form: EatWellMenuWizardForm): boolean {
  return (
    form.noKnownDiseases ||
    form.diseases.length > 0 ||
    form.otherDiseases.trim().length > 0
  )
}

export function isMenuWizardStepFourValid(form: EatWellMenuWizardForm): boolean {
  return form.noRegularMedications || form.medications.trim().length > 0
}

export function isMenuWizardStepFiveValid(form: EatWellMenuWizardForm): boolean {
  return (
    form.noKnownIntolerances ||
    form.intolerances.length > 0 ||
    form.otherIntolerances.trim().length > 0
  )
}

export function isMenuWizardStepSixValid(form: EatWellMenuWizardForm): boolean {
  return true
}

export function isMenuWizardStepSevenValid(form: EatWellMenuWizardForm): boolean {
  return form.isPregnant !== null && form.isLactating !== null
}

export function isMenuWizardStepEightValid(form: EatWellMenuWizardForm): boolean {
  return form.hasCompulsion !== null
}

export function isMenuWizardStepNineValid(form: EatWellMenuWizardForm): boolean {
  return form.consumesAlcohol !== null
}

export function isMenuWizardStepThirteenValid(form: EatWellMenuWizardForm): boolean {
  return form.neverTriedDiets || form.previousDiets.length > 0
}

export function isMenuWizardStepFourteenValid(form: EatWellMenuWizardForm): boolean {
  return form.informationAccuracyConfirmed
}

export function isMenuWizardStepValid(step: number, form: EatWellMenuWizardForm): boolean {
  switch (step) {
    case 2:
      return isMenuWizardStepTwoValid(form)
    case 3:
      return isMenuWizardStepThreeValid(form)
    case 4:
      return isMenuWizardStepFourValid(form)
    case 5:
      return isMenuWizardStepFiveValid(form)
    case 6:
      return isMenuWizardStepSixValid(form)
    case 7:
      return isMenuWizardStepSevenValid(form)
    case 8:
      return isMenuWizardStepEightValid(form)
    case 9:
      return isMenuWizardStepNineValid(form)
    case 13:
      return isMenuWizardStepThirteenValid(form)
    case 14:
      return isMenuWizardStepFourteenValid(form)
    default:
      return true
  }
}

export function toggleStringList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function getMenuObjectiveLabel(objective: EatWellMenuObjective): string {
  return MENU_OBJECTIVE_OPTIONS.find((option) => option.id === objective)?.label ?? 'Outros'
}
