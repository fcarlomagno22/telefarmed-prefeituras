export type PasswordRule = {
  id: string
  label: string
  test: (value: string) => boolean
}

export const passwordRules: PasswordRule[] = [
  {
    id: 'length',
    label: 'Mínimo de 8 caracteres',
    test: (value) => value.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'Uma letra maiúscula',
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: 'lowercase',
    label: 'Uma letra minúscula',
    test: (value) => /[a-z]/.test(value),
  },
  {
    id: 'number',
    label: 'Um número',
    test: (value) => /\d/.test(value),
  },
  {
    id: 'special',
    label: 'Um caractere especial',
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
]

export function isPasswordValid(value: string): boolean {
  return passwordRules.every((rule) => rule.test(value))
}
