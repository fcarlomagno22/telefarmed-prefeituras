import { formatCpfDisplay, initialsFromName, avatarClassForId } from '../admin-credenciais/formatters.js'
import { formatCnsDisplay } from '../../lib/cns.js'
import type {
  AdminContractStatus,
  AdminMunicipalPatientDetailDto,
  AdminMunicipalPatientDto,
  AdminPatientConsultationDto,
  AdminPatientDetailProfileDto,
  AdminPatientUbtVinculoDto,
  PacienteStatus,
  PreCadastroRegistrationInput,
} from './types.js'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export type ListagemRow = {
  id: string
  cpf: string
  nome: string
  nome_social: string | null
  data_nascimento: string
  sexo: string
  cns: string | null
  cns_pendente: boolean
  nacionalidade: string | null
  raca_cor: string | null
  consentimento_cadastro: Record<string, unknown> | null
  telefone: string | null
  email: string | null
  endereco: Record<string, unknown> | null
  contato_emergencia: unknown
  responsavel: Record<string, unknown> | null
  foto_url: string | null
  status: PacienteStatus
  criado_em: string
  entidade_contratante_id: string
  entidade_razao_social: string
  municipio: string
  uf: string
  contrato_ativo: boolean
  unidade_ubt_principal_id: string | null
  unidade_ubt_principal_nome: string | null
}

export type ConsultaRow = {
  id: string
  codigo_atendimento: string
  status: string
  criado_em: string
  finalizada_em: string | null
  especialidade_nome: string | null
  profissional_nome: string | null
  unidade_nome: string | null
}

export type UbtVinculoRow = {
  id: string
  principal: boolean
  unidade_ubt_id: string
  nome: string
  municipio: string
  uf: string
}

export function formatIsoDateToBrazilian(value: string | null | undefined): string {
  if (!value) return '—'
  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return '—'
  return `${day}/${month}/${year}`
}

export function parseBirthDateToIso(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed)
  if (!match) return trimmed
  const [, day, month, year] = match
  return `${year}-${month}-${day}`
}

