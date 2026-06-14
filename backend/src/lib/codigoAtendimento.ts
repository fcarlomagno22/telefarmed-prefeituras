import { randomBytes } from 'node:crypto'

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

/** Token alfanumérico para rota pública `/atendimento/:codigo` (16–64 chars). */
export function generateCodigoAtendimento(length = 24): string {
  const safeLength = Math.min(64, Math.max(16, length))
  const bytes = randomBytes(safeLength)
  return Array.from(bytes, (byte) => CHARSET[byte % CHARSET.length]).join('')
}
