export function isValidBirthDate(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 8) return false

  const day = Number(digits.slice(0, 2))
  const month = Number(digits.slice(2, 4))
  const year = Number(digits.slice(4, 8))
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1920) return false

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date <= today
}
