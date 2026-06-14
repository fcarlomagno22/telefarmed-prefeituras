import { isBackendApiEnabled } from '../../lib/api/config'
import { apiConsultarProfissionalCnpj } from '../../lib/api/profissional/cadastro'
import type { ProfissionalFinalizarCadastroEmpresaData } from '../../types/profissionalFinalizarCadastro'
import {
  CnpjReceitaFederalLookupError,
  fetchEmpresaDataByCnpjReceitaFederal,
} from '../cnpj/fetchCnpjReceitaFederal'

export class ProfissionalEmpresaLookupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfissionalEmpresaLookupError'
  }
}

/** Consulta dados cadastrais da empresa pelo CNPJ (backend com cache ou BrasilAPI em mock). */
export async function fetchProfissionalEmpresaByCnpj(
  cnpj: string,
): Promise<ProfissionalFinalizarCadastroEmpresaData> {
  try {
    if (isBackendApiEnabled()) {
      return await apiConsultarProfissionalCnpj(cnpj)
    }

    return await fetchEmpresaDataByCnpjReceitaFederal(cnpj)
  } catch (error) {
    if (error instanceof CnpjReceitaFederalLookupError) {
      throw new ProfissionalEmpresaLookupError(error.message)
    }
    if (error instanceof Error && error.name === 'ProfissionalCadastroApiError') {
      throw new ProfissionalEmpresaLookupError(error.message)
    }
    throw new ProfissionalEmpresaLookupError(
      'Não foi possível consultar o CNPJ na Receita Federal. Tente novamente.',
    )
  }
}
