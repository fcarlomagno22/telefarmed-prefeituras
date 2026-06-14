import type { AuthPortalScope } from './sessionRevocation'
import { clearAuthSessionRevoked, isAuthSessionRevoked } from './sessionRevocation'
import { isTransientPortalNetworkError } from './portalAuthErrors'

const BOOTSTRAP_RETRY_DELAYS_MS = [0, 400, 900, 1800] as const

const bootstrapInFlight = new Map<
  AuthPortalScope,
  Promise<{ accessToken: string; user: unknown }>
>()
const bootstrapActive = new Set<AuthPortalScope>()

export function isPortalAuthBootstrap(scope: AuthPortalScope): boolean {
  return bootstrapActive.has(scope)
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export async function runPortalAuthBootstrap<TUser>(options: {
  scope: AuthPortalScope
  accessToken: string | null
  fetchMe: (token: string) => Promise<{ user: TUser }>
  refresh: () => Promise<{ accessToken: string; user: TUser }>
  isTransientError: (error: unknown) => boolean
  createError: (message: string, status: number) => Error
}): Promise<{ accessToken: string; user: TUser }> {
  const existing = bootstrapInFlight.get(options.scope)
  if (existing) {
    return existing as Promise<{ accessToken: string; user: TUser }>
  }

  const promise = executeBootstrap(options)
  bootstrapInFlight.set(options.scope, promise)
  bootstrapActive.add(options.scope)

  try {
    return await promise
  } finally {
    bootstrapInFlight.delete(options.scope)
    bootstrapActive.delete(options.scope)
  }
}

async function executeBootstrap<TUser>(options: {
  scope: AuthPortalScope
  accessToken: string | null
  fetchMe: (token: string) => Promise<{ user: TUser }>
  refresh: () => Promise<{ accessToken: string; user: TUser }>
  isTransientError: (error: unknown) => boolean
  createError: (message: string, status: number) => Error
}): Promise<{ accessToken: string; user: TUser }> {
  let lastError: unknown

  for (const delayMs of BOOTSTRAP_RETRY_DELAYS_MS) {
    if (delayMs > 0) {
      await sleep(delayMs)
    }

    try {
      if (options.accessToken) {
        try {
          const me = await options.fetchMe(options.accessToken)
          clearAuthSessionRevoked(options.scope)
          return { accessToken: options.accessToken, user: me.user }
        } catch (error) {
          if (options.isTransientError(error)) {
            lastError = error
            continue
          }
          // Token expirado ou inválido — tenta refresh abaixo.
        }
      }

      if (!options.accessToken && isAuthSessionRevoked(options.scope)) {
        throw options.createError('Sessão encerrada. Faça login novamente.', 401)
      }

      const refreshed = await options.refresh()
      clearAuthSessionRevoked(options.scope)
      return { accessToken: refreshed.accessToken, user: refreshed.user }
    } catch (error) {
      lastError = error
      if (!options.isTransientError(error)) {
        throw error
      }
    }
  }

  throw lastError ?? options.createError('Falha de conexão com o servidor.', 0)
}

export async function revalidatePortalSession<TUser>(options: {
  accessToken: string | null
  fetchMe: (token: string) => Promise<{ user: TUser }>
  refresh: () => Promise<{ accessToken: string; user: TUser }>
}): Promise<{ accessToken: string; user: TUser }> {
  if (options.accessToken) {
    try {
      const me = await options.fetchMe(options.accessToken)
      return { accessToken: options.accessToken, user: me.user }
    } catch (error) {
      if (isTransientPortalNetworkError(error)) {
        throw error
      }
    }
  }

  return options.refresh()
}
