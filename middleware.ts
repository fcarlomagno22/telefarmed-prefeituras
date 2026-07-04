import { rewrite } from '@vercel/functions'

const ROOT_DOMAIN = process.env.PUBLIC_ROOT_DOMAIN?.trim() || 'telefarmed.com.br'

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0] ?? hostname
}

function isAppCidadesHost(hostname: string): boolean {
  const host = normalizeHostname(hostname)

  if (host.endsWith('.localhost')) {
    const slug = host.slice(0, -'.localhost'.length)
    return slug === 'vd' || slug.startsWith('vd-')
  }

  const suffix = `.${ROOT_DOMAIN}`
  if (!host.endsWith(suffix)) return false

  const slug = host.slice(0, -suffix.length)
  if (!slug || slug.includes('.')) return false

  return slug === 'vd' || slug.startsWith('vd-')
}

function isAppCidadesStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_expo/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon-512.png' ||
    pathname === '/metadata.json'
  )
}

export default function middleware(request: Request) {
  const hostname = request.headers.get('host') ?? ''
  if (!isAppCidadesHost(hostname)) return

  const url = new URL(request.url)
  if (url.pathname.startsWith('/api')) return

  if (isAppCidadesStaticAsset(url.pathname)) {
    return rewrite(new URL(`/vd-app${url.pathname}${url.search}`, request.url))
  }

  return rewrite(new URL(`/vd-app/index.html${url.search}`, request.url))
}

export const config = {
  matcher: ['/((?!api/).*)'],
}
