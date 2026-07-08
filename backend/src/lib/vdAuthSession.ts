/** Cookie httpOnly de refresh do app cidadão (VD). */
export const VD_REFRESH_COOKIE = 'token_refresh_vd'
export const VD_REFRESH_COOKIE_PATH = '/api/v1/vd/auth'

export const VD_REFRESH_TTL_DAYS = 7

export function vdRefreshExpiresAt(): string {
  const date = new Date()
  date.setDate(date.getDate() + VD_REFRESH_TTL_DAYS)
  return date.toISOString()
}
