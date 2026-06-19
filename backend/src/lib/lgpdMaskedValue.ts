function hasBulletMask(value: string): boolean {
  return value.includes('•')
}

export function isLgpdMaskedEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return hasBulletMask(trimmed)
}

export function isLgpdMaskedCpf(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return value.trim().startsWith('***.')
}

export function isLgpdMaskedPhone(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return value.includes('*****')
}

export function isLgpdMaskedZipCode(value: unknown): boolean {
  if (typeof value !== 'string') return false
  return value.trim().startsWith('*****')
}

export function isLgpdMaskedAddressField(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return false
  return hasBulletMask(trimmed)
}

export function stripLgpdMaskedPatientPatchFields(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body

  const input = { ...(body as Record<string, unknown>) }

  if (isLgpdMaskedEmail(input.email)) delete input.email
  if (isLgpdMaskedCpf(input.guardianCpf)) delete input.guardianCpf
  if (isLgpdMaskedPhone(input.phone)) delete input.phone
  if (isLgpdMaskedZipCode(input.zipCode)) delete input.zipCode
  if (isLgpdMaskedAddressField(input.street)) delete input.street
  if (isLgpdMaskedAddressField(input.number)) delete input.number
  if (isLgpdMaskedAddressField(input.complement)) delete input.complement
  if (isLgpdMaskedAddressField(input.neighborhood)) delete input.neighborhood

  if (Array.isArray(input.contacts)) {
    input.contacts = input.contacts.map((contact) => {
      if (!contact || typeof contact !== 'object' || Array.isArray(contact)) return contact
      const row = { ...(contact as Record<string, unknown>) }
      if (isLgpdMaskedPhone(row.phone)) delete row.phone
      return row
    })
  }

  return input
}
