export function formatHeightMeters(value: number | null | undefined): string | null {
  if (value == null) return null
  return `${value.toFixed(2).replace('.', ',')} m`
}

export function formatWeightKg(value: number | null | undefined): string | null {
  if (value == null) return null
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',')
  return `${formatted} kg`
}

export function formatAgeLabel(ageYears: number): string {
  return ageYears === 1 ? '1 ano' : `${ageYears} anos`
}

export function calculateImcFromValues(heightMeters: number, weightKg: number): number {
  const imc = weightKg / (heightMeters * heightMeters)
  return Number(imc.toFixed(1))
}

export function getImcZoneLabel(imc: number): string {
  if (imc < 18.5) return 'Baixo peso'
  if (imc < 25) return 'Peso normal'
  if (imc < 30) return 'Sobrepeso'
  if (imc < 35) return 'Obesidade grau I'
  if (imc < 40) return 'Obesidade grau II'
  return 'Obesidade grau III'
}
