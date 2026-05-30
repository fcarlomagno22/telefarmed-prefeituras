/** Portal onde o evento foi registrado. */
export type AuditLogPlatform = 'ubt' | 'prefeitura' | 'admin' | 'atendimento'

/** Escopo de visualização da página de auditoria. */
export type AuditLogScope = 'ubt' | 'prefeitura' | 'admin'

/** Coluna de cliente/unidade na tabela de logs. */
export type AuditLogTenantColumnMode = 'none' | 'ubt' | 'full'
