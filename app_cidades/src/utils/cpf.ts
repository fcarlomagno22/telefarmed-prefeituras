export function cpfDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function maskCpf(value: string): string {
  const digits = cpfDigits(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCpf(value: string): boolean {
  const digits = cpfDigits(value)

  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  const nums = digits.split('').map(Number)

  let sum = 0
  for (let i = 0; i < 9; i++) sum += nums[i]! * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0
  if (rest !== nums[9]) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += nums[i]! * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10 || rest === 11) rest = 0

  return rest === nums[10]
}
