type TriageBarItem = {
  key: string
  label: string
  count: number
  percent: number
}

export type AdminDashboardTriageChartsDto = {
  totalTriages: number
  chronicShare: {
    withChronicCount: number
    withoutChronicCount: number
    withChronicPercent: number
  }
  chronicConditions: TriageBarItem[]
  comorbidities: TriageBarItem[]
  chiefComplaints: TriageBarItem[]
  associatedSymptoms: TriageBarItem[]
}

const CHRONIC_LABELS: Array<{ key: string; label: string; aliases: string[] }> = [
  { key: 'hypertension', label: 'Hipertensão', aliases: ['hipertensão', 'hipertensao'] },
  { key: 'diabetes_type_1', label: 'Diabetes tipo 1', aliases: ['diabetes tipo 1'] },
  { key: 'diabetes_type_2', label: 'Diabetes tipo 2', aliases: ['diabetes tipo 2'] },
  { key: 'asthma_copd', label: 'Asma / DPOC', aliases: ['asma / dpoc', 'asma', 'dpoc'] },
  { key: 'heart_disease', label: 'Doença cardíaca', aliases: ['doença cardíaca', 'doenca cardiaca'] },
  { key: 'renal_failure', label: 'Insuficiência renal', aliases: ['insuficiência renal', 'insuficiencia renal'] },
  { key: 'epilepsy', label: 'Epilepsia', aliases: ['epilepsia'] },
  { key: 'depression_anxiety', label: 'Depressão / ansiedade', aliases: ['depressão / ansiedade', 'depressao / ansiedade'] },
  { key: 'obesity', label: 'Obesidade', aliases: ['obesidade'] },
  { key: 'hypothyroidism', label: 'Hipotiroidismo', aliases: ['hipotiroidismo'] },
  { key: 'cancer_treatment', label: 'Câncer em tratamento', aliases: ['câncer em tratamento', 'cancer em tratamento'] },
  { key: 'other', label: 'Outra', aliases: ['outra'] },
]

const SYMPTOM_LABELS: Array<{ key: string; label: string; aliases: string[] }> = [
  { key: 'fever', label: 'Febre', aliases: ['febre'] },
  { key: 'headache', label: 'Dor de cabeça', aliases: ['dor de cabeça', 'dor de cabeca'] },
  { key: 'cough', label: 'Tosse', aliases: ['tosse'] },
  { key: 'shortness_of_breath', label: 'Falta de ar', aliases: ['falta de ar'] },
  { key: 'nausea', label: 'Náusea', aliases: ['náusea', 'nausea'] },
  { key: 'dizziness', label: 'Tontura', aliases: ['tontura'] },
  { key: 'chest_pain', label: 'Dor no peito', aliases: ['dor no peito'] },
  { key: 'abdominal_pain', label: 'Dor abdominal', aliases: ['dor abdominal'] },
  { key: 'body_ache', label: 'Dor no corpo', aliases: ['dor no corpo'] },
  { key: 'sore_throat', label: 'Dor de garganta', aliases: ['dor de garganta'] },
  { key: 'diarrhea', label: 'Diarreia', aliases: ['diarreia'] },
  { key: 'fatigue', label: 'Cansaço', aliases: ['cansaço', 'cansaco'] },
]

const COMORBIDITY_BUCKETS = [
  { key: '0', label: 'Nenhuma crônica' },
  { key: '1', label: '1 condição' },
  { key: '2', label: '2 condições' },
  { key: '3plus', label: '3 ou mais' },
] as const

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim()
    .toLowerCase()
}

function parseTriagemFields(summary: string): Map<string, string> {
  const fields = new Map<string, string>()
  for (const rawLine of summary.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const colonIndex = line.indexOf(':')
    if (colonIndex <= 0) continue
    fields.set(line.slice(0, colonIndex).trim(), line.slice(colonIndex + 1).trim())
  }
  return fields
}

function matchCatalogLabel(
  token: string,
  catalog: Array<{ key: string; label: string; aliases: string[] }>,
): { key: string; label: string } | null {
  const normalized = normalizeText(token)
  if (!normalized) return null
  for (const item of catalog) {
    if (normalizeText(item.label) === normalized) return item
    if (item.aliases.some((alias) => normalizeText(alias) === normalized)) return item
  }
  return null
}

