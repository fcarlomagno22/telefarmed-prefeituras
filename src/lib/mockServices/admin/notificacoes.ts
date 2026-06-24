import type {
  AdminBroadcast,
  AdminNotificationPriority,
  AdminNotificationTargetSnapshot,
} from '../../../data/adminNotificacoesMock'
import { adminBroadcastsInitial, buildRecipientSummary } from '../../../data/adminNotificacoesMock'
import {
  adminNotificacaoPrefeituras,
  adminNotificacaoUbts,
} from '../../../data/adminNotificacoesRecipients'
import { adminDoctors } from '../../../data/adminMedicosMock'
import { mockDelay } from '../delay'

export class AdminNotificacoesApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'AdminNotificacoesApiError'
    this.status = status
    this.code = code
  }
}

export type AdminNotificationKpisResponse = {
  monthlySendCount: number
  lastBroadcastPrefeituraCount: number
  lastBroadcastUbtCount: number
  importantUnreadCount: number
}

export type AdminRecipientPrefeitura = {
  id: string
  name: string
  municipality: string
  uf: string
  regionKey: string
}

export type AdminRecipientUbt = {
  id: string
  name: string
  prefeituraId: string
  prefeituraName: string
  municipality: string
  uf: string
  regionKey: string
}

export type AdminRecipientPrefeituraUser = {
  id: string
  name: string
  role: string
  accessLevel: string
  prefeituraId: string
  prefeituraName: string
  municipality: string
  uf: string
}

export type AdminRecipientUbtUser = {
  id: string
  name: string
  role: string
  isUnitResponsible: boolean
  unidadeId: string
  unidadeName: string
  prefeituraId: string
  prefeituraName: string
  municipality: string
  uf: string
}

export type AdminRecipientProfissional = {
  id: string
  name: string
  specialty: string
  councilRegistration: string | null
}

