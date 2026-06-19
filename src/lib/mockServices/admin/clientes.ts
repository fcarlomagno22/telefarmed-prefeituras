import type {
  AdminClienteContact,
  AdminClienteContrato,
  AdminClienteContratoTipo,
  AdminClientePrecoEspecialidade,
  AdminClientePrecoProfissao,
  AdminClienteRow,
  AdminClienteStatus,
  AdminClientesTab,
} from '../../../data/adminClientesMock'
import {
  adminClientesRows,
  adminClientesSummary,
  filterAdminClientesByTab,
} from '../../../data/adminClientesMock'
import { adminConfiguracoesInitial } from '../../../data/adminConfiguracoesInitial'
import type { AdminClienteContratoAction } from '../../../components/admin/clientes/adminClienteContratoActions'
import type { AdminClienteUbtsResponse } from '../../../types/adminClienteUbts'
import type { TipoEntidade } from '../../../types/entidadeBranding'
import { mockDelay } from '../delay'

export class AdminClientesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminClientesApiError'
    this.status = status
    this.code = code
  }
}

export type ClientesSummaryResponse = {
  ativas: number
  ativasTrend: string
  implantacao: number
  implantacaoTrend: string
  prospects: number
  prospectsTrend: string
  suspensas: number
  suspensasTrend: string
  totalCadastrados: number
  ultimaAtualizacaoMunicipio: string
  ultimaAtualizacaoAgo: string
  porStatus: {
    ativas: number
    implantacao: number
    prospects: number
    suspensas: number
    semContrato: number
  }
}

export type ClinicoProfessionApi = {
  id: string
  name: string
  councilLabel: string
  councilAcronym: string
  active: boolean
  specialtyIds: string[]
}

export type ClinicoSpecialtyApi = {
  id: string
  name: string
  active: boolean
  professionIds: string[]
}

export type ClinicoCatalogResponse = {
  professions: ClinicoProfessionApi[]
  specialties: ClinicoSpecialtyApi[]
}

export type ClienteContratoTipoApi = {
  id: string
  label: string
  description: string
  modalidade: AdminClienteContratoTipo
}

export type ClienteContratoCatalogResponse = {
  contractTypes: ClienteContratoTipoApi[]
}

export type ListEntidadesParams = {
  search?: string
  status?: AdminClienteStatus | 'all'
  tab?: AdminClientesTab
}

export type CreateEntidadePayload = {
  pin: string
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  status: AdminClienteStatus
  tipoEntidade?: TipoEntidade
  logoHue?: number
  logoDataUrl?: string
  gestor: AdminClienteContact
  contatoContrato?: AdminClienteContact
  contatoTi: AdminClienteContact
  contatoSaude: AdminClienteContact
}

export type UpdateEntidadeContactsPayload = {
  pin: string
  gestor: AdminClienteContact
  contatoContrato?: AdminClienteContact
  contatoTi: AdminClienteContact
  contatoSaude: AdminClienteContact
}

export type UpdateEntidadePayload = {
  pin: string
  nome: string
  subtitulo: string
  razaoSocial: string
  cnpj: string
  municipio: string
  uf: string
  slug?: string
  tipoEntidade?: TipoEntidade
  logoHue?: number
  logoDataUrl?: string
}

export type UpdateEntidadeStatusPayload = {
  pin: string
  status: AdminClienteStatus
}

export type CreateContratoPayload = {
  pin: string
  numero?: string
  tipo: AdminClienteContratoTipo
  dataAssinatura: string
  dataEncerramento?: string | null
  consultasContratadas?: number | null
  permiteUltrapassar: boolean
  aceitaPacientesOutrosMunicipios?: boolean
  precosPorProfissao: AdminClientePrecoProfissao[]
  precosPorEspecialidade: AdminClientePrecoEspecialidade[]
  excedentePrecosPorProfissao?: AdminClientePrecoProfissao[] | null
  excedentePrecosPorEspecialidade?: AdminClientePrecoEspecialidade[] | null
  especialidadesAutorizadas: string[]
  contatoContrato?: AdminClienteContact
}

