const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function sanitizeSleepLogNotes(value: string | undefined | null): string | null {
  if (value == null) return null

  const sanitized = value.replace(CONTROL_CHAR_PATTERN, '').trim()
  if (!sanitized) return null

  return sanitized.slice(0, 500)
}
