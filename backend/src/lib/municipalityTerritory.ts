export function normalizeCityName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function normalizeUf(value: string): string {
  return value.trim().toUpperCase()
}

export function addressMatchesEntityTerritory(
  addressCity: string,
  addressState: string,
  entityMunicipio: string,
  entityUf: string,
): boolean {
  if (!addressCity.trim() || !addressState.trim() || !entityMunicipio.trim() || !entityUf.trim()) {
    return false
  }

  return (
    normalizeUf(addressState) === normalizeUf(entityUf) &&
    normalizeCityName(addressCity) === normalizeCityName(entityMunicipio)
  )
}

export function buildTerritoryMismatchMessage(
  entityMunicipio: string,
  entityUf: string,
  addressCity: string,
  addressState: string,
  options?: { subject?: string },
): string {
  const subject = options?.subject ?? 'A UBT só pode ser cadastrada'
  return `Este CEP é de ${addressCity.trim()}/${normalizeUf(addressState)}. ${subject} em ${entityMunicipio.trim()}/${normalizeUf(entityUf)}, área do município contratante.`
}

export const PATIENT_TERRITORY_MISMATCH_SUBJECT = 'O paciente só pode ser pré-cadastrado'
