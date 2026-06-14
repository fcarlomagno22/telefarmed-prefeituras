import { env, isProduction } from '../config/env.js'

/** Cookie httpOnly de refresh limitado à sessão do navegador (sem maxAge persistente). */
export function authRefreshCookieOptions(path: string) {
  return {
    httpOnly: true,
    secure: isProduction || env.COOKIE_SECURE === true,
    sameSite: 'lax' as const,
    path,
  }
}
