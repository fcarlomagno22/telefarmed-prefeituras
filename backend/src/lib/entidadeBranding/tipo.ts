import type { TipoEntidade } from './types.js'

export function isPrefeituraEntidadeTipo(tipo: TipoEntidade | undefined): boolean {
  return (tipo ?? 'prefeitura') === 'prefeitura'
}

export function resolveAceitaPacientesOutrosMunicipios(
  tipo: TipoEntidade | undefined,
  contratoAceita: boolean,
): boolean {
  if (!isPrefeituraEntidadeTipo(tipo)) return true
  return contratoAceita
}
