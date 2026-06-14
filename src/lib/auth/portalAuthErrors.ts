type AuthApiErrorLike = {
  status: number
}

export function isDefinitivePortalAuthError(error: unknown): error is AuthApiErrorLike {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return false
  }
  const status = Number((error as AuthApiErrorLike).status)
  return status === 401 || status === 403
}

export function isTransientPortalNetworkError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return false
  }
  const status = Number((error as AuthApiErrorLike).status)
  return status === 0 || status === 502 || status === 503 || status === 504
}
