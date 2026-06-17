export type RunWalkActivityIntensity =
  | 'very-light'
  | 'light'
  | 'adequate'
  | 'hard'
  | 'very-hard'

export type RunWalkActivityWellbeing =
  | 'very-well'
  | 'well'
  | 'a-bit-tired'
  | 'very-tired'
  | 'unwell'

export type RunWalkActivityDiscomfort =
  | 'none'
  | 'feet'
  | 'ankles'
  | 'calves'
  | 'knees'
  | 'hips'
  | 'back'
  | 'chest'
  | 'other'

export type RunWalkActivityCheckIn = {
  intensity: RunWalkActivityIntensity
  wellbeing: RunWalkActivityWellbeing
  discomfort: RunWalkActivityDiscomfort
  note: string | null
  answeredAt: string
}

export const RUN_WALK_INTENSITY_OPTIONS: {
  id: RunWalkActivityIntensity
  label: string
}[] = [
  { id: 'very-light', label: 'Muito leve' },
  { id: 'light', label: 'Leve' },
  { id: 'adequate', label: 'Adequada' },
  { id: 'hard', label: 'Difícil' },
  { id: 'very-hard', label: 'Muito difícil' },
]

export const RUN_WALK_WELLBEING_OPTIONS: {
  id: RunWalkActivityWellbeing
  label: string
}[] = [
  { id: 'very-well', label: 'Muito bem' },
  { id: 'well', label: 'Bem' },
  { id: 'a-bit-tired', label: 'Um pouco cansado' },
  { id: 'very-tired', label: 'Muito cansado' },
  { id: 'unwell', label: 'Indisposto' },
]

export const RUN_WALK_DISCOMFORT_OPTIONS: {
  id: RunWalkActivityDiscomfort
  label: string
}[] = [
  { id: 'none', label: 'Não' },
  { id: 'feet', label: 'Pés' },
  { id: 'ankles', label: 'Tornozelos' },
  { id: 'calves', label: 'Panturrilhas' },
  { id: 'knees', label: 'Joelhos' },
  { id: 'hips', label: 'Quadril' },
  { id: 'back', label: 'Costas' },
  { id: 'chest', label: 'Peito' },
  { id: 'other', label: 'Outro' },
]
