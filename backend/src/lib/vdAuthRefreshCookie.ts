import { env, isProduction } from '../config/env.js'
import {
  VD_REFRESH_COOKIE_PATH,
  VD_REFRESH_TTL_DAYS,
} from './vdAuthSession.js'

/** Cookie httpOnly de refresh do app cidadão (VD). */
export function vdAuthRefreshCookieOptions() {
  const sameSite = resolveVdRefreshCookieSameSite()

  return {
    httpOnly: true,
    secure: resolveVdRefreshCookieSecure(sameSite),
    sameSite,
    path: VD_REFRESH_COOKIE_PATH,
    maxAge: VD_REFRESH_TTL_DAYS * 24 * 60 * 60,
    // Sem `domain`: cookie fica restrito ao host da API (vd-{slug} em prod same-origin).
  } as const
}

export function vdAuthRefreshClearCookieOptions() {
  return { path: VD_REFRESH_COOKIE_PATH } as const
}

function resolveVdRefreshCookieSameSite(): 'lax' | 'none' {
  if (isProduction) return 'lax'

  // Dev cross-origin: app em vd-*.localhost:8081, API em localhost:3001.
  return 'none'
}

function resolveVdRefreshCookieSecure(sameSite: 'lax' | 'none'): boolean {
  // SameSite=None exige Secure; localhost aceita Secure mesmo em HTTP.
  if (sameSite === 'none') return true
  return isProduction || env.COOKIE_SECURE === true
}
