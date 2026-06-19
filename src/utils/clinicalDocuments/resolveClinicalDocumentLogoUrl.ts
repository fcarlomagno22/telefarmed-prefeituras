/** Garante URL absoluta para o backend conseguir baixar a logo no PDF. */
export function resolveClinicalDocumentLogoUrl(url?: string | null): string | undefined {
  const trimmed = url?.trim()
  if (!trimmed) return undefined

  if (/^https?:\/\//i.test(trimmed)) return trimmed

  if (typeof window !== 'undefined') {
    try {
      return new URL(trimmed, window.location.origin).href
    } catch {
      return undefined
    }
  }

  return trimmed
}
