export class Rh3ApiError extends Error {
  readonly code?: string
  readonly statusCode?: number
  readonly payload?: unknown

  constructor(message: string, options?: { code?: string; statusCode?: number; payload?: unknown }) {
    super(message)
    this.name = 'Rh3ApiError'
    this.code = options?.code
    this.statusCode = options?.statusCode
    this.payload = options?.payload
  }
}

export function isRh3ApiError(error: unknown): error is Rh3ApiError {
  return error instanceof Rh3ApiError
}
