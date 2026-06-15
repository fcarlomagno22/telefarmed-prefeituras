export type AbdominalGender = 'female' | 'male' | 'other'

export function parseProfileGender(gender: string): AbdominalGender {
  const normalized = gender.toLowerCase().trim()
  if (normalized.includes('masc')) return 'male'
  if (normalized.includes('fem')) return 'female'
  return 'other'
}

export function getAbdominalIdealMaxCm(gender: string) {
  const profileGender = parseProfileGender(gender)
  if (profileGender === 'male') return 94
  if (profileGender === 'female') return 80
  return 88
}

export function getAbdominalHighRiskFromCm(gender: string) {
  const idealMax = getAbdominalIdealMaxCm(gender)
  return idealMax + 8
}

type AbdominalZoneCopy = {
  label: string
  hint: string
}

export function getAbdominalCircumferenceZoneCopy(
  valueCm: number,
  gender: string,
): AbdominalZoneCopy {
  const idealMax = getAbdominalIdealMaxCm(gender)
  const highRiskFrom = getAbdominalHighRiskFromCm(gender)

  if (valueCm <= idealMax) {
    return {
      label: 'Dentro do ideal',
      hint: `Referência OMS para seu perfil: até ${idealMax} cm.`,
    }
  }

  if (valueCm < highRiskFrom) {
    return {
      label: 'Acima do ideal',
      hint: `Para seu perfil, a meta é até ${idealMax} cm.`,
    }
  }

  return {
    label: 'Risco elevado',
    hint: `Acima de ${idealMax} cm, o risco cardiovascular aumenta.`,
  }
}
