import { shouldRefreshAccessToken } from './jwtExpiry'

/**
 * Restaura sessão apenas a partir do armazenamento da aba (sessionStorage).
 * Nunca tenta refresh silencioso via cookie sem sessão ativa na aba —
 * ao fechar a aba ou o navegador, o usuário precisa fazer login novamente.
 */
export async function bootstrapTabBoundAuthSession<TUser>(options: {
  readSession: () => { accessToken: string | null; user: TUser | null }
  fetchMe: (accessToken: string) => Promise<TUser>
  refresh: () => Promise<{ accessToken: string; user: TUser }>
  onRestore: (accessToken: string, user: TUser) => void
  onClear: () => void
}): Promise<void> {
  const session = options.readSession()
  if (!session.accessToken || !session.user) {
    options.onClear()
    return
  }

  const { accessToken } = session

  if (!shouldRefreshAccessToken(accessToken)) {
    options.onRestore(accessToken, session.user)
    return
  }

  try {
    const user = await options.fetchMe(accessToken)
    options.onRestore(accessToken, user)
    return
  } catch {
    // Access token expirado ou inválido — tenta refresh só nesta aba ativa.
  }

  try {
    const refreshed = await options.refresh()
    options.onRestore(refreshed.accessToken, refreshed.user)
  } catch {
    options.onClear()
  }
}
