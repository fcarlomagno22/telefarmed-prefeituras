import {
  formatCpfDisplay,
  formatLastAccessLabel,
} from '../admin-credenciais/formatters.js'
import { formatIsoDateToBrazilian } from '../admin-pacientes/formatters.js'
import type { EspecialidadeRegistrada } from './especialidades.service.js'
import type {
  CandidaturaDocumentoRow,
  CandidaturaEmpresaRow,
  CandidaturaListagemRow,
  CandidaturaTimelineRow,
  DbCandidaturaStatus,
  FormacaoCandidatura,
  ProfissionalAtivoRow,
  UiCandidaturaStatus,
} from './types.js'

const FORMACAO_LABEL: Record<FormacaoCandidatura, string> = {
  medicina: 'Medicina',
  psicologia: 'Psicologia',
  nutricao: 'Nutrição',
  fonoaudiologia: 'Fonoaudiologia',
}

const FORMACAO_PROFESSION: Record<FormacaoCandidatura, string> = {
  medicina: 'Médicos',
  psicologia: 'Psicólogos',
  nutricao: 'Nutricionistas',
  fonoaudiologia: 'Fonoaudiólogos',
}

const PROFESSION_FORMACAO: Record<string, FormacaoCandidatura> = {
  Médicos: 'medicina',
  Psicólogos: 'psicologia',
  Nutricionistas: 'nutricao',
  Fonoaudiólogos: 'fonoaudiologia',
}

export function uiStatusFromDb(status: DbCandidaturaStatus): UiCandidaturaStatus {
  switch (status) {
    case 'correcao_solicitada':
      return 'incompleto'
    case 'aprovada':
      return 'aprovado'
    case 'reprovada':
      return 'reprovado'
    default:
      return status
  }
}

export function dbStatusFromUiFilter(status: string): DbCandidaturaStatus | null {
  switch (status) {
    case 'incompleto':
      return 'correcao_solicitada'
    case 'aprovado':
      return 'aprovada'
    case 'reprovado':
      return 'reprovada'
    case 'pendente':
    case 'em_analise':
      return status
    default:
      return null
  }
}

export function formacaoFromProfession(profession: string): FormacaoCandidatura | null {
  return PROFESSION_FORMACAO[profession] ?? null
}

function readEnderecoField(endereco: Record<string, unknown> | null, key: string): string {
  if (!endereco) return ''
  const value = endereco[key]
  return typeof value === 'string' ? value.trim() : ''
}

function addressSummary(endereco: Record<string, unknown>): string {
  const cidade = readEnderecoField(endereco, 'cidade')
  const uf = readEnderecoField(endereco, 'uf')
  if (cidade && uf) return `${cidade}/${uf}`
  return cidade || uf || '—'
}

function formatCouncilLabel(sigla: string): string {
  return sigla.trim().toUpperCase()
}

function formatCouncilRegistration(sigla: string | null, numero: string | null): string {
  if (!sigla || !numero) return ''
  return `${sigla.trim()} ${numero.trim()}`
}

function avatarFallbackUrl(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Profissional')}&background=ff6b00&color=fff`
}

export type CandidaturaDocumentoDto = {
  id: string
  kind: string
  label: string
  fileName: string
  uploadedAtLabel: string
  status: 'pendente' | 'aprovado' | 'reprovado'
  rejectReason?: string
  fileUrl?: string
  complementRequestedAtLabel?: string
}

export type CandidaturaDto = {
  id: string
  fullName: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  formation: FormacaoCandidatura
  formationLabel: string
  specialty: string
  specialties: EspecialidadeRegistrada[]
  councilLabel: string
  councilNumber: string
  councilUf: string
  rqe?: string
  professionalDescription: string
  addressSummary: string
  submittedAtLabel: string
  status: UiCandidaturaStatus
  assignedAnalyst?: string
  documents: CandidaturaDocumentoDto[]
  empresa: {
    status: CandidaturaEmpresaRow['status']
    cnpj?: string
    razaoSocial?: string
    municipio?: string
    uf?: string
  }
  timeline: Array<{
    id: string
    atLabel: string
    title: string
    detail?: string
    actor?: string
  }>
  accessCodeSentAtLabel?: string
  finalizedAtLabel?: string
}

