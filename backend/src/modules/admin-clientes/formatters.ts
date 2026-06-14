import { ClientesError } from './errors.js'
import type {
  AdminClienteContactDto,
  AdminClienteContratoDetalhesDto,
  AdminClienteContratoDto,
  AdminClienteContratoStatus,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidadeDto,
  AdminClientePrecoProfissaoDto,
  AdminClienteRowDto,
  AdminClienteStatus,
} from './types.js'

export type EntidadeRow = {
  id: string
  nome_exibicao: string
  subtitulo: string
  razao_social: string
  cnpj: string
  municipio: string
  uf: string
  status_cliente: AdminClienteStatus
  logo_hue: number
  logo_storage_path: string | null
  gestor: unknown
  contato_contrato: unknown
  contato_ti: unknown
  contato_saude: unknown
  atualizado_em: string
}

export type ContratoRow = {
  id: string
  entidade_contratante_id: string
  numero: string | null
  tipo: string
  status: AdminClienteContratoStatus
  data_assinatura: string
  data_encerramento: string | null
  consultas_contratadas: number | null
  consultas_realizadas: number
  percentual_utilizado: number | string | null
  permite_ultrapassar: boolean
  aceita_pacientes_outros_municipios: boolean
}

export type EspecialidadeAutorizadaRow = {
  contrato_id: string
  especialidade_id: string
}

export type PrecoProfissaoRow = {
  contrato_id: string
  profissao_id: string
  tipo: 'contratado' | 'excedente'
  valor_consulta_centavos: number
}

export type PrecoEspecialidadeRow = {
  contrato_id: string
  especialidade_id: string
  tipo: 'contratado' | 'excedente'
  valor_consulta_centavos: number
}

const DATE_BR_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/

export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '')
}

