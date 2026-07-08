import type { MaterialCommunityIcons } from '@expo/vector-icons'

export type RegistrationGender =
  | 'masculino'
  | 'feminino'
  | 'outros'
  | 'prefiro_nao_informar'

export const REGISTRATION_GENDER_OPTIONS: ReadonlyArray<{
  id: RegistrationGender
  label: string
  icon: keyof typeof MaterialCommunityIcons.glyphMap
  iconColor: string
}> = [
  { id: 'masculino', label: 'Masculino', icon: 'gender-male', iconColor: '#0284c7' },
  { id: 'feminino', label: 'Feminino', icon: 'gender-female', iconColor: '#e11d48' },
  { id: 'outros', label: 'Outros', icon: 'gender-non-binary', iconColor: '#7c3aed' },
  {
    id: 'prefiro_nao_informar',
    label: 'Prefiro não informar',
    icon: 'account-off-outline',
    iconColor: '#64748b',
  },
]

export function registrationGenderLabel(gender: RegistrationGender | ''): string {
  return REGISTRATION_GENDER_OPTIONS.find((option) => option.id === gender)?.label ?? ''
}
