export function competenceKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function parseCompetenceKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number)
  return { year, month }
}

export function formatCompetenceLabel(competenceKey: string): string {
  const { year, month } = parseCompetenceKey(competenceKey)
  const date = new Date(year, month - 1, 1)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function addCompetenceMonths(competenceKey: string, delta: number): string {
  const { year, month } = parseCompetenceKey(competenceKey)
  const date = new Date(year, month - 1 + delta, 1)
  return competenceKeyFromDate(date)
}

export function isCurrentCompetence(competenceKey: string, now = new Date()): boolean {
  return competenceKey === competenceKeyFromDate(now)
}

export function isFutureCompetence(competenceKey: string, now = new Date()): boolean {
  const { year, month } = parseCompetenceKey(competenceKey)
  const current = parseCompetenceKey(competenceKeyFromDate(now))
  if (year !== current.year) return year > current.year
  return month > current.month
}