export type UpdateContratoPayload = Omit<CreateContratoPayload, 'contatoContrato'>

let entidadesState: AdminClienteRow[] = JSON.parse(JSON.stringify(adminClientesRows))

function ensureEntidade(entidadeId: string): AdminClienteRow {
  const row = entidadesState.find((item) => item.id === entidadeId)
  if (!row) {
    throw new AdminClientesApiError('Entidade não encontrada.', 404)
  }
  return row
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function isAdminClientesApiError(error: unknown): error is AdminClientesApiError {
  return error instanceof AdminClientesApiError
}

export async function fetchClientesSummary(_accessToken: string): Promise<ClientesSummaryResponse> {
  void _accessToken
  return mockDelay(clone(adminClientesSummary) as ClientesSummaryResponse, 60)
}

export async function fetchClientesClinicoCatalog(
  _accessToken: string,
  activeOnly = true,
): Promise<ClinicoCatalogResponse> {
  const professions = adminConfiguracoesInitial.professions
    .filter((item) => (activeOnly ? item.active : true))
    .map((item) => ({
      id: item.id,
      name: item.name,
      councilLabel: item.councilLabel,
      councilAcronym: item.councilAcronym,
      active: item.active,
      specialtyIds: item.specialtyIds,
    }))

  const specialties = adminConfiguracoesInitial.specialties
    .filter((item) => (activeOnly ? item.active : true))
    .map((item) => ({
      id: item.id,
      name: item.name,
      active: item.active,
      professionIds: item.professionIds,
    }))

  return mockDelay({ professions, specialties }, 60)
}

export async function fetchClientesContratoCatalog(
  _accessToken: string,
): Promise<ClienteContratoCatalogResponse> {
  void _accessToken
  return mockDelay(
    {
      contractTypes: adminConfiguracoesInitial.contractTypes.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        modalidade: item.id as AdminClienteContratoTipo,
      })),
    },
    60,
  )
}

export async function fetchClientesEntidades(
  _accessToken: string,
  params: ListEntidadesParams = {},
): Promise<AdminClienteRow[]> {
  const search = params.search?.trim().toLowerCase()
  let rows = clone(entidadesState)
  if (params.tab) rows = filterAdminClientesByTab(rows, params.tab)
  if (params.status && params.status !== 'all') rows = rows.filter((row) => row.status === params.status)
  if (search) {
    rows = rows.filter((row) =>
      [row.prefeitura, row.razaoSocial, row.municipio, row.cnpj].some((field) =>
        field.toLowerCase().includes(search),
      ),
    )
  }
  return mockDelay(rows, 70)
}

export async function fetchClienteEntidade(
  _accessToken: string,
  entidadeId: string,
): Promise<AdminClienteRow> {
  return mockDelay(clone(ensureEntidade(entidadeId)), 70)
}

