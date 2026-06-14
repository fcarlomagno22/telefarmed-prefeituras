export type AuditoriaPortal = 'admin' | 'prefeitura' | 'ubt' | 'profissional' | 'atendimento'

export type AuditoriaAcessoAcao =
  | 'login_sucesso'
  | 'login_falha'
  | 'logout'
  | 'refresh'
  | 'sessao_revogada'

export type AuditoriaEventoAcao = 'visualizar' | 'inserir' | 'editar' | 'excluir' | 'acao_sensivel'

export type AuditActorContext = {
  portal: AuditoriaPortal
  atorId: string | null
  atorNome: string
  atorTipo: string
  cpf?: string
  entidadeContratanteId?: string | null
  unidadeUbtId?: string | null
  profissionalId?: string | null
  prefeituraName?: string | null
  ubtName?: string | null
  actorRole?: string
}

export type AuditLogEntryDto = {
  id: string
  kind: 'acesso' | 'evento'
  createdAt: string
  platform: AuditoriaPortal | 'atendimento'
  prefeituraName: string | null
  ubtName: string | null
  severity: 'info' | 'warning' | 'critical'
  dateTime: string
  userName: string
  userRole: string
  actionLabel: string
  httpMethod: string
  actionTone: 'create' | 'view' | 'update' | 'delete' | 'auth'
  moduleName: string
  pagePath: string
  resourceLabel: string
  resourceId: string
  serverResponse: string
  serverResponseTone: 'success' | 'error' | 'warning'
  ipAddress: string
  deviceInfo: string
}

export type AuditoriaSummaryDto = {
  totalEvents: number
  criticalEvents: number
  activeUsers: number
  totalAcessos: number
}

export type ListAuditoriaQuery = {
  limit?: number
  offset?: number
  search?: string
  portal?: AuditoriaPortal
  from?: string
  to?: string
  atorId?: string
  entidadeContratanteId?: string
  unidadeUbtId?: string
  acao?: string
  pagina?: string
  recursoTipo?: string
  recursoId?: string
}

export type AuditoriaScopeFilter = {
  mode: 'admin' | 'prefeitura' | 'ubt'
  entidadeContratanteId?: string
  unidadeUbtId?: string
  /** UBTs vinculadas à prefeitura (escopo prefeitura). */
  unidadeUbtIds?: string[]
  actorIds?: string[]
}
