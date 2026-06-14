const SENSITIVE_KEY_PATTERN =
  /(password|senha|pin|token|secret|authorization|cookie|refresh|hash|credencial|cvv|cartao)/i

const MAX_STRING_LENGTH = 500
const MAX_ARRAY_ITEMS = 20
const MAX_OBJECT_KEYS = 40
const MAX_PAYLOAD_BYTES = 8_192

export function sanitizeAuditoriaValue(value: unknown, depth = 0): unknown {
  if (value == null) return value
  if (depth > 4) return '[profundidade_maxima]'

  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LENGTH) {
      return `${value.slice(0, MAX_STRING_LENGTH)}…`
    }
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') return value

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeAuditoriaValue(item, depth + 1))
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {}
    const entries = Object.entries(value as Record<string, unknown>).slice(0, MAX_OBJECT_KEYS)
    for (const [key, nested] of entries) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = '[redacted]'
        continue
      }
      output[key] = sanitizeAuditoriaValue(nested, depth + 1)
    }
    return output
  }

  return String(value)
}

export function sanitizeAuditoriaPayload(value: unknown): Record<string, unknown> {
  const sanitized = sanitizeAuditoriaValue(value)
  if (sanitized == null || typeof sanitized !== 'object' || Array.isArray(sanitized)) {
    return {}
  }

  let payload = sanitized as Record<string, unknown>
  let serialized = JSON.stringify(payload)
  if (serialized.length <= MAX_PAYLOAD_BYTES) {
    return payload
  }

  payload = {
    ...payload,
    _truncated: true,
    _originalBytes: serialized.length,
  }
  serialized = JSON.stringify(payload)
  if (serialized.length <= MAX_PAYLOAD_BYTES) return payload

  return {
    _truncated: true,
    _originalBytes: serialized.length,
    summary: 'Payload reduzido por limite de auditoria.',
  }
}

export function normalizeClientIp(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null
  const value = raw.split(',')[0]?.trim()
  return value || null
}
