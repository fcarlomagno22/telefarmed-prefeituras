export { mapPrefeituraRedeError as mapPrefeituraContratoError } from '../prefeitura-rede/errors.js'

export class PrefeituraContratoError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'PrefeituraContratoError'
    this.code = code
    this.statusCode = statusCode
  }
}
