export const MIN_PORTAL_PASSWORD_LENGTH = 8

export type PasswordRequirement = {
  id: string
  label: string
  test: (password: string) => boolean
}

export const portalPasswordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'Mínimo de 8 caracteres',
    test: (password) => password.length >= MIN_PORTAL_PASSWORD_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'Uma letra maiúscula',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Uma letra minúscula',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    label: 'Um número',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Um caractere especial',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
]

export function isPortalPasswordValid(password: string): boolean {
  return portalPasswordRequirements.every((requirement) => requirement.test(password))
}

export function validatePortalPassword(password: string): string | null {
  const failed = portalPasswordRequirements.find((requirement) => !requirement.test(password))
  if (!failed) return null
  return `A senha deve atender: ${failed.label.toLowerCase()}.`
}
