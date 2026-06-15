export function cepDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskCep(value: string): string {
  const digits = cepDigits(value).slice(0, 8)

  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export function isValidCep(value: string): boolean {
  return cepDigits(value).length === 8
}
