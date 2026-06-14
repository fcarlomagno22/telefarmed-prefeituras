const MIN_PORTAL_PASSWORD_LENGTH = 8

const portalPasswordRequirements = [
  {
    id: 'length',
    test: (password: string) => password.length >= MIN_PORTAL_PASSWORD_LENGTH,
  },
  {
    id: 'uppercase',
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: 'digit',
    test: (password: string) => /\d/.test(password),
  },
  {
    id: 'special',
    test: (password: string) => /[^A-Za-z0-9]/.test(password),
  },
] as const

export function isPortalPasswordValid(password: string): boolean {
  return portalPasswordRequirements.every((requirement) => requirement.test(password))
}

export function validatePortalPassword(password: string): string | null {
  if (password.length < MIN_PORTAL_PASSWORD_LENGTH) {
    return 'A senha deve ter pelo menos 8 caracteres.'
  }
  if (!/[A-Z]/.test(password)) {
    return 'A senha deve conter ao menos uma letra maiúscula.'
  }
  if (!/[a-z]/.test(password)) {
    return 'A senha deve conter ao menos uma letra minúscula.'
  }
  if (!/\d/.test(password)) {
    return 'A senha deve conter ao menos um número.'
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'A senha deve conter ao menos um caractere especial.'
  }
  return null
}
