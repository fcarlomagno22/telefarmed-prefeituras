const PORTAL_PREFIXES = ['/prefeitura', '/ubt', '/admin', '/profissional'] as const

export function stripPortalPrefix(path: string): string {
  for (const prefix of PORTAL_PREFIXES) {
    if (path.startsWith(`${prefix}/`)) return path.slice(prefix.length) || '/'
    if (path === prefix) return '/'
  }
  return path
}

function pathnameUsesLegacyPortalPrefix(pathname: string): boolean {
  return PORTAL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/** Corrige rotas congeladas no import (`/prefeitura/...`) para hosts dedicados (`/...`). */
export function resolveSidebarNavTo(
  to: string,
  pathname = typeof window !== 'undefined' ? window.location.pathname : '',
): string {
  if (!pathnameUsesLegacyPortalPrefix(pathname)) {
    const stripped = stripPortalPrefix(to)
    if (stripped !== to) return stripped
  }
  return to
}

export function isSidebarNavItemActive(
  pathname: string,
  to: string,
  end?: boolean,
): boolean {
  const path = stripPortalPrefix(pathname)
  const target = stripPortalPrefix(resolveSidebarNavTo(to, pathname))

  if (end) return path === target
  return path === target || path.startsWith(`${target}/`)
}