export type AdminDoctorAttendanceDto = {
  id: string
  dateTimeLabel: string
  contractCity: string
  patientName: string
  durationMinutes: number
  documents: {
    id: string
    label: string
    fileName: string
    downloadUrl?: string
  }[]
}

export type AdminDoctorReviewDto = {
  id: string
  rating: number
  author: string
  comment: string
  createdAtLabel: string
}

export type AdminDoctorDto = {
  id: string
  name: string
  phone: string
  cpf: string
  rg: string
  crm: string
  ufCrm: string
  profession: string
  specialty: string
  specialties: EspecialidadeRegistrada[]
  avatarUrl: string
  zipCode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  allocation: 'nacional' | 'por_contrato'
  contractingEntity: {
    id: string
    razaoSocial: string
    municipality: string
    uf: string
  } | null
  onCallLabel: string
  status: 'ativo' | 'inativo'
  isOnlineNow: boolean
  totalPatientsThisMonth: number
  averageRating: number
  totalReviews: number
  lastLoginAt: string
  lastLogoutAt: string | null
  documents: []
  attendances: AdminDoctorAttendanceDto[]
  reviews: AdminDoctorReviewDto[]
  totalConsultations?: number
  completedConsultations?: number
  completionRate?: number
}

export function formatCandidaturaDocumento(
  row: CandidaturaDocumentoRow,
  fileUrl?: string,
): CandidaturaDocumentoDto {
  return {
    id: row.id,
    kind: row.tipo,
    label: row.rotulo,
    fileName: row.nome_arquivo,
    uploadedAtLabel: formatLastAccessLabel(row.criado_em),
    status: row.status,
    ...(row.motivo_reprovacao ? { rejectReason: row.motivo_reprovacao } : {}),
    ...(fileUrl ? { fileUrl } : {}),
    ...(row.complemento_solicitado_em
      ? { complementRequestedAtLabel: formatLastAccessLabel(row.complemento_solicitado_em) }
      : {}),
  }
}

export function formatCandidaturaListItem(
  row: CandidaturaListagemRow,
  specialties: EspecialidadeRegistrada[] = [],
): CandidaturaDto {
  const resolvedSpecialties =
    specialties.length > 0
      ? specialties
      : row.especialidade_nome.trim()
        ? [{ name: row.especialidade_nome.trim(), ...(row.rqe ? { rqe: row.rqe } : {}) }]
        : []

  return {
    id: row.id,
    fullName: row.nome_completo,
    cpf: formatCpfDisplay(row.cpf),
    email: row.email,
    phone: row.telefone ?? '',
    birthDate: formatIsoDateToBrazilian(row.data_nascimento),
    formation: row.formacao,
    formationLabel: FORMACAO_LABEL[row.formacao],
    specialty: resolvedSpecialties[0]?.name ?? row.especialidade_nome,
    specialties: resolvedSpecialties,
    councilLabel: formatCouncilLabel(row.conselho_sigla),
    councilNumber: row.conselho_numero,
    councilUf: row.conselho_uf,
    ...(row.rqe ? { rqe: row.rqe } : {}),
    professionalDescription: row.descricao_profissional,
    addressSummary: addressSummary(row.endereco),
    submittedAtLabel: formatLastAccessLabel(row.enviada_em ?? row.criado_em),
    status: uiStatusFromDb(row.status),
    ...(row.analista_nome ? { assignedAnalyst: row.analista_nome } : {}),
    documents: [],
    empresa: {
      status: (row.empresa_status as CandidaturaEmpresaRow['status']) ?? 'nao_informado',
      ...(row.empresa_cnpj ? { cnpj: row.empresa_cnpj } : {}),
      ...(row.empresa_razao_social ? { razaoSocial: row.empresa_razao_social } : {}),
    },
    timeline: [],
    ...(row.codigo_acesso_enviado_em
      ? { accessCodeSentAtLabel: formatLastAccessLabel(row.codigo_acesso_enviado_em) }
      : {}),
    ...(row.finalizada_em ? { finalizedAtLabel: formatLastAccessLabel(row.finalizada_em) } : {}),
  }
}

