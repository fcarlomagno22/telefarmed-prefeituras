import type {
  AdminClienteContact,
  AdminClienteContratoTipo,
  AdminClienteStatus,
} from '../../../../types/adminClientes'
import { isValidEmail } from '../../../prefeitura/rede/newUbt/newUbtFormTypes'
import {
  buildOptionalAdminClienteContact,
  validateCadastroContratoContactStep,
  validateCadastroContratoStep,
  validateCadastroEspecialidadesStep,
  validateCadastroExcedenteStep,
} from '../adminClienteContratoForm'

export const adminEntidadeCadastroFlowSteps = [
  { id: 'entidade', label: 'Dados da entidade' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'especialidades', label: 'Profissões e especialidades' },
  { id: 'excedente', label: 'Ultrapassagem' },
  { id: 'contatos', label: 'Contatos operacionais' },
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
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  logoDataUrl: string | null
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
    nome: '',
    subtitulo: 'Prefeitura Municipal',
    razaoSocial: '',
    cnpj: '',
    logoDataUrl: null,
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

function validateContact(
  name: string,
  email: string,
  phone: string,
  label: string,
): string | null {
  if (!name.trim()) return `Informe o nome do contato de ${label}.`
  if (!email.trim()) return `Informe o e-mail do contato de ${label}.`
  if (!isValidEmail(email)) return `E-mail inválido para o contato de ${label}.`
  if (phone.replace(/\D/g, '').length < 10) {
    return `Informe o telefone do contato de ${label} com DDD.`
  }
  return null
}

export function validateAdminEntidadeCadastroStep(
  step: AdminEntidadeCadastroStep,
  form: AdminEntidadeCadastroFormState,
): string | null {
  switch (step) {
    case 'entidade':
      if (!form.razaoSocial.trim()) return 'Informe a razão social.'
      if (!isValidCnpj(form.cnpj)) return 'Informe um CNPJ válido com 14 dígitos.'
      if (!form.municipio.trim()) return 'Selecione o município.'
      if (!form.uf.trim()) return 'Selecione a UF.'
      if (!form.nome.trim()) return 'Informe o nome da entidade.'
      return null
    case 'contrato':
      return validateCadastroContratoStep(form)
    case 'especialidades':
      return validateCadastroEspecialidadesStep(form)
    case 'excedente':
      return validateCadastroExcedenteStep(form)
    case 'contatos':
      return (
        validateContact(form.gestorNome, form.gestorEmail, form.gestorTelefone, 'gestor da entidade') ??
        validateContact(form.saudeNome, form.saudeEmail, form.saudeTelefone, 'saúde') ??
        validateContact(form.tiNome, form.tiEmail, form.tiTelefone, 'TI') ??
        validateCadastroContratoContactStep(form)
      )
    case 'revisao':
      return (
        validateAdminEntidadeCadastroStep('entidade', form) ??
        validateAdminEntidadeCadastroStep('contrato', form) ??
        validateAdminEntidadeCadastroStep('especialidades', form) ??
        validateAdminEntidadeCadastroStep('excedente', form) ??
        validateAdminEntidadeCadastroStep('contatos', form)
      )
    default:
      return null
  }
}

export function isAdminEntidadeCadastroStepReady(
  step: AdminEntidadeCadastroStep,
  form: AdminEntidadeCadastroFormState,
): boolean {
  return validateAdminEntidadeCadastroStep(step, form) === null
}

export function resolveFirstInvalidCadastroStep(
  form: AdminEntidadeCadastroFormState,
): { step: AdminEntidadeCadastroStep; error: string } | null {
  const steps: AdminEntidadeCadastroStep[] = [
    'entidade',
    'contrato',
    'especialidades',
    'excedente',
    'contatos',
  ]

  for (const targetStep of steps) {
    const error = validateAdminEntidadeCadastroStep(targetStep, form)
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

  return {
    pin,
    nome: form.nome.trim(),
    subtitulo: form.subtitulo.trim(),
    razaoSocial: form.razaoSocial.trim(),
    cnpj: form.cnpj.trim(),
    ...(form.logoDataUrl ? { logoDataUrl: form.logoDataUrl } : {}),
    municipio: form.municipio.trim(),
    uf: form.uf,
    status: form.status,
    gestor: {
      name: form.gestorNome.trim(),
      email: form.gestorEmail.trim(),
      phone: form.gestorTelefone.trim(),
      phoneType: form.gestorTelefoneTipo,
    },
    contatoContrato,
    contatoTi: {
      name: form.tiNome.trim(),
      email: form.tiEmail.trim(),
      phone: form.tiTelefone.trim(),
      phoneType: form.tiTelefoneTipo,
    },
    contatoSaude: {
      name: form.saudeNome.trim(),
      email: form.saudeEmail.trim(),
      phone: form.saudeTelefone.trim(),
      phoneType: form.saudeTelefoneTipo,
    },
  }
}