export async function fetchClienteUbts(
  _accessToken: string,
  entidadeId: string,
): Promise<AdminClienteUbtsResponse> {
  void _accessToken
  const entidade = ensureEntidade(entidadeId)
  const response: AdminClienteUbtsResponse = {
    entidadeId: entidade.id,
    prefeitura: entidade.prefeitura,
    total: 2,
    ubts: [
      {
        id: `${entidade.id}-ubt-1`,
        name: 'UBT Central',
        region: 'Centro',
        regionKey: 'centro',
        status: 'ativa',
        statusLabel: 'Ativa',
        cnes: '1234567',
        unitType: 'Fixa',
        address: {
          formatted: `Av. Principal, 100 — Centro, ${entidade.municipio}/${entidade.uf}`,
          cep: '12345-678',
          street: 'Av. Principal',
          number: '100',
          complement: 'Sala 2',
          neighborhood: 'Centro',
          city: entidade.municipio,
          state: entidade.uf,
        },
        phone: '(11) 98765-4321',
        dailyCapacityLabel: '40 consultas/dia',
        specialtyNames: ['Clínico Geral', 'Pediatria'],
        stationsTotal: 4,
        stationsOnline: 3,
        maintenanceTerminals: 1,
        notes: 'Unidade principal da rede municipal.',
        responsible: {
          name: 'Maria Coordenadora',
          email: 'maria.ubt@prefeitura.local',
          cpf: '12345678901',
          phone: '(11) 91234-5678',
          credentialsConfigured: true,
        },
        operators: [
          { id: 'op-1', name: 'Ana Operadora', role: 'Operador' },
          { id: 'op-2', name: 'Bruno Operador', role: 'Operador' },
        ],
        metrics: {
          operatorsOnline: 2,
          stationsActive: 3,
          consultationsCompleted: 18,
          consultationsInProgress: 1,
          cancellationsToday: 0,
          avgConsultationMinutes: 12,
          queueNow: 2,
          consultationsToday: 19,
        },
      },
      {
        id: `${entidade.id}-ubt-2`,
        name: 'UBT Bairro Norte',
        region: 'Norte',
        regionKey: 'norte',
        status: 'manutencao',
        statusLabel: 'Manutenção',
        cnes: '7654321',
        unitType: 'Móvel',
        address: {
          formatted: `Rua das Flores, 50 — Bairro Norte, ${entidade.municipio}/${entidade.uf}`,
          cep: '87654-321',
          street: 'Rua das Flores',
          number: '50',
          complement: '',
          neighborhood: 'Bairro Norte',
          city: entidade.municipio,
          state: entidade.uf,
        },
        phone: '(11) 97654-3210',
        dailyCapacityLabel: '25 consultas/dia',
        specialtyNames: ['Clínico Geral'],
        stationsTotal: 2,
        stationsOnline: 0,
        maintenanceTerminals: 2,
        notes: 'Em manutenção programada até sexta-feira.',
        responsible: {
          name: 'João Responsável',
          email: 'joao.ubt@prefeitura.local',
          cpf: '98765432100',
          phone: '(11) 99876-5432',
          credentialsConfigured: false,
        },
        operators: [{ id: 'op-3', name: 'Carla Operadora', role: 'Operador' }],
        metrics: {
          operatorsOnline: 0,
          stationsActive: 0,
          consultationsCompleted: 0,
          consultationsInProgress: 0,
          cancellationsToday: 3,
          avgConsultationMinutes: 0,
          queueNow: 0,
          consultationsToday: 0,
        },
      },
    ],
  }
  return mockDelay(response, 120)
}

export async function createClienteEntidade(
  _accessToken: string,
  payload: CreateEntidadePayload,
): Promise<AdminClienteRow> {
  void _accessToken
  const row: AdminClienteRow = {
    id: `cli-${Date.now()}`,
    prefeitura: payload.nome,
    tipoEntidade: payload.tipoEntidade ?? 'prefeitura',
    subtitle: payload.subtitulo,
    razaoSocial: payload.razaoSocial,
    cnpj: payload.cnpj,
    municipio: payload.municipio,
    uf: payload.uf,
    gestor: payload.gestor,
    contatoContrato: payload.contatoContrato,
    contatoTi: payload.contatoTi,
    contatoSaude: payload.contatoSaude,
    status: payload.status,
    logoHue: payload.logoHue ?? 180,
    logoUrl: payload.logoDataUrl,
    contratos: [],
  }
  entidadesState = [row, ...entidadesState]
  return mockDelay(clone(row), 80)
}

export async function updateClienteEntidadeStatus(
  _accessToken: string,
  entidadeId: string,
  payload: UpdateEntidadeStatusPayload,
): Promise<AdminClienteRow> {
  const row = ensureEntidade(entidadeId)
  row.status = payload.status
  return mockDelay(clone(row), 70)
}

