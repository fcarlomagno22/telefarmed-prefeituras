export type OperationalStreamKind = 'fila.updated' | 'consulta.updated'

export type OperationalStreamEvent = {
  kind: OperationalStreamKind
  at: string
  entidadeContratanteId: string
  unidadeUbtId: string
  filaEsperaId?: string
  consultaId?: string
  status?: string
  action?: string
}

export type OperationalStreamPortal = 'ubt' | 'prefeitura' | 'admin'

export type OperationalStreamScope =
  | { portal: 'ubt'; unidadeUbtId: string; entidadeContratanteId: string }
  | { portal: 'prefeitura'; entidadeContratanteId: string; regionKey?: string | null }
  | { portal: 'admin'; entidadeFilterId?: string | null; regionKey?: string | null }
