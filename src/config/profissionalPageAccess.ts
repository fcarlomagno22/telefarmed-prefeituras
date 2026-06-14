import type { ProfissionalPortalPageId } from './profissionalCredenciaisConfig'
import { profissionalPortalPages } from './profissionalCredenciaisConfig'
import type { PermissionAction } from './accessCredentials'
import type { ProfissionalAuthUser } from '../lib/services/profissional/auth'
import { profissionalRoutes } from './profissionalRoutes'

const PROFISSIONAL_PATH_PREFIX = '/profissional'

export function resolveProfissionalPageIdFromPath(
  pathname: string,
): ProfissionalPortalPageId | null {
  const normalized = pathname.startsWith(PROFISSIONAL_PATH_PREFIX)
    ? pathname.slice(PROFISSIONAL_PATH_PREFIX.length) || '/'
    : pathname

  const segment = normalized.replace(/^\//, '').split('/')[0] ?? ''

  if (!segment || segment === 'entrando') return null

  const pathAliases: Record<string, ProfissionalPortalPageId> = {
    agenda: 'agenda',
    atendimento: 'agenda',
    atendimentos: 'atendimentos',
    historico: 'atendimentos',
    escala: 'escala',
    financeiro: 'financeiro',
    avaliacao: 'avaliacao',
    suporte: 'suporte',
    notificacoes: 'notificacoes',
    perfil: 'perfil',
  }

  return pathAliases[segment] ?? null
}

export function profissionalUserCan(
  user: ProfissionalAuthUser | null | undefined,
  page: ProfissionalPortalPageId,
  action: PermissionAction,
): boolean {
  if (!user) return false
  return user.pagePermissions[page]?.includes(action) ?? false
}

export function profissionalUserCanViewPage(
  user: ProfissionalAuthUser | null | undefined,
  page: ProfissionalPortalPageId,
): boolean {
  return profissionalUserCan(user, page, 'visualizar')
}

export function resolveDefaultProfissionalHomePath(
  user: ProfissionalAuthUser | null | undefined,
): string {
  if (!user) return profissionalRoutes.agenda

  const preferred = profissionalPortalPages.find((page) =>
    profissionalUserCanViewPage(user, page.id),
  )
  return preferred?.route ?? profissionalRoutes.agenda
}

export function resolveFirstAccessibleProfissionalPath(
  user: ProfissionalAuthUser | null | undefined,
): string | null {
  if (!user) return null

  const page = profissionalPortalPages.find((candidate) =>
    profissionalUserCanViewPage(user, candidate.id),
  )
  return page?.route ?? null
}

export function filterProfissionalSidebarItems<
  T extends { to: string },
>(user: ProfissionalAuthUser | null | undefined, items: T[]): T[] {
  return items.filter((item) => {
    const pageId = resolveProfissionalPageIdFromPath(item.to)
    if (!pageId) return true
    return profissionalUserCanViewPage(user, pageId)
  })
}
