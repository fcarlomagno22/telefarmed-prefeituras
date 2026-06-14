export function maskCpfForLgpd(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length < 11) return cpf
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

export function maskPhoneForLgpd(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return phone
  const ddd = digits.slice(0, 2)
  const last4 = digits.slice(-4)
  if (digits.length >= 11) {
    return `(${ddd}) *****-${last4}`
  }
  return `(${ddd}) ****-${last4}`
}

export function maskEmailForLgpd(email: string): string {
  const trimmed = email.trim()
  const at = trimmed.indexOf('@')
  if (at <= 0) return '•••••@•••••'
  return `${trimmed.slice(0, 1)}${'•'.repeat(4)}@${trimmed.slice(at + 1, at + 2)}${'•'.repeat(4)}`
}
