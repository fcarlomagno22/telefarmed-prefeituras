import {
  PROFISSIONAL_FINALIZAR_CADASTRO_MIN_PASSWORD_LENGTH,
  PROFISSIONAL_FINALIZAR_CADASTRO_MOCK_CODE,
} from '../../config/profissionalFinalizarCadastro'
import type { ProfissionalFinalizarCadastroFormErrors } from '../../types/profissionalFinalizarCadastro'
import type { ProfissionalFinalizarCadastroFormValues } from '../../types/profissionalFinalizarCadastro'
import { pixKeyIsFilled } from './profissionalPixKey'

function isValidCnpj(value: string) {
  return value.replace(/\D/g, '').length === 14
}

export function validateProfissionalFinalizarCadastroAccessStep(
  accessCode: string,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}
  const digits = accessCode.replace(/\D/g, '')

  if (digits.length !== 6) {
    errors.accessCode = 'Informe o código de 6 dígitos enviado por e-mail.'
    return errors
  }

  if (digits !== PROFISSIONAL_FINALIZAR_CADASTRO_MOCK_CODE) {
    errors.accessCode = 'Código inválido ou expirado. Verifique o e-mail de aprovação.'
  }

  return errors
}

export function validateProfissionalFinalizarCadastroEmpresaStep(
  cnpj: string,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}

  if (!cnpj.trim()) {
    errors.cnpj = 'Informe o CNPJ da empresa prestadora.'
    return errors
  }

  if (!isValidCnpj(cnpj)) {
    errors.cnpj = 'CNPJ inválido. Use 14 dígitos.'
  }

  return errors
}

export function validateProfissionalFinalizarCadastroConfirmarEmpresaStep(
  empresaConfirmed: boolean,
  hasEmpresaData: boolean,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}

  if (!hasEmpresaData) {
    errors.confirmarEmpresa = 'Não foi possível carregar os dados da empresa. Volte e informe o CNPJ.'
    return errors
  }

  if (!empresaConfirmed) {
    errors.empresaConfirmed = 'Confirme que os dados da empresa estão corretos.'
  }

  return errors
}

export function validateProfissionalFinalizarCadastroPixStep(
  pixKeyType: ProfissionalFinalizarCadastroFormValues['pixKeyType'],
  pixKey: string,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}

  if (!pixKeyIsFilled(pixKeyType, pixKey)) {
    errors.pixKey = 'Informe uma chave PIX válida para recebimentos.'
  }

  return errors
}

export function validateProfissionalFinalizarCadastroFotoStep(
  selfiePhotoDataUrl: string,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}

  if (!selfiePhotoDataUrl.trim()) {
    errors.selfiePhotoDataUrl = 'Tire uma selfie para continuar o cadastro.'
  }

  return errors
}

export function validateProfissionalFinalizarCadastroContratoStep(
  contractScrolledToEnd: boolean,
  contractAccepted: boolean,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}

  if (!contractScrolledToEnd) {
    errors.contractScrolledToEnd =
      'Abra o contrato e role até o final antes de confirmar o aceite.'
  }

  if (!contractAccepted) {
    errors.contractAccepted = 'Confirme que leu e aceita o contrato de prestação de serviços.'
  }

  return errors
}

export function validateProfissionalFinalizarCadastroSenhaStep(
  password: string,
  confirmPassword: string,
): ProfissionalFinalizarCadastroFormErrors {
  const errors: ProfissionalFinalizarCadastroFormErrors = {}

  if (password.length < PROFISSIONAL_FINALIZAR_CADASTRO_MIN_PASSWORD_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${PROFISSIONAL_FINALIZAR_CADASTRO_MIN_PASSWORD_LENGTH} caracteres.`
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirme a senha de acesso.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'As senhas não coincidem.'
  }

  return errors
}

export function hasProfissionalFinalizarCadastroErrors(
  errors: ProfissionalFinalizarCadastroFormErrors,
) {
  return Object.keys(errors).length > 0
}
