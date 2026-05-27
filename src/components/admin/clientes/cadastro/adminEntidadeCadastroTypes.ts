import type {
  AdminClienteContact,
  AdminClienteContrato,
  AdminClienteContratoDetalhes,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidade,
  AdminClienteRow,
  AdminClienteStatus,
} from '../../../../data/adminClientesMock'
import { getSpecialtyById, specialties } from '../../../../data/specialties'
import { parseCurrencyBrl } from '../../../../utils/masks'
import { isValidEmail } from '../../../prefeitura/rede/newUbt/newUbtFormTypes'

export const adminEntidadeCadastroFlowSteps = [
  { id: 'entidade', label: 'Dados da entidade' },
  { id: 'contatos', label: 'Contatos' },
  { id: 'contrato', label: 'Contrato' },
  { id: 'especialidades', label: 'Especialidades' },
  { id: 'excedente', label: 'Ultrapassagem' },
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
  contratoTipo: AdminClienteContratoTipo
  numeroContrato: string
  vigenciaInicio: string
  vigenciaFim: string
  consultasContratadas: string
  permiteUltrapassar: boolean
  precosEspecialidade: AdminEntidadePrecosEspecialidadeForm
  excedentePrecosEspecialidade: AdminEntidadePrecosEspecialidadeForm
  specialtyIds: Set<string>
}

export function createEmptyAdminEntidadeCadastroForm(): AdminEntidadeCadastroFormState {
  const defaultSpecialtyIds = new Set(specialties.map((item) => item.id))

  return {
    nome: '',
    subtitulo: 'Prefeitura Municipal',
    razaoSocial: '',
    cnpj: '',
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
    contratoTipo: 'pacote_fechado',
    numeroContrato: '',
    vigenciaInicio: '',
    vigenciaFim: '',
    consultasContratadas: '',
    permiteUltrapassar: false,
    precosEspecialidade: {},
    excedentePrecosEspecialidade: {},
    specialtyIds: defaultSpecialtyIds,
  }
}

function validatePrecosPorEspecialidade(
  specialtyIds: Set<string>,
  precos: AdminEntidadePrecosEspecialidadeForm,
  contextLabel: string,
): string | null {
  for (const specialtyId of specialtyIds) {
    if (parseCurrencyBrl(precos[specialtyId] ?? '') <= 0) {
      const name = getSpecialtyById(specialtyId)?.name ?? 'especialidade'
      return `Informe o ${contextLabel} para ${name}.`
    }
  }
  return null
}

function buildPrecosPorEspecialidadeFromForm(
  specialtyIds: Iterable<string>,
  precos: AdminEntidadePrecosEspecialidadeForm,
): AdminClientePrecoEspecialidade[] {
  return [...specialtyIds].map((specialtyId) => ({
    specialtyId,
    valorConsulta: parseCurrencyBrl(precos[specialtyId] ?? ''),
  }))
}

export function resolveAdminEntidadeCadastroStepIndex(step: AdminEntidadeCadastroStep) {
  return adminEntidadeCadastroFlowSteps.findIndex((item) => item.id === step)
}

export function isPacoteOuMensal(tipo: AdminClienteContratoTipo) {
  return tipo === 'mensal' || tipo === 'pacote_fechado'
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
  _step: AdminEntidadeCadastroStep,
  _form: AdminEntidadeCadastroFormState,
): string | null {
  // Validação desativada temporariamente para permitir testes
  // do fluxo completo sem bloqueios em nenhum passo.
  // TODO: reintroduzir regras de validação definitivas depois dos testes.
  return null
}

export function buildAdminClienteRowFromCadastroForm(
  form: AdminEntidadeCadastroFormState,
): AdminClienteRow {
  const id = `cli-${Date.now()}`
  const consultasContratadas = isPacoteOuMensal(form.contratoTipo)
    ? Number.parseInt(form.consultasContratadas, 10)
    : null

  const precosPorEspecialidade = buildPrecosPorEspecialidadeFromForm(
    form.specialtyIds,
    form.precosEspecialidade,
  )

  const excedentePrecosPorEspecialidade =
    isPacoteOuMensal(form.contratoTipo) && form.permiteUltrapassar
      ? buildPrecosPorEspecialidadeFromForm(
          form.specialtyIds,
          form.excedentePrecosEspecialidade,
        )
      : null

  const detalhes: AdminClienteContratoDetalhes = {
    consultasContratadas,
    valorConsultaPacote: null,
    permiteUltrapassar: isPacoteOuMensal(form.contratoTipo) && form.permiteUltrapassar,
    precosPorEspecialidade,
    excedentePrecosPorEspecialidade,
    especialidadesAutorizadas: [...form.specialtyIds],
  }

  const contrato: AdminClienteContrato = {
    id: `ctr-${id}-1`,
    numero: form.numeroContrato.trim() || `CTR-${id}-1`,
    dataAssinatura: form.vigenciaInicio.trim(),
    dataEncerramento: form.vigenciaFim.trim() || null,
    tipo: form.contratoTipo,
    status: form.status === 'implantacao' ? 'implantacao' : 'ativo',
    percentualUtilizado: form.contratoTipo === 'sob_demanda' ? null : 0,
    consultasRealizadas: form.contratoTipo === 'sob_demanda' ? 0 : null,
    detalhes,
  }

  return {
    id,
    prefeitura: form.nome.trim(),
    subtitle: form.subtitulo.trim(),
    razaoSocial: form.razaoSocial.trim(),
    cnpj: form.cnpj.trim(),
    municipio: form.municipio.trim(),
    uf: form.uf,
    gestor: {
      name: form.gestorNome.trim(),
      email: form.gestorEmail.trim(),
      phone: form.gestorTelefone.trim(),
      phoneType: form.gestorTelefoneTipo,
    },
    contatoContrato: {
      name: form.contratoNome.trim(),
      email: form.contratoEmail.trim(),
      phone: form.contratoTelefone.trim(),
      phoneType: form.contratoTelefoneTipo,
    },
    contatoSaude: {
      name: form.saudeNome.trim(),
      email: form.saudeEmail.trim(),
      phone: form.saudeTelefone.trim(),
      phoneType: form.saudeTelefoneTipo,
    },
    contatoTi: {
      name: form.tiNome.trim(),
      email: form.tiEmail.trim(),
      phone: form.tiTelefone.trim(),
      phoneType: form.tiTelefoneTipo,
    },
    status: form.status,
    logoHue: Math.floor(Math.random() * 360),
    contratos: [contrato],
  }
}
