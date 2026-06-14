import { formatRelativeTimeAgo } from '../admin-clientes/formatters.js'
import type {
  AdminDashboardPackageUsageDto,
  AdminMunicipalityRowDto,
  AdminNocHistoryEntry,
  AdminNocIncidentDto,
} from './types.js'

type NocIncidentRow = {
  id: string
  titulo: string
  entidade_contratante_id: string | null
  municipio_nome: string
  categoria: AdminNocIncidentDto['category']
  prioridade: AdminNocIncidentDto['priority']
  status: AdminNocIncidentDto['status']
  responsavel: string | null
  time_nome: string
  sla_interno_horas: number
  sla_interno_estourado: boolean
  detectado_em: string
  descricao: string
  impacto: string
  acao_recomendada: string
  historico: unknown
}

export function stateKeyFromUf(uf: string): string {
  return uf.trim().toLowerCase().slice(0, 2) || 'sp'
}

export function formatAdminCurrencyCompact(value: number, withSymbol = false): string {
  const prefix = withSymbol ? 'R$ ' : ''

  if (Math.abs(value) >= 1_000_000) {
    const amount = value / 1_000_000
    const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace('.', ',')
    return `${prefix}${formatted}M`
  }

  if (Math.abs(value) >= 1_000) {
    const amount = value / 1_000
    const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace('.', ',')
    return `${prefix}${formatted}k`
  }

  return new Intl.NumberFormat('pt-BR', {
    style: withSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}

export function centavosToReais(centavos: number): number {
  return Math.round(centavos) / 100
}

export function resolvePackageUsageStatus(
  usagePercent: number,
): AdminDashboardPackageUsageDto['status'] {
  if (usagePercent > 95) return 'critico'
  if (usagePercent > 80) return 'atencao'
  return 'normal'
}

export function resolveMunicipalityHealth(
  packageUsagePercent: number,
  openNocCount: number,
): AdminMunicipalityRowDto['health'] {
  if (openNocCount > 0 && packageUsagePercent > 90) return 'red'
  if (packageUsagePercent > 95 || openNocCount >= 2) return 'red'
  if (packageUsagePercent > 80 || openNocCount > 0) return 'yellow'
  return 'green'
}

export function resolveMunicipalitySla(
  avgWaitMinutes: number,
  terminalsOnline: number,
): AdminMunicipalityRowDto['sla'] {
  if (terminalsOnline <= 0 || avgWaitMinutes >= 25) return 'critico'
  if (avgWaitMinutes >= 15) return 'atencao'
  return 'normal'
}

export function parseNocHistory(raw: unknown): AdminNocHistoryEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const item = entry as Record<string, unknown>
      return {
        at: typeof item.at === 'string' ? item.at : '—',
        actor: typeof item.actor === 'string' ? item.actor : 'Sistema',
        note: typeof item.note === 'string' ? item.note : '',
      }
    })
    .slice(0, 30)
}

export function mapNocIncidentRow(row: NocIncidentRow): AdminNocIncidentDto {
  return {
    id: row.id,
    title: row.titulo,
    municipality: row.municipio_nome,
    municipalityId: row.entidade_contratante_id ?? '',
    category: row.categoria,
    priority: row.prioridade,
    status: row.status,
    assignee: row.responsavel,
    team: row.time_nome,
    internalSlaHours: row.sla_interno_horas,
    internalSlaBreached: row.sla_interno_estourado,
    detectedAt: row.detectado_em,
    timeAgo: formatRelativeTimeAgo(row.detectado_em),
    description: row.descricao,
    impact: row.impacto,
    recommendedAction: row.acao_recomendada,
    history: parseNocHistory(row.historico),
  }
}

export const ADMIN_DASHBOARD_FILTER_OPTIONS = {
  period: [
    { value: 'hoje', label: 'Hoje' },
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
  ],
  contract: [
    { value: 'all', label: 'Todos os contratos' },
    { value: 'active', label: 'Ativos' },
    { value: 'expiring', label: 'Vencendo (90 dias)' },
    { value: 'suspended', label: 'Suspensos' },
  ],
  health: [
    { value: 'all', label: 'Todos os semáforos' },
    { value: 'green', label: 'Verde — operação normal' },
    { value: 'yellow', label: 'Amarelo — atenção' },
    { value: 'red', label: 'Vermelho — crítico' },
  ],
} as const

const STATE_LABELS: Record<string, string> = {
  df: 'Distrito Federal',
  go: 'Goiás',
  mg: 'Minas Gerais',
  sp: 'São Paulo',
  rj: 'Rio de Janeiro',
  pr: 'Paraná',
  rs: 'Rio Grande do Sul',
  ba: 'Bahia',
  sc: 'Santa Catarina',
}

export function buildStateFilterOptions(stateKeys: Set<string>) {
  const options = [{ value: 'all', label: 'Todos os estados' }]
  const sorted = [...stateKeys].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  for (const key of sorted) {
    options.push({
      value: key,
      label: STATE_LABELS[key] ?? key.toUpperCase(),
    })
  }

  return options
}

export function buildCityFilterOptions(
  rows: Array<{ id: string; name: string; stateKey: string }>,
  stateFilter: string,
) {
  const scoped =
    stateFilter !== 'all' ? rows.filter((row) => row.stateKey === stateFilter) : rows

  return [
    { value: 'all', label: 'Todas as cidades' },
    ...scoped
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((row) => ({ value: row.id, label: row.name })),
  ]
}

export function daysUntilDate(isoDate: string | null | undefined, now = new Date()): number | null {
  if (!isoDate) return null
  const end = new Date(`${isoDate}T23:59:59${'-03:00'}`)
  if (Number.isNaN(end.getTime())) return null
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
}
