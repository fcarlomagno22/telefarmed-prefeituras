export function cpfDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function normalizeCpf(value: string): string {
  const digits = cpfDigits(value)
  if (digits.length !== 11) {
    throw new Error('CPF inválido')
  }
  return digits
}
