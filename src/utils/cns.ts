export function cnsDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskCns(value: string): string {
  const digits = cnsDigits(value).slice(0, 15)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
  if (digits.length <= 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
  }
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)} ${digits.slice(11)}`
}

export function isValidCns(value: string): boolean {
  const digits = cnsDigits(value)
  if (digits.length !== 15 || !/^\d{15}$/.test(digits)) return false

  if (/^[789]/.test(digits)) {
    return digits.endsWith('00')
  }

  const pis = digits.slice(0, 11)
  let sum = 0
  for (let index = 0; index < 11; index += 1) {
    sum += Number.parseInt(pis[index] ?? '0', 10) * (15 - index)
  }

  let remainder = sum % 11
  let checkDigit = 11 - remainder
  if (checkDigit === 11) checkDigit = 0

  if (checkDigit === 10) {
    sum += 2
    remainder = sum % 11
    checkDigit = 11 - remainder
    if (checkDigit === 11) checkDigit = 0
  }

  const expected = `${pis}${String(checkDigit)}001`
  return digits === expected
}
