const BRAZILIAN_STATE_NAME_TO_UF: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
}

function normalizeStateLookupKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** Converte nome ou sigla de estado brasileiro para UF de 2 letras (SP, MG, PA…). */
export function normalizeBrazilianStateUf(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''

  const compact = trimmed.replace(/\s+/g, '')
  if (/^[A-Za-z]{2}$/.test(compact)) {
    return compact.toUpperCase()
  }

  const mapped = BRAZILIAN_STATE_NAME_TO_UF[normalizeStateLookupKey(trimmed)]
  if (mapped) return mapped

  return trimmed.slice(0, 2).toUpperCase()
}
