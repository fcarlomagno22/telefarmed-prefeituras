const MONTH_ABBR: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
}

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/** Converte chave ISO (2026-05), numérica (05/2026) ou abreviada (Mai/2026) em mês/ano. */
export function parseCompetenciaToMonthYear(
  competencia: string,
): { month: number; year: number } | null {
  const trimmed = competencia.trim()

  const iso = /^(\d{4})-(\d{2})$/.exec(trimmed)
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]) }

  const numeric = /^(\d{2})\/(\d{4})$/.exec(trimmed)
  if (numeric) return { year: Number(numeric[2]), month: Number(numeric[1]) }

  const abbr = /^([A-Za-z]{3})\/(\d{4})$/.exec(trimmed)
  if (abbr) {
    const month = MONTH_ABBR[abbr[1]!.toLowerCase()]
    if (month) return { year: Number(abbr[2]), month }
  }

  return null
}

export function formatCompetenciaLabel(competencia: string): string {
  const parsed = parseCompetenciaToMonthYear(competencia)
  if (!parsed) return competencia
  return `${MONTH_LABELS[parsed.month - 1] ?? String(parsed.month).padStart(2, '0')}/${parsed.year}`
}

export function compareCompetenciaLabels(a: string, b: string): number {
  const pa = parseCompetenciaToMonthYear(a)
  const pb = parseCompetenciaToMonthYear(b)
  if (!pa || !pb) return a.localeCompare(b, 'pt-BR')
  if (pa.year !== pb.year) return pa.year - pb.year
  return pa.month - pb.month
}
