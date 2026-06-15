export function isProfissionalPlantaoEncerrado(input: {
  plantaoStatus?: string | null
  endAt: string
  now?: Date
}): boolean {
  if (input.plantaoStatus === 'realizado') return true
  const endMs = new Date(input.endAt).getTime()
  const nowMs = (input.now ?? new Date()).getTime()
  return Number.isFinite(endMs) && nowMs >= endMs
}

export function filterPlantoesAtivosParaProfissional<
  T extends { plantaoStatus?: string | null; endAt: string },
>(items: T[], now?: Date): T[] {
  return items.filter((item) => !isProfissionalPlantaoEncerrado({ ...item, now }))
}
