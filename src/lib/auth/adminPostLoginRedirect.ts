const POST_LOGIN_REDIRECT_KEY = 'telefarmed.admin.postLoginRedirect'

export function setAdminPostLoginRedirect(path: string): void {
  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, path)
  } catch {
    // sessionStorage indisponível
  }
}

export function consumeAdminPostLoginRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    return path
  } catch {
    return null
  }
}
