import type {
  RedeConfigRede,
  RedeDonutSlice,
  RedeOperatorApi,
  RedeUnitApi,
  RedeUnitStatus,
  UnidadeUbtRow,
} from './types.js'

const REGION_SLICE_COLORS = [
  '#0ea5e9',
  '#8b5cf6',
  '#f97316',
  '#10b981',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#eab308',
]

function readAddressField(endereco: Record<string, unknown>, key: string): string {
  const value = endereco[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function formatUnitAddress(endereco: Record<string, unknown>): {
  formatted: string
  parts: {
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
  }
} {
  const parts = {
    cep: readAddressField(endereco, 'cep'),
    street: readAddressField(endereco, 'street'),
    number: readAddressField(endereco, 'number'),
    complement: readAddressField(endereco, 'complement'),
    neighborhood: readAddressField(endereco, 'neighborhood'),
    city: readAddressField(endereco, 'city'),
    state: readAddressField(endereco, 'state'),
  }

  const line1 = [parts.street, parts.number, parts.complement].filter(Boolean).join(', ')
  const line2 = [parts.neighborhood, parts.city && parts.state ? `${parts.city} - ${parts.state}` : parts.city]
    .filter(Boolean)
    .join(' · ')

  const formatted = [line1, line2].filter(Boolean).join(' · ') || 'Endereço não informado'

  return { formatted, parts }
}

export function normalizeMaintenanceIndexes(
  indexes: number[] | null | undefined,
  stationsTotal: number,
): number[] {
  if (!indexes?.length) return []
  const max = Math.max(0, stationsTotal)
  return [...new Set(indexes.filter((index) => Number.isInteger(index) && index >= 0 && index < max))].sort(
    (a, b) => a - b,
  )
}

export function computeStationsOnline(
  stationsTotal: number,
  maintenanceIndexes: number[],
  status: RedeUnitStatus,
): number {
  if (status === 'inativa') return 0
  const normalized = normalizeMaintenanceIndexes(maintenanceIndexes, stationsTotal)
  return Math.max(0, stationsTotal - normalized.length)
}

export function resolveOperationalStatus(
  currentStatus: RedeUnitStatus,
  stationsTotal: number,
  maintenanceIndexes: number[],
): RedeUnitStatus {
  if (currentStatus === 'inativa') return 'inativa'
  const normalized = normalizeMaintenanceIndexes(maintenanceIndexes, stationsTotal)
  if (stationsTotal > 0 && normalized.length >= stationsTotal) return 'manutencao'
  return 'ativa'
}

export function mapUnitRowToApi(
  row: UnidadeUbtRow,
  responsible?: { name: string; phone: string },
): RedeUnitApi {
  const maintenanceTerminalIndexes = normalizeMaintenanceIndexes(
    row.terminais_manutencao,
    row.terminais_total,
  )
  const { formatted } = formatUnitAddress(row.endereco)

  return {
    id: row.id,
    name: row.nome,
    address: formatted,
    cnes: row.cnes || '—',
    region: row.ra_rotulo,
    regionKey: row.ra_chave,
    responsibleName: responsible?.name ?? 'Responsável pendente',
    responsiblePhone: responsible?.phone ?? row.telefone ?? '',
    stationsTotal: row.terminais_total,
    stationsOnline: computeStationsOnline(
      row.terminais_total,
      maintenanceTerminalIndexes,
      row.estado_operacional,
    ),
    status: row.estado_operacional,
    maintenanceTerminalIndexes,
  }
}

export function mapOperatorRow(row: { id: string; unidade_ubt_id: string; nome: string; funcao: string }): RedeOperatorApi {
  return {
    id: row.id,
    unitId: row.unidade_ubt_id,
    name: row.nome,
    role: row.funcao || 'Operador',
  }
}

export function buildRegionSlices(units: RedeUnitApi[]): RedeDonutSlice[] {
  const counts = new Map<string, { label: string; value: number }>()
  for (const unit of units) {
    const key = unit.regionKey || 'outros'
    const current = counts.get(key)
    if (current) {
      current.value += 1
    } else {
      counts.set(key, { label: unit.region || key, value: 1 })
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .map(([regionKey, item], index) => ({
      key: regionKey,
      label: item.label,
      value: item.value,
      color: REGION_SLICE_COLORS[index % REGION_SLICE_COLORS.length]!,
    }))
}

export function buildTerminalStatusSlices(units: RedeUnitApi[]): RedeDonutSlice[] {
  let online = 0
  let maintenance = 0
  let offline = 0

  for (const unit of units) {
    const maintenanceCount = unit.maintenanceTerminalIndexes.length

    if (unit.status === 'inativa') {
      offline += unit.stationsTotal
      continue
    }

    online += unit.stationsOnline
    maintenance += maintenanceCount

    const unaccounted = unit.stationsTotal - unit.stationsOnline - maintenanceCount
    if (unaccounted > 0) {
      offline += unaccounted
    }
  }

  const entries: Array<{ key: string; label: string; value: number; color: string }> = [
    { key: 'online', label: 'Online', value: online, color: '#10b981' },
    { key: 'offline', label: 'Offline', value: offline, color: '#ef4444' },
    { key: 'manutencao', label: 'Manutenção', value: maintenance, color: '#f97316' },
  ]

  return entries.filter((entry) => entry.value > 0)
}

export function buildFilterOptions(units: RedeUnitApi[]) {
  const regions = new Map<string, string>()
  for (const unit of units) {
    if (!unit.regionKey) continue
    regions.set(unit.regionKey, unit.region)
  }

  return {
    regions: [
      { value: 'todas', label: 'Todas as regiões' },
      ...[...regions.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
        .map(([value, label]) => ({ value, label })),
    ],
    statuses: [
      { value: 'todas', label: 'Todos os status' },
      { value: 'ativa', label: 'Ativa' },
      { value: 'manutencao', label: 'Manutenção' },
      { value: 'inativa', label: 'Inativa' },
    ],
  }
}

export function parseConfigRede(raw: unknown): RedeConfigRede {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  return raw as RedeConfigRede
}

export function formatDailyCapacityLabel(capacity: number): string {
  if (capacity <= 0) return 'Sem limite por unidade'
  return `${capacity} consultas/dia`
}

export function formatUnitTypeLabel(tipo: 'fixa' | 'movel'): 'Fixa' | 'Móvel' {
  return tipo === 'movel' ? 'Móvel' : 'Fixa'
}

export function buildAddressPayload(input?: {
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}): Record<string, string> {
  if (!input) return {}
  const payload: Record<string, string> = {}
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' && value.trim()) {
      payload[key] = value.trim()
    }
  }
  return payload
}

export function maintenanceIndexesForStatus(
  status: RedeUnitStatus,
  stationsTotal: number,
  explicit?: number[],
): number[] {
  if (explicit) return normalizeMaintenanceIndexes(explicit, stationsTotal)
  if (status === 'manutencao' && stationsTotal > 0) {
    return Array.from({ length: stationsTotal }, (_, index) => index)
  }
  return []
}