export function parseBrazilianDateToIso(value: string): string {
  const trimmed = value.trim()
  const match = DATE_BR_REGEX.exec(trimmed)
  if (!match) {
    throw new ClientesError('Data inválida. Use o formato dd/mm/aaaa.', 'INVALID_DATA', 400)
  }

  const [, day, month, year] = match
  const iso = `${year}-${month}-${day}`
  const parsed = new Date(`${iso}T12:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) {
    throw new ClientesError('Data inválida.', 'INVALID_DATA', 400)
  }

  return iso
}

export function formatIsoDateToBrazilian(value: string | null | undefined): string | null {
  if (!value) return null
  const datePart = value.slice(0, 10)
  const [year, month, day] = datePart.split('-')
  if (!year || !month || !day) return null
  return `${day}/${month}/${year}`
}

export function brlToCentavos(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ClientesError('Valor de consulta inválido.', 'INVALID_DATA', 400)
  }
  return Math.round(value * 100)
}

export function centavosToBrl(value: number): number {
  return Math.round(value) / 100
}

export function mapContact(value: unknown): AdminClienteContactDto {
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

  const contact: AdminClienteContactDto = {
    name: String(record.name ?? record.nome ?? '').trim(),
    email: String(record.email ?? '').trim(),
  }

  const phone = String(record.phone ?? record.telefone ?? '').trim()
  if (phone) contact.phone = phone

  const phoneType = record.phoneType ?? record.telefone_tipo
  if (phoneType === 'fixo' || phoneType === 'celular') {
    contact.phoneType = phoneType
  }

  return contact
}

export function serializeContact(contact: AdminClienteContactDto): Record<string, unknown> {
  return {
    name: contact.name.trim(),
    email: contact.email.trim(),
    ...(contact.phone ? { phone: contact.phone.trim() } : {}),
    ...(contact.phoneType ? { phoneType: contact.phoneType } : {}),
  }
}

function mapPrecosProfissao(rows: PrecoProfissaoRow[], tipo: 'contratado' | 'excedente') {
  return rows
    .filter((row) => row.tipo === tipo)
    .map(
      (row): AdminClientePrecoProfissaoDto => ({
        professionId: row.profissao_id,
        valorConsulta: centavosToBrl(row.valor_consulta_centavos),
      }),
    )
}

function mapPrecosEspecialidade(rows: PrecoEspecialidadeRow[], tipo: 'contratado' | 'excedente') {
  return rows
    .filter((row) => row.tipo === tipo)
    .map(
      (row): AdminClientePrecoEspecialidadeDto => ({
        specialtyId: row.especialidade_id,
        valorConsulta: centavosToBrl(row.valor_consulta_centavos),
      }),
    )
}

export function buildContratoDetalhes(
  contrato: ContratoRow,
  especialidades: EspecialidadeAutorizadaRow[],
  precosProfissao: PrecoProfissaoRow[],
  precosEspecialidade: PrecoEspecialidadeRow[],
): AdminClienteContratoDetalhesDto {
  const excedenteProfissao = mapPrecosProfissao(precosProfissao, 'excedente')
  const excedenteEspecialidade = mapPrecosEspecialidade(precosEspecialidade, 'excedente')

  return {
    consultasContratadas: contrato.consultas_contratadas,
    valorConsultaPacote: null,
    permiteUltrapassar: contrato.permite_ultrapassar,
    aceitaPacientesOutrosMunicipios: contrato.aceita_pacientes_outros_municipios,
    precosPorProfissao: mapPrecosProfissao(precosProfissao, 'contratado'),
    precosPorEspecialidade: mapPrecosEspecialidade(precosEspecialidade, 'contratado'),
    excedentePrecosPorProfissao: excedenteProfissao.length > 0 ? excedenteProfissao : null,
    excedentePrecosPorEspecialidade:
      excedenteEspecialidade.length > 0 ? excedenteEspecialidade : null,
    especialidadesAutorizadas: especialidades.map((row) => row.especialidade_id),
  }
}

export function mapContratoRow(
  contrato: ContratoRow,
  especialidades: EspecialidadeAutorizadaRow[],
  precosProfissao: PrecoProfissaoRow[],
  precosEspecialidade: PrecoEspecialidadeRow[],
  modalidade: AdminClienteContratoTipo,
): AdminClienteContratoDto {
  const percentual =
    contrato.percentual_utilizado == null
      ? null
      : Number.parseFloat(String(contrato.percentual_utilizado))

  return {
    id: contrato.id,
    numero: contrato.numero ?? undefined,
    dataAssinatura: formatIsoDateToBrazilian(contrato.data_assinatura) ?? '',
    dataEncerramento: formatIsoDateToBrazilian(contrato.data_encerramento),
    tipo: contrato.tipo,
    modalidade,
    status: contrato.status,
    percentualUtilizado: Number.isFinite(percentual) ? percentual : null,
    consultasRealizadas: contrato.consultas_realizadas,
    detalhes: buildContratoDetalhes(
      contrato,
      especialidades,
      precosProfissao,
      precosEspecialidade,
    ),
  }
}

export function mapEntidadeRow(
  row: EntidadeRow,
  contratos: AdminClienteContratoDto[],
  logoUrl?: string,
): AdminClienteRowDto {
  const contatoContrato = row.contato_contrato ? mapContact(row.contato_contrato) : undefined

  return {
    id: row.id,
    prefeitura: row.nome_exibicao,
    subtitle: row.subtitulo,
    razaoSocial: row.razao_social,
    cnpj: row.cnpj,
    municipio: row.municipio,
    uf: row.uf,
    gestor: mapContact(row.gestor),
    ...(contatoContrato && contatoContrato.name ? { contatoContrato } : {}),
    contatoTi: mapContact(row.contato_ti),
    contatoSaude: mapContact(row.contato_saude),
    status: row.status_cliente,
    logoHue: row.logo_hue,
    ...(logoUrl ? { logoUrl } : {}),
    contratos,
  }
}

export function formatRelativeTimeAgo(isoDate: string): string {
  const timestamp = Date.parse(isoDate)
  if (Number.isNaN(timestamp)) return 'recentemente'

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60_000))

  if (diffMinutes < 60) return `há ${diffMinutes} min`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `há ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `há ${diffDays} dia${diffDays === 1 ? '' : 's'}`
}

export function escapeIlikeTerm(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}