function extractChronicTokens(summary: string, fields: Map<string, string>): string[] {
  const cronicas = fields.get('Crônicas')
  if (cronicas) {
    if (normalizeText(cronicas).includes('nenhuma informada')) return []
    return cronicas
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (normalizeText(summary).includes('sem doencas cronicas conhecidas')) return []
  return []
}

function extractSymptomTokens(fields: Map<string, string>): string[] {
  const sintomas = fields.get('Sintomas')
  if (!sintomas) return []
  return sintomas
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function extractChiefComplaint(fields: Map<string, string>): string | null {
  const motivo = fields.get('Motivo')?.trim()
  return motivo || null
}

function toBarItems(
  counts: Map<string, { label: string; count: number }>,
  total: number,
  limit = 10,
): TriageBarItem[] {
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      percent: total > 0 ? Math.round((value.count / total) * 100) : 0,
    }))
}

export function aggregateTriageCharts(summaries: string[]): AdminDashboardTriageChartsDto {
  const chronicCounts = new Map<string, { label: string; count: number }>()
  const comorbidityCounts = new Map<string, { label: string; count: number }>(
    COMORBIDITY_BUCKETS.map((bucket) => [bucket.key, { label: bucket.label, count: 0 }]),
  )
  const complaintCounts = new Map<string, { label: string; count: number }>()
  const symptomCounts = new Map<string, { label: string; count: number }>()

  let withChronicCount = 0
  let withoutChronicCount = 0

  for (const summary of summaries) {
    const trimmed = summary.trim()
    if (!trimmed) continue

    const fields = parseTriagemFields(trimmed)
    const chronicTokens = extractChronicTokens(trimmed, fields)
    const matchedChronics = new Set<string>()

    for (const token of chronicTokens) {
      const matched = matchCatalogLabel(token, CHRONIC_LABELS)
      if (!matched || matched.key === 'other') continue
      matchedChronics.add(matched.key)
      const current = chronicCounts.get(matched.key) ?? { label: matched.label, count: 0 }
      current.count += 1
      chronicCounts.set(matched.key, current)
    }

    if (matchedChronics.size > 0) {
      withChronicCount += 1
    } else if (
      fields.has('Crônicas') ||
      normalizeText(trimmed).includes('sem doencas cronicas conhecidas')
    ) {
      withoutChronicCount += 1
    }

    const comorbidityKey =
      matchedChronics.size >= 3
        ? '3plus'
        : matchedChronics.size === 2
          ? '2'
          : matchedChronics.size === 1
            ? '1'
            : '0'
    const comorbidity = comorbidityCounts.get(comorbidityKey)
    if (comorbidity) comorbidity.count += 1

    const complaint = extractChiefComplaint(fields)
    if (complaint) {
      const key = normalizeText(complaint)
      const current = complaintCounts.get(key) ?? { label: complaint, count: 0 }
      current.count += 1
      complaintCounts.set(key, current)
    }

    for (const token of extractSymptomTokens(fields)) {
      const matched = matchCatalogLabel(token, SYMPTOM_LABELS)
      if (!matched) continue
      const current = symptomCounts.get(matched.key) ?? { label: matched.label, count: 0 }
      current.count += 1
      symptomCounts.set(matched.key, current)
    }
  }

  const totalTriages = summaries.filter((item) => item.trim()).length
  const chronicShareDenominator = withChronicCount + withoutChronicCount

  const chronicConditions = toBarItems(chronicCounts, totalTriages, 12)
  const comorbidities = COMORBIDITY_BUCKETS.map((bucket) => {
    const item = comorbidityCounts.get(bucket.key)!
    return {
      key: bucket.key,
      label: bucket.label,
      count: item.count,
      percent: totalTriages > 0 ? Math.round((item.count / totalTriages) * 100) : 0,
    }
  })
  const chiefComplaints = toBarItems(complaintCounts, totalTriages, 10)
  const associatedSymptoms = toBarItems(symptomCounts, totalTriages, 10)

  return {
    totalTriages,
    chronicShare: {
      withChronicCount,
      withoutChronicCount,
      withChronicPercent:
        chronicShareDenominator > 0
          ? Math.round((withChronicCount / chronicShareDenominator) * 100)
          : 0,
    },
    chronicConditions,
    comorbidities,
    chiefComplaints,
    associatedSymptoms,
  }
}