export type AdminBroadcastListResponse = {
  broadcasts: AdminBroadcast[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type CreateAdminBroadcastPayload = {
  title: string
  body: string
  priority: AdminNotificationPriority
  targets: Array<
    | {
        channel: 'prefeitura' | 'ubt'
        mode: 'all' | 'selected' | 'users'
        recipientIds?: string[]
        userIds?: string[]
      }
    | {
        channel: 'medico'
        mode: 'all'
        audienceScope: 'medico_all' | 'medico_plantao' | 'medico_especialidade'
        specialtyFilter?: string
      }
    | {
        channel: 'medico'
        mode: 'users'
        userIds: string[]
      }
    | {
        channel: 'paciente_app'
        mode: 'all' | 'selected'
        entidadeIds?: string[]
      }
  >
}

export type AdminRecipientProfissionaisStats = {
  totalAtivos: number
  emPlantao: number
  especialidades: Array<{
    id: string
    name: string
    activeCount: number
  }>
}

let broadcastsState: AdminBroadcast[] = JSON.parse(JSON.stringify(adminBroadcastsInitial))

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function isAdminNotificacoesApiError(error: unknown): error is AdminNotificacoesApiError {
  return error instanceof AdminNotificacoesApiError
}

export async function fetchAdminNotificationKpis(_accessToken: string) {
  void _accessToken
  const last = broadcastsState[0]
  const lastPrefeituraCount =
    last?.targets
      .filter((target) => target.channel === 'prefeitura')
      .reduce((sum, target) => sum + target.count, 0) ?? 0
  const lastUbtCount =
    last?.targets.filter((target) => target.channel === 'ubt').reduce((sum, target) => sum + target.count, 0) ??
    0
  return mockDelay(
    {
      monthlySendCount: broadcastsState.length,
      lastBroadcastPrefeituraCount: lastPrefeituraCount,
      lastBroadcastUbtCount: lastUbtCount,
      importantUnreadCount: broadcastsState.filter((item) => item.priority === 'important').length,
    } as AdminNotificationKpisResponse,
    60,
  )
}

export async function fetchAdminBroadcasts(
  _accessToken: string,
  params?: { search?: string; page?: number; pageSize?: number },
) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const search = params?.search?.trim().toLowerCase()
  const filtered = broadcastsState.filter((item) => {
    if (!search) return true
    return [item.title, item.body, item.recipientSummary].some((value) =>
      value.toLowerCase().includes(search),
    )
  })
  const start = (page - 1) * pageSize
  return mockDelay(
    {
      broadcasts: clone(filtered.slice(start, start + pageSize)),
      page,
      pageSize,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    } as AdminBroadcastListResponse,
    60,
  )
}

export async function fetchAdminRecipientPrefeituras(
  _accessToken: string,
  params?: { uf?: string; municipality?: string },
) {
  return mockDelay(
    clone(
      adminNotificacaoPrefeituras
        .filter((item) => !params?.uf || item.uf === params.uf)
        .filter((item) => !params?.municipality || item.id === params.municipality)
        .map((item) => ({
          id: item.id,
          name: item.name,
          municipality: item.municipio,
          uf: item.uf,
          regionKey: 'centro',
        })),
    ),
    60,
  )
}

export async function fetchAdminRecipientUbts(
  _accessToken: string,
  params?: { uf?: string; municipality?: string; prefeituraId?: string },
) {
  return mockDelay(
    clone(
      adminNotificacaoUbts
        .filter((item) => !params?.prefeituraId || item.municipalityId === params.prefeituraId)
        .filter((item) => !params?.municipality || item.municipalityId === params.municipality)
        .map((item) => ({
          id: item.id,
          name: item.name,
          prefeituraId: item.municipalityId,
          prefeituraName: item.municipalityName,
          municipality: item.municipalityName,
          uf: params?.uf ?? 'DF',
          regionKey: item.regionKey,
        })),
    ),
    60,
  )
}

export async function fetchAdminRecipientProfissionaisStats(_accessToken: string) {
  void _accessToken
  const ativos = adminDoctors.filter((item) => item.status === 'ativo')
  const bySpecialty = new Map<string, number>()
  ativos.forEach((doctor) => bySpecialty.set(doctor.specialty, (bySpecialty.get(doctor.specialty) ?? 0) + 1))
  return mockDelay(
    {
      totalAtivos: ativos.length,
      emPlantao: ativos.filter((item) => item.onCallLabel.trim()).length,
      especialidades: Array.from(bySpecialty.entries()).map(([name, activeCount], index) => ({
        id: `esp-${index}`,
        name,
        activeCount,
      })),
    } as AdminRecipientProfissionaisStats,
    60,
  )
}

export async function fetchAdminRecipientProfissionais(
  _accessToken: string,
  params?: { search?: string; specialty?: string },
) {
  void _accessToken
  const search = params?.search?.trim().toLowerCase()
  const specialty = params?.specialty?.trim().toLowerCase()

  const rows: AdminRecipientProfissional[] = adminDoctors
    .filter((item) => item.status === 'ativo')
    .filter((item) => {
      if (specialty && item.specialty.toLowerCase() !== specialty) return false
      if (!search) return true
      const haystack = `${item.name} ${item.specialty} ${item.crm} ${item.ufCrm}`.toLowerCase()
      return haystack.includes(search)
    })
    .map((item) => ({
      id: item.id,
      name: item.name,
      specialty: item.specialty,
      councilRegistration: item.crm ? `${item.crm}-${item.ufCrm}` : null,
    }))

  return mockDelay(clone(rows), 60)
}

export async function fetchAdminRecipientPrefeituraUsers(
  _accessToken: string,
  params?: { uf?: string; municipality?: string; prefeituraId?: string; search?: string },
) {
  const users: AdminRecipientPrefeituraUser[] = adminNotificacaoPrefeituras.map((item, index) => ({
    id: `pref-user-${index}`,
    name: `${item.name} Gestor ${index + 1}`,
    role: 'Gestor municipal',
    accessLevel: 'administrador',
    prefeituraId: item.id,
    prefeituraName: item.name,
    municipality: item.municipio,
    uf: item.uf,
  }))
  const search = params?.search?.trim().toLowerCase()
  return mockDelay(
    clone(
      users.filter((item) => {
        if (params?.prefeituraId && item.prefeituraId !== params.prefeituraId) return false
        if (params?.municipality && item.prefeituraId !== params.municipality) return false
        if (params?.uf && item.uf !== params.uf) return false
        if (search && ![item.name, item.prefeituraName, item.role].some((value) => value.toLowerCase().includes(search))) {
          return false
        }
        return true
      }),
    ),
    60,
  )
}

export async function fetchAdminRecipientUbtUsers(
  _accessToken: string,
  params?: {
    uf?: string
    municipality?: string
    prefeituraId?: string
    unidadeId?: string
    search?: string
  },
) {
  const users: AdminRecipientUbtUser[] = adminNotificacaoUbts.map((item, index) => ({
    id: `ubt-user-${index}`,
    name: `Operador ${index + 1}`,
    role: index % 4 === 0 ? 'Responsável UBT' : 'Operador',
    isUnitResponsible: index % 4 === 0,
    unidadeId: item.id,
    unidadeName: item.name,
    prefeituraId: item.municipalityId,
    prefeituraName: item.municipalityName,
    municipality: item.municipalityName,
    uf: params?.uf ?? 'DF',
  }))
  const search = params?.search?.trim().toLowerCase()
  return mockDelay(
    clone(
      users.filter((item) => {
        if (params?.prefeituraId && item.prefeituraId !== params.prefeituraId) return false
        if (params?.municipality && item.prefeituraId !== params.municipality) return false
        if (params?.unidadeId && item.unidadeId !== params.unidadeId) return false
        if (search && ![item.name, item.unidadeName, item.role].some((value) => value.toLowerCase().includes(search))) {
          return false
        }
        return true
      }),
    ),
    60,
  )
}

export async function createAdminBroadcast(
  _accessToken: string,
  payload: CreateAdminBroadcastPayload,
) {
  void _accessToken
  const targets: AdminNotificationTargetSnapshot[] = payload.targets.map((target) => {
    if (target.channel === 'paciente_app') {
      return {
        channel: 'paciente_app',
        mode: target.mode === 'all' ? 'all' : 'selected',
        recipientIds: target.entidadeIds ?? [],
        recipientLabels:
          target.mode === 'all'
            ? ['Todos os pacientes ativos do app']
            : [`${target.entidadeIds?.length ?? 0} município(s)`],
        count: target.mode === 'all' ? 1280 : (target.entidadeIds?.length ?? 0) * 240,
      }
    }
    if (target.channel === 'medico') {
      if (target.mode === 'users') {
        const selected = adminDoctors.filter(
          (item) => item.status === 'ativo' && target.userIds.includes(item.id),
        )
        return {
          channel: 'medico',
          mode: 'users',
          userIds: target.userIds,
          recipientIds: [],
          recipientLabels: selected.slice(0, 5).map((item) => item.name),
          count: selected.length,
        }
      }
      return {
        channel: 'medico',
        mode: 'all',
        audienceScope: target.audienceScope,
        specialtyFilter: target.specialtyFilter,
        recipientIds: [],
        recipientLabels: ['Profissionais ativos'],
        count: adminDoctors.filter((item) => item.status === 'ativo').length,
      }
    }
    const mode = target.mode
    if (target.channel === 'prefeitura') {
      const recipients =
        mode === 'all'
          ? adminNotificacaoPrefeituras
          : adminNotificacaoPrefeituras.filter((item) => target.recipientIds?.includes(item.id))
      return {
        channel: 'prefeitura',
        mode,
        recipientIds: target.recipientIds ?? [],
        userIds: target.userIds,
        recipientLabels: recipients.map((item) => item.name),
        count: recipients.length,
      }
    }
    const recipients =
      mode === 'all'
        ? adminNotificacaoUbts
        : adminNotificacaoUbts.filter((item) => target.recipientIds?.includes(item.id))
    return {
      channel: 'ubt',
      mode,
      recipientIds: target.recipientIds ?? [],
      userIds: target.userIds,
      recipientLabels: recipients.map((item) => item.name),
      count: recipients.length,
    }
  })

  const broadcast: AdminBroadcast = {
    id: `adm-n-${Date.now()}`,
    title: payload.title,
    body: payload.body,
    sentAt: new Date().toISOString(),
    priority: payload.priority,
    sentBy: 'Admin Mock',
    targets,
    recipientCount: targets.reduce((sum, item) => sum + item.count, 0),
    recipientSummary: buildRecipientSummary(targets),
  }
  broadcastsState = [broadcast, ...broadcastsState]
  return mockDelay(clone(broadcast), 80)
}

export type { AdminNotificationTargetSnapshot }
