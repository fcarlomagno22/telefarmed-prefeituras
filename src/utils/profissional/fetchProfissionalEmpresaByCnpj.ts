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

/** Consulta dados cadastrais da empresa pelo CNPJ na base da Receita Federal (BrasilAPI). */
export async function fetchProfissionalEmpresaByCnpj(
  cnpj: string,
): Promise<ProfissionalFinalizarCadastroEmpresaData> {
  try {
    return await fetchEmpresaDataByCnpjReceitaFederal(cnpj)
  } catch (error) {
    if (error instanceof CnpjReceitaFederalLookupError) {
      throw new ProfissionalEmpresaLookupError(error.message)
    }
    throw new ProfissionalEmpresaLookupError(
      'Não foi possível consultar o CNPJ na Receita Federal. Tente novamente.',
    )
  }
}
