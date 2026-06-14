import type { PermissionAction } from './accessCredentials'
import { profissionalRoutes } from './profissionalRoutes'

export const profissionalPortalPages = [
  {
    id: 'agenda' as const,
    label: 'Agenda',
    get route() {
      return profissionalRoutes.agenda
    },
  },
  {
    id: 'atendimentos' as const,
    label: 'Atendimentos',
    get route() {
      return profissionalRoutes.atendimentos
    },
  },
  {
    id: 'escala' as const,
    label: 'Plantões',
    get route() {
      return profissionalRoutes.escala
    },
  },
  {
    id: 'financeiro' as const,
    label: 'Financeiro',
    get route() {
      return profissionalRoutes.financeiro
    },
  },
  {
    id: 'avaliacao' as const,
    label: 'Avaliação',
    get route() {
      return profissionalRoutes.avaliacao
    },
  },
  {
    id: 'suporte' as const,
    label: 'Suporte',
    get route() {
      return profissionalRoutes.suporte
    },
  },
  {
    id: 'notificacoes' as const,
    label: 'Notificações',
    get route() {
      return profissionalRoutes.notificacoes
    },
  },
  {
    id: 'perfil' as const,
    label: 'Perfil',
    get route() {
      return profissionalRoutes.perfil
    },
  },
]

export type ProfissionalPortalPageId = (typeof profissionalPortalPages)[number]['id']

export type ProfissionalPagePermissions = Record<ProfissionalPortalPageId, PermissionAction[]>

export function emptyProfissionalPagePermissions(): ProfissionalPagePermissions {
  return Object.fromEntries(
    profissionalPortalPages.map((page) => [page.id, [] as PermissionAction[]]),
  ) as ProfissionalPagePermissions
}
