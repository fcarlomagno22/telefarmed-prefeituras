import type { AuditLogsFilterOptions } from './getAuditLogsDataset'

export type AuditFilterOption = { value: string; label: string }

export const auditLogAllUbtsOption: AuditFilterOption = {
  value: '',
  label: 'Todas as UBTs',
}

export const auditLogSelectPrefeituraUbtOption: AuditFilterOption = {
  value: '',
  label: 'Todas as UBTs da prefeitura',
}

export function labelForAuditFilterKey(
  options: readonly AuditFilterOption[] | undefined,
  key: string,
) {
  if (!key || !options) return null
  return options.find((item) => item.value === key)?.label ?? null
}

export function getAuditUbtFilterOptions(
  prefeituraKey: string,
  filterOptions: Pick<AuditLogsFilterOptions, 'ubts' | 'ubtsByPrefeitura'>,
): AuditFilterOption[] {
  if (!prefeituraKey) {
    const all = filterOptions.ubts?.filter((item) => item.value !== '') ?? []
    return [auditLogAllUbtsOption, ...all]
  }

  const scoped = filterOptions.ubtsByPrefeitura?.[prefeituraKey] ?? []
  return [auditLogSelectPrefeituraUbtOption, ...scoped]
}

export function isAuditUbtAllowedForPrefeitura(
  prefeituraKey: string,
  ubtKey: string,
  filterOptions: Pick<AuditLogsFilterOptions, 'ubts' | 'ubtsByPrefeitura'>,
) {
  if (!ubtKey) return true
  if (!prefeituraKey) {
    return filterOptions.ubts?.some((item) => item.value === ubtKey) ?? false
  }
  return (filterOptions.ubtsByPrefeitura?.[prefeituraKey] ?? []).some(
    (item) => item.value === ubtKey,
  )
}

export function resolveAuditPrefeituraFilter(
  prefeituraKey: string,
  prefeituras?: readonly AuditFilterOption[],
) {
  return labelForAuditFilterKey(prefeituras, prefeituraKey)
}

export function resolveAuditUbtFilter(ubtKey: string, ubts?: readonly AuditFilterOption[]) {
  return labelForAuditFilterKey(ubts, ubtKey)
}

export function patchAuditPrefeituraFilter(
  prefeituraKey: string,
  currentUbtKey: string,
  filterOptions: Pick<AuditLogsFilterOptions, 'ubts' | 'ubtsByPrefeitura'>,
): { prefeitura: string; ubt: string } {
  if (!prefeituraKey) {
    return { prefeitura: '', ubt: '' }
  }
  const ubt = isAuditUbtAllowedForPrefeitura(prefeituraKey, currentUbtKey, filterOptions)
    ? currentUbtKey
    : ''
  return { prefeitura: prefeituraKey, ubt }
}
