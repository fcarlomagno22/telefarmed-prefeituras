import type { AdminPortalPageId } from './adminCredenciaisConfig'
import { adminPortalPages } from './adminCredenciaisConfig'
import type { PermissionAction } from './accessCredentials'
import type { AdminAuthUser } from '../lib/mockAuth/adminAuthMock'
import { adminRoutes } from './adminRoutes'
import { isDedicatedPortal, isTenantGestaoHost } from './portalHost'

const ADMIN_LEGACY_PREFIX = '/admin'

function normalizeAdminPathname(pathname: string): string {
  if (isDedicatedPortal('admin')) return pathname
  if (isTenantGestaoHost()) return pathname
  if (pathname.startsWith(ADMIN_LEGACY_PREFIX)) {
    return pathname.slice(ADMIN_LEGACY_PREFIX.length) || '/'
  }
  return pathname
}

/** Mapeia rotas do painel admin para o ID da página nas permissões. */
export function resolveAdminPageIdFromPath(pathname: string): AdminPortalPageId | null {
  const normalized = normalizeAdminPathname(pathname)

  const segment = normalized.replace(/^\//, '').split('/')[0] ?? ''

  if (!segment || segment === 'entrando') return null

  const pathAliases: Record<string, AdminPortalPageId> = {
    dashboard: 'dashboard',
    clientes: 'clientes',
    'monitor-operacional': 'monitor',
    monitor: 'monitor',
    pessoas: 'pessoas',
    pacientes: 'pessoas',
    operadores: 'credenciais',
    medicos: 'profissionais',
    profissionais: 'profissionais',
    escala: 'gestaoEscala',
    'gestao-escala': 'gestaoEscala',
    financeiro: 'financeiro',
    notificacoes: 'notificacoes',
    suporte: 'suporte',
    auditoria: 'auditoria',
    credenciais: 'credenciais',
    configuracoes: 'configuracoes',
  }

  return pathAliases[segment] ?? null
}

export function adminUserCan(
  user: AdminAuthUser | null | undefined,
  page: AdminPortalPageId,
  action: PermissionAction,
): boolean {
  if (!user) return false
  if (user.isMaster) return true
  return user.pagePermissions[page]?.includes(action) ?? false
}

export function adminUserCanViewPage(
  user: AdminAuthUser | null | undefined,
  page: AdminPortalPageId,
): boolean {
  return adminUserCan(user, page, 'visualizar')
}

export function adminUserIsAdministrator(user: AdminAuthUser | null | undefined): boolean {
  return Boolean(user?.isMaster || user?.accessLevel === 'administrador')
}

export function resolveDefaultAdminHomePath(user: AdminAuthUser | null | undefined): string {
  if (!user) return adminRoutes.dashboard

  const preferred = adminPortalPages.find((page) => adminUserCanViewPage(user, page.id))
  return preferred?.route ?? adminRoutes.dashboard
}

export function resolveFirstAccessibleAdminPath(
  user: AdminAuthUser | null | undefined,
): string | null {
  if (!user) return null
  if (user.isMaster) return adminRoutes.dashboard

  const page = adminPortalPages.find((candidate) => adminUserCanViewPage(user, candidate.id))
  return page?.route ?? null
}

export function filterAdminSidebarSections<
  T extends { items: { to: string }[] },
>(user: AdminAuthUser | null | undefined, sections: T[]): T[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const pageId = resolveAdminPageIdFromPath(item.to)
        if (!pageId) return true
        return adminUserCanViewPage(user, pageId)
      }),
    }))
    .filter((section) => section.items.length > 0)
}
