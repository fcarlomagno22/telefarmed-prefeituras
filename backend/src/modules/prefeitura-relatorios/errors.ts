import { mapPrefeituraConsultasError } from '../prefeitura-consultas/errors.js'

export function mapPrefeituraRelatoriosError(error: unknown): {
  statusCode: number
  body: { error: string; code?: string }
} {
  return mapPrefeituraConsultasError(error)
}
