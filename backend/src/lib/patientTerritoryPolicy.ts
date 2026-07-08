import { isPrefeituraEntidadeTipo } from './entidadeBranding/tipo.js'
import type { TipoEntidade } from './entidadeBranding/types.js'

/** Restrição de município só se aplica a prefeitura sem flag de outros municípios. */
export function shouldEnforcePatientMunicipalityTerritory(
  tipoEntidade: TipoEntidade | undefined,
  aceitaPacientesOutrosMunicipios: boolean,
): boolean {
  if (!isPrefeituraEntidadeTipo(tipoEntidade)) return false
  return !aceitaPacientesOutrosMunicipios
}

/** No app cidadão, a flag do contrato vale para qualquer tipo de entidade. */
export function shouldEnforceVdAppCadastroTerritory(
  contratoAceitaPacientesOutrosMunicipios: boolean,
): boolean {
  return !contratoAceitaPacientesOutrosMunicipios
}

export const VD_APP_TERRITORY_MISMATCH_SUBJECT = 'O cadastro no app só está disponível'
