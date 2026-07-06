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
  gradient: readonly [string, string, string]
}

export const IMC_REFERENCE_ZONES: ImcZoneStyle[] = [
  {
    id: 'underweight',
    label: 'Baixo peso',
    rangeLabel: '< 18,5',
    color: '#0e7490',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(8, 145, 178, 0.35)',
    gradient: ['#ecfeff', '#67e8f9', '#22d3ee'],
  },
  {
    id: 'normal',
    label: 'Peso normal',
    rangeLabel: '18,5 – 24,9',
    color: '#047857',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(5, 150, 105, 0.35)',
    gradient: ['#ecfdf5', '#6ee7b7', '#34d399'],
  },
  {
    id: 'overweight',
    label: 'Sobrepeso',
    rangeLabel: '25 – 29,9',
    color: '#92400e',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(217, 119, 6, 0.4)',
    gradient: ['#fffbeb', '#fcd34d', '#f59e0b'],
  },
  {
    id: 'obesity-1',
    label: 'Obesidade grau I',
    rangeLabel: '30 – 34,9',
    color: '#c2410c',
    bg: 'rgba(251, 146, 60, 0.12)',
    border: 'rgba(234, 88, 12, 0.4)',
    gradient: ['#fff7ed', '#fdba74', '#fb923c'],
  },
  {
    id: 'obesity-2',
    label: 'Obesidade grau II',
    rangeLabel: '35 – 39,9',
    color: '#b91c1c',
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(220, 38, 38, 0.4)',
    gradient: ['#fef2f2', '#fca5a5', '#f87171'],
  },
  {
    id: 'obesity-3',
    label: 'Obesidade grau III',
    rangeLabel: '≥ 40',
    color: '#991b1b',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(220, 38, 38, 0.45)',
    gradient: ['#fee2e2', '#f87171', '#ef4444'],
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
