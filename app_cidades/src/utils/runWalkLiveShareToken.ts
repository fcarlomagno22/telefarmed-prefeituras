const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateLiveShareToken(length = 8): string {
  let token = ''
  for (let index = 0; index < length; index += 1) {
    token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
  }
  return token
}

export function normalizeLiveShareToken(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidLiveShareToken(value: string): boolean {
  const normalized = normalizeLiveShareToken(value)
  return normalized.length >= 6 && normalized.length <= 12
}
