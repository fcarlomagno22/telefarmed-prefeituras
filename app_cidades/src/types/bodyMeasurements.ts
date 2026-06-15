import { MetricDataPoint } from './metrics'

export type StorableBodyMeasurementId =
  | 'abdomen'
  | 'quadril'
  | 'peito'
  | 'cintura'
  | 'coxa'
  | 'braco'
  | 'pescoco'

export type BodyMeasurementId = 'peso' | StorableBodyMeasurementId | 'cintura_quadril'

export type BodyMeasurementGroup = 'principal' | 'complementar'

export type BodyMeasurementConfig = {
  id: BodyMeasurementId
  label: string
  shortLabel: string
  unit: 'kg' | 'cm' | 'índice'
  icon: string
  group: BodyMeasurementGroup
  min: number
  max: number
  step: number
  defaultValue: number
  computed?: boolean
  loggable?: boolean
}

export type BodyMeasurementReading = {
  id: StorableBodyMeasurementId | 'peso'
  value: number
}

export type BodyMeasurementHistory = Partial<Record<StorableBodyMeasurementId, MetricDataPoint[]>>
