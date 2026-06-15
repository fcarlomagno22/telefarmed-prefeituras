import { ProfileSnapshot } from '../types/metrics'

export function parseHeightMeters(value: string): number | null {
  const normalized = value.replace(/\s*m$/i, '').trim().replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function parseWeightKg(value: string): number | null {
  const normalized = value.replace(/\s*kg$/i, '').trim().replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function calculateImc(profile: ProfileSnapshot): number | null {
  const height = parseHeightMeters(profile.height)
  const weight = parseWeightKg(profile.weight)
  if (!height || !weight) return null

  const imc = weight / (height * height)
  return Number(imc.toFixed(1))
}

export function hasImcInputs(profile: ProfileSnapshot) {
  return parseHeightMeters(profile.height) !== null && parseWeightKg(profile.weight) !== null
}

export type ImcZoneId =
  | 'underweight'
  | 'normal'
  | 'overweight'
  | 'obesity-1'
  | 'obesity-2'
  | 'obesity-3'

export type ImcZoneStyle = {
  id: ImcZoneId
  label: string
  rangeLabel: string
  color: string
  bg: string
  border: string
}

export const IMC_REFERENCE_ZONES: ImcZoneStyle[] = [
  {
    id: 'underweight',
    label: 'Baixo peso',
    rangeLabel: '< 18,5',
    color: '#67e8f9',
    bg: 'rgba(103, 232, 249, 0.12)',
    border: 'rgba(103, 232, 249, 0.32)',
  },
  {
    id: 'normal',
    label: 'Peso normal',
    rangeLabel: '18,5 – 24,9',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.35)',
  },
  {
    id: 'overweight',
    label: 'Sobrepeso',
    rangeLabel: '25 – 29,9',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(251, 191, 36, 0.35)',
  },
  {
    id: 'obesity-1',
    label: 'Obesidade grau I',
    rangeLabel: '30 – 34,9',
    color: '#fb923c',
    bg: 'rgba(251, 146, 60, 0.14)',
    border: 'rgba(251, 146, 60, 0.35)',
  },
  {
    id: 'obesity-2',
    label: 'Obesidade grau II',
    rangeLabel: '35 – 39,9',
    color: '#f87171',
    bg: 'rgba(248, 113, 113, 0.14)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  {
    id: 'obesity-3',
    label: 'Obesidade grau III',
    rangeLabel: '≥ 40',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
]

export function getImcZone(imc: number): ImcZoneStyle {
  if (imc < 18.5) return IMC_REFERENCE_ZONES[0]
  if (imc < 25) return IMC_REFERENCE_ZONES[1]
  if (imc < 30) return IMC_REFERENCE_ZONES[2]
  if (imc < 35) return IMC_REFERENCE_ZONES[3]
  if (imc < 40) return IMC_REFERENCE_ZONES[4]
  return IMC_REFERENCE_ZONES[5]
}

export function formatImcValue(imc: number) {
  return imc.toFixed(1).replace('.', ',')
}
