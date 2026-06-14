import type {
  AdminBroadcastDto,
  AdminBroadcastTargetSnapshot,
  AudienciaComunicado,
  OrigemComunicado,
  PortalNotificationDto,
  PrioridadeComunicado,
} from './types.js'
import { priorityToApi } from './priority.js'

type InboxRow = {
  comunicado_id: string
  titulo: string
  corpo: string
  prioridade: PrioridadeComunicado
  origem: OrigemComunicado
  audiencia: AudienciaComunicado
  unidade_ubt_id: string | null
  unidade_nome: string | null
  remetente_tipo: string
  remetente_nome: string
  especialidade_filtro: string | null
  destinatarios_resumo: string
  enviado_em: string
  lido_em: string | null
}

type SentRow = {
  id: string
  titulo: string
  corpo: string
  prioridade: PrioridadeComunicado
  origem: OrigemComunicado
  audiencia: AudienciaComunicado
  unidade_ubt_id: string | null
  remetente_nome: string
  especialidade_filtro: string | null
  destinatarios_resumo: string
  enviado_em: string
  unidade_nome?: string | null
}

function senderLabelFromRow(row: { remetente_tipo: string; remetente_nome: string; origem: OrigemComunicado }) {
  if (row.remetente_nome.trim()) return row.remetente_nome
  if (row.origem === 'telefarmed') return 'Telefarmed · Operações'
  if (row.origem === 'contract_manager') return 'Gestão municipal'
  if (row.origem === 'ubt') return 'Unidade UBT'
  return 'Sistema'
}

export function mapInboxRowToNotification(row: InboxRow): PortalNotificationDto {
  return {
    id: row.comunicado_id,
    direction: 'inbox',
    origin: row.origem,
    audience: row.audiencia,
    title: row.titulo,
    body: row.corpo,
    sentAt: row.enviado_em,
    readAt: row.lido_em,
    unitId: row.unidade_ubt_id ?? undefined,
    unitName: row.unidade_nome ?? undefined,
    senderLabel: senderLabelFromRow(row),
    recipientLabel: row.destinatarios_resumo || 'Você',
    priority: priorityToApi(row.prioridade),
    specialtyFilter: row.especialidade_filtro ?? undefined,
  }
}

export function mapSentRowToNotification(row: SentRow): PortalNotificationDto {
  return {
    id: row.id,
    direction: 'sent',
    origin: row.origem,
    audience: row.audiencia,
    title: row.titulo,
    body: row.corpo,
    sentAt: row.enviado_em,
    readAt: row.enviado_em,
    unitId: row.unidade_ubt_id ?? undefined,
    unitName: row.unidade_nome ?? undefined,
    senderLabel: row.remetente_nome || 'Você',
    recipientLabel: row.destinatarios_resumo || 'Destinatários',
    priority: priorityToApi(row.prioridade),
    specialtyFilter: row.especialidade_filtro ?? undefined,
  }
}

export function buildAdminRecipientSummary(targets: AdminBroadcastTargetSnapshot[]): string {
  const parts = targets
    .filter((target) => target.count > 0)
    .map((target) => {
      if (target.channel === 'medico') {
        return `${target.count} profissional${target.count === 1 ? '' : 'is'}`
      }
      const label = target.channel === 'prefeitura' ? 'prefeitura' : 'UBT'
      return `${target.count} ${label}${target.count === 1 ? '' : 's'}`
    })
  return parts.join(' · ') || '—'
}

export function mapAdminComunicadoRow(row: {
  id: string
  titulo: string
  corpo: string
  prioridade: PrioridadeComunicado
  remetente_nome: string
  alvos_snapshot: unknown
  destinatarios_resumo: string
  total_destinatarios: number
  enviado_em: string
}): AdminBroadcastDto {
  const targets = Array.isArray(row.alvos_snapshot)
    ? (row.alvos_snapshot as AdminBroadcastTargetSnapshot[])
    : []

  return {
    id: row.id,
    title: row.titulo,
    body: row.corpo,
    sentAt: row.enviado_em,
    priority: priorityToApi(row.prioridade),
    sentBy: row.remetente_nome,
    targets,
    recipientCount: row.total_destinatarios,
    recipientSummary: row.destinatarios_resumo || buildAdminRecipientSummary(targets),
  }
}
