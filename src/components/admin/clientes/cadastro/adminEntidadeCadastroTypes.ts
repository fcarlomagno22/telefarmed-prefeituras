import type {
  AdminClienteContact,
  AdminClienteContratoTipo,
  AdminClienteStatus,
} from '../../../../types/adminClientes'
import type { TipoEntidade } from '../../../../types/entidadeBranding'
import { isPrefeituraEntidadeTipo } from '../../../../config/adminEntidadeTipo'
import {
  buildOptionalAdminClienteContact,
  validateCadastroContratoContactStep,
  validateCadastroContratoStep,
  validateCadastroEspecialidadesStep,
  validateCadastroExcedenteStep,
  validateCadastroOperacionalContactsRequirement,
  validateOptionalAdminClienteContact,
} from '../adminClienteContratoForm'

import type { ClienteSpecialtyOption } from '../../../../hooks/useAdminClientesClinicoCatalog'
import {
  isSlugAvailabilityConfirmed,
  validateTenantSlug,
  type TenantSlugAvailabilityState,
} from '../../../../utils/tenantSlug'

export type AdminEntidadeCadastroValidationOptions = {
  specialties?: ClienteSpecialtyOption[]
}

export const adminEntidadeCadastroFlowSteps = [
  { id: 'identificacao', label: 'Identificação' },
  { id: 'marca', label: 'Marca' },
  { id: 'endereco', label: 'Endereço público' },
  { id: 'contrato', label: 'Contrato e contatos' },
  { id: 'revisao', label: 'Revisão' },
] as const

export type AdminEntidadeCadastroStep = (typeof adminEntidadeCadastroFlowSteps)[number]['id']

export const adminEntidadeUfOptions = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
].map((uf) => ({ value: uf, label: uf }))

export const adminEntidadeStatusOptions: { value: AdminClienteStatus; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'implantacao', label: 'Em implantação' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'suspensa', label: 'Suspensa' },
]

export const adminEntidadeStatusEditOptions: { value: AdminClienteStatus; label: string }[] = [
  ...adminEntidadeStatusOptions,
  { value: 'sem_contrato', label: 'Sem contrato' },
]

export const adminEntidadeContratoTipoOptions: {
  value: AdminClienteContratoTipo
  label: string
}[] = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'pacote_fechado', label: 'Pacote fechado' },
  { value: 'sob_demanda', label: 'Sob demanda' },
]

export const adminEntidadeTelefoneTipoOptions: {
  value: NonNullable<AdminClienteContact['phoneType']>
  label: string
}[] = [
  { value: 'celular', label: 'Celular' },
  { value: 'fixo', label: 'Fixo' },
]

export type AdminEntidadePrecosEspecialidadeForm = Record<string, string>

export type AdminEntidadeCadastroFormState = {
  tipoEntidade: TipoEntidade
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  logoDataUrl: string | null
  loginBackgroundDataUrl: string | null
  faviconDataUrl: string | null
  corPrimaria: string
  nomeMarca: string
  slug: string
  municipio: string
  uf: string
  status: AdminClienteStatus
  gestorNome: string
  gestorEmail: string
  gestorTelefone: string
  gestorTelefoneTipo: NonNullable<AdminClienteContact['phoneType']>
  saudeNome: string
  saudeEmail: string
  saudeTelefone: string
  saudeTelefoneTipo: NonNullable<AdminClienteContact['phoneType']>
  contratoNome: string
  contratoEmail: string
  contratoTelefone: string
  contratoTelefoneTipo: NonNullable<AdminClienteContact['phoneType']>
  tiNome: string
  tiEmail: string
  tiTelefone: string
  tiTelefoneTipo: NonNullable<AdminClienteContact['phoneType']>
  contratoTipo: string
  contratoModalidade: AdminClienteContratoTipo
  numeroContrato: string
  vigenciaInicio: string
  vigenciaFim: string
  consultasContratadas: string
  permiteUltrapassar: boolean
  aceitaPacientesOutrosMunicipios: boolean
  professionIds: Set<string>
  precosProfissao: AdminEntidadePrecosEspecialidadeForm
  precosEspecialidade: AdminEntidadePrecosEspecialidadeForm
  excedentePrecosProfissao: AdminEntidadePrecosEspecialidadeForm
  excedentePrecosEspecialidade: AdminEntidadePrecosEspecialidadeForm
  specialtyIds: Set<string>
}

