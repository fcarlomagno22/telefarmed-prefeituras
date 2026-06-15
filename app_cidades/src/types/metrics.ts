export type ChartableMetricId =
  | 'imc'
  | 'peso'
  | 'glicemia'
  | 'pressao'
  | 'frequencia'
  | 'passos'
  | 'distancia'
  | 'corporais'
  | 'hidratacao'
  | 'circunferencia'

export type PeriodPreset = 'today' | 'yesterday' | 'week' | 'month' | 'last30days' | 'custom'

export type MetricDataPoint = {
  date: string
  hour?: number
  value: number
  diastolic?: number
}

export type ProfileFieldId = 'height' | 'weight' | 'age' | 'gender'

export type EditableProfileFieldId = 'height' | 'weight' | 'gender'

export type ProfileSnapshot = {
  height: string
  weight: string
  age: string
  gender: string
}

export type PeriodSelection = {
  preset: PeriodPreset
  start: Date
  end: Date
}