export function ageFromBirthDateIso(iso: string): number {
  const parsed = new Date(`${iso.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return 0
  const today = new Date()
  let age = today.getFullYear() - parsed.getFullYear()
  const monthDiff = today.getMonth() - parsed.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
    age -= 1
  }
  return Math.max(age, 0)
}

export function registrationMonthLabelFromIso(iso: string): AdminMunicipalPatientDto['registrationMonthLabel'] {
  const month = Number.parseInt(iso.slice(5, 7), 10)
  if (month === 12) return 'Dez'
  const labels: AdminMunicipalPatientDto['registrationMonthLabel'][] = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
  ]
  return labels[month - 1] ?? 'Mai'
}

export function sexoToGenderLabel(sexo: string): string {
  switch (sexo) {
    case 'masculino':
      return 'Masculino'
    case 'feminino':
      return 'Feminino'
    default:
      return 'Não informado'
  }
}

export function genderToSexo(gender: string): 'masculino' | 'feminino' | 'nao_informado' {
  const normalized = gender.trim().toLowerCase()
  if (normalized === 'masculino' || normalized === 'm') return 'masculino'
  if (normalized === 'feminino' || normalized === 'f') return 'feminino'
  return 'nao_informado'
}

export function readEnderecoField(endereco: Record<string, unknown> | null, key: string): string {
  if (!endereco) return ''
  const value = endereco[key]
  return typeof value === 'string' ? value : ''
}

function readContacts(contatoEmergencia: unknown): AdminPatientDetailProfileDto['contacts'] {
  if (!Array.isArray(contatoEmergencia)) return []
  return contatoEmergencia
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `contact-${index + 1}`,
      name: String(item.name ?? item.nome ?? '').trim(),
      phone: String(item.phone ?? item.telefone ?? '').trim(),
      relationship: String(item.relationship ?? item.parentesco ?? '').trim(),
    }))
    .filter((item) => item.name || item.phone)
}

function computeMissingFields(row: ListagemRow): string[] {
  const missing: string[] = []
  if (row.cns_pendente || !row.cns?.trim()) missing.push('CNS')
  if (!row.nacionalidade?.trim()) missing.push('nacionalidade')
  if (!row.raca_cor?.trim()) missing.push('raça/cor')
  if (!row.telefone?.trim()) missing.push('telefone')
  if (!row.email?.trim()) missing.push('e-mail')
  const contacts = readContacts(row.contato_emergencia)
  if (!contacts.some((c) => c.name && c.phone)) missing.push('contato de emergência')
  if (!readEnderecoField(row.endereco, 'cep')) missing.push('CEP')
  return missing
}

export function formatLastAppointmentRelative(iso: string | null): string {
  if (!iso) return 'Sem consultas'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Sem consultas'

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (date >= startOfToday) {
    return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (date >= startOfYesterday) {
    return `Ontem, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays < 7) return `${diffDays} dias atrás`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana(s) atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function monthsWithoutConsultation(lastConsultationIso: string | null): number | null {
  if (!lastConsultationIso) return null
  const date = new Date(lastConsultationIso)
  if (Number.isNaN(date.getTime())) return null
  const now = new Date()
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  return Math.max(months, 0)
}

function mapConsultationStatus(status: string): AdminPatientConsultationDto['status'] {
  if (status === 'concluida') return 'concluida'
  if (status === 'cancelada') return 'cancelada'
  return 'agendada'
}

export function mapConsultaRow(row: ConsultaRow): AdminPatientConsultationDto {
  const reference = row.finalizada_em ?? row.criado_em
  const date = new Date(reference)
  return {
    id: row.id,
    date: formatIsoDateToBrazilian(reference),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    specialty: row.especialidade_nome ?? '—',
    professional: row.profissional_nome ?? '—',
    status: mapConsultationStatus(row.status),
    protocol: row.codigo_atendimento,
    ubtName: row.unidade_nome ?? '—',
  }
}

export function buildProfile(
  row: ListagemRow,
  registrationUnit: string,
): AdminPatientDetailProfileDto {
  const endereco = row.endereco
  const responsavel = row.responsavel ?? {}
  return {
    email: row.email?.trim() ?? '',
    socialName: row.nome_social?.trim() ?? '',
    genderLabel: sexoToGenderLabel(row.sexo),
    nationality: row.nacionalidade?.trim() ?? '',
    raceColor: row.raca_cor?.trim() ?? '',
    guardianName: String(responsavel.name ?? responsavel.nome ?? '').trim(),
    guardianCpf: String(responsavel.cpf ?? '').trim(),
    guardianRelationship: String(
      responsavel.parentesco ?? responsavel.relationship ?? '',
    ).trim(),
    guardianPhone: String(responsavel.telefone ?? responsavel.phone ?? '').trim(),
    guardianAttendanceAuthorized: Boolean(
      responsavel.autorizacao_atendimento ?? responsavel.attendanceAuthorized,
    ),
    residenceMunicipalityIbgeCode: readEnderecoField(endereco, 'codigo_ibge_municipio'),
    cns: row.cns?.trim() ? formatCnsDisplay(row.cns) : '',
    cnsPendente: Boolean(row.cns_pendente),
    zipCode: readEnderecoField(endereco, 'cep'),
    street: readEnderecoField(endereco, 'logradouro') || readEnderecoField(endereco, 'rua'),
    number: readEnderecoField(endereco, 'numero'),
    complement: readEnderecoField(endereco, 'complemento'),
    neighborhood:
      readEnderecoField(endereco, 'bairro') || readEnderecoField(endereco, 'neighborhood'),
    city: readEnderecoField(endereco, 'cidade') || row.municipio,
    state: readEnderecoField(endereco, 'uf') || row.uf,
    contacts: readContacts(row.contato_emergencia),
    registrationUnit,
    registeredAt: formatIsoDateToBrazilian(row.criado_em),
    notes: '',
  }
}

export function mapListagemToPatient(
  row: ListagemRow,
  stats?: { totalAppointments: number; lastAppointmentIso: string | null },
): AdminMunicipalPatientDto {
  const birthIso = row.data_nascimento.slice(0, 10)
  const missingFields = computeMissingFields(row)
  const contractStatus: AdminContractStatus = row.contrato_ativo ? 'ativo' : 'encerrado'
  const lastIso = stats?.lastAppointmentIso ?? null

  return {
    id: row.id,
    name: row.nome,
    initials: initialsFromName(row.nome),
    avatarUrl: row.foto_url?.trim() || undefined,
    avatarClassName: avatarClassForId(row.id),
    bairro: readEnderecoField(row.endereco, 'bairro') || '—',
    phone: row.telefone?.trim() ?? '',
    cpf: formatCpfDisplay(row.cpf),
    birthDate: formatIsoDateToBrazilian(birthIso),
    age: ageFromBirthDateIso(birthIso),
    lastAppointmentDate: lastIso ? formatIsoDateToBrazilian(lastIso) : '—',
    lastAppointmentRelative: formatLastAppointmentRelative(lastIso),
    totalAppointments: stats?.totalAppointments ?? 0,
    municipalRecordId: `MUN-${row.id.replace(/\D/g, '').slice(-6).padStart(6, '0')}`,
    firstAttendanceUnit: row.unidade_ubt_principal_nome ?? '—',
    registeredAt: formatIsoDateToBrazilian(row.criado_em),
    monthsWithoutConsultation: monthsWithoutConsultation(lastIso),
    dataQuality: missingFields.length > 0 ? 'incomplete' : 'complete',
    missingFields,
    municipality: row.municipio,
    contractStatus,
    registrationMonthLabel: registrationMonthLabelFromIso(row.criado_em),
    contractingEntityId: row.entidade_contratante_id,
    contractingEntityRazaoSocial: row.entidade_razao_social,
  }
}

export function mapListagemToDetail(
  row: ListagemRow,
  options: {
    ubts: UbtVinculoRow[]
    consultations: ConsultaRow[]
    stats?: { totalAppointments: number; lastAppointmentIso: string | null }
  },
): AdminMunicipalPatientDetailDto {
  const registrationUnit =
    row.unidade_ubt_principal_nome ?? options.ubts.find((u) => u.principal)?.nome ?? '—'
  const base = mapListagemToPatient(row, options.stats)

  return {
    ...base,
    ubts: options.ubts.map(
      (ubt): AdminPatientUbtVinculoDto => ({
        id: ubt.unidade_ubt_id,
        nome: ubt.nome,
        principal: ubt.principal,
        municipio: ubt.municipio,
        uf: ubt.uf,
      }),
    ),
    consultations: options.consultations.map(mapConsultaRow),
    profile: buildProfile(row, registrationUnit),
  }
}

export function buildEnderecoFromInput(input: {
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  residenceMunicipalityIbgeCode?: string
}): Record<string, string> {
  const endereco: Record<string, string> = {}
  if (input.zipCode?.trim()) endereco.cep = input.zipCode.trim()
  if (input.street?.trim()) endereco.logradouro = input.street.trim()
  if (input.number?.trim()) endereco.numero = input.number.trim()
  if (input.complement?.trim()) endereco.complemento = input.complement.trim()
  if (input.neighborhood?.trim()) endereco.bairro = input.neighborhood.trim()
  if (input.city?.trim()) endereco.cidade = input.city.trim()
  if (input.state?.trim()) endereco.uf = input.state.trim()
  if (input.residenceMunicipalityIbgeCode?.trim()) {
    endereco.codigo_ibge_municipio = input.residenceMunicipalityIbgeCode.trim()
  }
  return endereco
}

export function buildResponsavelFromInput(input: {
  guardianName?: string
  guardianCpf?: string
  guardianRelationship?: string
  guardianPhone?: string
  guardianAttendanceAuthorized?: boolean
}): Record<string, string | boolean> | null {
  const name = input.guardianName?.trim()
  const cpf = input.guardianCpf?.replace(/\D/g, '')
  const relationship = input.guardianRelationship?.trim()
  const phone = input.guardianPhone?.replace(/\D/g, '')
  const authorized = input.guardianAttendanceAuthorized === true

  if (!name && !cpf && !relationship && !phone && !authorized) return null

  return {
    ...(name ? { name } : {}),
    ...(cpf ? { cpf } : {}),
    ...(relationship ? { parentesco: relationship } : {}),
    ...(phone ? { telefone: phone } : {}),
    ...(authorized ? { autorizacao_atendimento: true } : {}),
  }
}

export function buildConsentimentoFromInput(
  consent?: PreCadastroRegistrationInput['registrationConsent'],
): Record<string, unknown> | null {
  if (!consent) return null

  return {
    dados_conferidos: consent.dataReviewed,
    autorizacao_teleconsulta: consent.teleconsultationAuthorized,
    ciencia_dados: consent.dataUsageAcknowledged,
    permissao_notificacoes: consent.notificationsAllowed,
    operador_nome: consent.operatorName.trim(),
    cadastrado_em: consent.registeredAt,
    ...(consent.registrationUnitId ? { unidade_ubt_id: consent.registrationUnitId } : {}),
    unidade_ubt_nome: consent.registrationUnitName.trim(),
    ...(consent.operatorUserId ? { operador_usuario_ubt_id: consent.operatorUserId } : {}),
    ...(consent.operatorAdminId ? { operador_admin_id: consent.operatorAdminId } : {}),
  }
}

export function buildContactsFromInput(
  contacts?: PreCadastroRegistrationInput['contacts'],
): unknown[] {
  if (!contacts?.length) return []
  return contacts
    .filter((c) => c.name.trim() || c.phone.trim())
    .map((c) => ({
      ...(c.id ? { id: c.id } : {}),
      name: c.name.trim(),
      phone: c.phone.trim(),
      ...(c.relationship?.trim() ? { relationship: c.relationship.trim() } : {}),
    }))
}

export function preCadastroInputToDados(input: PreCadastroRegistrationInput): Record<string, unknown> {
  return { ...input }
}

export function monthLabelShort(monthIndex: number): string {
  return MONTH_LABELS[monthIndex] ?? 'Jan'
}

export function escapeIlikeTerm(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}
