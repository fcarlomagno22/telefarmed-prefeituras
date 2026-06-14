import type { AuditLogEntry } from '../../types/auditLogs'
import type { AuditLogScope } from '../../types/auditLogScope'
import { auditLogPlatformFilterOptions, resolveAuditLogPlatformLabel } from '../../components/auditoria/auditLogPlatformConfig'
import type { AuditLogsFilterOptions } from './getAuditLogsDataset'

type FilterOption = { value: string; label: string }

function slugifyFilterValue(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function withEmptyOption(empty: FilterOption, options: FilterOption[]): FilterOption[] {
  const rest = options
    .filter((option) => option.value !== '' && option.label.trim())
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
  return [empty, ...rest]
}

function uniqueOptionsFromEntries(
  entries: AuditLogEntry[],
  pickLabel: (entry: AuditLogEntry) => string | null | undefined,
): FilterOption[] {
  const seen = new Set<string>()
  const options: FilterOption[] = []

  for (const entry of entries) {
    const label = pickLabel(entry)?.trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    options.push({ value: slugifyFilterValue(label), label })
  }

  return options
}

function buildUbtsByPrefeitura(entries: AuditLogEntry[]): Record<string, FilterOption[]> {
  const map = new Map<string, Map<string, FilterOption>>()

  for (const entry of entries) {
    const prefeituraLabel = entry.prefeituraName?.trim()
    const ubtLabel = entry.ubtName?.trim()
    if (!prefeituraLabel || !ubtLabel || ubtLabel === 'Sem UBT') continue

    const prefeituraKey = slugifyFilterValue(prefeituraLabel)
    if (!map.has(prefeituraKey)) map.set(prefeituraKey, new Map())

    const scopedUbts = map.get(prefeituraKey)!
    const ubtKey = ubtLabel.toLowerCase()
    if (!scopedUbts.has(ubtKey)) {
      scopedUbts.set(ubtKey, { value: slugifyFilterValue(ubtLabel), label: ubtLabel })
    }
  }

  const result: Record<string, FilterOption[]> = {}
  for (const [prefeituraKey, ubtMap] of map) {
    result[prefeituraKey] = Array.from(ubtMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR'),
    )
  }
  return result
}

function uniquePlatformsFromEntries(entries: AuditLogEntry[]): FilterOption[] {
  const seen = new Set<string>()
  const options: FilterOption[] = []

  for (const entry of entries) {
    if (seen.has(entry.platform)) continue
    seen.add(entry.platform)
    options.push({
      value: entry.platform,
      label: resolveAuditLogPlatformLabel(entry.platform),
    })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

function allPlatformFilterOptions(): FilterOption[] {
  return auditLogPlatformFilterOptions.map((option) => ({ ...option }))
}

function uniqueOutcomesFromEntries(entries: AuditLogEntry[]): FilterOption[] {
  const seen = new Set<string>()
  const options: FilterOption[] = []
  const labels: Record<string, string> = {
    success: 'Sucesso',
    error: 'Falha',
  }

  for (const entry of entries) {
    const tone = entry.serverResponseTone
    if (seen.has(tone)) continue
    seen.add(tone)
    options.push({ value: tone, label: labels[tone] ?? tone })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
}

/** Opções dos filtros derivadas exclusivamente dos eventos retornados pela API. */
export function buildAuditLogsFilterOptions(
  scope: AuditLogScope,
  entries: AuditLogEntry[],
): AuditLogsFilterOptions {
  const ubtsByPrefeitura = buildUbtsByPrefeitura(entries)

  return {
    users: withEmptyOption(
      { value: '', label: 'Todos os usuários' },
      uniqueOptionsFromEntries(entries, (entry) => entry.userName),
    ),
    actions: withEmptyOption(
      { value: '', label: 'Todas as ações' },
      uniqueOptionsFromEntries(entries, (entry) => entry.actionLabel),
    ),
    modules: withEmptyOption(
      { value: '', label: 'Todos os módulos' },
      uniqueOptionsFromEntries(entries, (entry) => entry.moduleName),
    ),
    periods: [
      { value: '', label: 'Período' },
      { value: '24h', label: 'Últimas 24 horas' },
      { value: '7d', label: 'Últimos 7 dias' },
      { value: '30d', label: 'Últimos 30 dias' },
    ],
    prefeituras:
      scope === 'admin'
        ? withEmptyOption(
            { value: '', label: 'Todas as prefeituras' },
            uniqueOptionsFromEntries(entries, (entry) => entry.prefeituraName),
          )
        : undefined,
    ubts: withEmptyOption(
      {
        value: '',
        label: scope === 'prefeitura' ? 'Todas as UBTs da rede' : 'Todas as UBTs',
      },
      uniqueOptionsFromEntries(entries, (entry) =>
        entry.ubtName && entry.ubtName !== 'Sem UBT' ? entry.ubtName : null,
      ),
    ),
    ubtsByPrefeitura,
    platforms: withEmptyOption(
      { value: '', label: 'Todas as plataformas' },
      scope === 'admin'
        ? allPlatformFilterOptions()
        : uniquePlatformsFromEntries(entries),
    ),
    userTypes: withEmptyOption(
      { value: '', label: 'Todos os tipos' },
      uniqueOptionsFromEntries(entries, (entry) => entry.userRole),
    ),
    units: withEmptyOption(
      { value: '', label: 'Todas as unidades' },
      uniqueOptionsFromEntries(entries, (entry) =>
        entry.ubtName && entry.ubtName !== 'Sem UBT' ? entry.ubtName : entry.prefeituraName,
      ),
    ),
    serverResponses: withEmptyOption(
      { value: '', label: 'Todos os resultados' },
      uniqueOptionsFromEntries(entries, (entry) => entry.serverResponse),
    ),
    outcomes: withEmptyOption(
      { value: '', label: 'Todos' },
      uniqueOutcomesFromEntries(entries),
    ),
  }
}
