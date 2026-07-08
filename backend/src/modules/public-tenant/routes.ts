import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../config/env.js'
import {
  extractSubdomainFromHostname,
  isPlatformTenantHost,
  resolveTenantByHost,
  resolveTenantBySlug,
} from '../../lib/tenant/resolveTenantByHost.js'
import { lookupTenantSlugRedirect } from '../../lib/tenant/slugRedirect.js'
import { isAppCidadesDedicatedHost } from '../../lib/tenant/appCidadesHost.js'
import { toPublicTenantPayload } from './serializer.js'
import { setTenantCacheHeaders } from '../../lib/cache/httpCacheHeaders.js'

const PUBLIC_TENANT_RATE_LIMIT_MAX = 60

const tenantQuerySchema = z.object({
  host: z.string().trim().optional(),
  slug: z.string().trim().optional(),
})

function resolveRequestHost(
  headers: { host?: string; 'x-forwarded-host'?: string | string[] },
  queryHost?: string,
): string | undefined {
  const forwardedHost = headers['x-forwarded-host']
  const fromForwarded =
    typeof forwardedHost === 'string' ? forwardedHost.split(',')[0]?.trim() : undefined

  return fromForwarded || queryHost || headers.host
}

function tenantRootUrl(slug: string): string {
  return `https://${slug}.${env.PUBLIC_ROOT_DOMAIN}/`
}

async function redirectIfLegacySlug(
  slug: string,
  reply: { redirect: (url: string, statusCode?: number) => unknown },
): Promise<boolean> {
  if (isPlatformTenantHost(slug)) return false

  const redirectSlug = await lookupTenantSlugRedirect(slug)
  if (!redirectSlug) return false

  reply.redirect(tenantRootUrl(redirectSlug), 301)
  return true
}

export async function registerPublicTenantRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/tenant',
    {
      config: {
        rateLimit: {
          max: PUBLIC_TENANT_RATE_LIMIT_MAX,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const parsed = tenantQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.status(400).send({ message: 'Parâmetros inválidos.' })
      }

      const hostHeader = resolveRequestHost(request.headers, parsed.data.host)

      let slugCandidate: string | undefined

      if (parsed.data.slug) {
        slugCandidate = parsed.data.slug.trim().toLowerCase()
      } else if (hostHeader) {
        slugCandidate = extractSubdomainFromHostname(hostHeader) ?? undefined
      } else {
        return reply.status(400).send({ message: 'Informe o header Host ou o parâmetro host.' })
      }

      if (
        slugCandidate &&
        !(hostHeader && isAppCidadesDedicatedHost(hostHeader)) &&
        (await redirectIfLegacySlug(slugCandidate, reply))
      ) {
        return
      }

      let tenant = null

      if (parsed.data.slug) {
        tenant = await resolveTenantBySlug(parsed.data.slug)
      } else if (hostHeader) {
        tenant = await resolveTenantByHost(hostHeader)
      }

      if (!tenant) {
        return reply.status(404).send({ message: 'Endereço não encontrado.' })
      }

      setTenantCacheHeaders(reply)
      return reply.send(toPublicTenantPayload(tenant))
    },
  )
}
