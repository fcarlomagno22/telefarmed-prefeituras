export const queryKeys = {
  clinicoCatalog: (activeOnly = true) => ['clinico-catalog', { activeOnly }] as const,
  adminClinicoCatalog: (activeOnly = true) => ['admin-clinico-catalog', { activeOnly }] as const,
  contratoCatalog: () => ['contrato-catalog'] as const,
  prefeituraUnits: () => ['prefeitura-units'] as const,
  prefeituraRedeOverview: () => ['prefeitura-rede-overview'] as const,
  prefeituraUbtOptions: () => ['prefeitura-ubt-options'] as const,
  adminUbtOptions: () => ['admin-ubt-options'] as const,
  prefeituraContratoSpecialtyIds: () => ['prefeitura-contrato-specialty-ids'] as const,
  ubtTriagemSpecialties: (dateKey: string) => ['ubt-triagem-specialties', dateKey] as const,
  profissionalPerfil: () => ['profissional', 'perfil'] as const,
  profissionalAgenda: (dateFrom: string, dateTo: string) =>
    ['profissional', 'agenda', dateFrom, dateTo] as const,
  profissionalEscala: (dateFrom?: string, dateTo?: string) =>
    ['profissional', 'escala', dateFrom ?? '', dateTo ?? ''] as const,
  profissionalAtendimentos: (
    filters: unknown,
    page: number,
    pageSize: number,
  ) => ['profissional', 'atendimentos', { filters, page, pageSize }] as const,
  profissionalAvaliacao: (query: unknown) => ['profissional', 'avaliacao', query] as const,
  profissionalFinanceiroBase: () => ['profissional', 'financeiro', 'base'] as const,
  profissionalFinanceiroDetail: (competenceKey: string) =>
    ['profissional', 'financeiro', 'detail', competenceKey] as const,
  profissionalNotificacoes: (filters: unknown) =>
    ['profissional', 'notificacoes', filters] as const,
  profissionalNotificacoesKpis: () => ['profissional', 'notificacoes', 'kpis'] as const,
  portalSuporteKpis: (variant: string) => ['portal', 'suporte', variant, 'kpis'] as const,
  portalSuporteTickets: (variant: string, query: unknown) =>
    ['portal', 'suporte', variant, 'tickets', query] as const,
} as const