export async function updateClienteEntidadeContacts(
  _accessToken: string,
  entidadeId: string,
  payload: UpdateEntidadeContactsPayload,
): Promise<AdminClienteRow> {
  const row = ensureEntidade(entidadeId)
  row.gestor = payload.gestor
  row.contatoContrato = payload.contatoContrato
  row.contatoTi = payload.contatoTi
  row.contatoSaude = payload.contatoSaude
  return mockDelay(clone(row), 70)
}

export async function updateClienteEntidade(
  _accessToken: string,
  entidadeId: string,
  payload: UpdateEntidadePayload,
): Promise<AdminClienteRow> {
  const row = ensureEntidade(entidadeId)
  const normalizedCnpj = payload.cnpj.replace(/\D/g, '')
  const duplicate = entidadesState.find(
    (item) => item.id !== entidadeId && item.cnpj.replace(/\D/g, '') === normalizedCnpj,
  )
  if (duplicate) {
    throw new AdminClientesApiError('Já existe um cliente cadastrado com este CNPJ.', 409, 'DUPLICATE_CNPJ')
  }

  row.prefeitura = payload.nome.trim()
  row.subtitle = payload.subtitulo.trim()
  if (payload.tipoEntidade) row.tipoEntidade = payload.tipoEntidade
  row.razaoSocial = payload.razaoSocial.trim()
  row.cnpj = normalizedCnpj
  row.municipio = payload.municipio.trim()
  row.uf = payload.uf.trim().toUpperCase()
  if (payload.slug) {
    const normalizedSlug = payload.slug.trim().toLowerCase()
    const duplicateSlug = entidadesState.find(
      (item) => item.id !== entidadeId && item.slug?.trim().toLowerCase() === normalizedSlug,
    )
    if (duplicateSlug) {
      throw new AdminClientesApiError(
        'Este endereço já está em uso por outro cliente.',
        409,
        'DUPLICATE_SLUG',
      )
    }
    row.slug = normalizedSlug
  }
  if (payload.logoHue != null) row.logoHue = payload.logoHue
  if (payload.logoDataUrl) row.logoUrl = payload.logoDataUrl
  return mockDelay(clone(row), 70)
}

export async function deleteClienteContrato(
  _accessToken: string,
  contratoId: string,
  _pin: string,
): Promise<AdminClienteRow> {
  void _accessToken
  void _pin
  for (const entidade of entidadesState) {
    const next = entidade.contratos.filter((item) => item.id !== contratoId)
    if (next.length !== entidade.contratos.length) {
      entidade.contratos = next
      return mockDelay(clone(entidade), 70)
    }
  }
  throw new AdminClientesApiError('Contrato não encontrado.', 404)
}

export async function deleteClienteEntidade(
  _accessToken: string,
  entidadeId: string,
  _pin: string,
): Promise<void> {
  void _accessToken
  void _pin
  entidadesState = entidadesState.filter((item) => item.id !== entidadeId)
  return mockDelay(undefined, 70)
}

export async function createClienteContrato(
  _accessToken: string,
  entidadeId: string,
  payload: CreateContratoPayload,
): Promise<AdminClienteRow> {
  const row = ensureEntidade(entidadeId)
  const contrato: AdminClienteContrato = {
    id: `ctr-${Date.now()}`,
    numero: payload.numero,
    dataAssinatura: payload.dataAssinatura,
    dataEncerramento: payload.dataEncerramento ?? null,
    tipo: payload.tipo,
    modalidade:
      payload.tipo === 'mensal' || payload.tipo === 'pacote_fechado' || payload.tipo === 'sob_demanda'
        ? payload.tipo
        : 'pacote_fechado',
    status: 'ativo',
    percentualUtilizado: null,
    consultasRealizadas: null,
    detalhes: {
      consultasContratadas: payload.consultasContratadas ?? null,
      valorConsultaPacote: null,
      permiteUltrapassar: payload.permiteUltrapassar,
      aceitaPacientesOutrosMunicipios: payload.aceitaPacientesOutrosMunicipios ?? false,
      precosPorProfissao: payload.precosPorProfissao,
      precosPorEspecialidade: payload.precosPorEspecialidade,
      excedentePrecosPorProfissao: payload.excedentePrecosPorProfissao ?? null,
      excedentePrecosPorEspecialidade: payload.excedentePrecosPorEspecialidade ?? null,
      especialidadesAutorizadas: payload.especialidadesAutorizadas,
    },
  }
  row.contratos = [contrato, ...row.contratos]
  return mockDelay(clone(row), 80)
}