export function formatCandidaturaDetail(
  row: CandidaturaListagemRow,
  documentos: CandidaturaDocumentoDto[],
  empresa: CandidaturaEmpresaRow | null,
  timeline: CandidaturaTimelineRow[],
  specialties: EspecialidadeRegistrada[] = [],
): CandidaturaDto {
  const base = formatCandidaturaListItem(row, specialties)

  return {
    ...base,
    documents: documentos,
    empresa: empresa
      ? {
          status: empresa.status,
          ...(empresa.cnpj ? { cnpj: empresa.cnpj } : {}),
          ...(empresa.razao_social ? { razaoSocial: empresa.razao_social } : {}),
          ...(empresa.municipio ? { municipio: empresa.municipio } : {}),
          ...(empresa.uf ? { uf: empresa.uf } : {}),
        }
      : base.empresa,
    timeline: timeline.map((event) => ({
      id: event.id,
      atLabel: formatLastAccessLabel(event.criado_em),
      title: event.titulo,
      ...(event.detalhe ? { detail: event.detalhe } : {}),
      ...(event.autor_nome ? { actor: event.autor_nome } : {}),
    })),
  }
}

export function formatProfissionalAtivo(
  row: ProfissionalAtivoRow,
  avatarUrl?: string,
  specialties: EspecialidadeRegistrada[] = [],
  detail?: {
    attendances: AdminDoctorAttendanceDto[]
    reviews: AdminDoctorReviewDto[]
    totalConsultations: number
    completedConsultations: number
    completionRate: number
  },
): AdminDoctorDto {
  const resolvedSpecialties =
    specialties.length > 0
      ? specialties
      : row.especialidade_nome.trim()
        ? [{ name: row.especialidade_nome.trim(), ...(row.rqe ? { rqe: row.rqe } : {}) }]
        : []
  const endereco = row.endereco ?? {}
  const profession = row.formacao ? FORMACAO_PROFESSION[row.formacao] : 'Médicos'

  return {
    id: row.id,
    name: row.nome,
    phone: row.telefone ?? '',
    cpf: formatCpfDisplay(row.cpf),
    rg: row.rg ?? '',
    crm: formatCouncilRegistration(row.conselho_sigla, row.conselho_numero),
    ufCrm: row.conselho_uf ?? '',
    profession,
    specialty: resolvedSpecialties[0]?.name ?? row.especialidade_nome,
    specialties: resolvedSpecialties,
    avatarUrl: avatarUrl ?? avatarFallbackUrl(row.nome),
    zipCode: readEnderecoField(endereco, 'cep'),
    street: readEnderecoField(endereco, 'logradouro'),
    number: readEnderecoField(endereco, 'numero'),
    complement: readEnderecoField(endereco, 'complemento'),
    neighborhood: readEnderecoField(endereco, 'bairro'),
    city: readEnderecoField(endereco, 'cidade'),
    state: readEnderecoField(endereco, 'uf'),
    allocation: row.alocacao,
    contractingEntity:
      row.entidade_contratante_id && row.entidade_razao_social
        ? {
            id: row.entidade_contratante_id,
            razaoSocial: row.entidade_razao_social,
            municipality: row.entidade_municipio ?? '',
            uf: row.entidade_uf ?? '',
          }
        : null,
    onCallLabel: row.plantao_rotulo,
    status: row.status,
    isOnlineNow: Boolean(row.online_agora),
    totalPatientsThisMonth: row.pacientes_mes_atual,
    averageRating: Number(row.rating_media) || 0,
    totalReviews: row.rating_total,
    lastLoginAt: formatLastAccessLabel(row.ultimo_login_em),
    lastLogoutAt: null,
    documents: [],
    attendances: detail?.attendances ?? [],
    reviews: detail?.reviews ?? [],
    ...(detail
      ? {
          totalConsultations: detail.totalConsultations,
          completedConsultations: detail.completedConsultations,
          completionRate: detail.completionRate,
        }
      : {}),
  }
}

export function escapeIlikeTerm(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}
