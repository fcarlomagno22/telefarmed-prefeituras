function hasBulletMask(value: string): boolean {
  return value.includes('•')
}

export function isLgpdMaskedEmail(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return false
  return hasBulletMask(trimmed)
}

export function isLgpdMaskedCpf(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? ''
  return trimmed.startsWith('***.')
}

export function isLgpdMaskedPhone(value: string | undefined | null): boolean {
  return (value?.trim() ?? '').includes('*****')
}

export function isLgpdMaskedZipCode(value: string | undefined | null): boolean {
  return (value?.trim() ?? '').startsWith('*****')
}

export function isLgpdMaskedAddressField(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return false
  return hasBulletMask(trimmed)
}

export function clearLgpdMaskedRegistrationField(value: string | undefined | null): string {
  if (!value?.trim()) return ''
  if (
    isLgpdMaskedEmail(value) ||
    isLgpdMaskedCpf(value) ||
    isLgpdMaskedPhone(value) ||
    isLgpdMaskedZipCode(value) ||
    isLgpdMaskedAddressField(value)
  ) {
    return ''
  }
  return value
}
