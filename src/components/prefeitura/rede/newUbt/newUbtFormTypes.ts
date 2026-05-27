import type { PrefeituraRedeUnitStatus } from '../../../../data/prefeituraRedeMock'

export const newUbtFlowSteps = [
  { id: 'unit', label: 'Unidade' },
  { id: 'location', label: 'Endereço e responsável' },
  { id: 'operation', label: 'Operação' },
  { id: 'review', label: 'Revisão' },
] as const

export type NewUbtFormStep = (typeof newUbtFlowSteps)[number]['id']

export type NewUbtUnitType = 'movel' | 'fixa'

export const newUbtUnitTypeOptions = [
  { value: 'fixa' as const, label: 'Fixa' },
  { value: 'movel' as const, label: 'Móvel' },
]

export function getNewUbtUnitTypeLabel(value: NewUbtUnitType) {
  return newUbtUnitTypeOptions.find((option) => option.value === value)?.label ?? value
}

export type NewUbtFormState = {
  name: string
  cnes: string
  unitType: NewUbtUnitType
  status: PrefeituraRedeUnitStatus
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  regionId: string
  unitLandlinePhone: string
  responsibleName: string
  responsibleEmail: string
  responsibleCpf: string
  responsiblePhone: string
  responsibleAccessPassword: string
  responsibleAuthorizationPin: string
  stationsTotal: string
  dailyCapacityPerUnit: string
  enableDailyCapacityLimit: boolean
  specialtyIds: Set<string>
  notes: string
}

export function createEmptyNewUbtForm(defaultRegionId: string): NewUbtFormState {
  return {
    name: '',
    cnes: '',
    unitType: 'fixa',
    status: 'ativa',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'Brasília',
    state: 'DF',
    regionId: defaultRegionId,
    unitLandlinePhone: '',
    responsibleName: '',
    responsibleEmail: '',
    responsibleCpf: '',
    responsiblePhone: '',
    responsibleAccessPassword: '',
    responsibleAuthorizationPin: '',
    stationsTotal: '4',
    dailyCapacityPerUnit: '24',
    enableDailyCapacityLimit: true,
    specialtyIds: new Set(),
    notes: '',
  }
}

export function resolveNewUbtStepIndex(step: NewUbtFormStep) {
  return newUbtFlowSteps.findIndex((item) => item.id === step)
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidCpf(value: string) {
  return value.replace(/\D/g, '').length === 11
}

export function hasResponsibleAccessCredentials(form: NewUbtFormState) {
  return (
    form.responsibleAccessPassword.length >= 8 && form.responsibleAuthorizationPin.length === 6
  )
}

export function formatNewUbtAddress(form: NewUbtFormState) {
  const parts = [
    form.street,
    form.number ? `nº ${form.number}` : '',
    form.complement,
    form.neighborhood,
    `${form.city} - ${form.state}`,
    form.cep ? `CEP ${form.cep}` : '',
  ].filter(Boolean)

  return parts.join(', ')
}
