import type { PrefeituraPortalPageId } from './prefeituraCredenciaisConfig'
import { prefeituraPortalPages } from './prefeituraCredenciaisConfig'
import type { PermissionAction } from './accessCredentials'
import type { PrefeituraAuthUser } from '../lib/mockAuth/prefeituraAuthMock'

const PREFEITURA_PATH_PREFIX = '/prefeitura'

export function resolvePrefeituraPageIdFromPath(pathname: string): PrefeituraPortalPageId | null {
  const normalized = pathname.startsWith(PREFEITURA_PATH_PREFIX)
    ? pathname.slice(PREFEITURA_PATH_PREFIX.length) || '/'
    : pathname

  const segment = normalized.replace(/^\//, '').split('/')[0] ?? ''

  if (!segment || segment === 'entrando') return null

  const pathAliases: Record<string, PrefeituraPortalPageId> = {
    dashboard: 'dashboard',
    rede: 'rede',
    monitor: 'monitor',
    consultas: 'consultas',
    agendas: 'agendas',
    agenda: 'agendas',
    usuarios: 'usuarios',
    contrato: 'contrato',
    relatorios: 'relatorios',
    notificacoes: 'notificacoes',
    alertas: 'notificacoes',
    suporte: 'suporte',
    credenciais: 'credenciais',
    auditoria: 'auditoria',
  }

  return pathAliases[segment] ?? null
}

export function prefeituraUserIsAdministrador(user: PrefeituraAuthUser | null | undefined): boolean {
  return user?.accessLevel === 'administrador'
}

export function prefeituraUserCan(
  user: PrefeituraAuthUser | null | undefined,
  page: PrefeituraPortalPageId,
  action: PermissionAction,
): boolean {
  if (!user) return false
  if (prefeituraUserIsAdministrador(user)) return true
  return user.pagePermissions[page]?.includes(action) ?? false
}

export function prefeituraUserCanViewPage(
  user: PrefeituraAuthUser | null | undefined,
  page: PrefeituraPortalPageId,
): boolean {
  return prefeituraUserCan(user, page, 'visualizar')
}

export function resolveDefaultPrefeituraHomePath(
  user: PrefeituraAuthUser | null | undefined,
): string {
  if (!user) return '/prefeitura/dashboard'

  const preferred = prefeituraPortalPages.find((page) => prefeituraUserCanViewPage(user, page.id))
  return preferred?.route ?? '/prefeitura/dashboard'
}

export function resolveFirstAccessiblePrefeituraPath(
  user: PrefeituraAuthUser | null | undefined,
): string | null {
  if (!user) return null
  if (prefeituraUserIsAdministrador(user)) return '/prefeitura/dashboard'

  const page = prefeituraPortalPages.find((candidate) =>
    prefeituraUserCanViewPage(user, candidate.id),
  )
  return page?.route ?? null
}

export function filterPrefeituraSidebarSections<
  T extends { items: { to: string }[] },
>(user: PrefeituraAuthUser | null | undefined, sections: T[]): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const pageId = resolvePrefeituraPageIdFromPath(item.to)
        if (!pageId) return true
        return prefeituraUserCanViewPage(user, pageId)
      }),
    }))
    .filter((section) => section.items.length > 0)
}
