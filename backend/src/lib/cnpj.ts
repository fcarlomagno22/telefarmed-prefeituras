export function normalizeCnpj(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) {
    throw new Error('CNPJ inválido')
  }
  return digits
}

function allSameDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits)
}

function calcCnpjCheckDigit(base: string, weights: number[]): number {
  let sum = 0
  for (let index = 0; index < weights.length; index += 1) {
    sum += Number(base[index]) * weights[index]!
  }
  const remainder = sum % 11
  return remainder < 2 ? 0 : 11 - remainder
}

export function isValidCnpj(value: string): boolean {
  let digits: string
  try {
    digits = normalizeCnpj(value)
  } catch {
    return false
  }

  if (allSameDigits(digits)) return false

  const base = digits.slice(0, 12)
  const firstDigit = calcCnpjCheckDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const secondDigit = calcCnpjCheckDigit(`${base}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return digits === `${base}${firstDigit}${secondDigit}`
}