export function createEmptyAdminEntidadeCadastroForm(): AdminEntidadeCadastroFormState {
  return {
    tipoEntidade: 'prefeitura',
    nome: '',
    subtitulo: 'Prefeitura Municipal',
    razaoSocial: '',
    cnpj: '',
    logoDataUrl: null,
    loginBackgroundDataUrl: null,
    faviconDataUrl: null,
    corPrimaria: '#ff6b00',
    nomeMarca: '',
    slug: '',
    municipio: 'Brasília',
    uf: 'DF',
    status: 'implantacao',
    gestorNome: '',
    gestorEmail: '',
    gestorTelefone: '',
    gestorTelefoneTipo: 'celular',
    saudeNome: '',
    saudeEmail: '',
    saudeTelefone: '',
    saudeTelefoneTipo: 'celular',
    contratoNome: '',
    contratoEmail: '',
    contratoTelefone: '',
    contratoTelefoneTipo: 'celular',
    tiNome: '',
    tiEmail: '',
    tiTelefone: '',
    tiTelefoneTipo: 'celular',
    contratoTipo: '',
    contratoModalidade: 'pacote_fechado',
    numeroContrato: '',
    vigenciaInicio: '',
    vigenciaFim: '',
    consultasContratadas: '',
    permiteUltrapassar: false,
    aceitaPacientesOutrosMunicipios: false,
    professionIds: new Set(),
    precosProfissao: {},
    precosEspecialidade: {},
    excedentePrecosProfissao: {},
    excedentePrecosEspecialidade: {},
    specialtyIds: new Set(),
  }
}

export function resolveAdminEntidadeCadastroStepIndex(step: AdminEntidadeCadastroStep) {
  return adminEntidadeCadastroFlowSteps.findIndex((item) => item.id === step)
}

export function isPacoteOuMensal(modalidade: AdminClienteContratoTipo) {
  return modalidade === 'mensal' || modalidade === 'pacote_fechado'
}

function isValidContractDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim())
  if (!match) return false
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) return false
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function isValidCnpj(value: string) {
  return value.replace(/\D/g, '').length === 14
}

export function validateAdminEntidadeCadastroStep(
  step: AdminEntidadeCadastroStep,
  form: AdminEntidadeCadastroFormState,
  slugAvailability?: TenantSlugAvailabilityState,
  options?: AdminEntidadeCadastroValidationOptions,
): string | null {
  switch (step) {
    case 'identificacao':
      if (!form.razaoSocial.trim()) return 'Informe a razão social.'
      if (!isValidCnpj(form.cnpj)) return 'Informe um CNPJ válido com 14 dígitos.'
      if (!form.municipio.trim()) {
        return isPrefeituraEntidadeTipo(form.tipoEntidade)
          ? 'Selecione o município.'
          : 'Informe a cidade.'
      }
      if (!form.uf.trim()) return 'Selecione a UF.'
      return null
    case 'marca':
      if (!form.nomeMarca.trim()) return 'Informe o nome exibido da marca.'
      if (!/^#[0-9A-Fa-f]{6}$/.test(form.corPrimaria.trim())) {
        return 'Informe uma cor primária válida (#RRGGBB).'
      }
      return null
    case 'endereco': {
      const slugError = validateTenantSlug(form.slug)
      if (slugError) return slugError
      if (!slugAvailability || !isSlugAvailabilityConfirmed(form.slug, slugAvailability)) {
        return 'Aguarde a confirmação de disponibilidade do endereço público.'
      }
      return null
    }
    case 'contrato':
      return (
        validateCadastroContratoStep(form) ??
        validateCadastroEspecialidadesStep(form, options?.specialties) ??
        validateCadastroExcedenteStep(form) ??
        validateOptionalAdminClienteContact(
          form.gestorNome,
          form.gestorEmail,
          form.gestorTelefone,
          'gestor da entidade',
        ) ??
        validateOptionalAdminClienteContact(
          form.saudeNome,
          form.saudeEmail,
          form.saudeTelefone,
          'saúde',
        ) ??
        validateCadastroContratoContactStep(form) ??
        validateOptionalAdminClienteContact(
          form.tiNome,
          form.tiEmail,
          form.tiTelefone,
          'TI',
        ) ??
        validateCadastroOperacionalContactsRequirement(form)
      )
    case 'revisao':
      return (
        validateAdminEntidadeCadastroStep('identificacao', form) ??
        validateAdminEntidadeCadastroStep('marca', form) ??
        validateAdminEntidadeCadastroStep('endereco', form, slugAvailability) ??
        validateAdminEntidadeCadastroStep('contrato', form, slugAvailability, options)
      )
    default:
      return null
  }
}

