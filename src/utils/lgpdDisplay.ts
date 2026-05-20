export function maskCpfForDisplay(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length < 11) return cpf
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}

export function maskPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return phone
  const ddd = digits.slice(0, 2)
  const last4 = digits.slice(-4)
  if (digits.length >= 11) {
    return `(${ddd}) *****-${last4}`
  }
  return `(${ddd}) ****-${last4}`
}

export function maskZipCodeForDisplay(zip: string): string {
  const digits = zip.replace(/\D/g, '')
  if (digits.length < 8) return '*****-***'
  return `*****-${digits.slice(-3)}`
}

export function maskStreetForDisplay(street: string): string {
  if (!street.trim()) return street
  const prefixMatch = street.match(
    /^((?:Av\.|Rua|Alameda|Al\.|Travessa|Trav\.|Rodovia|Rod\.|Estrada|Est\.|Praça|Pç\.)\s*)/i,
  )
  const prefix = prefixMatch?.[1] ?? ''
  return `${prefix}${'•'.repeat(8)}`
}

export function maskAddressFieldForDisplay(value: string): string {
  if (!value || value === '—') return value
  return '••••••••'
}

export function maskNeighborhoodForDisplay(value: string): string {
  if (!value.trim()) return value
  if (value.length <= 3) return '•••'
  return `${value.slice(0, 3)}${'•'.repeat(Math.max(3, value.length - 3))}`
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}
