import {
  auditLogPrefeituraFilterOptions,
  auditLogUbtFilterOptions,
} from '../../data/auditLogsMock'

export type AuditFilterOption = { value: string; label: string }

export const auditLogAllUbtsOption: AuditFilterOption = {
  value: '',
  label: 'Todas as UBTs',
}

export const auditLogSelectPrefeituraUbtOption: AuditFilterOption = {
  value: '',
  label: 'Todas as UBTs da prefeitura',
}

/** UBTs vinculadas a cada prefeitura (mock alinhado aos clientes do admin). */
export const auditLogUbtsByPrefeitura: Record<string, readonly AuditFilterOption[]> = {
  brasilia: [
    { value: 'ubt-centro-historico', label: 'UBT Centro Histórico' },
    { value: 'ubt-norte-i', label: 'UBT Norte I' },
    { value: 'ubt-taguatinga', label: 'UBT Taguatinga' },
  ],
  campinas: [{ value: 'ubt-sul', label: 'UBT Sul' }],
  sorocaba: [],
}

/** Prefeitura do portal municipal em uso (mock). */
export const auditLogPrefeituraPortalKey = 'brasilia'

export function labelForAuditFilterKey(
  options: readonly AuditFilterOption[],
  key: string,
) {
  if (!key) return null
  return options.find((item) => item.value === key)?.label ?? null
}

export function getAuditUbtFilterOptions(prefeituraKey: string): AuditFilterOption[] {
  if (!prefeituraKey) {
    return [auditLogAllUbtsOption, ...auditLogUbtFilterOptions.filter((item) => item.value !== '')]
  }

  const scoped = auditLogUbtsByPrefeitura[prefeituraKey] ?? []
  return [auditLogSelectPrefeituraUbtOption, ...scoped]
}

export function isAuditUbtAllowedForPrefeitura(prefeituraKey: string, ubtKey: string) {
  if (!ubtKey) return true
  if (!prefeituraKey) {
    return auditLogUbtFilterOptions.some((item) => item.value === ubtKey)
  }
  return (auditLogUbtsByPrefeitura[prefeituraKey] ?? []).some((item) => item.value === ubtKey)
}

export function resolveAuditPrefeituraFilter(prefeituraKey: string) {
  return labelForAuditFilterKey(
    auditLogPrefeituraFilterOptions.filter((item) => item.value !== ''),
    prefeituraKey,
  )
}

export function resolveAuditUbtFilter(ubtKey: string) {
  return labelForAuditFilterKey(
    auditLogUbtFilterOptions.filter((item) => item.value !== ''),
    ubtKey,
  )
}

/** Ao trocar a prefeitura, limpa UBT se não pertencer ao novo município. Sem prefeitura, UBT fica vazio. */
export function patchAuditPrefeituraFilter(
  prefeituraKey: string,
  currentUbtKey: string,
): { prefeitura: string; ubt: string } {
  if (!prefeituraKey) {
    return { prefeitura: '', ubt: '' }
  }
  const ubt = isAuditUbtAllowedForPrefeitura(prefeituraKey, currentUbtKey) ? currentUbtKey : ''
  return { prefeitura: prefeituraKey, ubt }
}