export async function updateClienteContratoStatus(
  _accessToken: string,
  contratoId: string,
  _pin: string,
  action: AdminClienteContratoAction,
): Promise<AdminClienteRow> {
  for (const entidade of entidadesState) {
    const contrato = entidade.contratos.find((item) => item.id === contratoId)
    if (!contrato) continue
    if (action === 'suspender') contrato.status = 'suspenso'
    if (action === 'reativar') contrato.status = 'ativo'
    if (action === 'encerrar') contrato.status = 'encerrado'
    return mockDelay(clone(entidade), 70)
  }
  throw new AdminClientesApiError('Contrato não encontrado.', 404)
}

export async function updateClienteContrato(
  _accessToken: string,
  contratoId: string,
  payload: UpdateContratoPayload,
): Promise<AdminClienteRow> {
  void _accessToken
  for (const entidade of entidadesState) {
    const contrato = entidade.contratos.find((item) => item.id === contratoId)
    if (!contrato) continue

    contrato.numero = payload.numero
    contrato.tipo = payload.tipo
    contrato.dataAssinatura = payload.dataAssinatura
    contrato.dataEncerramento = payload.dataEncerramento ?? null
    contrato.modalidade =
      payload.tipo === 'mensal' || payload.tipo === 'pacote_fechado' || payload.tipo === 'sob_demanda'
        ? payload.tipo
        : contrato.modalidade ?? 'pacote_fechado'
    contrato.detalhes = {
      consultasContratadas: payload.consultasContratadas ?? null,
      valorConsultaPacote: null,
      permiteUltrapassar: payload.permiteUltrapassar,
      aceitaPacientesOutrosMunicipios: payload.aceitaPacientesOutrosMunicipios ?? false,
      precosPorProfissao: payload.precosPorProfissao,
      precosPorEspecialidade: payload.precosPorEspecialidade,
      excedentePrecosPorProfissao: payload.excedentePrecosPorProfissao ?? null,
      excedentePrecosPorEspecialidade: payload.excedentePrecosPorEspecialidade ?? null,
      especialidadesAutorizadas: payload.especialidadesAutorizadas,
    }
    return mockDelay(clone(entidade), 70)
  }
  throw new AdminClientesApiError('Contrato não encontrado.', 404)
}

export async function createClienteUbt(
  accessToken: string,
  entidadeId: string,
  _payload: import('../../api/admin/clientes').ClienteUbtPayload,
): Promise<AdminClienteUbtsResponse> {
  void _payload
  return fetchClienteUbts(accessToken, entidadeId)
}

export async function updateClienteUbt(
  accessToken: string,
  entidadeId: string,
  _ubtId: string,
  _payload: Partial<import('../../api/admin/clientes').ClienteUbtPayload>,
): Promise<AdminClienteUbtsResponse> {
  void _ubtId
  void _payload
  return fetchClienteUbts(accessToken, entidadeId)
}

export async function deleteClienteUbt(
  accessToken: string,
  entidadeId: string,
  _ubtId: string,
): Promise<AdminClienteUbtsResponse> {
  void _ubtId
  return fetchClienteUbts(accessToken, entidadeId)
}

export type { AdminClienteContrato, AdminClienteRow }
