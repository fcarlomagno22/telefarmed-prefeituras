import type { PrefeituraRedeUnit } from '../data/prefeituraRedeMock'

/** Normaliza regionKey da UBT para a key da RA administrativa. */
const REGION_KEY_TO_RA_KEY: Record<string, string> = {
  centro: 'centro',
  central: 'centro',
  norte: 'norte',
  sul: 'sul',
  leste: 'leste',
  oeste: 'oeste',
}

export function getPrefeituraRedeUnitRaKey(unit: PrefeituraRedeUnit) {
  return REGION_KEY_TO_RA_KEY[unit.regionKey] ?? unit.regionKey
}

export function filterPrefeituraRedeUnitsByRaKeys(
  units: PrefeituraRedeUnit[],
  raKeys: Iterable<string>,
) {
  const keys = new Set(raKeys)
  if (keys.size === 0) return units
  return units.filter((unit) => keys.has(getPrefeituraRedeUnitRaKey(unit)))
}
