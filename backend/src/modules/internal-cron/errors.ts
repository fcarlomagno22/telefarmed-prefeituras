export class InternalCronError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'InternalCronError'
    this.statusCode = statusCode
  }
}

export function mapInternalCronError(error: unknown): {
  statusCode: number
  body: { error: string }
} {
  if (error instanceof InternalCronError) {
    return { statusCode: error.statusCode, body: { error: error.message } }
  }
  return { statusCode: 500, body: { error: 'Falha ao executar job agendado.' } }
}
