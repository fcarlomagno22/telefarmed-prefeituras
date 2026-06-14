export function getSupabaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') return message
  }
  if (error instanceof Error) return error.message
  return String(error)
}

export function getSupabaseErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code
    return typeof code === 'string' ? code : null
  }
  return null
}

/** PostgREST: tabela/view ausente no schema cache (migration pendente). */
export function isMissingSupabaseResource(error: unknown, resourceName?: string): boolean {
  const code = getSupabaseErrorCode(error)
  const message = getSupabaseErrorMessage(error)

  if (code === 'PGRST205') {
    if (!resourceName) return true
    return message.includes(resourceName)
  }

  if (resourceName && message.includes(resourceName)) {
    return message.includes('schema cache') || message.includes('Could not find')
  }

  return false
}
