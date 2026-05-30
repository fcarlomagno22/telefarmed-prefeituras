import type { ProfissionalPixKeyType } from './profissionalFinanceiro'
import type { ProfissionalFinalizarCadastroStepId } from '../config/profissionalFinalizarCadastro'

export type ProfissionalFinalizarCadastroProfissionalData = {
  fullName: string
  cpf: string
}

export type ProfissionalFinalizarCadastroEmpresaData = {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  situacaoCadastral: string
  dataAbertura: string
  naturezaJuridica: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export type ProfissionalFinalizarCadastroFormValues = {
  accessCode: string
  cnpj: string
  empresaConfirmed: boolean
  pixKeyType: ProfissionalPixKeyType
  pixKey: string
  selfiePhotoDataUrl: string
  contractOpened: boolean
  contractScrolledToEnd: boolean
  contractAccepted: boolean
  password: string
  confirmPassword: string
}

export type ProfissionalFinalizarCadastroFormErrors = Partial<
  Record<
    | keyof ProfissionalFinalizarCadastroFormValues
    | ProfissionalFinalizarCadastroStepId,
    string
  >
>
