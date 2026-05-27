const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** ID alfanumérico para rota `/atendimento/:id` (substituível pelo back-end). */
export function generateAttendanceId(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join('')
}

export function isValidAttendanceId(value: string | undefined): value is string {
  if (!value || value.length < 8 || value.length > 64) return false
  return /^[a-zA-Z0-9]+$/.test(value)
}
