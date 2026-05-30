const ESCALA_ID_ALPHABET = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** ID público da escala — 13 caracteres alfanuméricos, estável por plantão. */
export function formatProfissionalEscalaShiftId(sourceId: string): string {
  let hash = 2166136261
  for (let i = 0; i < sourceId.length; i++) {
    hash ^= sourceId.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  let result = ''
  let state = hash >>> 0
  for (let i = 0; i < 13; i++) {
    state = (Math.imul(state, 1103515245) + 12345 + i) >>> 0
    result += ESCALA_ID_ALPHABET[state % ESCALA_ID_ALPHABET.length]
  }
  return result
}
