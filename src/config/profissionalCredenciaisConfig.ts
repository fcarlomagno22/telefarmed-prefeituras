import type { PermissionAction } from './accessCredentials'

export const profissionalPortalPages = [
  { id: 'agenda', label: 'Agenda', route: '/profissional/agenda' },
  { id: 'atendimentos', label: 'Atendimentos', route: '/profissional/atendimentos' },
  { id: 'escala', label: 'Plantões', route: '/profissional/escala' },
  { id: 'financeiro', label: 'Financeiro', route: '/profissional/financeiro' },
  { id: 'avaliacao', label: 'Avaliação', route: '/profissional/avaliacao' },
  { id: 'suporte', label: 'Suporte', route: '/profissional/suporte' },
  { id: 'notificacoes', label: 'Notificações', route: '/profissional/notificacoes' },
  { id: 'perfil', label: 'Perfil', route: '/profissional/perfil' },
] as const

export type ProfissionalPortalPageId = (typeof profissionalPortalPages)[number]['id']

export type ProfissionalPagePermissions = Record<ProfissionalPortalPageId, PermissionAction[]>

export function emptyProfissionalPagePermissions(): ProfissionalPagePermissions {
  return Object.fromEntries(
    profissionalPortalPages.map((page) => [page.id, [] as PermissionAction[]]),
  ) as ProfissionalPagePermissions
}
