export function cpfDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCpf(cpf: string): boolean {
  const digits = cpfDigits(cpf)

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
