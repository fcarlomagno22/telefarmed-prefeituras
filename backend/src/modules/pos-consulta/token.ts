import { randomBytes } from 'node:crypto'

export function generatePosConsultaCheckinToken(): string {
  return randomBytes(24).toString('hex')
}