export function isAdminEntidadeCadastroStepReady(
  step: AdminEntidadeCadastroStep,
  form: AdminEntidadeCadastroFormState,
  slugAvailability?: TenantSlugAvailabilityState,
  options?: AdminEntidadeCadastroValidationOptions,
): boolean {
  return validateAdminEntidadeCadastroStep(step, form, slugAvailability, options) === null
}

export function resolveFirstInvalidCadastroStep(
  form: AdminEntidadeCadastroFormState,
  slugAvailability?: TenantSlugAvailabilityState,
  options?: AdminEntidadeCadastroValidationOptions,
): { step: AdminEntidadeCadastroStep; error: string } | null {
  const steps: AdminEntidadeCadastroStep[] = ['identificacao', 'marca', 'endereco', 'contrato']

  for (const targetStep of steps) {
    const error = validateAdminEntidadeCadastroStep(targetStep, form, slugAvailability, options)
    if (error) return { step: targetStep, error }
  }

  return null
}

export function buildCreateEntidadePayloadFromCadastroForm(
  form: AdminEntidadeCadastroFormState,
  pin: string,
) {
  const contatoContrato = buildOptionalAdminClienteContact({
    name: form.contratoNome,
    email: form.contratoEmail,
    phone: form.contratoTelefone,
    phoneType: form.contratoTelefoneTipo,
  })
  const gestor = buildOptionalAdminClienteContact({
    name: form.gestorNome,
    email: form.gestorEmail,
    phone: form.gestorTelefone,
    phoneType: form.gestorTelefoneTipo,
  })
  const contatoSaude = buildOptionalAdminClienteContact({
    name: form.saudeNome,
    email: form.saudeEmail,
    phone: form.saudeTelefone,
    phoneType: form.saudeTelefoneTipo,
  })
  const contatoTi = buildOptionalAdminClienteContact({
    name: form.tiNome,
    email: form.tiEmail,
    phone: form.tiTelefone,
    phoneType: form.tiTelefoneTipo,
  })

  return {
    pin,
    nome: (form.nome.trim() || form.nomeMarca.trim() || form.municipio.trim()).trim(),
    subtitulo: form.subtitulo.trim(),
    razaoSocial: form.razaoSocial.trim(),
    cnpj: form.cnpj.trim(),
    slug: form.slug.trim().toLowerCase(),
    tipoEntidade: form.tipoEntidade,
    corPrimaria: form.corPrimaria.trim(),
    nomeMarca: form.nomeMarca.trim(),
    ...(form.logoDataUrl ? { logoDataUrl: form.logoDataUrl } : {}),
    ...(form.loginBackgroundDataUrl
      ? { loginBackgroundDataUrl: form.loginBackgroundDataUrl }
      : {}),
    ...(form.faviconDataUrl ? { faviconDataUrl: form.faviconDataUrl } : {}),
    municipio: form.municipio.trim(),
    uf: form.uf,
    status: form.status,
    ...(gestor ? { gestor } : {}),
    contatoContrato,
    ...(contatoSaude ? { contatoSaude } : {}),
    ...(contatoTi ? { contatoTi } : {}),
  }
}
