export type TriagemResumoSectionId =
  | 'queixa'
  | 'cronicas'
  | 'vitais'
  | 'medicamentos'
  | 'complementos'
  | 'outros'

export type TriagemResumoItem = {
  label: string
  value: string
  multiline?: boolean
}

export type TriagemResumoSection = {
  id: TriagemResumoSectionId
  title: string
  items: TriagemResumoItem[]
}

const SECTION_BY_LABEL: Record<string, TriagemResumoSectionId> = {
  Motivo: 'queixa',
  Início: 'queixa',
  Intensidade: 'queixa',
  Sintomas: 'queixa',
  Detalhes: 'queixa',
  Crônicas: 'cronicas',
  'Outra condição': 'cronicas',
  'Usa insulina': 'cronicas',
  'Última glicemia conhecida': 'cronicas',
  'Medicação para pressão': 'cronicas',
  'Idoso — alertas': 'cronicas',
  'Pressão arterial': 'vitais',
  Glicemia: 'vitais',
  Temperatura: 'vitais',
  Peso: 'vitais',
  'Saturação O₂': 'vitais',
  'Medicamentos contínuos': 'medicamentos',
  Medicamentos: 'medicamentos',
  Alergias: 'medicamentos',
  'Gravidez/amamentação': 'complementos',
  'Acompanhante (menor)': 'complementos',
}

const SECTION_TITLES: Record<TriagemResumoSectionId, string> = {
  queixa: 'Queixa e sintomas',
  cronicas: 'Condições crônicas',
  vitais: 'Sinais vitais',
  medicamentos: 'Medicamentos e alergias',
  complementos: 'Informações complementares',
  outros: 'Outras informações',
}

const SECTION_ORDER: TriagemResumoSectionId[] = [
  'queixa',
  'cronicas',
  'vitais',
  'medicamentos',
  'complementos',
  'outros',
]

function parseTriagemEntries(text: string): TriagemResumoItem[] {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const items: TriagemResumoItem[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!

    if (line === 'Medicamentos:' || line.startsWith('Medicamentos:')) {
      const inline = line.slice('Medicamentos:'.length).trim()
      const valueLines = inline ? [inline] : []
      index += 1
      while (index < lines.length && /^\d+\.\s/.test(lines[index]!)) {
        valueLines.push(lines[index]!)
        index += 1
      }
      items.push({
        label: 'Medicamentos',
        value: valueLines.join('\n'),
        multiline: valueLines.length > 1,
      })
      continue
    }

    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const label = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim()
      items.push({
        label,
        value: value || '—',
      })
    } else {
      items.push({
        label: 'Informação',
        value: line,
      })
    }

    index += 1
  }

  return items
}

export function parseTriagemResumoToSections(summary: string): TriagemResumoSection[] {
  const trimmed = summary.trim()
  if (!trimmed) return []

  const entries = parseTriagemEntries(trimmed)
  const grouped = new Map<TriagemResumoSectionId, TriagemResumoItem[]>()

  for (const entry of entries) {
    const sectionId = SECTION_BY_LABEL[entry.label] ?? 'outros'
    const bucket = grouped.get(sectionId) ?? []
    bucket.push(entry)
    grouped.set(sectionId, bucket)
  }

  return SECTION_ORDER.filter((id) => grouped.has(id)).map((id) => ({
    id,
    title: SECTION_TITLES[id],
    items: grouped.get(id) ?? [],
  }))
}

export function extractTriagemChiefComplaint(summary: string): string | null {
  const trimmed = summary.trim()
  if (!trimmed) return null

  for (const line of trimmed.split('\n')) {
    if (line.startsWith('Motivo:')) {
      const value = line.slice('Motivo:'.length).trim()
      return value || null
    }
  }

  const firstLine = trimmed.split('\n').find((line) => line.trim())?.trim()
  return firstLine ?? null
}
