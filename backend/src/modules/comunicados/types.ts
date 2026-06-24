export type PrioridadeComunicado = 'normal' | 'importante'
export type PrioridadeComunicadoApi = 'normal' | 'important'

export type OrigemComunicado = 'telefarmed' | 'contract_manager' | 'ubt' | 'profissional'

export type AudienciaComunicado =
  | 'contract_manager'
  | 'ubt_all'
  | 'ubt_responsible'
  | 'ubt_user'
  | 'medico_all'
  | 'medico_plantao'
  | 'medico_especialidade'

export type RemetenteComunicadoTipo = 'admin' | 'prefeitura' | 'ubt' | 'profissional' | 'sistema'

export type DestinatarioComunicadoTipo = 'usuario_prefeitura' | 'usuario_ubt' | 'profissional'

export type DestinatarioInsert = {
  tipo: DestinatarioComunicadoTipo
  usuarioPrefeituraId?: string
  usuarioUbtId?: string
  profissionalId?: string
  unidadeUbtId?: string | null
  rotuloDestinatario: string
}

export type ComunicadoInsertPayload = {
  titulo: string
  corpo: string
  prioridade: PrioridadeComunicado
  origem: OrigemComunicado
  audiencia: AudienciaComunicado
  entidadeContratanteId?: string | null
  unidadeUbtId?: string | null
  remetenteTipo: RemetenteComunicadoTipo
  remetenteAdminId?: string | null
  remetentePrefeituraId?: string | null
  remetenteUbtId?: string | null
  remetenteProfissionalId?: string | null
  remetenteNome: string
  especialidadeFiltro?: string | null
  alvosSnapshot: unknown
  destinatariosResumo: string
}

export type PortalNotificationDto = {
  id: string
  direction: 'inbox' | 'sent'
  origin: OrigemComunicado
  audience: AudienciaComunicado
  title: string
  body: string
  sentAt: string
  readAt: string | null
  unitId?: string
  unitName?: string
  senderLabel: string
  recipientLabel: string
  priority: PrioridadeComunicadoApi
  professionalId?: string
  senderProfessionalId?: string
  specialtyFilter?: string
}

export type PortalNotificationListResult = {
  notifications: PortalNotificationDto[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PortalNotificationKpis = {
  unreadCount: number
  inboxCount: number
  sentCount: number
  telefarmedInboxCount: number
  lastBroadcastUbtCount: number
}

export type AdminBroadcastTargetSnapshot = {
  channel: 'prefeitura' | 'ubt' | 'medico' | 'paciente_app'
  mode: 'all' | 'selected' | 'users'
  audienceScope?: 'medico_all' | 'medico_plantao' | 'medico_especialidade'
  specialtyFilter?: string
  recipientIds: string[]
  userIds?: string[]
  recipientLabels: string[]
  count: number
}

export type AdminBroadcastDto = {
  id: string
  title: string
  body: string
  sentAt: string
  priority: PrioridadeComunicadoApi
  sentBy: string
  targets: AdminBroadcastTargetSnapshot[]
  recipientCount: number
  recipientSummary: string
}
