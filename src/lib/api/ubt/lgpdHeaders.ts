import { readActiveLgpdUnlockToken } from '../../../utils/lgpdSession'

export function ubtLgpdRequestHeaders(
  lgpdUnlockToken?: string | null,
): Record<string, string> | undefined {
  const token = lgpdUnlockToken ?? readActiveLgpdUnlockToken()
  if (!token) return undefined
  return { 'X-Ubt-Lgpd-Token': token }
}
