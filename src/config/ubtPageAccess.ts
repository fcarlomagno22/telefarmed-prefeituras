import type { SystemPageId } from './accessCredentials'
import { systemPages } from './accessCredentials'
import type { PermissionAction } from './accessCredentials'
import type { UbtAuthUser } from '../lib/mockAuth/ubtAuthMock'
import { ubtRoutes } from './ubtRoutes'
import { getDedicatedPortal } from './portalHost'

const UBT_LEGACY_PREFIX = '/ubt'

function normalizeUbtPathname(pathname: string): string {
  if (getDedicatedPortal() === 'ubt') return pathname
  if (pathname.startsWith(UBT_LEGACY_PREFIX)) {
    return pathname.slice(UBT_LEGACY_PREFIX.length) || '/'
  }
  return pathname
}

export function resolveUbtPageIdFromPath(pathname: string): SystemPageId | null {
  const normalized = normalizeUbtPathname(pathname)

  const segment = normalized.replace(/^\//, '').split('/')[0] ?? ''

  if (!segment || segment === 'entrando') return null

  const pathAliases: Record<string, SystemPageId> = {
    triagem: 'triagem',
    home: 'triagem',
    dashboard: 'triagem',
    agenda: 'agenda',
    consultas: 'consultas',
    usuarios: 'usuarios',
    notificacoes: 'notificacoes',
    suporte: 'suporte',
    credenciais: 'credenciais',
    auditoria: 'auditoria',
    'sala-de-espera': 'triagem',
    atendimento: 'triagem',
  }

  return pathAliases[segment] ?? null
}

export function ubtUserIsAdministrador(user: UbtAuthUser | null | undefined): boolean {
  return user?.accessLevel === 'administrador'
}

export function ubtUserCan(
  user: UbtAuthUser | null | undefined,
  page: SystemPageId,
  action: PermissionAction,
): boolean {
  if (!user) return false
  if (ubtUserIsAdministrador(user)) return true
  return user.systemPermissions[page]?.includes(action) ?? false
}

export function ubtUserCanViewPage(
  user: UbtAuthUser | null | undefined,
  page: SystemPageId,
): boolean {
  return ubtUserCan(user, page, 'visualizar')
}

export function resolveDefaultUbtHomePath(user: UbtAuthUser | null | undefined): string {
  if (!user) return ubtRoutes.agenda

  const preferred = systemPages.find((page) => ubtUserCanViewPage(user, page.id))
  return preferred?.route ?? ubtRoutes.agenda
}

export function resolveFirstAccessibleUbtPath(user: UbtAuthUser | null | undefined): string | null {
  if (!user) return null
  if (ubtUserIsAdministrador(user)) return ubtRoutes.agenda

  const page = systemPages.find((candidate) => ubtUserCanViewPage(user, candidate.id))
  return page?.route ?? null
}

export function filterUbtSidebarItems<
  T extends { to: string },
>(user: UbtAuthUser | null | undefined, items: T[]): T[] {
  return items.filter((item) => {
    const pageId = resolveUbtPageIdFromPath(item.to)
    if (!pageId) return true
    return ubtUserCanViewPage(user, pageId)
  })
}
