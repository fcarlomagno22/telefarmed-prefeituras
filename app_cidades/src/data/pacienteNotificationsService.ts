import AsyncStorage from '@react-native-async-storage/async-storage'
import { appEnv } from '../config/env'
import type { PacienteNotification, PacienteNotificationPriority } from '../types/pacienteNotification'
import { cpfDigits } from '../utils/cpf'

const LOCAL_DELETED_KEY = '@telefarmed/paciente-notifications-deleted'
const LOCAL_READ_KEY = '@telefarmed/paciente-notifications-read'

type RemoteNotificationRow = {
  id: string
  titulo: string
  corpo: string
  prioridade: PacienteNotificationPriority
  remetente_nome: string
  enviado_em: string
  lido_em: string | null
  excluido_em: string | null
}

function isRemoteConfigured() {
  return Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey)
}

function remoteHeaders(prefer?: string) {
  return {
    apikey: appEnv.supabaseAnonKey,
    Authorization: `Bearer ${appEnv.supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  }
}

function mapRow(row: RemoteNotificationRow): PacienteNotification {
  return {
    id: row.id,
    title: row.titulo,
    body: row.corpo,
    priority: row.prioridade === 'importante' ? 'important' : 'normal',
    senderLabel: row.remetente_nome,
    sentAt: row.enviado_em,
    readAt: row.lido_em,
  }
}

function localKey(cpf: string, suffix: string) {
  return `${suffix}:${cpfDigits(cpf)}`
}

async function readLocalIdSet(cpf: string, suffix: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(localKey(cpf, suffix))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

async function writeLocalIdSet(cpf: string, suffix: string, ids: Set<string>) {
  await AsyncStorage.setItem(localKey(cpf, suffix), JSON.stringify(Array.from(ids)))
}

async function fetchRemoteNotifications(cpf: string): Promise<PacienteNotification[]> {
  const normalizedCpf = cpfDigits(cpf)
  if (!normalizedCpf || !isRemoteConfigured()) return []

  const url =
    `${appEnv.supabaseUrl}/rest/v1/paciente_app_notificacoes` +
    `?paciente_cpf=eq.${encodeURIComponent(normalizedCpf)}` +
    '&excluido_em=is.null' +
    '&select=id,titulo,corpo,prioridade,remetente_nome,enviado_em,lido_em,excluido_em' +
    '&order=enviado_em.desc'

  const response = await fetch(url, {
    headers: remoteHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Falha ao carregar notificações (${response.status}).`)
  }

  const rows = (await response.json()) as RemoteNotificationRow[]
  return rows.map(mapRow)
}

async function patchRemoteNotification(
  cpf: string,
  id: string,
  patch: Record<string, string | null>,
) {
  const normalizedCpf = cpfDigits(cpf)
  if (!normalizedCpf || !isRemoteConfigured()) return false

  const url =
    `${appEnv.supabaseUrl}/rest/v1/paciente_app_notificacoes` +
    `?id=eq.${encodeURIComponent(id)}` +
    `&paciente_cpf=eq.${encodeURIComponent(normalizedCpf)}`

  const response = await fetch(url, {
    method: 'PATCH',
    headers: remoteHeaders('return=minimal'),
    body: JSON.stringify(patch),
  })

  return response.ok
}

function applyLocalOverrides(
  notifications: PacienteNotification[],
  readIds: Set<string>,
  deletedIds: Set<string>,
): PacienteNotification[] {
  return notifications
    .filter((item) => !deletedIds.has(item.id))
    .map((item) =>
      readIds.has(item.id) && !item.readAt
        ? { ...item, readAt: new Date().toISOString() }
        : item,
    )
}

function buildMockPacienteNotifications(): PacienteNotification[] {
  const now = Date.now()
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  return [
    {
      id: 'mock-notif-1',
      title: 'Consulta confirmada',
      body:
        'Sua teleconsulta está marcada para amanhã às 14h. Acesse "Minhas consultas" para entrar na sala virtual no horário.',
      priority: 'important',
      senderLabel: 'Telefarmed',
      sentAt: new Date(now - 2 * hour).toISOString(),
      readAt: null,
    },
    {
      id: 'mock-notif-2',
      title: 'Novo conteúdo em Saúde Mental',
      body:
        'Adicionamos exercícios de respiração e atividades guiadas para ajudar no seu dia a dia. Confira na aba Saúde Mental.',
      priority: 'normal',
      senderLabel: 'Programa municipal',
      sentAt: new Date(now - 1 * day).toISOString(),
      readAt: null,
    },
    {
      id: 'mock-notif-3',
      title: 'Lembrete: atualize seu perfil',
      body:
        'Mantenha telefone e e-mail em dia para receber avisos de consultas e comunicados importantes da prefeitura.',
      priority: 'normal',
      senderLabel: 'Telefarmed',
      sentAt: new Date(now - 3 * day).toISOString(),
      readAt: new Date(now - 2 * day).toISOString(),
    },
    {
      id: 'mock-notif-4',
      title: 'Campanha de prevenção',
      body:
        'Junho é o mês de conscientização sobre saúde cardiovascular. Veja dicas rápidas na área Vida Saudável do app.',
      priority: 'normal',
      senderLabel: 'Secretaria de Saúde',
      sentAt: new Date(now - 5 * day).toISOString(),
      readAt: new Date(now - 4 * day).toISOString(),
    },
  ]
}

export async function listPacienteNotifications(cpf: string): Promise<PacienteNotification[]> {
  const normalizedCpf = cpfDigits(cpf)
  if (!normalizedCpf) return []

  const [remote, readIds, deletedIds] = await Promise.all([
    fetchRemoteNotifications(normalizedCpf).catch(() => [] as PacienteNotification[]),
    readLocalIdSet(normalizedCpf, LOCAL_READ_KEY),
    readLocalIdSet(normalizedCpf, LOCAL_DELETED_KEY),
  ])

  const merged = applyLocalOverrides(remote, readIds, deletedIds)
  if (merged.length > 0) return merged

  return applyLocalOverrides(buildMockPacienteNotifications(), readIds, deletedIds)
}

export async function countUnreadPacienteNotifications(cpf: string): Promise<number> {
  const notifications = await listPacienteNotifications(cpf)
  return notifications.filter((item) => !item.readAt).length
}

export async function markPacienteNotificationRead(cpf: string, id: string): Promise<void> {
  const normalizedCpf = cpfDigits(cpf)
  if (!normalizedCpf) return

  const readAt = new Date().toISOString()
  const patched = await patchRemoteNotification(normalizedCpf, id, { lido_em: readAt })

  if (!patched) {
    const readIds = await readLocalIdSet(normalizedCpf, LOCAL_READ_KEY)
    readIds.add(id)
    await writeLocalIdSet(normalizedCpf, LOCAL_READ_KEY, readIds)
  }
}

export async function markAllPacienteNotificationsRead(cpf: string): Promise<number> {
  const notifications = await listPacienteNotifications(cpf)
  const unread = notifications.filter((item) => !item.readAt)

  await Promise.all(unread.map((item) => markPacienteNotificationRead(cpf, item.id)))
  return unread.length
}

export async function deletePacienteNotification(cpf: string, id: string): Promise<void> {
  const normalizedCpf = cpfDigits(cpf)
  if (!normalizedCpf) return

  const deletedAt = new Date().toISOString()
  const patched = await patchRemoteNotification(normalizedCpf, id, { excluido_em: deletedAt })

  if (!patched) {
    const deletedIds = await readLocalIdSet(normalizedCpf, LOCAL_DELETED_KEY)
    deletedIds.add(id)
    await writeLocalIdSet(normalizedCpf, LOCAL_DELETED_KEY, deletedIds)
  }
}
